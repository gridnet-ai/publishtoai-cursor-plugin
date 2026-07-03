import chalk from 'chalk';
import ora from 'ora';
import { verifyDomain } from './api.js';
import { die, hint } from './output.js';
import { localValidate, readWeb4PageFile, slugFromPage } from './validate-local.js';

export function normalizeDomain(raw: string): string {
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/^www\./, '');
  d = d.split('/')[0] ?? d;
  return d;
}

export function printDnsInstructions(slug: string, domain: string): void {
  const host = `_bigsearch.${domain}`;
  const value = `bigsearch-verify=${slug}`;
  const legacyValue = `bigsearch-irl-verify=${slug}`;
  console.log(chalk.bold('\nAdd this DNS TXT record:\n'));
  hint(`  Host:  ${host}`);
  hint('  Type:  TXT');
  console.log(chalk.white(`  Value: ${value}`));
  hint(`\n(Legacy apex TXT ${domain} → ${legacyValue} also accepted during transition.)`);
}

export async function runVerifySecure(options: {
  file: string;
  domain?: string;
  showDns?: boolean;
  wait?: boolean;
  apiKey: string;
}): Promise<void> {
  let page: unknown;
  try {
    ({ page } = readWeb4PageFile(options.file));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('file_not_found:')) die(`File not found: ${msg.slice('file_not_found:'.length)}`);
    die('Invalid web4page.json');
  }

  const local = localValidate(page);
  if (!local.valid) {
    console.log(chalk.red('✗ Invalid web4page.json'));
    console.log(JSON.stringify(local.errors, null, 2));
    process.exit(1);
  }

  const slug = local.slug ?? slugFromPage(page);
  if (!slug) die('entity.slug is required');

  const entityUrl =
    typeof page === 'object' && page !== null && 'entity' in page
      ? (page as { entity?: { url?: string } }).entity?.url?.trim() ?? ''
      : '';
  const domain = options.domain
    ? normalizeDomain(options.domain)
    : entityUrl
      ? normalizeDomain(entityUrl)
      : '';

  if (!domain) die('Domain required: set entity.url or use --domain');

  printDnsInstructions(slug, domain);
  if (options.showDns) return;

  const maxAttempts = options.wait ? 10 : 1;
  const intervalMs = 30_000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const spinner = ora(
      attempt === 0 ? 'Checking DNS verification...' : `Retry ${attempt + 1}/${maxAttempts}...`,
    ).start();

    const { status, data } = await verifyDomain(slug, domain, options.apiKey);
    spinner.stop();

    if (status === 401 || status === 403) die('API key invalid or expired.');
    if (status === 412) {
      die('Publish your IRL first. Run: publishtoai publish');
    }
    if (status >= 400 && !data.verified) {
      die(data.message ?? data.error ?? 'Verification failed');
    }

    if (data.verified) {
      console.log(chalk.green('\n✓ IRL Secure'));
      console.log(chalk.bold('  verified:   true'));
      console.log(chalk.bold(`  trustTier:  ${data.trustTier ?? 'irls'}`));
      console.log(chalk.bold(`  irlUrl:     ${data.irlUrl ?? '—'}`));
      return;
    }

    if (attempt < maxAttempts - 1) {
      console.log(chalk.yellow(`  ${data.reason ?? 'TXT not detected'} — waiting 30s...`));
      await new Promise((r) => setTimeout(r, intervalMs));
    } else {
      die(data.reason ?? 'TXT record not detected');
    }
  }
}
