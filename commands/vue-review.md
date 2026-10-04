---
description: Run the Vue and TypeScript specialist review lanes relevant to changed frontend code.
---

# Vue Code Review

This command is a focused frontend specialist utility. Superpowers owns the primary review workflow; the selected agents provide distinct Vue and TypeScript judgment.

## Usage

/vue-review [path]

## Scope

- Vue Composition API, reactivity, composables, Pinia, Router, and component behavior.
- TypeScript/JavaScript type and async concerns when they are part of the Vue change.
- Use both vue-reviewer and typescript-reviewer for Vue-related TypeScript/JavaScript changes.

Use the repository's own lint, typecheck, test, and build commands. Do not assume a particular package manager or tool flag.

## Integration

- Use agent-routing when an additional distinct specialist lane is needed.
- Superpowers remains the primary implementation, testing, review, and completion workflow.

## Related

- Agent: agents/vue-reviewer.md
- Companion agent: agents/typescript-reviewer.md
- Skill: skills/vue-patterns/
- Rules: applicable .claude/rules/ecc/vue/* and .claude/rules/ecc/typescript/* rules are managed separately.