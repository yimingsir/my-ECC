#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');

const SELECTED_RULES = [
  'common/coding-style.md',
  'common/security.md',
  'golang/coding-style.md',
  'golang/patterns.md',
  'golang/security.md',
  'python/coding-style.md',
  'python/patterns.md',
  'python/security.md',
  'typescript/coding-style.md',
  'typescript/security.md',
  'vue/coding-style.md',
  'vue/patterns.md',
  'vue/security.md'
];

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const fail = (message) => {
  console.error('[my-ECC rules] ERROR: ' + message);
  process.exit(1);
};

let mode = 'user';
let projectRoot = process.cwd();
let dryRun = false;
let checkOnly = false;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];

  if (arg === '--user') {
    mode = 'user';
    continue;
  }

  if (arg === '--project') {
    mode = 'project';
    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      projectRoot = path.resolve(next);
      i += 1;
    }
    continue;
  }

  if (arg.startsWith('--project=')) {
    mode = 'project';
    projectRoot = path.resolve(arg.slice('--project='.length) || '.');
    continue;
  }

  if (arg === '--dry-run') {
    dryRun = true;
    continue;
  }

  if (arg === '--check') {
    checkOnly = true;
    continue;
  }

  fail('Unknown argument: ' + arg);
}

if (has('--check') && has('--dry-run')) fail('--check and --dry-run cannot be used together.');

const sourceFiles = SELECTED_RULES.map((relativePath) => ({
  relativePath,
  source: path.join(ROOT, 'rules', relativePath)
}));

const missing = sourceFiles
  .filter(({ source }) => !fs.existsSync(source))
  .map(({ relativePath }) => 'rules/' + relativePath);

if (missing.length > 0) {
  console.error('[my-ECC rules] Missing selected rule files:');
  for (const item of missing) console.error('  - ' + item);
  process.exit(1);
}

if (checkOnly) {
  console.log('[my-ECC rules] Rule set is valid (' + SELECTED_RULES.length + ' files).');
  process.exit(0);
}

const destinationRoot = mode === 'user'
  ? path.join(os.homedir(), '.claude', 'rules', 'ecc')
  : path.join(projectRoot, '.claude', 'rules', 'ecc');

if (!dryRun) fs.mkdirSync(destinationRoot, { recursive: true });

for (const { relativePath, source } of sourceFiles) {
  const destination = path.join(destinationRoot, relativePath);
  if (!dryRun) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
  console.log((dryRun ? '[dry-run] ' : '') + relativePath + ' -> ' + destination);
}

console.log(
  '[my-ECC rules] ' +
  (dryRun ? 'Would install ' : 'Installed ') +
  SELECTED_RULES.length +
  ' curated rules to ' +
  destinationRoot
);
console.log('[my-ECC rules] Namespace preserved; existing unrelated rules are not removed.');
