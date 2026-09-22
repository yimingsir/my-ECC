#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PROFILE_PATH = path.join(ROOT, "config", "my-ecc-profile.json");
const MARKETPLACE_PATH = path.join(ROOT, ".claude-plugin", "marketplace.json");
const VERSION_PATH = path.join(ROOT, "VERSION");
const CHECK_ONLY = process.argv.includes("--check");

function fail(message) {
  console.error(\`[my-ECC] ERROR: \${message}\`);
  process.exit(1);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(\`Cannot read JSON \${path.relative(ROOT, file)}: \${error.message}\`);
  }
}

if (!fs.existsSync(PROFILE_PATH)) fail("Profile file is missing.");
if (!fs.existsSync(VERSION_PATH)) fail("VERSION file is missing.");

const profile = readJson(PROFILE_PATH);
const eccVersion = fs.readFileSync(VERSION_PATH, "utf8").trim();

if (!eccVersion) fail("VERSION is empty.");
if (!/^\\d+\\.\\d+\\.\\d+/.test(eccVersion)) {
  fail(\`Unexpected ECC version: \${eccVersion}\`);
}

for (const key of ["skills", "agents", "commands"]) {
  if (!Array.isArray(profile[key]) || profile[key].length === 0) {
    fail(\`Profile field \${key} must be a non-empty array.\`);
  }
}

if (!["minimal", "standard", "strict"].includes(profile.hook_profile)) {
  fail(\`Unsupported hook_profile: \${profile.hook_profile}\`);
}

function assertUnique(items, label) {
  const duplicates = items.filter((item, index) => items.indexOf(item) !== index);
  if (duplicates.length) {
    fail(\`\${label} contains duplicates: \${[...new Set(duplicates)].join(", ")}\`);
  }
}

assertUnique(profile.skills, "skills");
assertUnique(profile.agents, "agents");
assertUnique(profile.commands, "commands");

const missing = [];

for (const skill of profile.skills) {
  if (!fs.existsSync(path.join(ROOT, "skills", skill, "SKILL.md"))) {
    missing.push(\`skills/\${skill}/SKILL.md\`);
  }
}

for (const agent of profile.agents) {
  if (!fs.existsSync(path.join(ROOT, "agents", \`\${agent}.md\`))) {
    missing.push(\`agents/\${agent}.md\`);
  }
}

for (const command of profile.commands) {
  if (!fs.existsSync(path.join(ROOT, "commands", \`\${command}.md\`))) {
    missing.push(\`commands/\${command}.md\`);
  }
}

if (!fs.existsSync(path.join(ROOT, "hooks", "hooks.json"))) {
  missing.push("hooks/hooks.json");
}

if (missing.length) {
  console.error("[my-ECC] Profile references missing upstream components:");
  for (const item of missing) console.error(\`  - \${item}\`);
  process.exit(1);
}

const pluginVersion = \`\${eccVersion}-my.\${profile.profile_version}\`;

const marketplace = {
  name: "my-ecc",
  owner: {
    name: "yimingsir",
    url: "https://github.com/yimingsir"
  },
  metadata: {
    description: "Curated ECC profile for yimingsir's Superpowers-first Claude Code workflow."
  },
  plugins: [
    {
      name: "my-ecc",
      source: "./",
      description: profile.description,
      version: pluginVersion,
      author: {
        name: "yimingsir",
        url: "https://github.com/yimingsir"
      },
      homepage: "https://github.com/yimingsir/my-ECC",
      repository: "https://github.com/yimingsir/my-ECC",
      license: "MIT",
      keywords: [
        "claude-code",
        "ecc",
        "superpowers",
        "go",
        "python",
        "django",
        "fastapi",
        "vue",
        "postgresql",
        "mysql",
        "redis"
      ],
      category: "workflow",
      tags: [
        "curated",
        "engineering",
        "go",
        "python",
        "vue",
        "database",
        "security"
      ],
      strict: false,
      userConfig: {
        hooks_enabled: {
          type: "boolean",
          title: "Enable my-ECC hooks",
          description: "Enable ECC lifecycle, quality, and safety hooks.",
          default: Boolean(profile.hooks_enabled)
        },
        hook_profile: {
          type: "string",
          title: "my-ECC hook profile",
          description: "Choose minimal, standard, or strict.",
          default: profile.hook_profile
        }
      },
      skills: profile.skills.map((skill) => \`./skills/\${skill}\`),
      agents: profile.agents.map((agent) => \`./agents/\${agent}.md\`),
      commands: profile.commands.map((command) => \`./commands/\${command}.md\`),
      hooks: "./hooks/hooks.json"
    }
  ]
};

const generated = JSON.stringify(marketplace, null, 2) + "\\n";

if (CHECK_ONLY) {
  if (!fs.existsSync(MARKETPLACE_PATH)) {
    fail("Generated marketplace is missing; run this script without --check.");
  }
  const current = fs.readFileSync(MARKETPLACE_PATH, "utf8");
  if (current !== generated) {
    fail("marketplace.json is out of date with config/my-ecc-profile.json and VERSION.");
  }
  console.log(\`[my-ECC] Profile is valid for ECC \${eccVersion} (plugin \${pluginVersion}).\`);
} else {
  fs.writeFileSync(MARKETPLACE_PATH, generated);
  console.log(\`[my-ECC] Generated curated marketplace for ECC \${eccVersion} (plugin \${pluginVersion}).\`);
}

console.log(\`[my-ECC] Skills: \${profile.skills.length}; agents: \${profile.agents.length}; commands: \${profile.commands.length}; hooks: \${profile.hook_profile}.\`);
