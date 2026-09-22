# my-ECC

This fork keeps upstream ECC as the source of truth and adds a small curated overlay for a Superpowers-first workflow.

## Profile

The current default profile is defined in \`config/my-ecc-profile.json\`.

The profile focuses on Go, Python, Django, FastAPI, PostgreSQL, MySQL, Redis, Vue 3, Playwright E2E, API design, security, search-first research, documentation lookup, and ECC standard hooks.

Superpowers remains the main development workflow: brainstorming, planning, TDD orchestration, subagent-driven development, review flow, and verification are not replaced by ECC.

## Update model

After an upstream ECC release is merged, \`scripts/apply-my-ecc-profile.mjs\`:

1. validates every selected component still exists;
2. regenerates \`.claude-plugin/marketplace.json\`;
3. derives the plugin version from ECC \`VERSION\` plus the local \`profile_version\`.

The sync workflow runs this automatically after each upstream release merge. The workflow only treats \`.claude-plugin/marketplace.json\` as an expected conflict; unexpected conflicts fail the workflow so they do not silently erase customizations.

## Claude Code installation

\`\`\`text
/plugin marketplace add yimingsir/my-ECC
/plugin install my-ecc@my-ecc
\`\`\`

Then use Claude Code's normal plugin update / marketplace refresh flow.

## Rules

Claude Code plugin manifests do not distribute Rules as plugin components. Keep always-loaded rules separate.

For this setup, the intended ECC rule packs are:

- \`rules/common\`
- \`rules/golang\`
- \`rules/python\`
- \`rules/typescript\`
- \`rules/vue\`

Prefer project-local rules for repository-specific conventions.

## Deferred capabilities

These are intentionally not enabled in the default profile:

- \`continuous-learning-v2\`
- \`skill-stocktake\`
- \`strategic-compact\`

Add them to \`config/my-ecc-profile.json\` and bump \`profile_version\` when you decide to enable them.

## Validation

\`\`\`bash
node scripts/apply-my-ecc-profile.mjs --check
\`\`\`

Regenerate after a profile change:

\`\`\`bash
node scripts/apply-my-ecc-profile.mjs
\`\`\`
