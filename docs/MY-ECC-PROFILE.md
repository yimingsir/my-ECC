# my-ECC

Curated ECC overlay for a Superpowers-first Claude Code workflow.

## Install

```text
/plugin marketplace add yimingsir/my-ECC
/plugin install my-ecc@my-ecc
```

Install the curated Rules separately:

```bash
node scripts/install-my-ecc-rules.mjs
```

This installs the selected Rules to `~/.claude/rules/ecc/`.

For project-local Rules:

```bash
node scripts/install-my-ecc-rules.mjs --project
```

Preview without changing files:

```bash
node scripts/install-my-ecc-rules.mjs --dry-run
```

## Architecture

Superpowers owns the main development workflow. my-ECC supplies selected ECC skills, specialist agents, useful commands, and ECC standard hooks.

`config/my-ecc-profile.json` is the only file you edit to change the curated component set.

`scripts/apply-my-ecc-profile.mjs` generates the plugin manifest, marketplace entry, and managed hook configuration.

`plugin.json` is the component authority. Claude Code 2.1+ auto-loads `hooks/hooks.json` from an installed plugin, so the plugin manifest intentionally does **not** declare a `hooks` field.

## Curated engineering layer

The default profile is intentionally focused on your current stack and Superpowers-first workflow.

### Added in profile v3

**Agents**
- `silent-failure-hunter` — finds swallowed errors, dangerous fallbacks, missing error propagation, and failure paths that look successful.
- `pr-test-analyzer` — checks whether changed behavior is actually covered by meaningful tests, including edge and error paths.

**Skills**
- `error-handling` — robust error propagation, retries, circuit breakers, and user/developer error boundaries.
- `contract-first` — keeps frontend/backend and service boundaries aligned through a canonical contract.
- `ai-regression-testing` — targets AI-assisted development blind spots and regression coverage.
- `production-audit` — audits production-readiness beyond ordinary build/lint/test checks.
- `deployment-patterns` — covers CI/CD, rollout strategy, health checks, and rollback patterns.

These are additive engineering capabilities; they do not replace Superpowers' primary workflow.

## Hook overlay

The hook profile is `standard`, with two ECC hooks disabled because your project-level hooks already own the corresponding responsibilities:

- `post:quality-gate` — disabled to avoid duplicate per-edit quality checks alongside your `format-on-edit.py`.
- `stop:format-typecheck` — disabled to avoid a Stop-hook race with your `verify-on-stop.py`, which is the authoritative final quality gate.

The following ECC safety/context hooks remain enabled, including Bash preflight, config protection, session lifecycle, governance, context monitoring, and skill tracking.

The disabled hook IDs are validated against `hooks/hooks.metadata.json` on every profile generation. This makes an upstream hook rename/removal fail the sync workflow instead of silently changing your policy.

## Rules

Rules are intentionally **not** part of the Claude Code plugin manifest. Install only the curated, stable Rules you want as a separate user- or project-level layer.

The installer currently manages:

```text
rules/common/coding-style.md
rules/common/security.md

rules/golang/coding-style.md
rules/golang/patterns.md
rules/golang/security.md

rules/python/coding-style.md
rules/python/patterns.md
rules/python/security.md

rules/typescript/coding-style.md
rules/typescript/security.md

rules/vue/coding-style.md
rules/vue/patterns.md
rules/vue/security.md
```

The installer preserves the `common/`, `golang/`, `python/`, `typescript/`, and `vue/` directory structure because language-specific Rules reference their common counterparts.

It only writes these managed files; unrelated Rules already under `~/.claude/rules/` or `.claude/rules/` are not removed.

Workflow-heavy Rules such as common testing, git workflow, hooks, and agents are intentionally excluded. Those responsibilities remain with Superpowers, my-ECC hooks, and my-ECC Agents/Skills to avoid competing instructions.

## Deferred

The default profile intentionally defers heavier or more specialized capabilities:
- `continuous-learning-v2`
- `skill-stocktake`
- `strategic-compact`
- `frontend-design-direction`
- `living-docs-governance`
- `codebase-onboarding`
- `harness-optimizer`
- `type-design-analyzer`
- `performance-optimizer`
- `a11y-architect`

They remain upstream-visible and can be promoted into the profile later without changing the architecture.

## Automatic upstream updates

The sync workflow merges the latest ECC release, resolves only expected conflicts in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, re-applies the profile, and pushes the result.

Unexpected conflicts fail the workflow instead of silently overwriting custom changes.

Plugin version is `<ECC VERSION>-my.<profile_version>`, so every upstream release becomes a new plugin version automatically.

## Validate

```bash
node scripts/apply-my-ecc-profile.mjs --check
node scripts/install-my-ecc-rules.mjs --check
node tests/lib/hook-flags.test.js
```

Regenerate after changing the profile:

```bash
node scripts/apply-my-ecc-profile.mjs
```
