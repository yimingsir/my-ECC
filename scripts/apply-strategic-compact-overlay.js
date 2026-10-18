#!/usr/bin/env node
/**
 * Apply the curated strategic-compact overlay on top of upstream ECC files.
 *
 * Upstream-owned files remain the source baseline. This script reapplies only
 * the minimal local behavior after an upstream release merge and fails closed
 * when an expected upstream anchor is no longer recognizable.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { withRefreshedFingerprints } = require('./lib/hooks-config.js');

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const rootIndex = args.indexOf('--root');
const ROOT = rootIndex >= 0 ? path.resolve(args[rootIndex + 1] || '.') : process.cwd();

const FILES = {
  hooks: 'hooks/hooks.json',
  metadata: 'hooks/hooks.metadata.json',
  hookScript: 'scripts/hooks/suggest-compact.js',
  englishSkill: 'skills/strategic-compact/SKILL.md',
  chineseSkill: 'docs/zh-CN/skills/strategic-compact/SKILL.md',
};

function fail(message) {
  console.error('[my-ECC strategic-compact overlay] ' + message);
  process.exit(1);
}

function read(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) fail('Required upstream file is missing: ' + relativePath);
  return fs.readFileSync(fullPath, 'utf8');
}

function transformHookConfig(source) {
  let config;
  try {
    config = JSON.parse(source);
  } catch (error) {
    fail('hooks/hooks.json is not valid JSON: ' + error.message);
  }
  const entries = config?.hooks?.PreToolUse;
  if (!Array.isArray(entries)) fail('hooks/hooks.json has no PreToolUse array.');
  const matches = entries.filter(entry =>
    Array.isArray(entry.hooks) && entry.hooks.some(hook =>
      typeof hook.command === 'string' && hook.command.includes('scripts/hooks/suggest-compact.js')
    )
  );
  if (matches.length !== 1) {
    fail('Expected exactly one PreToolUse registration for suggest-compact.js; found ' + matches.length + '.');
  }
  matches[0].matcher = '.*';
  return JSON.stringify(config, null, 2) + '\n';
}

function transformHookScript(source) {
  const alreadyPatched = /if\s*\(bucket\s*<\s*0\)\s*\{[\s\S]{0,300}writeFile\(bucketFile,\s*['"]-1['"]\)[\s\S]{0,120}return null;\s*\}/.test(source);
  if (alreadyPatched) return source;

  const anchor = 'if (bucket < 0) return null;';
  const count = source.split(anchor).length - 1;
  if (count !== 1) {
    fail('Cannot safely apply context-bucket reset in scripts/hooks/suggest-compact.js; upstream changed the expected code region. Review upstream behavior and update this overlay intentionally.');
  }
  return source.replace(anchor, [
    'if (bucket < 0) {',
    '      // A compacted transcript can fall below the threshold. Re-arm the',
    '      // context signal so a later climb back to the threshold is reported.',
    "      writeFile(bucketFile, '-1');",
    '      return null;',
    '    }',
  ].join('\n'));
}

function transformEnglishSkill(source) {
  const updated = 'runs on every PreToolUse tool call (the hook matcher is `.*`)';
  const original = 'runs on PreToolUse (Edit/Write)';
  if (source.includes(updated) && !source.includes(original)) return source;
  if (source.split(original).length - 1 !== 1) {
    fail('Cannot safely update the English strategic-compact Skill description; review upstream changes.');
  }
  return source.replace(original, updated);
}

const CHINESE_SECTION = `## 工作原理

\`suggest-compact.js\` 通过 \`PreToolUse\` Hook 在**每次工具调用前**运行（Hook matcher 为 \`.*\`），组合两类信号：

1. **上下文 Token 数（主要信号）** — 从 Hook 输入的 \`transcript_path\` 读取会话 transcript 最近一条 assistant usage 记录，计算 \`input_tokens + cache_read_input_tokens + cache_creation_input_tokens\`。标准 200K 窗口默认在约 160K 提醒；检测到 1M 窗口时默认在约 250K 提醒。超过阈值后，每增加约 60K Token 可再次提醒。
2. **工具调用次数（辅助信号）** — 默认累计 50 次工具调用时提醒，之后每增加 25 次再次提醒。现在 Hook 在所有工具调用前运行，因此统计的是会话中的工具调用，而不只是 Edit/Write。

上下文 Token 信号更重要：少量大型文件读取或 MCP 结果也可能迅速占满窗口，而大量轻量调用未必造成上下文压力。

当上下文占用因 \`/compact\` 降到阈值以下时，Hook 会重新启用上下文提醒；上下文再次增长到阈值时可重新提醒。

## Hook 设置

**作为 my-ECC/ECC 插件安装时**，无需手动复制 Hook 配置。插件的 \`hooks/hooks.json\` 已注册 \`pre:edit-write:suggest-compact\`，在 \`standard\` 和 \`strict\` 配置档中通过 profile-aware runner 执行。不要再把同一 Hook 重复添加到 \`~/.claude/settings.json\`，以免重复运行。

若没有提醒，检查以下项目：

- \`config/my-ecc-profile.json\` 选中了 \`strategic-compact\`，且 \`disabled_hooks\` 不包含 \`pre:edit-write:suggest-compact\`。
- 生成后的 \`ecc/setup.json\` 中 \`hooks.enabled\` 为 \`true\`，`hooks.disabled` 不包含该 Hook ID。
- 运行时没有通过 \`ECC_HOOKS_ENABLED=false\`、`ECC_DISABLED_HOOKS\` 或插件选项覆盖禁用 Hook。
- 当前 Hook profile 为 \`standard\` 或 \`strict\`；该 Hook 不在 \`minimal\` profile 中运行。
- Hook 输入包含可读取的 \`transcript_path\` 和 usage 记录；否则 Token 信号会静默跳过，但工具调用计数信号仍可工作。

## 配置

- \`COMPACT_THRESHOLD\` — 首次按工具调用次数提醒的阈值，默认 \`50\`。
- \`COMPACT_CONTEXT_THRESHOLD\` — 上下文 Token 提醒阈值，标准 200K 窗口默认 \`160000\`，1M 窗口默认 \`250000\`；设为 \`0\` 可关闭 Token 信号。
- \`COMPACT_CONTEXT_INTERVAL\` — 超过阈值后每增加多少 Token 再提醒，默认 \`60000\`。
- \`COMPACT_STATE_TTL_DAYS\` — 清理临时目录中过期会话计数状态的天数，默认 \`14\`。
- \`ECC_CONTEXT_WINDOW_TOKENS\` — 显式指定上下文窗口大小，优先于自动检测。
- \`CLAUDE_CODE_AUTO_COMPACT_WINDOW\` — 当未设置 \`ECC_CONTEXT_WINDOW_TOKENS\` 时，作为窗口大小的后备配置。

窗口大小通常通过模型 ID 中的 \`[1m]\` 标记检测；观察到 Token 数超过 200K 时也会推断为大窗口。若使用较大窗口模型且模型 ID 不包含这些线索，请显式设置窗口大小覆盖值。

`;

function transformChineseSkill(source) {
  const startMarker = '## 工作原理';
  const endMarker = '## 压缩决策指南';
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) {
    fail('Cannot safely locate the Chinese strategic-compact Skill section boundaries; review upstream changes.');
  }
  const currentSection = source.slice(start, end).trimEnd();
  if (currentSection === CHINESE_SECTION.trimEnd()) return source;

  // Only replace the exact upstream baseline section we audited. If upstream
  // adds or changes content here, stop rather than silently overwriting it.
  const upstreamBaselineSha256 = '0d23d0faea7591d89ab2afe38a8a59328a90eefdde22ffa0dee278d6f9e6d3a9';
  const currentSha256 = crypto.createHash('sha256').update(currentSection).digest('hex');
  if (currentSha256 !== upstreamBaselineSha256) {
    fail('Chinese strategic-compact Skill section differs from both the known upstream baseline and the curated overlay; review upstream changes before updating the overlay.');
  }
  return source.slice(0, start) + CHINESE_SECTION + source.slice(end);
}

function refreshMetadata(hookConfigText, metadataText) {
  let hooksConfig;
  let metadata;
  try {
    hooksConfig = JSON.parse(hookConfigText);
    metadata = JSON.parse(metadataText);
  } catch (error) {
    fail('Cannot parse Hook configuration or metadata: ' + error.message);
  }
  return JSON.stringify(withRefreshedFingerprints(hooksConfig, metadata), null, 2) + '\n';
}

const original = {};
for (const [key, relativePath] of Object.entries(FILES)) original[key] = read(relativePath);

const transformed = {
  hooks: transformHookConfig(original.hooks),
  hookScript: transformHookScript(original.hookScript),
  englishSkill: transformEnglishSkill(original.englishSkill),
  chineseSkill: transformChineseSkill(original.chineseSkill),
};
transformed.metadata = refreshMetadata(transformed.hooks, original.metadata);

const changes = Object.keys(FILES).filter(key => transformed[key] !== original[key]);
if (CHECK) {
  if (changes.length > 0) {
    fail('Overlay is not applied to: ' + changes.map(key => FILES[key]).join(', ') + '. Run node scripts/apply-my-ecc-profile.mjs to regenerate.');
  }
  console.log('[my-ECC strategic-compact overlay] Overlay is current.');
} else {
  for (const key of changes) {
    fs.writeFileSync(path.join(ROOT, FILES[key]), transformed[key]);
  }
  console.log('[my-ECC strategic-compact overlay] Applied overlay to ' + (changes.length ? changes.map(key => FILES[key]).join(', ') : 'no files (already current)') + '.');
}
