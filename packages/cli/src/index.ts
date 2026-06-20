#!/usr/bin/env node
import { program } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import {
  checkReadiness,
  getStatus,
  mapValidateToRemote,
  publishPage,
  remoteValidate,
  verifyApiKey,
} from './api.js';
import { ensureAuthenticated, runDeviceLogin } from './login.js';
import { discoverWeb4PageFiles } from './discover.js';
import { die, hint, printPublishError, printPublishSuccess, printValidateResult } from './output.js';
import { localValidate, readWeb4PageFile, slugFromPage } from './validate-local.js';
import { runVerifySecure } from './verify-domain.js';

const DEFAULT_FILE = './web4page.json';

function writeInitScaffold(): void {
  const target = path.join(process.cwd(), 'web4page.json');
  if (fs.existsSync(target)) {
    console.log(chalk.yellow('web4page.json already exists. Run `bigsearch validate` to check it.'));
    return;
  }
  const scaffold = {
    $schema: 'https://web4page.org/spec/v1',
    entity: {
      name: 'Your Business Name',
      type: 'business',
      slug: 'your-business-slug',
      description: 'One sentence description of your entity.',
      url: 'https://yourdomain.com',
      location: { city: '', state: '', country: 'US' },
    },
    read: {
      grounding:
        'Write 2-3 sentences here that explain who you are to an AI model. Be specific about what you do, where you are, and who you serve. Include city, services, and what makes you distinct.',
      llms_txt: 'https://yourdomain.com/llms.txt',
      products: [],
      services: [],
      keywords: ['your city', 'your industry', 'your service'],
    },
    discover: { crawl_permissions: ['*'] },
    meta: {
      spec_version: '1.0.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
  fs.writeFileSync(target, `${JSON.stringify(scaffold, null, 2)}\n`);
  console.log(chalk.green('✓ Created web4page.json'));
  hint('\nNext steps:');
  hint('  1. Fill in your entity details');
  hint('  2. Run: bigsearch validate');
  hint('  3. Run: bigsearch login');
  hint('     Or: bigsearch publish (login runs automatically)');
}

async function runValidate(file: string, remote: boolean): Promise<void> {
  let page: unknown;
  try {
    ({ page } = readWeb4PageFile(file));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('file_not_found:')) die(`File not found: ${msg.slice('file_not_found:'.length)}`);
    if (msg.startsWith('invalid_json:')) die(`Invalid JSON: ${msg.slice('invalid_json:'.length)}`);
    die(msg);
  }

  if (!remote) {
    printValidateResult(localValidate(page));
    return;
  }

  const spinner = ora('Validating via BigSearch API...').start();
  try {
    const data = await remoteValidate(page);
    spinner.stop();
    printValidateResult(mapValidateToRemote(data));
  } catch {
    spinner.stop();
    console.log(chalk.yellow('API unreachable — validating locally'));
    printValidateResult(localValidate(page));
  }
}

async function runPublish(file: string): Promise<void> {
  const apiKey = await ensureAuthenticated();

  let page: unknown;
  try {
    ({ page } = readWeb4PageFile(file));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('file_not_found:')) die(`File not found: ${msg.slice('file_not_found:'.length)}`);
    die('Invalid web4page.json');
  }

  const local = localValidate(page);
  if (!local.valid) {
    console.log(chalk.red('✗ Fix validation errors before publishing.'));
    console.log(JSON.stringify(local.errors, null, 2));
    process.exit(1);
  }

  const spinner = ora('Publishing to BigSearch AI...').start();
  const { status, data } = await publishPage(page, apiKey);
  spinner.stop();

  if (!data.indexed) printPublishError(status, data);
  printPublishSuccess(data);
}

