---
description: Run the Go specialist review lane for changed Go code; use additional specialist delegation only for distinct concerns.
---

# Go Code Review

This command is a focused Go review utility. Superpowers owns the primary review workflow; the selected Go agent supplies Go-specific specialist judgment.

## Usage

/go-review [path]

## Scope

- Go API and service boundaries.
- Error handling and package-level correctness.
- Concurrency and goroutine lifecycle.
- Database access and transaction behavior when Go code is involved.
- Go testing patterns and maintainability.

Use the repository's canonical lint, test, build, and static-analysis commands. Do not assume a particular installed analyzer.

## Integration

- Use /go-test for focused Go test design or execution.
- Use /go-build when the build or type-checking path is failing.
- Use agent-routing for an additional distinct specialist lane such as type design or performance.
- Superpowers remains the primary implementation, testing, review, and completion workflow.

## Related

- Agent: agents/go-reviewer.md
- Skills: skills/golang-patterns/, skills/golang-testing/