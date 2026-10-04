---
description: Run AgentShield against agent, hook, MCP, permission, and secret surfaces. This is the slash-command entrypoint for that deterministic audit.
---

# Security Scan Command

Run AgentShield against the current project or a target path, then turn the findings into a prioritized remediation plan.

This command is a deterministic scanning utility. It does not replace the project's security workflow or manually reasoned security review.

## Usage

`/security-scan [path] [--format text|json|markdown|html] [--min-severity low|medium|high|critical] [--fix]`

- `path` (optional): defaults to the current project. Use a `.claude/` path, a repo root, or a checked-in template directory.
- `--format`: output format. Use `json` for CI, `markdown` for handoffs, and `html` for standalone review reports.
- `--min-severity`: filters lower-priority findings.
- `--fix`: applies only AgentShield fixes explicitly marked as safe and auto-fixable.

## Deterministic Engine

Prefer the packaged scanner:

```bash
npx ecc-agentshield scan --path "${TARGET_PATH:-.}" --format text
```

For local AgentShield development, run from the AgentShield checkout:

```bash
npm run scan -- --path "${TARGET_PATH:-.}" --format text
```

Use AgentShield output as the source of truth for scanner findings and separate scanner facts from follow-up judgment.

## Review Flow

1. Run the scanner against the requested scope.
2. Separate active runtime findings from lower-confidence inventory.
3. For each critical/high finding, record the path, severity, runtime confidence, impact, exact remediation, and whether the fix is safe to automate.
4. If `--fix` is requested, state the intended safe fixes before applying them.
5. Re-run the scan after fixes and report the before/after result.

Manual security judgment is separate from the scanner. Use the project's specialist delegation path to invoke `security-reviewer` when a finding needs expert interpretation.

## Output Contract

Return:

1. Security grade and score when provided by AgentShield.
2. Counts by severity and runtime confidence.
3. Critical/high findings with exact paths.
4. Lower-confidence findings grouped separately.
5. A remediation order.
6. Commands run and whether the scan was local, CI, or npx-backed.

## Arguments

$ARGUMENTS:
- optional target path
- optional AgentShield flags
