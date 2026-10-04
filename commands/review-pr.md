---
description: Run only the my-ECC specialist review lanes relevant to a PR; Superpowers remains the primary review workflow.
---

# Specialist PR Review Adapter

This is an explicit specialist utility. It does not replace Superpowers brainstorming, planning, implementation, testing, review, or completion gates.

## Usage

`/review-pr [PR-number-or-URL]`

## Steps

1. Identify the PR, actual base branch, changed files, and merge/readiness signals when available.
2. Establish the changed surfaces with repository evidence.
3. Use the project's `agent-routing` guidance to select only the relevant my-ECC specialists.
4. Dispatch the smallest primary/companion set; do not invoke the whole reviewer fleet.
5. Aggregate findings by issue, deduplicate overlapping findings, and preserve file/line evidence.
6. Keep scanner, build, and test failures distinct from reviewer judgment.
7. Return findings grouped by severity plus unresolved verification gaps.

## Boundary

- Superpowers owns the review workflow and completion decisions.
- This command only selects and collects specialist review lanes.
- Do not invoke upstream or non-selected agents such as `code-reviewer`, `comment-analyzer`, or `code-simplifier`.
- Follow project `.claude/rules/*` and applicable domain Skills instead of restating their engineering rules here.

## Evidence standard

Report actionable findings supported by repository evidence. Mark uncertain items as verification gaps instead of presenting them as defects.

## Related

- Specialist delegation: `agent-routing`
- Superpowers: primary workflow and review process
