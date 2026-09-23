#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PROFILE = path.join(ROOT, 'config', 'my-ecc-profile.json');
const MARKETPLACE = path.join(ROOT, '.claude-plugin', 'marketplace.json');
const PLUGIN = path.join(ROOT, '.claude-plugin', 'plugin.json');
const HOOK_SETUP = path.join(ROOT, 'ecc', 'setup.json');
const HOOK_METADATA = path.join(ROOT, 'hooks', 'hooks.metadata.json');
const VERSION = path.join(ROOT, 'VERSION');
const MCP_CONFIG = path.join(ROOT, '.mcp.json');
const CHECK = process.argv.includes('--check');

const DISPATCHER_HOOK_GLOBS = [
  path.join(ROOT, 'scripts', 'hooks'),
];

const INTERNAL_HOOK_ID_PATTERNS = [
  /\bid\s*:\s*['"]((?:pre|post|stop|session(?:-start|-end)?):[^'"]+)['"]/g,
  /\b[A-Z0-9_]*HOOK_ID\s*=\s*['"]((?:pre|post|stop|session(?:-start|-end)?):[^'"]+)['"]/g,
];

const listJavaScriptFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listJavaScriptFiles(fullPath);
      return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
    });
};

const discoverInternalHookIds = () => {
  const ids = new Set();
  for (const dir of DISPATCHER_HOOK_GLOBS) {
    for (const file of listJavaScriptFiles(dir)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const pattern of INTERNAL_HOOK_ID_PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(source))) ids.add(match[1]);
      }
    }
  }
  return ids;
};

const CURATED_MCP_SERVERS = {
  'chrome-devtools': {
    command: 'npx',
    args: [
      '-y',
      'chrome-devtools-mcp@latest',
      '--headless',
      '--isolated',
      '--chrome-arg=--no-sandbox'
    ]
  }
};

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

if (!Array.isArray(profile.disabled_hooks)) fail('Profile field disabled_hooks must be an array.');
if (new Set(profile.disabled_hooks).size !== profile.disabled_hooks.length) fail('Profile field disabled_hooks contains duplicates.');

if (!['minimal', 'standard', 'strict'].includes(profile.hook_profile)) fail('Unsupported hook profile: ' + profile.hook_profile);

const missing = [];
for (const item of profile.skills) if (!fs.existsSync(path.join(ROOT, 'skills', item, 'SKILL.md'))) missing.push('skills/' + item + '/SKILL.md');
for (const item of profile.agents) if (!fs.existsSync(path.join(ROOT, 'agents', item + '.md'))) missing.push('agents/' + item + '.md');
for (const item of profile.commands) if (!fs.existsSync(path.join(ROOT, 'commands', item + '.md'))) missing.push('commands/' + item + '.md');
if (!fs.existsSync(path.join(ROOT, 'hooks', 'hooks.json'))) missing.push('hooks/hooks.json');
if (!fs.existsSync(HOOK_METADATA)) missing.push('hooks/hooks.metadata.json');
if (missing.length) {
  console.error('[my-ECC] Missing upstream components:');
  for (const item of missing) console.error('  - ' + item);
  process.exit(1);
}

const hookMetadata = readJson(HOOK_METADATA);
const hookIds = new Set(
  Object.values(hookMetadata.entries || {})
    .flat()
    .map(entry => entry.id)
    .filter(Boolean)
);

const internalHookIds = discoverInternalHookIds();
for (const hookId of internalHookIds) hookIds.add(hookId);

const unknownDisabledHooks = profile.disabled_hooks.filter((hookId) => !hookIds.has(hookId));
if (unknownDisabledHooks.length > 0) {
  fail(
    'Profile disabled_hooks references unknown ECC hook(s): ' +
    unknownDisabledHooks.join(', ') +
    '. Checked hooks.metadata.json and hook implementation registries under scripts/hooks/.'
  );
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
  commands: profile.commands.map((item) => './commands/' + item + '.md')
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

const hookSetup = {
  hooks: {
    enabled: Boolean(profile.hooks_enabled),
    profile: profile.hook_profile,
    disabled: profile.disabled_hooks
  }
};

const currentMcp = fs.existsSync(MCP_CONFIG) ? readJson(MCP_CONFIG) : { mcpServers: {} };
if (!currentMcp.mcpServers || typeof currentMcp.mcpServers !== 'object' || Array.isArray(currentMcp.mcpServers)) {
  fail('.mcp.json must contain an object-valued mcpServers field.');
}
const expectedMcp = {
  ...currentMcp,
  mcpServers: {
    ...currentMcp.mcpServers,
    ...CURATED_MCP_SERVERS
  }
};

const expectedPlugin = JSON.stringify(plugin, null, 2) + '\n';
const expectedMarketplace = JSON.stringify(marketplace, null, 2) + '\n';
const expectedHookSetup = JSON.stringify(hookSetup, null, 2) + '\n';
const expectedMcpConfig = JSON.stringify(expectedMcp, null, 2) + '\n';

if (CHECK) {
  if (!fs.existsSync(PLUGIN) || fs.readFileSync(PLUGIN, 'utf8') !== expectedPlugin) fail('plugin.json is stale; regenerate it with this script.');
  if (!fs.existsSync(MARKETPLACE) || fs.readFileSync(MARKETPLACE, 'utf8') !== expectedMarketplace) fail('marketplace.json is stale; regenerate it with this script.');
  if (!fs.existsSync(HOOK_SETUP) || fs.readFileSync(HOOK_SETUP, 'utf8') !== expectedHookSetup) fail('ecc/setup.json is stale; regenerate it with this script.');
  if (!fs.existsSync(MCP_CONFIG) || fs.readFileSync(MCP_CONFIG, 'utf8') !== expectedMcpConfig) fail('.mcp.json is stale; regenerate it with this script.');
  console.log('[my-ECC] Profile is valid for ECC ' + eccVersion + ' (' + pluginVersion + ').');
} else {
  fs.mkdirSync(path.dirname(HOOK_SETUP), { recursive: true });
  fs.writeFileSync(PLUGIN, expectedPlugin);
  fs.writeFileSync(MARKETPLACE, expectedMarketplace);
  fs.writeFileSync(HOOK_SETUP, expectedHookSetup);
  fs.writeFileSync(MCP_CONFIG, expectedMcpConfig);
  console.log('[my-ECC] Generated my-ECC plugin + marketplace + hook setup + MCP overlay for ECC ' + eccVersion + ' (' + pluginVersion + ').');
}
