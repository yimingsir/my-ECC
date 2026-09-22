# my-ECC

Curated ECC overlay for a Superpowers-first Claude Code workflow.

## Install

```text
/plugin marketplace add yimingsir/my-ECC
/plugin install my-ecc@my-ecc
```

## Architecture

Superpowers owns the main development workflow. my-ECC supplies selected ECC skills, specialist agents, useful commands, and ECC standard hooks.

`config/my-ecc-profile.json` is the only file you edit to change the curated component set.

`scripts/apply-my-ecc-profile.mjs` generates the plugin manifest, marketplace entry, and managed hook configuration.

`plugin.json` is the component authority. Claude Code 2.1+ auto-loads `hooks/hooks.json` from an installed plugin, so the plugin manifest intentionally does **not** declare a `hooks` field.

## Hook overlay

The hook profile is `standard`, with two ECC hooks disabled because your project-level hooks already own the corresponding responsibilities:

- `post:quality-gate` — disabled to avoid duplicate per-edit quality checks alongside your `format-on-edit.py`.
- `stop:format-typecheck` — disabled to avoid a Stop-hook race with your `verify-on-stop.py`, which is the authoritative final quality gate.

The following ECC safety/context hooks remain enabled, including Bash preflight, config protection, session lifecycle, governance, context monitoring, and skill tracking.

The disabled hook IDs are validated against `hooks/hooks.metadata.json` on every profile generation. This makes an upstream hook rename/removal fail the sync workflow instead of silently changing your policy.

## Automatic upstream updates

The sync workflow merges the latest ECC release, resolves only expected conflicts in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, re-applies the profile, and pushes the result.

Unexpected conflicts fail the workflow instead of silently overwriting custom changes.

Plugin version is `<ECC VERSION>-my.<profile_version>`, so every upstream release becomes a new plugin version automatically.

## Rules

Claude Code plugin manifests do not distribute always-loaded Rules. Keep these separate:
`rules/common`, `rules/golang`, `rules/python`, `rules/typescript`, `rules/vue`.

## Deferred

`continuous-learning-v2`, `skill-stocktake`, and `strategic-compact` are intentionally not enabled by default.

## Validate

```bash
node scripts/apply-my-ecc-profile.mjs --check
node tests/lib/hook-flags.test.js
```

Regenerate after changing the profile:

```bash
node scripts/apply-my-ecc-profile.mjs
```
