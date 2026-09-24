# my-ECC Customization & Maintenance Rules

> **Purpose:** This document is the operating contract for maintaining `yimingsir/my-ECC` as a curated fork of `affaan-m/ECC`.
>
> Read this before changing the profile, hooks, generated metadata, or CI workflows.

## 1. Architecture and goals

`my-ECC` is an upstream-tracking ECC fork with a deliberate local overlay. The intended architecture is:

```text
Superpowers
  └─ primary workflow: brainstorm → plan → implement → verify → review

my-ECC
  ├─ Skills        → domain knowledge and reusable engineering practices
  ├─ Agents        → specialized reviewers/resolvers
  ├─ Commands      → explicit ECC capabilities
  ├─ Rules/knowledge provided by ECC
  └─ Hooks         → intentionally curated; do not let ECC automation compete with Superpowers

ECC upstream (affaan-m/ECC)
  └─ remains the source for upstream-owned implementation files
```

The fork should add a thin, reproducible overlay rather than permanently diverging from upstream implementation files.

## 2. Source of truth

The primary human-maintained configuration is:

```text
config/my-ecc-profile.json
```

The current profile is `profile_version: 5`, uses `hook_profile: standard`, and has an explicit `disabled_hooks` list. The profile also defines the curated Skills, Agents, and Commands. Do not manually maintain the generated metadata files as independent configuration sources.

The generator is:

```text
scripts/apply-my-ecc-profile.mjs
```

It validates the profile, resolves upstream hook metadata/internal hook IDs, builds the plugin metadata, and generates the local overlay artifacts.

## 3. Generated files: do not hand-edit

The following files are generated/derived from the profile and generator:

```text
.claude-plugin/plugin.json
.claude-plugin/marketplace.json
ecc/setup.json
.mcp.json
```

When the profile changes, regenerate them with:

```bash
node scripts/apply-my-ecc-profile.mjs
node scripts/apply-my-ecc-profile.mjs --check
```

The `--check` command is the required drift check. CI must pass it before a profile change is considered complete.

### Version rule

`profile_version` participates in the generated plugin version:

```text
ECC VERSION + "-my." + profile_version
```

For example, ECC `2.2.2` + profile version `5` produces `2.2.2-my.5`.

Therefore:

- It is valid to change `profile_version` when the curated profile changes.
- It is **not** valid to change only `profile_version` and leave generated artifacts stale.
- Never hand-edit `.claude-plugin/plugin.json` merely to make its version match the profile; run the generator instead.

## 4. Upstream-owned files

Prefer to leave upstream implementation files unchanged. In particular, do not modify these merely to customize the local profile:

```text
hooks/hooks.json
hooks/hooks.metadata.json
scripts/hooks/*
```

If a Hook is undesirable locally, express that preference through:

```text
config/my-ecc-profile.json
  → disabled_hooks
```

This keeps upstream releases mergeable and makes the customization reproducible after every upstream sync.

### Exception: real upstream bug fixes

If an upstream-owned implementation genuinely needs a local patch, treat it as an explicit fork divergence. Before doing so:

1. Confirm the behavior cannot be expressed through the profile/overlay.
2. Identify the exact upstream file and reason for divergence.
3. Check how `sync-upstream-release.yml` will merge that file.
4. Add/update CI coverage for the divergence.
5. Document the reason and expected upstream conflict/maintenance cost in this document or a dedicated design note.

Do not use upstream-file edits as a shortcut for profile customization.

## 5. Hook policy

Current policy is intentionally **Superpowers-first**:

```text
hook_profile: standard
hooks_enabled: true
+ explicit disabled_hooks
```

The disabled list currently removes automation that is redundant, intrusive, or likely to interfere with the primary workflow, including Bash GateGuard/reminders, tmux automation, automatic learning/tracking/governance, MCP health checks, dispatcher tracking, and several Stop/session automation hooks.

The remaining hooks should be kept small and purposeful. Current intent is to retain basic session/compaction/config-protection behavior rather than broad command interception.

### Standard vs minimal

Do not change `hook_profile` from `standard` to `minimal` merely because the effective runtime currently resembles minimal.

Before changing the profile:

1. Audit the actual Hook IDs accepted by each profile.
2. Compare `minimal`, `standard`, and the current `disabled_hooks` set.
3. Check whether upstream has added new hooks since the last audit.
4. Verify that the desired retained protections are still active.
5. Run the profile generator and all relevant CI.

`hook_profile` expresses the upstream baseline; `disabled_hooks` expresses the local policy overlay.

## 6. How the profile is applied

The generator performs these important checks:

- `skills`, `agents`, and `commands` are non-empty and contain no duplicates.
- `hook_profile` is one of `minimal`, `standard`, or `strict`.
- `disabled_hooks` is an array with no duplicates.
- Referenced Skills/Agents/Commands exist.
- `hooks/hooks.json` and `hooks/hooks.metadata.json` exist.
- Disabled Hook IDs exist either in Hook metadata or in the internal Hook implementation registries under `scripts/hooks/`.

It then generates:

```text
plugin.json
marketplace.json
ecc/setup.json
.mcp.json
```

The MCP overlay currently preserves existing `mcpServers` and overlays the curated `chrome-devtools` server configuration. Do not replace the whole MCP file by hand when changing the profile.

## 7. Custom CI workflows

### 7.1 `sync-my-ecc-profile.yml`

Location:

```text
.github/workflows/sync-my-ecc-profile.yml
```

Purpose: automatically regenerate derived artifacts after a change to the profile or generator.

It runs when `main` receives changes to:

