#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  areHooksEnabled,
  getDisabledHookIds,
  getHookProfile,
  isHookEnabled,
  readManagedHookConfig
} = require('../../scripts/lib/hook-flags');

function makeTempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'my-ecc-hook-flags-'));
  fs.mkdirSync(path.join(root, 'ecc'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'ecc', 'setup.json'),
    JSON.stringify({
      hooks: {
        enabled: true,
        profile: 'standard',
        disabled: ['stop:format-typecheck', 'post:quality-gate']
      }
    }, null, 2)
  );
  return root;
}

function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

const root = makeTempRoot();

try {
  const env = {
    CLAUDE_PLUGIN_ROOT: root,
    ECC_HOOK_PROFILE: undefined,
    ECC_HOOKS_ENABLED: undefined,
    ECC_DISABLED_HOOKS: undefined
  };

  const managed = readManagedHookConfig(env);
  assert.deepStrictEqual(managed.disabled.sort(), ['post:quality-gate', 'stop:format-typecheck']);

  assert.strictEqual(getHookProfile(env), 'standard');
  assert.strictEqual(areHooksEnabled(env), true);

  const disabled = [...getDisabledHookIds(env)].sort();
  assert.deepStrictEqual(disabled, ['post:quality-gate', 'stop:format-typecheck']);

  assert.strictEqual(
    isHookEnabled('post:quality-gate', { env, profiles: 'standard,strict' }),
    false
  );
  assert.strictEqual(
    isHookEnabled('stop:format-typecheck', { env, profiles: 'standard,strict' }),
    false
  );
  assert.strictEqual(
    isHookEnabled('post:session-activity-tracker', { env, profiles: 'standard,strict' }),
    true
  );

  const envWithOverride = {
    ...env,
    ECC_DISABLED_HOOKS: 'pre:bash:dispatcher'
  };
  const combined = [...getDisabledHookIds(envWithOverride)].sort();
  assert.deepStrictEqual(combined, [
    'post:quality-gate',
    'pre:bash:dispatcher',
    'stop:format-typecheck'
  ]);

  assert.strictEqual(
    isHookEnabled('pre:bash:dispatcher', { env: envWithOverride, profiles: 'standard,strict' }),
    false
  );

  const envDisabled = { ...env, ECC_HOOKS_ENABLED: '0' };
  assert.strictEqual(areHooksEnabled(envDisabled), false);
  assert.strictEqual(
    isHookEnabled('post:session-activity-tracker', { env: envDisabled, profiles: 'standard,strict' }),
    false
  );

  console.log('Passed: 8');
  console.log('Failed: 0');
} finally {
  cleanup(root);
}
