# my-ECC Customization & Maintenance Rules

> **Purpose:** This is the canonical maintenance document for `yimingsir/my-ECC`, a curated fork of `affaan-m/ECC` designed to complement a Superpowers-first Claude Code workflow.
>
> **Rule:** When this document conflicts with the repository's executable code or configuration, the code/configuration is authoritative and this document must be corrected.
>
> **Documentation rule:** **Whenever a customization, configuration, Hook policy, generator, CI workflow, upstream-sync behavior, or other repository maintenance rule is changed, update this document in the same change (or immediately afterward) so it remains an accurate maintenance contract.** Do not knowingly leave this document stale.

## 1. Architecture and ownership

The intended architecture is:

```text
Superpowers
  └─ primary workflow: brainstorm → plan → implement → verify → review

my-ECC
  ├─ Skills        → domain knowledge and reusable engineering practices
  ├─ Agents        → specialist reviewers/resolvers
  ├─ Commands      → explicit ECC capabilities
  ├─ Rules         → separately installed engineering/security conventions
  └─ Hooks         → deliberately curated automation

ECC upstream (affaan-m/ECC)
  └─ source for upstream implementation files
```

The fork should remain a thin, reproducible overlay over upstream ECC. Local policy belongs in the profile and generated overlay, not in copied/rewritten upstream implementations.

## 2. Canonical configuration

The primary human-maintained profile is:

```text
config/my-ecc-profile.json
```

Current profile state is defined by that file. At the time this document was last synchronized, it uses:

```text
profile_version: 5
hook_profile: standard
hooks_enabled: true
```

The profile selects the curated Skills, Agents, and Commands and contains the explicit `disabled_hooks` policy. The exact lists in `config/my-ecc-profile.json` are authoritative; do not duplicate them manually in documentation.

The generator is:

```text
scripts/apply-my-ecc-profile.mjs
```

It validates the profile and generates the derived plugin metadata, hook setup, and MCP overlay.

## 3. Generated files

These files are derived outputs and are **not independent configuration sources**:

```text
.claude-plugin/plugin.json
.claude-plugin/marketplace.json
ecc/setup.json
.mcp.json
```

Generate them with:

```bash
node scripts/apply-my-ecc-profile.mjs
```

Then verify drift with:

```bash
node scripts/apply-my-ecc-profile.mjs --check
```

Do not permanently hand-edit generated files. If a generated value is wrong, fix the profile or generator and regenerate.

### Version rule

The generator computes the plugin version as:

```text
<ECC VERSION>-my.<profile_version>
```

For example, ECC `2.2.2` with profile version `5` produces `2.2.2-my.5`.

Therefore:

- It is valid to increment `profile_version` when the curated profile semantics materially change.
- It is invalid to change only `profile_version` and leave generated artifacts stale.
- Never hand-edit `.claude-plugin/plugin.json` just to make its version match the profile.

## 4. Upstream-owned files

Prefer to leave upstream implementation files unchanged, especially:

```text
hooks/hooks.json
hooks/hooks.metadata.json
scripts/hooks/*
```

If a Hook is undesirable locally, disable it through:

```text
config/my-ecc-profile.json
  → disabled_hooks
```

This is essential for reliable upstream synchronization.

### Exception: real upstream bug fixes

A local change to an upstream-owned implementation is acceptable only when the behavior cannot be expressed through the profile/overlay. Before doing so:

1. Identify the exact upstream file and reason for divergence.
2. Check how `sync-upstream-release.yml` will handle that path.
3. Add or update CI coverage.
4. Document the divergence and its expected maintenance cost.
5. Update this document in the same change to record the new maintenance rule or divergence.
6. Verify an upstream release sync before considering the change complete.

Do not edit upstream Hook registries merely to disable local behavior.

## 5. Current Hook policy

The current local policy is:

```text
hook_profile: standard
hooks_enabled: true
+ explicit disabled_hooks
```

The exact `disabled_hooks` list is maintained only in `config/my-ecc-profile.json`. At present it disables Bash verification/GateGuard/reminder/tmux/commit-quality automation, several Edit/Write and governance/learning/MCP checks, dispatcher/skill tracking, Plan Canvas session behavior, and several Stop/SessionEnd automation hooks.

