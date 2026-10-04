---
description: Navigate the curated my-ECC agents, skills, commands, hooks, install profiles, and maintenance docs without advertising uninstalled upstream surfaces.
---

# /ecc-guide

Use this command as a compact map of the curated my-ECC surface. It should help the user discover the right local capability without dumping the upstream catalog or advertising components that are not installed by the profile.

## Usage

```text
/ecc-guide
/ecc-guide setup
/ecc-guide skills
/ecc-guide commands
/ecc-guide hooks
/ecc-guide install
/ecc-guide find: <query>
/ecc-guide <feature-or-file-name>
```

## Operating Rules

1. Read the current repository files before answering when the checkout is available.
2. Prefer current profile/catalog data over hard-coded counts.
3. Keep the first answer short, then offer targeted drill-down paths.
4. Link users to canonical files instead of copying long sections.
5. Do not recommend a command, skill, or agent unless it is present in the current curated profile or explicitly documented as separately installed.

## Curated Command Surface

The current profile exposes:

- `/build-fix`
- `/go-build`
- `/go-test`
- `/go-review`
- `/python-review`
- `/fastapi-review`
- `/vue-review`
- `/review-pr`
- `/security-scan`
- `/quality-gate`
- `/test-coverage`
- `/update-docs`
- `/ecc-guide`

Upstream-only commands such as `/project-init`, `/harness-audit`, `/skill-health`, and `/skill-create` must not be advertised as part of this curated installation.

## What To Inspect

Use these files as the canonical map:

- `config/my-ecc-profile.json` for the curated Skills, Agents, and Commands
- `.claude-plugin/plugin.json` for generated plugin exposure
- `commands/` for maintained slash-command utilities
- `skills/*/SKILL.md` for reusable domain guidance
- `agents/*.md` for delegated specialist roles
- `hooks/README.md` and `hooks/hooks.json` for hook behavior
- `docs/MY-ECC-CUSTOMIZATION.md` for fork-specific maintenance rules

## Topic Lookup

For `skills`, `commands`, `hooks`, or `agents`:

1. Summarize the current curated surface in a few bullets.
2. Point to the canonical files.
3. Suggest one verification command when useful.
4. Avoid exhaustive upstream catalogs unless the user asks for them.

## Search Mode

For `find: <query>`:

1. Search the repository with `rg`.
2. Group matches by skills, commands, agents, rules, docs, and hooks.
3. Return the strongest matches first with file paths.
4. Recommend the next action only when it reduces ambiguity.

## Feature Lookup

For a named feature:

1. Check exact paths first, such as `skills/<name>/SKILL.md`, `commands/<name>.md`, and `agents/<name>.md`.
2. If exact lookup fails, search with `rg`.
3. Explain what the feature does, when it applies, and which file is canonical.
4. Mention adjacent features only when that prevents confusion.
