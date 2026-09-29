#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateRun } from '../src/validate.mjs';
import { buildRun } from '../src/build.mjs';
const [command, ...args] = process.argv.slice(2);
const option = (name) => {
  const position = args.indexOf(`--${name}`);
  return position >= 0 ? args[position + 1] : undefined;
};
const usage = 'Usage: node bin/flowforge.mjs doctor | <validate|build> --spec <canonical-spec.json> --blueprint <ui-blueprint.json> [--out <directory>]';

if (command === 'doctor') {
  const requiredFiles = [
    'AGENTS.md',
    '.agents/skills/flowforge-html/SKILL.md',
    '.agents/skills/flowforge-html/references/artifact-contract.md',
    'schemas/canonical-spec.schema.json',
    'schemas/ui-blueprint.schema.json'
  ];
  const majorVersion = Number(process.versions.node.split('.')[0]);
  const missingFiles = [];
  for (const file of requiredFiles) {
    try { await access(resolve(file)); } catch { missingFiles.push(file); }
  }
  console.log(`Node.js: ${process.version} (${majorVersion >= 20 ? 'passed' : 'requires version 20+'})`);
  console.log(`Agent package: ${missingFiles.length ? `missing ${missingFiles.join(', ')}` : 'passed'}`);
  console.log('Server: not required');
  console.log('Package install: not required');
  process.exit(majorVersion >= 20 && missingFiles.length === 0 ? 0 : 1);
}

if (!['validate', 'build'].includes(command) || !option('spec') || !option('blueprint') || (command === 'build' && !option('out'))) {
  console.error(usage);
  process.exit(2);
}

try {
  const spec = JSON.parse(await readFile(resolve(option('spec')), 'utf8'));
  const blueprint = JSON.parse(await readFile(resolve(option('blueprint')), 'utf8'));
  const report = validateRun(spec, blueprint);
  for (const issue of report.errors) console.error(`ERROR ${issue.code}: ${issue.message}${issue.path ? ` (${issue.path})` : ''}`);
  for (const issue of report.warnings) console.warn(`WARN ${issue.code}: ${issue.message}`);
  if (report.coverage) console.log(`Coverage: ${report.coverage.mappedCount}/${report.coverage.uiRequirementCount} UI requirements mapped`);
  if (report.errors.length) process.exit(1);
  if (command === 'validate') {
    console.log('Validation passed.');
    process.exit(0);
  }

  const path = await buildRun(spec, blueprint, resolve(option('out')), report);
  console.log(`Built ${path}`);
} catch (error) {
  console.error(`Build failed: ${error.message}`);
  process.exit(1);
}
