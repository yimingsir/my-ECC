# my-ECC

Curated ECC overlay for a Superpowers-first Claude Code workflow.

## Install

```text
/plugin marketplace add yimingsir/my-ECC
/plugin install my-ecc@my-ecc
```

## Design

Superpowers owns the main development workflow. my-ECC supplies selected ECC skills, specialist agents, useful commands, and ECC standard hooks.

The selected profile lives in `config/my-ecc-profile.json`.

The generator `scripts/apply-my-ecc-profile.mjs` validates every selected upstream component and generates `.claude-plugin/marketplace.json`.

## Automatic upstream updates

After each upstream ECC release, the sync workflow merges the release, resolves only the expected `.claude-plugin/marketplace.json` conflict, re-applies the curated profile, and pushes the result.

Any other merge conflict fails the workflow instead of silently overwriting custom changes.

Plugin version is `<ECC VERSION>-my.<profile_version>`, so upstream releases become new plugin versions automatically.

## Rules

Claude Code plugin manifests do not distribute always-loaded Rules. Keep these separate:
`rules/common`, `rules/golang`, `rules/python`, `rules/typescript`, `rules/vue`.

## Deferred

`continuous-learning-v2`, `skill-stocktake`, and `strategic-compact` are intentionally not enabled in the default profile.

## Validate

```bash
node scripts/apply-my-ecc-profile.mjs --check
```