```text
config/my-ecc-profile.json
scripts/apply-my-ecc-profile.mjs
```

It performs:

```text
checkout
  ↓
Node.js 20
  ↓
node scripts/apply-my-ecc-profile.mjs
  ↓
node scripts/apply-my-ecc-profile.mjs --check
  ↓
commit generated artifacts if they changed
  ↓
push main
```

It only watches the source/generator paths, so the generated commit does not recursively trigger the same workflow merely because generated files changed.

**Normal usage:** edit the profile, commit/push, and let this workflow regenerate the artifacts. Running the generator locally first is still recommended because it gives faster feedback.

### 7.2 `sync-upstream-release.yml`

Location:

```text
.github/workflows/sync-upstream-release.yml
```

Purpose: keep the fork synchronized with the latest `affaan-m/ECC` release while reapplying the local profile.

The workflow:

1. Checks the latest upstream ECC release.
2. Fetches upstream tags.
3. Merges the upstream release into `main`.
4. Handles only the explicitly expected generated-file merge-conflict cases.
5. Runs `node scripts/apply-my-ecc-profile.mjs` again.
6. Commits changed generated overlay artifacts.
7. Pushes `main`.
8. Synchronizes the upstream release tag on the fork.

**Important:** this is why local customization should live in the profile/overlay rather than in upstream Hook implementation files. The profile is reapplied after every upstream release.

## 8. Required workflow for future changes

### A. Changing Skills / Agents / Commands

1. Edit `config/my-ecc-profile.json`.
2. Ensure the referenced path exists.
3. Run:

```bash
node scripts/apply-my-ecc-profile.mjs
node scripts/apply-my-ecc-profile.mjs --check
```

4. Inspect `git diff`.
5. Commit the source profile and generated artifacts together, or push the profile and let `sync-my-ecc-profile.yml` generate them.
6. Confirm CI passes.

### B. Changing Hooks

Before adding/removing a Hook from `disabled_hooks`:

1. Identify the Hook ID in upstream metadata or `scripts/hooks/`.
2. Decide whether the behavior is truly undesirable or merely unexpected.
3. Prefer disabling it through `config/my-ecc-profile.json` rather than changing its implementation.
4. Run the generator and `--check`.
5. Run the relevant CI.
6. If changing `hook_profile`, perform the full minimal/standard/strict audit described above.

Never remove Hook entries from `hooks/hooks.json` just to disable them locally.

### C. Changing `profile_version`

When the curated profile semantics change materially:

1. Increment `profile_version` in `config/my-ecc-profile.json`.
2. Run the generator.
3. Run `--check`.
4. Confirm `.claude-plugin/plugin.json` now has the matching `X.Y.Z-my.N` version.
5. Commit/push and verify CI.

Never manually edit only `plugin.json`.

### D. Changing the generator

Treat `scripts/apply-my-ecc-profile.mjs` as infrastructure, not as a generated file.

After changing it:

```bash
node scripts/apply-my-ecc-profile.mjs
node scripts/apply-my-ecc-profile.mjs --check
```

Then inspect every generated file for unintended changes. Because the profile-sync CI also watches the generator, a pushed generator change will trigger regeneration automatically.

### E. Changing upstream-sync CI

Before modifying `.github/workflows/sync-upstream-release.yml`:

1. Preserve the upstream merge/reapply-profile sequence.
2. Do not weaken conflict detection.
3. Ensure the profile is reapplied after an upstream merge.
4. Ensure generated artifacts are committed after regeneration.
5. Test both the “new upstream release” and “already contains release, profile drift exists” paths when practical.
6. Verify release-tag handling is still intact.

## 9. What not to do

Do **not**:

- Directly delete or rewrite upstream Hook registries to disable local behavior.
- Manually edit generated `plugin.json`, `marketplace.json`, `ecc/setup.json`, or `.mcp.json` as a permanent source of truth.
- Change `profile_version` without regenerating artifacts.
- Add a Hook ID to `disabled_hooks` without confirming that the ID exists.
- Switch to `minimal` without auditing what minimal actually enables in the current upstream release.
- Add a custom CI that independently rewrites generated files using `sed`, `jq`, or ad-hoc logic when the generator can do it.
- Make a local customization that the upstream-sync workflow will silently overwrite.
- Assume a green profile CI means the upstream sync behavior is safe; both workflows have different responsibilities.

## 10. CI acceptance checklist

Before considering a customization complete:

```text
[ ] config/my-ecc-profile.json is the intended source change
[ ] profile_version is bumped when the profile semantics changed
[ ] generated artifacts were regenerated by apply-my-ecc-profile.mjs
[ ] apply-my-ecc-profile.mjs --check passes
[ ] no unintended upstream-owned files changed
[ ] disabled Hook IDs are valid
[ ] Skills/Agents/Commands referenced by the profile exist
[ ] Profile Sync CI passes
[ ] Profile validation CI passes
[ ] If upstream-related, Sync ECC upstream release still passes
[ ] If hooks changed, the effective hook set was reviewed
```

## 11. Maintenance principle

The core rule for this fork is:

> **Keep upstream code upstream. Keep local policy in the profile. Keep derived state generated. Keep synchronization automated.**

When a future change is proposed, first ask:

```text
Can this be expressed in config/my-ecc-profile.json?
        │
        ├─ yes → do that
        │
        └─ no → can it be implemented as a local overlay without
                modifying upstream-owned implementation files?
                    │
                    ├─ yes → do that
                    │
                    └─ no → document the fork divergence and update CI
```

This keeps `my-ECC` compatible with continuous ECC upstream releases while preserving the intended Superpowers-first workflow.
