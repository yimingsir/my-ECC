---
description: Analyze test coverage, find high-value gaps, and generate tests toward an explicit or project-configured target.
---

# Test Coverage

Analyze test coverage for the current project and focus test work on meaningful behavioral gaps rather than chasing an invented percentage.

## Usage

`/test-coverage [path] [--target=NN]`

## Target Resolution

Use the first available source:

1. An explicit `--target=NN`.
2. The repository's own CI or coverage configuration.
3. A documented project threshold in repository documentation.
4. If no target exists, report the current coverage and prioritized gaps without inventing a pass/fail threshold.

Never assume 80% is a universal requirement.

## Step 1: Detect the Project's Coverage Path

Prefer the project's existing scripts and configuration.

| Stack | Default evidence source |
|---|---|
| Go | `go test -coverprofile=coverage.out ./...` or the repository's test/coverage script |
| Python / Django / FastAPI | `pytest` with the repository's configured `pytest-cov` options |
| Vue / TypeScript | the repository's declared Vitest/Jest test script and its configured coverage reporter |

Do not add tool-specific flags when the repository already provides a canonical wrapper.

## Step 2: Analyze Gaps

Prioritize:

1. Business-critical behavior.
2. Error handling and failure paths.
3. Boundary conditions and validation.
4. Concurrency, transactions, retries, and idempotency where relevant.
5. High-risk branches that are currently untested.

Use coverage percentages as evidence, not as the only measure of test quality.

## Step 3: Generate Tests

Follow the repository's existing test patterns, fixture strategy, naming, and mocking boundaries.

- Test behavior and observable contracts.
- Reuse existing helpers and fixtures.
- Do not add tests solely to inflate the denominator.
- Keep each test independent and deterministic.
- Prefer regression tests for discovered defects.

## Step 4: Verify

1. Run the relevant test suite.
2. Re-run the configured coverage command.
3. Compare the new result with the resolved target, when a target exists.
4. Report remaining gaps and explain why they were not filled.

## Output

Return:

- coverage before/after;
- target and its source, or `no configured target`;
- highest-value missing tests;
- files/branches that remain under-covered;
- verification commands and their results.