The retained set is intentionally small and focused on basic lifecycle/config protection rather than broad command interception. Do not infer the effective Hook set from this document alone; inspect the current profile and Hook implementation/metadata when changing it.

### Standard vs minimal

`hook_profile` is the upstream baseline; `disabled_hooks` is the local policy overlay.

Do not switch from `standard` to `minimal` merely because the current effective runtime resembles minimal. Before changing it:

1. Inspect how the current ECC release classifies Hook IDs for `minimal`, `standard`, and `strict`.
2. Compare those sets with the current `disabled_hooks` list.
3. Check for newly added upstream Hooks.
4. Confirm the protections you intend to retain are still active.
5. Run the generator and relevant tests/CI.
6. Update this document if the resulting policy or maintenance procedure changes.

The repository code is authoritative if the documented policy and actual Hook behavior differ.

## 6. Skills, Agents, Commands and Rules

The profile is intentionally focused on the project's Go/Python/Vue/database stack and is designed to complement, not replace, Superpowers.

Profile-managed components are declared in:

```text
config/my-ecc-profile.json
```

The generator verifies that referenced Skills, Agents, and Commands exist.

Rules are deliberately not part of the Claude Code plugin manifest. The separate Rules installer manages the curated Rules under `rules/` and can install them for the user or for a project. Use its own documented commands and do not treat installed Rules as generated plugin metadata.

Do not add workflow-heavy Rules that duplicate Superpowers unless there is a documented reason.

## 7. MCP overlay

`scripts/apply-my-ecc-profile.mjs` preserves the existing `.mcp.json` server map and overlays the curated `chrome-devtools` server configuration.

The generator currently configures Chrome DevTools MCP for the target Linux/root runtime using headless, isolated browser execution and `--no-sandbox`.

Do not replace the whole `.mcp.json` by hand when changing the profile. If MCP behavior needs to change, update the generator/profile design and regenerate.

## 8. Custom CI workflows

### 8.1 `sync-my-ecc-profile.yml`

Location:

```text
.github/workflows/sync-my-ecc-profile.yml
```

Purpose: regenerate derived artifacts automatically after changes to the profile or profile generator.

It currently triggers on `main` when either changes:

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

Generated files are not in the trigger paths, so the generated commit does not recursively trigger this workflow.

**Normal usage:** edit the profile, commit/push, and let the workflow regenerate the artifacts. Running the generator locally first is recommended for faster feedback.

### 8.2 `sync-upstream-release.yml`

Location:

```text
.github/workflows/sync-upstream-release.yml
```

Purpose: keep the fork synchronized with the latest `affaan-m/ECC` release while reapplying the local overlay.

The workflow:

1. Gets the latest upstream release tag.
2. Fetches upstream tags.
3. Merges the release into `main`.
4. Permits only the explicitly expected generated-file conflict cases.
5. Re-runs `node scripts/apply-my-ecc-profile.mjs`.
6. Commits generated overlay changes.
7. Pushes `main`.
8. Synchronizes the upstream release tag on the fork.

Unexpected merge conflicts fail the workflow rather than being silently overwritten.

This workflow is the reason local customization should live in the profile/overlay instead of upstream Hook implementation files.

## 9. Required workflow for future changes

**Every customization change must include a documentation review. If the change affects behavior, file ownership, generated outputs, Hook policy, CI, upstream synchronization, versioning, or the maintenance procedure, update this document before the change is considered complete.**

### A. Changing Skills / Agents / Commands

1. Edit `config/my-ecc-profile.json`.
2. Verify every referenced component exists.
3. Run:

```bash
node scripts/apply-my-ecc-profile.mjs
node scripts/apply-my-ecc-profile.mjs --check
```

4. Inspect `git diff` for unintended generated or upstream changes.
5. Update this document if the supported component set or maintenance procedure changed.
6. Commit/push the source profile and generated artifacts, or push the profile and let `sync-my-ecc-profile.yml` generate them.
7. Confirm CI passes.

### B. Changing Hooks

