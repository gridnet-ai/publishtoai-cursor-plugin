const DEFAULT_BASE = 'https://bigsearchai.com';

export function apiBaseUrl(): string {
  const raw = process.env.BIGSEARCH_API_URL?.trim();
  return raw ? raw.replace(/\/+$/, '') : DEFAULT_BASE;
}

export function irlApiUrl(path: string): string {
  const base = apiBaseUrl();
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}/api/v1/irl${suffix}`;
}

export function requireApiKey(): string {
  const key = process.env.BIGSEARCH_API_KEY?.trim();
  if (!key) {
    return '';
  }
  return key;
}

export function exitMissingApiKey(): never {
  console.error('No BIGSEARCH_API_KEY found.');
  console.error('');
  console.error('  Get your key at:');
  console.error('  → https://bigsearchai.com/account (Developer tab)');
  console.error('');
  console.error('  Then run:');
  console.error('  export BIGSEARCH_API_KEY=your-key');
  console.error('  bigsearch publish');
  process.exit(1);
}