async function runPublishAll(): Promise<void> {
  const apiKey = await ensureAuthenticated();

  const files = discoverWeb4PageFiles();
  if (files.length === 0) die('No web4page.json files found. Run `bigsearch init` first.');

  console.log(chalk.bold(`Publishing ${files.length} web4page.json file(s)...\n`));

  let ok = 0;
  let failed = 0;

  for (const file of files) {
    const rel = path.relative(process.cwd(), file) || file;
    const spinner = ora(rel).start();
    try {
      const { page } = readWeb4PageFile(file);
      const local = localValidate(page);
      if (!local.valid) {
        spinner.fail(`${rel} — validation failed`);
        failed += 1;
        continue;
      }
      const { status, data } = await publishPage(page, apiKey);
      if (!data.indexed) {
        spinner.fail(`${rel} — ${data.error ?? `HTTP ${status}`}`);
        failed += 1;
        continue;
      }
      spinner.succeed(`${rel} → ${data.irlUrl ?? data.slug}`);
      ok += 1;
    } catch {
      spinner.fail(`${rel} — error`);
      failed += 1;
    }
  }

  console.log('');
  console.log(chalk.bold(`Done: ${ok} published, ${failed} failed`));
  if (failed > 0) process.exit(1);
}

async function runStatus(slug: string): Promise<void> {
  const spinner = ora(`Fetching status for ${slug}...`).start();
  const { status, data } = await getStatus(slug);
  spinner.stop();

  if (status === 404) die(`Not indexed: ${slug}`);
  if (status !== 200) die(data.error ?? `HTTP ${status}`);

  console.log(chalk.green(`✓ ${data.name ?? slug}`));
  hint(`  slug:        ${data.slug ?? slug}`);
  hint(`  indexed:     ${String(data.indexed ?? false)}`);
  if (data.irlUrl) {
    hint(`  irlUrl:      ${data.irlUrl}`);
    hint('               Web 4.0 page (machine-readable entity record)');
  }
  if (data.url) {
    hint(`  url:         ${data.url}`);
    hint('               Traditional Web page (human-readable AI directory listing)');
  }
  if (typeof data.entityScore === 'number') hint(`  entityScore: ${data.entityScore}/100`);
  if (data.surfaces?.llmsTxt) hint(`  llms.txt:    ${data.surfaces.llmsTxt}`);
  if (data.surfaces?.mcpJson) hint(`  mcp.json:    ${data.surfaces.mcpJson}`);
}

async function runCheck(opts: { slug?: string; url?: string }): Promise<void> {
  if (!opts.slug && !opts.url) die('Provide --slug <slug> or --url <url>');

  const spinner = ora('Checking readiness...').start();
  const { status, data } = await checkReadiness({ slug: opts.slug, url: opts.url });
  spinner.stop();

  if (status !== 200) die(data.error ?? `HTTP ${status}`);

  if (data.slug) console.log(chalk.bold(`slug:      ${data.slug}`));
  if (data.url) console.log(chalk.bold(`url:       ${data.url}`));
  console.log(chalk.bold(`readiness: ${data.readiness ?? 'unknown'}`));
  if (typeof data.indexed === 'boolean') console.log(chalk.bold(`indexed:   ${data.indexed}`));
  if (data.irlUrl) hint(`  irlUrl:      ${data.irlUrl}`);
  if (typeof data.entityScore === 'number') hint(`  entityScore: ${data.entityScore}/100`);
  if (data.hint) hint(`\n  ${data.hint}`);
}

