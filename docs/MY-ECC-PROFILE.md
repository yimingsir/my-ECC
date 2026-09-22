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

`scripts/apply-my-ecc-profile.mjs` generates both `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.

`plugin.json` is the component authority. The marketplace entry only publishes the plugin source and metadata.

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
```

Regenerate after changing the profile:

```bash
node scripts/apply-my-ecc-profile.mjs
```
