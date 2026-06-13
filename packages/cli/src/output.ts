import chalk from 'chalk';
import type { ValidateResult } from './validate-local.js';

export function printValidateResult(data: ValidateResult): void {
  if (!data.valid) {
    console.log(chalk.red('✗ Validation failed'));
    console.log(JSON.stringify(data.errors, null, 2));
    process.exit(1);
  }
  console.log(chalk.green('✓ Valid web4page.json'));
  console.log(chalk.bold(`\n  entityScore: ${data.entityScore}/100`));
  if (data.slug) {
    console.log(chalk.gray(`  slug:        ${data.slug}`));
  }
  console.log(chalk.gray('\n  VCAP capabilities:'));
  const v = data.vcap;
  console.log(`  ${v?.read ? chalk.green('✓') : chalk.gray('○')} READ     — AI understands you`);
  console.log(`  ${v?.discover ? chalk.green('✓') : chalk.gray('○')} DISCOVER — AI can cite you`);
  console.log(`  ${v?.write ? chalk.green('✓') : chalk.gray('○')} WRITE    — AI can transact with you`);
  console.log(`  ${v?.act ? chalk.green('✓') : chalk.gray('○')} ACT      — AI agents can operate with you`);
}

export function printPublishSuccess(data: {
  url?: string;
  irlUrl?: string;
  entityScore?: number;
  slug?: string;
  searchUrl?: string;
  surfaces?: {
    llmsTxt?: string;
    mcpJson?: string;
    openapiJson?: string;
  };
  visibility?: {
    bigSearchEligible?: boolean;
    indexNow?: string;
    googleIndexing?: string;
  };
}): void {
  console.log(chalk.green('✓ Published to BigSearch AI'));
  console.log(chalk.bold('\n  indexed:     true'));
  if (data.slug) console.log(chalk.bold(`  slug:        ${data.slug}`));
  if (data.url) console.log(chalk.bold(`  url:         ${data.url}`));
  if (data.irlUrl) console.log(chalk.bold(`  irlUrl:      ${data.irlUrl}`));
  if (typeof data.entityScore === 'number') {
    console.log(chalk.bold(`  entityScore: ${data.entityScore}/100`));
  }

  const slug = data.slug ?? '';
  if (data.surfaces?.llmsTxt || data.irlUrl) {
    console.log(chalk.gray('\nSurfaces now crawlable:'));
    const base = data.irlUrl ?? (slug ? `https://bigsearchai.com/irl/${slug}` : '');
    if (data.surfaces?.llmsTxt) hint(`  ${data.surfaces.llmsTxt}`);
    else if (base) hint(`  ${base}/llms.txt`);
    if (data.surfaces?.mcpJson) hint(`  ${data.surfaces.mcpJson}`);
    else if (base) hint(`  ${base}/mcp.json`);
    if (data.surfaces?.openapiJson) hint(`  ${data.surfaces.openapiJson}`);
    else if (base) hint(`  ${base}/openapi.json`);
  }

  console.log(chalk.gray('\nDiscovery (tier-dependent, async):'));
  hint('  → businessPageSearchIndex (Big Search eligibility — immediate)');
  hint('  → sitemap-merchants.xml (immediate)');
  if (data.visibility?.indexNow) hint(`  → IndexNow: ${data.visibility.indexNow}`);
  else hint('  → IndexNow (Air+ tier, ~minutes)');
  if (data.visibility?.googleIndexing) hint(`  → Google Indexing: ${data.visibility.googleIndexing}`);
  else hint('  → Google Indexing API (Pro+ tier, ~hours)');

  if (data.searchUrl) {
    console.log(chalk.bold(`\nSearch now: ${data.searchUrl}`));
  }
}

export function printPublishError(status: number, data: { error?: string; details?: unknown; suggestions?: string[] }): never {
  if (status === 401 || status === 403) {
    console.log(chalk.red('✗ API key invalid or missing.'));
    console.log(chalk.gray('\n  Get a key at https://bigsearchai.com/account (Developer tab)'));
    console.log(chalk.gray('  export BIGSEARCH_API_KEY=your-key'));
    process.exit(1);
  }
  if (data.error === 'slug_taken') {
    console.log(chalk.red('✗ Slug already taken by another account.'));
    if (data.suggestions?.length) {
      console.log(chalk.gray('\n  Suggestions:'));
      for (const s of data.suggestions) {
        console.log(chalk.gray(`    • ${s}`));
      }
    }
    process.exit(1);
  }
  console.log(chalk.red('✗ Publish failed.'));
  console.log(chalk.gray(`  ${data.error ?? 'unknown_error'}`));
  if (data.details) {
    console.log(JSON.stringify(data.details, null, 2));
  }
  process.exit(1);
}

export function die(message: string): never {
  console.log(chalk.red(`✗ ${message}`));
  process.exit(1);
}

export function hint(message: string): void {
  console.log(chalk.gray(message));
}
