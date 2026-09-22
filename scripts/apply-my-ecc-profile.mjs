#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PROFILE = path.join(ROOT, 'config', 'my-ecc-profile.json');
const MARKETPLACE = path.join(ROOT, '.claude-plugin', 'marketplace.json');
const PLUGIN = path.join(ROOT, '.claude-plugin', 'plugin.json');
const VERSION = path.join(ROOT, 'VERSION');
const CHECK = process.argv.includes('--check');

const fail = (message) => {
  console.error('[my-ECC] ERROR: ' + message);
  process.exit(1);
};

const readJson = (file) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { fail('Cannot parse ' + path.relative(ROOT, file) + ': ' + error.message); }
};

if (!fs.existsSync(PROFILE) || !fs.existsSync(VERSION)) fail('Profile or VERSION file is missing.');
const profile = readJson(PROFILE);
const eccVersion = fs.readFileSync(VERSION, 'utf8').trim();

if (!/^\d+\.\d+\.\d+/.test(eccVersion)) fail('Unexpected ECC version: ' + eccVersion);
for (const key of ['skills', 'agents', 'commands']) {
  if (!Array.isArray(profile[key]) || profile[key].length === 0) fail('Profile field ' + key + ' must be a non-empty array.');
  if (new Set(profile[key]).size !== profile[key].length) fail('Profile field ' + key + ' contains duplicates.');
}
if (!['minimal', 'standard', 'strict'].includes(profile.hook_profile)) fail('Unsupported hook profile: ' + profile.hook_profile);

const missing = [];
for (const item of profile.skills) if (!fs.existsSync(path.join(ROOT, 'skills', item, 'SKILL.md'))) missing.push('skills/' + item + '/SKILL.md');
for (const item of profile.agents) if (!fs.existsSync(path.join(ROOT, 'agents', item + '.md'))) missing.push('agents/' + item + '.md');
for (const item of profile.commands) if (!fs.existsSync(path.join(ROOT, 'commands', item + '.md'))) missing.push('commands/' + item + '.md');
if (!fs.existsSync(path.join(ROOT, 'hooks', 'hooks.json'))) missing.push('hooks/hooks.json');
if (missing.length) {
  console.error('[my-ECC] Missing upstream components:');
  for (const item of missing) console.error('  - ' + item);
  process.exit(1);
}

const pluginVersion = eccVersion + '-my.' + profile.profile_version;
const plugin = {
  name: 'my-ecc',
  version: pluginVersion,
  description: profile.description,
  author: { name: 'yimingsir', url: 'https://github.com/yimingsir' },
  homepage: 'https://github.com/yimingsir/my-ECC',
  repository: 'https://github.com/yimingsir/my-ECC',
  license: 'MIT',
  keywords: ['claude-code','ecc','superpowers','go','python','django','fastapi','vue','postgresql','mysql','redis'],
  userConfig: {
    hooks_enabled: { type: 'boolean', title: 'Enable my-ECC hooks', description: 'Enable ECC lifecycle, quality, and safety hooks.', default: Boolean(profile.hooks_enabled) },
    hook_profile: { type: 'string', title: 'my-ECC hook profile', description: 'Choose minimal, standard, or strict.', default: profile.hook_profile }
  },
  skills: profile.skills.map((item) => './skills/' + item),
  agents: profile.agents.map((item) => './agents/' + item + '.md'),
  commands: profile.commands.map((item) => './commands/' + item + '.md'),
  hooks: './hooks/hooks.json'
};

const marketplace = {
  name: 'my-ecc',
  owner: { name: 'yimingsir', url: 'https://github.com/yimingsir' },
  metadata: { description: 'Curated ECC profile for yimingsir\'s Superpowers-first Claude Code workflow.' },
  plugins: [{
    name: 'my-ecc',
    source: './',
    description: profile.description,
    author: { name: 'yimingsir', url: 'https://github.com/yimingsir' },
    homepage: 'https://github.com/yimingsir/my-ECC',
    repository: 'https://github.com/yimingsir/my-ECC',
    license: 'MIT',
    keywords: ['claude-code','ecc','superpowers','go','python','django','fastapi','vue','postgresql','mysql','redis'],
    category: 'workflow',
    tags: ['curated','engineering','go','python','vue','database','security'],
    strict: true
  }]
};

const expectedPlugin = JSON.stringify(plugin, null, 2) + '\n';
const expectedMarketplace = JSON.stringify(marketplace, null, 2) + '\n';

if (CHECK) {
  if (!fs.existsSync(PLUGIN) || fs.readFileSync(PLUGIN, 'utf8') !== expectedPlugin) fail('plugin.json is stale; regenerate it with this script.');
  if (!fs.existsSync(MARKETPLACE) || fs.readFileSync(MARKETPLACE, 'utf8') !== expectedMarketplace) fail('marketplace.json is stale; regenerate it with this script.');
  console.log('[my-ECC] Profile is valid for ECC ' + eccVersion + ' (' + pluginVersion + ').');
} else {
  fs.writeFileSync(PLUGIN, expectedPlugin);
  fs.writeFileSync(MARKETPLACE, expectedMarketplace);
  console.log('[my-ECC] Generated my-ECC plugin + marketplace for ECC ' + eccVersion + ' (' + pluginVersion + ').');
}