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
  return process.env.BIGSEARCH_API_KEY?.trim() ?? '';
}
