---
description: Run the Python specialist review lane for changed Python code; use framework-specific delegation when applicable.
---

# Python Code Review

This command is a focused Python review utility. Superpowers owns the primary review workflow; this command supplies Python-specific specialist judgment.

## Usage

/python-review [path]

## Scope

- Python correctness, typing, idioms, error handling, and testability.
- Django: ORM behavior, migration safety, DRF boundaries, and transaction semantics.
- FastAPI: Pydantic contracts, dependency injection, async correctness, and response models.

Use the repository's own lint, type-check, test, and formatting commands. Do not invent tool flags or assume a particular package manager.

## Integration

- Use /build-fix when a build, type-check, or static-analysis failure must be isolated first.
- Use agent-routing when a distinct specialist lane is materially relevant.
- Superpowers remains the primary implementation, testing, review, and completion workflow.

## Related

- Agent: agents/python-reviewer.md
- Skills: skills/python-patterns/, skills/python-testing/