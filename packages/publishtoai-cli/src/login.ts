import { spawn } from 'node:child_process';
import os from 'node:os';
import chalk from 'chalk';
import ora from 'ora';
import { authApiUrl, requireApiKey, saveConfigFile } from './config.js';

type DeviceResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

type TokenResponse = {
  api_key?: string;
  reused?: boolean;
  error?: string;
};

function openBrowser(url: string): void {
  const platform = process.platform;
  if (platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  if (platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
}

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function runDeviceLogin(): Promise<string> {
  const hostname = os.hostname().slice(0, 120);
  const deviceRes = await fetch(authApiUrl('/device'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_label: hostname }),
  });

  if (!deviceRes.ok) {
    throw new Error(`Device auth failed (HTTP ${deviceRes.status})`);
  }

  const device = await parseJsonSafe<DeviceResponse>(deviceRes);
  if (!device?.device_code) {
    throw new Error(`Device auth failed (HTTP ${deviceRes.status})`);
  }
  const verifyUrl = `${device.verification_uri}?code=${encodeURIComponent(device.user_code)}&source=publishtoai`;

  console.log('');
  console.log(chalk.bold('Authorize PublishToAI CLI'));
  console.log('');
  console.log(`  1. Open ${chalk.cyan(verifyUrl)}`);
  console.log(`  2. Enter code: ${chalk.yellow(device.user_code)}`);
  console.log('');
  openBrowser(verifyUrl);

  const spinner = ora('Waiting for authorization…').start();
  const deadline = Date.now() + device.expires_in * 1000;
  const intervalMs = Math.max(1000, Math.min(2000, (device.interval ?? 3) * 1000));

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const tokenRes = await fetch(authApiUrl('/token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_code: device.device_code }),
    });

    const token = await parseJsonSafe<TokenResponse>(tokenRes);
    if (!token) {
      // Transient gateway/function errors — keep polling until deadline.
      continue;
    }
    if (token.reused) {
      const existing = requireApiKey();
      if (existing) {
        spinner.succeed('Authorized — using existing ~/.publishtoai/config.json key');
        return existing;
      }
      spinner.fail('Session approved but no local API key found');
      throw new Error('Run publishtoai login after saving a key, or revoke old CLI keys and retry.');
    }
    if (token.api_key) {
      saveConfigFile({ apiKey: token.api_key });
      spinner.succeed('Authorized — API key saved to ~/.publishtoai/config.json');
      return token.api_key;
    }

    if (token.error === 'expired_token') {
      spinner.fail('Authorization code expired');
      throw new Error('Login expired. Run publishtoai login again.');
    }
  }

  spinner.fail('Authorization timed out');
  throw new Error('Login timed out. Run publishtoai login again.');
}

export async function ensureAuthenticated(): Promise<string> {
  const existing = requireApiKey();
  if (existing) return existing;
  return runDeviceLogin();
}
