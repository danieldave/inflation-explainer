#!/usr/bin/env node
// Accessibility baseline for every page: the shared access menu is loaded exactly once,
// and each page declares its language, a mobile viewport and a title.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', 'shots']);
const pages = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    if (f.name.startsWith('.') || SKIP.has(f.name)) continue;
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p); else if (f.name.endsWith('.html')) pages.push(p);
  }
})(ROOT);
let bad = 0;
const fail = (p, why) => { bad++; console.log('  ✗ ' + path.relative(ROOT, p) + ': ' + why); };
if (!fs.existsSync(path.join(ROOT, 'a11y.js'))) { console.log('  ✗ a11y.js is missing from the site root'); process.exit(1); }
for (const p of pages) {
  const s = fs.readFileSync(p, 'utf8');
  if (/http-equiv=["']refresh/i.test(s) || !/<\/body>/i.test(s)) continue;
  const n = (s.match(/src="[^"]*a11y\.js"/g) || []).length;
  if (n !== 1) fail(p, `access menu loaded ${n} times (expected 1)`);
  if (!/<html[^>]*\slang="[a-z]{2}/i.test(s)) fail(p, 'missing <html lang>');
  if (!/name="viewport"/i.test(s)) fail(p, 'missing viewport meta');
  if (!/<title>[^<]+<\/title>/i.test(s)) fail(p, 'missing <title>');
}
if (bad) { console.log(`\n${bad} accessibility baseline problem(s)`); process.exit(1); }
console.log(`  ✓ accessibility baseline: ${pages.length} pages load the access menu once and declare lang, viewport and title`);
