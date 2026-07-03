import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const nodeRequire = createRequire(__filename);
const scopedEntry = nodeRequire.resolve('@publishtoai/cli');

export function delegateToPublishtoaiCli(args: string[]): number {
  const result = spawnSync(process.execPath, [scopedEntry, ...args], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) {
    console.error(result.error.message);
    return 1;
  }
  return result.status ?? 1;
}
