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

`scripts/apply-my-ecc-profile.mjs` generates the plugin manifest, marketplace entry, managed hook configuration, and curated MCP overlay.

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

## MCP overlay

The repository keeps a curated Chrome DevTools MCP configuration for the target Linux/root runtime:

- headless browser execution
- isolated browser profile
- `--no-sandbox` passed to Chrome because the runtime may execute as root

The overlay is applied to `.mcp.json` while preserving other upstream MCP server entries. It is re-applied after every upstream release merge, so upstream changes do not silently remove the runtime-specific Chrome DevTools settings.

## Hook overlay

The hook profile is `standard`. The curated profile disables only hooks that overlap with responsibilities already owned by Superpowers or your local Claude Code hooks:

- `pre:edit-write:gateguard-fact-force` — disabled because Superpowers owns the primary development workflow and already drives repository understanding before edits; keeping a blocking first-touch Edit/Write gate caused redundant denial/retry loops.
- `session:start` — disabled so Superpowers remains the primary `SessionStart` context owner; ECC lifecycle/telemetry hooks remain available without competing with Superpowers' session bootstrap.
- `post:quality-gate` — disabled to avoid duplicate per-edit quality checks alongside your `format-on-edit.py`.
- `post:edit:accumulator` — disabled because it primarily feeds ECC's `stop:format-typecheck`, which is also disabled in this profile.
- `post:edit:design-quality-check` — disabled because frontend design guidance is better handled by your `frontend-design`, Vue-specific skills, and repository conventions than by a heuristic warning on every edit.
- `stop:format-typecheck` — disabled because your `verify-on-stop.py` is the authoritative final changed-scope verification hook.

The following ECC safety/context hooks remain enabled, including Bash preflight, Bash/PowerShell destructive-command GateGuard, config protection, MCP health checks, console-log auditing, session persistence, governance, context monitoring, and skill tracking.

Disabled hook IDs are validated against both `hooks/hooks.metadata.json` and Hook IDs registered inside ECC hook dispatcher implementations under `scripts/hooks/`. This keeps curated overrides explicit while allowing internal dispatcher hooks such as `post:quality-gate` to be controlled without hardcoding the upstream version.

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

The sync workflow merges the latest ECC release, resolves expected overlay conflicts in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and `.mcp.json`, re-applies the profile, and pushes the result.

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
