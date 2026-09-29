import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeTraceability } from './validate.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function buildRun(spec, blueprint, outDirectory, report) {
  const out = resolve(outDirectory);
  await mkdir(out, { recursive: true });
  const data = JSON.stringify({ spec, blueprint }).replaceAll('<', '\\u003c');
  const html = `<!doctype html>\n<html lang="${escapeHtml(blueprint.designSystem.locale)}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${escapeHtml(spec.project.name)} — mockup</title>\n<link rel="stylesheet" href="./style.css">\n</head>\n<body>\n<div id="app"></div>\n<script id="mockup-data" type="application/json">${data}</script>\n<script src="./app.js" defer></script>\n</body>\n</html>\n`;
  await writeFile(join(out, 'index.html'), html, 'utf8');
  await copyFile(join(root, 'web', 'app.js'), join(out, 'app.js'));
  await copyFile(join(root, 'web', 'style.css'), join(out, 'style.css'));
  await writeFile(join(out, 'traceability.json'), JSON.stringify(makeTraceability(spec, blueprint), null, 2), 'utf8');
  await writeFile(join(out, 'qa-report.json'), JSON.stringify({
    runId: spec.runId,
    staticValidation: 'passed',
    coverage: report.coverage,
    warnings: report.warnings,
    browserQA: 'not-run',
    baReview: 'pending'
  }, null, 2), 'utf8');
  return join(out, 'index.html');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
