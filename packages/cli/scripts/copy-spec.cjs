const fs = require('node:fs');
const path = require('node:path');

const specDist = path.resolve(__dirname, '../../spec/dist');
const target = path.resolve(__dirname, '../dist/web4page-spec');
const schemaSrc = path.resolve(__dirname, '../../spec/schema.json');
const schemaTarget = path.resolve(__dirname, '../dist/web4page-spec-schema.json');

if (!fs.existsSync(specDist)) {
  console.error('copy-spec: run @bigsearch/web4page-spec build first');
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(specDist, target, { recursive: true });
fs.copyFileSync(schemaSrc, schemaTarget);
console.log('Copied web4page-spec dist -> packages/cli/dist/web4page-spec');
