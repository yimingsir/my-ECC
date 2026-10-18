#!/usr/bin/env node
/**
 * Regression tests for the generated strategic-compact overlay.
 *
 * Covers clean application/idempotence and fail-closed behavior when an
 * upstream release changes the code region the overlay expects.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const OVERLAY = path.join(ROOT, 'scripts', 'apply-strategic-compact-overlay.js');
const FILES = [
  'hooks/hooks.json',
  'hooks/hooks.metadata.json',
  'scripts/hooks/suggest-compact.js',
  'skills/strategic-compact/SKILL.md',
  'docs/zh-CN/skills/strategic-compact/SKILL.md',
];

function run(root, args = []) {
  return spawnSync(process.execPath, [OVERLAY, '--root', root, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 10000,
  });
}

function writeFixture(root, unsupportedUpstreamChange = false) {
  for (const relativePath of FILES) {
    const destination = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    let content = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

    if (relativePath === 'hooks/hooks.json') {
      const config = JSON.parse(content);
      const registration = config.hooks.PreToolUse.find(entry =>
        entry.hooks.some(hook => String(hook.command).includes('scripts/hooks/suggest-compact.js'))
      );
      assert.ok(registration, 'upstream fixture must register suggest-compact.js');
      registration.matcher = 'Edit|Write';
      content = JSON.stringify(config, null, 2) + '\n';
    } else if (relativePath === 'scripts/hooks/suggest-compact.js') {
      const patched = [
        'if (bucket < 0) {',
        '      // A compacted transcript can fall below the threshold. Re-arm the',
        '      // context signal so a later climb back to the threshold is reported.',
        "      writeFile(bucketFile, '-1');",
        '      return null;',
        '    }',
      ].join('\n');
      assert.ok(content.includes(patched), 'fixture source must contain the known local patch');
      content = content.replace(patched, 'if (bucket < 0) return null;');
      if (unsupportedUpstreamChange) {
        content = content.replace('if (bucket < 0) return null;', 'if (bucket < 0) { return null; }');
      }
    } else if (relativePath === 'skills/strategic-compact/SKILL.md') {
      content = content.replace(
        'runs on every PreToolUse tool call (the hook matcher is `.*`)',
        'runs on PreToolUse (Edit/Write)',
      );
    } else if (relativePath === 'docs/zh-CN/skills/strategic-compact/SKILL.md') {
      const start = content.indexOf('## 工作原理');
      const end = content.indexOf('## 压缩决策指南');
      assert.ok(start >= 0 && end > start, 'Chinese Skill section boundaries must exist');
      content = content.slice(0, start) + '## 工作原理\n\n上游版本的原始工作原理说明。\n\n' + content.slice(end);
    }

    fs.writeFileSync(destination, content);
  }
}

function withFixture(fn, unsupportedUpstreamChange = false) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'my-ecc-compact-overlay-'));
  try {
    writeFixture(root, unsupportedUpstreamChange);
    fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

let failures = 0;
function test(name, fn) {
  try {
    fn();
    process.stdout.write('✓ ' + name + '\n');
  } catch (error) {
    failures++;
    process.stderr.write('✗ ' + name + '\n  ' + error.stack + '\n');
  }
}

test('applies the overlay to an unchanged upstream baseline and is idempotent', () => {
  withFixture(root => {
    const before = run(root, ['--check']);
    assert.notEqual(before.status, 0, 'check mode should detect missing overlay');
    assert.match(before.stderr, /Overlay is not applied/);

    const applied = run(root);
    assert.equal(applied.status, 0, applied.stderr || applied.stdout);

    const checked = run(root, ['--check']);
    assert.equal(checked.status, 0, checked.stderr || checked.stdout);

    const secondApply = run(root);
    assert.equal(secondApply.status, 0, secondApply.stderr || secondApply.stdout);
    assert.equal(run(root, ['--check']).status, 0, 'a second apply must remain current');

    const hooks = JSON.parse(fs.readFileSync(path.join(root, 'hooks/hooks.json'), 'utf8'));
    const registration = hooks.hooks.PreToolUse.find(entry =>
      entry.hooks.some(hook => String(hook.command).includes('scripts/hooks/suggest-compact.js'))
    );
    assert.equal(registration.matcher, '.*');

    const hookScript = fs.readFileSync(path.join(root, 'scripts/hooks/suggest-compact.js'), 'utf8');
    assert.match(hookScript, /writeFile\(bucketFile, '-1'\)/);

    const english = fs.readFileSync(path.join(root, 'skills/strategic-compact/SKILL.md'), 'utf8');
    assert.match(english, /every PreToolUse tool call/);

    const chinese = fs.readFileSync(path.join(root, 'docs/zh-CN/skills/strategic-compact/SKILL.md'), 'utf8');
    assert.match(chinese, /每次工具调用前/);
  });
});

test('fails closed without modifying files when upstream changes the expected code region', () => {
  withFixture(root => {
    const hooksPath = path.join(root, 'hooks/hooks.json');
    const scriptPath = path.join(root, 'scripts/hooks/suggest-compact.js');
    const hooksBefore = fs.readFileSync(hooksPath, 'utf8');
    const scriptBefore = fs.readFileSync(scriptPath, 'utf8');

    const result = run(root);
    assert.notEqual(result.status, 0, 'an unknown upstream code shape must fail');
    assert.match(result.stderr, /Cannot safely apply context-bucket reset/);
    assert.equal(fs.readFileSync(hooksPath, 'utf8'), hooksBefore, 'no earlier file should be partially written');
    assert.equal(fs.readFileSync(scriptPath, 'utf8'), scriptBefore, 'unrecognized upstream source must be preserved');
  }, true);
});

if (failures > 0) process.exit(1);
process.stdout.write('All strategic-compact overlay tests passed.\n');