async function runDoctor(file: string): Promise<void> {
  const apiKey = await ensureAuthenticated();

  let page: unknown;
  try {
    ({ page } = readWeb4PageFile(file));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('file_not_found:')) die(`File not found: ${msg.slice('file_not_found:'.length)}`);
    die('Invalid web4page.json');
  }

  const local = localValidate(page);
  if (!local.valid) {
    console.log(chalk.red('✗ Local validation failed'));
    console.log(JSON.stringify(local.errors, null, 2));
    process.exit(1);
  }
  console.log(chalk.green('✓ Local web4page.json is valid'));

  const keySpinner = ora('Verifying BIGSEARCH_API_KEY...').start();
  const keyStatus = await verifyApiKey(apiKey);
  if (keyStatus === 'invalid') {
    keySpinner.fail('API key invalid');
    die('Get a key at https://bigsearchai.com/account (Developer tab)');
  }
  keySpinner.succeed('API key accepted');

  const slug = local.slug ?? slugFromPage(page);
  if (!slug) die('Could not read slug from web4page.json');

  const statusSpinner = ora(`Checking index status for ${slug}...`).start();
  const { status, data } = await getStatus(slug);
  statusSpinner.stop();

  if (status === 404 || !data.indexed) {
    console.log(chalk.yellow(`○ Not yet indexed: ${slug}`));
    hint('  Run: bigsearch publish');
    return;
  }

  console.log(chalk.green('✓ Indexed on BigSearch AI'));
  hint(`  irlUrl: ${data.irlUrl ?? '—'}`);

  const llmsUrl = data.surfaces?.llmsTxt;
  if (llmsUrl) {
    const surfaceSpinner = ora('Checking llms.txt surface...').start();
    try {
      const head = await fetch(llmsUrl, { method: 'GET' });
      if (head.ok) surfaceSpinner.succeed('llms.txt reachable');
      else surfaceSpinner.warn(`llms.txt returned HTTP ${head.status}`);
    } catch {
      surfaceSpinner.warn('llms.txt unreachable');
    }
  }
}

program
  .name('bigsearch')
  .description('BigSearch AI — publish your business to the IRL index')
  .version('1.2.0');

program.command('init').description('Scaffold web4page.json in the current directory').action(writeInitScaffold);

program
  .command('login')
  .description('Sign in via browser and save API key to ~/.bigsearch/config.json')
  .action(async () => {
    try {
      await runDeviceLogin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      die(msg);
    }
  });

program
  .command('validate')
  .description('Validate web4page.json (local by default)')
  .option('-f, --file <path>', 'Path to web4page.json', DEFAULT_FILE)
  .option('--remote', 'Validate via BigSearch API')
  .action(async (opts: { file: string; remote?: boolean }) => {
    await runValidate(opts.file, Boolean(opts.remote));
  });

program
  .command('publish')
  .description('Publish web4page.json to the BigSearch IRL index')
  .option('-f, --file <path>', 'Path to web4page.json', DEFAULT_FILE)
  .option('--all', 'Publish every web4page.json in the project tree')
  .action(async (opts: { file: string; all?: boolean }) => {
    if (opts.all) {
      await runPublishAll();
      return;
    }
    await runPublish(opts.file);
  });

program
  .command('status')
  .description('Index status for a published slug')
  .argument('<slug>', 'Entity slug')
  .action(async (slug: string) => {
    await runStatus(slug);
  });

program
  .command('check')
  .description('Readiness check for a slug or URL')
  .option('--slug <slug>', 'Indexed slug to check')
  .option('--url <url>', 'Site URL to check')
  .action(async (opts: { slug?: string; url?: string }) => {
    await runCheck(opts);
  });

program
  .command('doctor')
  .description('Check API key, local file, and index / llms.txt readiness')
  .option('-f, --file <path>', 'Path to web4page.json', DEFAULT_FILE)
  .action(async (opts: { file: string }) => {
    await runDoctor(opts.file);
  });

program
  .command('verify')
  .description('Verify domain ownership for IRL Secure (IRLS) via DNS TXT')
  .option('-f, --file <path>', 'Path to web4page.json', DEFAULT_FILE)
  .option('-d, --domain <host>', 'Domain to verify (default: entity.url host)')
  .option('--show-dns', 'Print DNS TXT instructions only')
  .option('--wait', 'Poll verify every 30s up to 10 attempts')
  .action(async (opts: { file: string; domain?: string; showDns?: boolean; wait?: boolean }) => {
    const apiKey = await ensureAuthenticated();
    await runVerifySecure({
      file: opts.file,
      domain: opts.domain,
      showDns: opts.showDns,
      wait: opts.wait,
      apiKey,
    });
  });

program.parse();
