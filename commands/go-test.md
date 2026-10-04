---
description: Run and design Go tests using repository conventions; Superpowers owns the primary TDD workflow.
---

# Go Test Utility

This command provides focused Go testing guidance and execution support. It does not establish a competing TDD workflow.

## Usage

/go-test [path-or-package]

## Focus

- Prefer table-driven tests for related behavioral cases.
- Reuse project-native fixtures, helpers, fakes, and setup patterns.
- Cover normal behavior, failure paths, boundary conditions, concurrency, and public contracts where relevant.
- Keep tests deterministic, independent, and focused on observable behavior.

## Verification

Prefer the repository's canonical test command. Typical Go checks include:

```bash
go test ./...
go test -race ./...
go test -coverprofile=coverage.out ./...
go tool cover -func=coverage.out
```

Coverage targets come from project CI/configuration when one exists. Do not assume a universal percentage.

## Integration

- Use /go-build when the build or type-checking path is failing.
- Use /go-review for Go-specific specialist review after the change is stable.
- Superpowers remains the primary testing/TDD workflow.

## Related

- Skill: skills/golang-testing/
- Agent: agents/go-build-resolver.md for build failures