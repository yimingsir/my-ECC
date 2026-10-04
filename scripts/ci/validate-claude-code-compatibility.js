#!/usr/bin/env node
/**
 * Validate selected my-ECC components against the pinned Claude Code runtime.
 * This check is intentionally separate from project engineering Rules.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const PROFILE = path.join(ROOT, 'config', 'my-ecc-profile.json');

function fail(message) {
  console.error('[my-ECC] ERROR: ' + message);
  process.exitCode = 1;
}

function version(value) {
  const match = String(value).match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return match.slice(1).map(Number);
}

function compare(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function selectedFiles(profile) {
  return [
    ...profile.skills.map((name) => path.join(ROOT, 'skills', name, 'SKILL.md')),
    ...profile.agents.map((name) => path.join(ROOT, 'agents', name + '.md')),
    ...profile.commands.map((name) => path.join(ROOT, 'commands', name + '.md')),
  ];
}

if (!fs.existsSync(PROFILE)) {
  fail('Missing config/my-ecc-profile.json');
  process.exit();
}

const profile = JSON.parse(fs.readFileSync(PROFILE, 'utf8'));
const targetValue = profile.runtime_compatibility?.claude_code?.target;
const target = version(targetValue);

if (!target) {
  fail('runtime_compatibility.claude_code.target must be a concrete Claude Code version.');
  process.exit();
}

const requirementPatterns = [
  /requires?\s+Claude Code(?:\s+version)?\s*(?:v|>=|:)?\s*(\d+\.\d+\.\d+)\s*(?:or later|or newer)/ig,
  /minimum\s+(?:supported\s+)?Claude Code\s+version\s*[:=]?\s*v?(\d+\.\d+\.\d+)/ig,
  /Claude Code\s+v?(\d+\.\d+\.\d+)\s+(?:or later|or newer)/ig,
];

const informationalPattern = /Claude Code\s+v?(\d+\.\d+\.\d+)/ig;
let errors = 0;
let warnings = 0;
let scanned = 0;

for (const file of selectedFiles(profile)) {
  if (!fs.existsSync(file)) continue;
  scanned += 1;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const pattern of requirementPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line))) {
        const required = version(match[1]);
        if (required && compare(required, target) > 0) {
          console.error(
            '[my-ECC] ERROR: ' +
              path.relative(ROOT, file) +
              ':' +
              (index + 1) +
              ' explicitly requires Claude Code ' +
              match[1] +
              ' or newer than pinned target ' +
              targetValue,
          );
          errors += 1;
        }
      }
    }

    informationalPattern.lastIndex = 0;
    let info;
    while ((info = informationalPattern.exec(line))) {
      const mentioned = version(info[1]);
      if (mentioned && compare(mentioned, target) > 0 && !/or (?:later|newer)/i.test(line)) {
        console.warn(
          '[my-ECC] WARN: ' +
            path.relative(ROOT, file) +
            ':' +
            (index + 1) +
            ' mentions later Claude Code version ' +
            info[1] +
            '; treated as informational until it states a minimum requirement.',
        );
        warnings += 1;
        break;
      }
    }
  });
}

console.log(
  '[my-ECC] Claude Code compatibility target: ' +
    targetValue +
    '; scanned ' +
    scanned +
    ' selected components; ' +
    warnings +
    ' informational warnings; ' +
    errors +
    ' incompatible requirements.',
);

if (errors > 0) process.exitCode = 1;