1. Identify the Hook ID in `hooks/hooks.metadata.json` or the Hook implementation registries under `scripts/hooks/`.
2. Prefer `disabled_hooks` over implementation changes.
3. If changing `hook_profile`, perform the full `minimal`/`standard`/`strict` audit described above.
4. Run the generator and `--check`.
5. Run the relevant Hook tests/CI.
6. Inspect the effective Hook set after the change.
7. Update this document whenever the Hook policy, rationale, or maintenance process changes.

Never remove Hook entries from upstream Hook registries merely to disable them locally.

### C. Changing `profile_version`

When the curated profile semantics change materially:

1. Increment `profile_version` in `config/my-ecc-profile.json`.
2. Run the generator.
3. Run `--check`.
4. Confirm `.claude-plugin/plugin.json` has the matching `<ECC VERSION>-my.<profile_version>` value.
5. Inspect the generated diff.
6. Update this document if the versioning policy or profile maintenance rule changed.
7. Push and verify CI.

Never manually change only the generated plugin version.

### D. Changing the generator

Treat `scripts/apply-my-ecc-profile.mjs` as infrastructure.

After modifying it:

```bash
node scripts/apply-my-ecc-profile.mjs
node scripts/apply-my-ecc-profile.mjs --check
```

Then inspect every generated file. A pushed generator change also triggers `sync-my-ecc-profile.yml`.

If generator behavior or generated-file ownership changes, update this document in the same change.

### E. Changing upstream-sync CI

Before modifying `.github/workflows/sync-upstream-release.yml`:

1. Preserve the upstream merge → profile reapply sequence.
2. Do not weaken unexpected-conflict detection.
3. Keep generated overlay regeneration after the merge.
4. Preserve release-tag handling.
5. Test both new-release and already-synced/drift-repair paths when practical.
6. Update this document with any changed CI contract or maintenance procedure.
7. Confirm the change does not cause the profile or generated artifacts to be lost on the next upstream release.

### F. Changing custom profile CI

Before modifying `.github/workflows/sync-my-ecc-profile.yml`:

1. Keep `config/my-ecc-profile.json` and the generator as the source inputs.
2. Do not reimplement generation with ad-hoc `sed`, `jq`, or duplicated logic.
3. Keep generated paths out of the workflow trigger paths unless there is a deliberate reason to change the trigger design.
4. Ensure `--check` remains part of the workflow.
5. Ensure the bot commit contains only expected generated changes.
6. Update this document if the CI contract or maintenance procedure changes.

## 10. What not to do

Do not:

- Delete or rewrite upstream Hook registries to disable local behavior.
- Treat generated metadata as an independent source of truth.
- Change `profile_version` without regenerating artifacts.
- Add a disabled Hook ID without verifying that the ID exists.
- Switch to `minimal` without auditing the current upstream Hook classification.
- Create a second generator for plugin/setup/MCP metadata.
- Add CI that independently rewrites generated files when the generator can do it.
- Make a local customization that upstream sync will silently overwrite.
- Assume profile CI alone proves that upstream release sync is safe.
- Leave this document stale after changing the customization or maintenance contract.

## 11. CI acceptance checklist

Before considering a customization complete:

```text
[ ] The intended source change is in config/my-ecc-profile.json or an explicitly documented overlay/infrastructure file
[ ] profile_version is bumped when profile semantics materially changed
[ ] Generated artifacts were regenerated by apply-my-ecc-profile.mjs
[ ] apply-my-ecc-profile.mjs --check passes
[ ] No unintended upstream-owned files changed
[ ] Disabled Hook IDs are valid
[ ] Skills/Agents/Commands referenced by the profile exist
[ ] Documentation was reviewed and updated when behavior or maintenance rules changed
[ ] Profile Sync CI passes
[ ] Relevant validation/tests pass
[ ] If upstream-related, Sync ECC upstream release still passes
[ ] If Hooks changed, the effective Hook set was reviewed
```

## 12. Maintenance principle

The core rule for this fork is:

> **Keep upstream code upstream. Keep local policy in the profile. Keep derived state generated. Keep synchronization automated. Keep this document synchronized with the implementation.**

When a future change is proposed, ask:

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
