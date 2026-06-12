import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_BASE = 'https://bigsearchai.com';

function configFilePath(): string {
  return path.join(os.homedir(), '.bigsearch', 'config.json');
}

function loadConfigFile(): { apiKey?: string; apiUrl?: string } | null {
  try {
    const raw = fs.readFileSync(configFilePath(), 'utf8');
    const parsed = JSON.parse(raw) as { apiKey?: string; apiUrl?: string };
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function apiBaseUrl(): string {
  const env = process.env.BIGSEARCH_API_URL?.trim();
  if (env) return env.replace(/\/+$/, '');
  const file = loadConfigFile()?.apiUrl?.trim();
  if (file) return file.replace(/\/+$/, '');
  return DEFAULT_BASE;
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
