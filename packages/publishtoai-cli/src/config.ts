import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_BASE = 'https://bigsearchai.com';

export type BigsearchConfig = {
  apiKey?: string;
  apiUrl?: string;
};

export function configFilePath(): string {
  return path.join(os.homedir(), '.publishtoai', 'config.json');
}

export function loadConfigFile(): BigsearchConfig | null {
  try {
    const raw = fs.readFileSync(configFilePath(), 'utf8');
    const parsed = JSON.parse(raw) as BigsearchConfig;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveConfigFile(config: BigsearchConfig): void {
  const dir = path.dirname(configFilePath());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configFilePath(), `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
}

export function apiBaseUrl(): string {
  const env = process.env.BIGSEARCH_API_URL?.trim();
  if (env) return env.replace(/\/+$/, '');
  const file = loadConfigFile()?.apiUrl?.trim();
  if (file) return file.replace(/\/+$/, '');
  return DEFAULT_BASE;
}

export function authApiUrl(suffix: string): string {
  const base = apiBaseUrl();
  const pathSuffix = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `${base}/api/v1/auth${pathSuffix}`;
}

export function irlApiUrl(pathSuffix: string): string {
  const base = apiBaseUrl();
  const suffix = pathSuffix.startsWith('/') ? pathSuffix : `/${pathSuffix}`;
  return `${base}/api/v1/irl${suffix}`;
}

export function requireApiKey(): string {
  const env = process.env.BIGSEARCH_API_KEY?.trim();
  if (env) return env;
  const fileKey = loadConfigFile()?.apiKey?.trim();
  return fileKey ?? '';
}

export function exitMissingApiKey(): never {
  console.error('No BIGSEARCH_API_KEY found.');
  console.error('');
  console.error('  Run: publishtoai login');
  console.error('  Or set BIGSEARCH_API_KEY for CI/scripts.');
  console.error('');
  console.error('  Manual keys: https://bigsearchai.com/account (API Keys tab)');
  process.exit(1);
}
