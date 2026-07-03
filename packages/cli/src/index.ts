#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const nodeRequire = createRequire(__filename);
const publishtoaiEntry = nodeRequire.resolve('@publishtoai/cli');

console.error(
  '@bigsearch/cli is deprecated — use npx publishtoai or @publishtoai/cli (same Big Search registry).',
);

const args = process.argv.slice(2);
const result = spawnSync(process.execPath, [publishtoaiEntry, ...args], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
