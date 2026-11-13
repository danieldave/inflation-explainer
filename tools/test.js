#!/usr/bin/env node
/* Inflation Explainer AI — checks the API (normal + Family Basket), languages and SEO. No key or money needed. */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
let passed = 0; const ok = (n, f) => Promise.resolve().then(f).then(() => { passed++; console.log('  ✓', n); });
function call(h, { body = {}, origin = 'https://inflation-explainer.vercel.app', ip = '1.1.1.1' } = {}) {
  return new Promise(r => { const res = { headers: {}, code: 200, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(d) { r({ code: this.code, data: d }); }, end() { r({ code: this.code }); } };
    h({ method: 'POST', body, headers: { origin, host: 'inflation-explainer.vercel.app', 'x-forwarded-for': ip } }, res); });
}
let calls = 0, sys = '', user = '';
global.fetch = async (u, o) => { calls++; const b = JSON.parse(o.body); sys = b.messages[0].content; user = b.messages[1].content;
  const out = /basket/i.test(sys.slice(0, 400)) && sys.includes('family typed') ? { headline: 'h', explain: 'e', drivers: ['Rice added ₦9,000', 'Rice added ₦9,000!', 'Garri'], tips: ['a', 'b', 'c', 'd'] }
    : { headline: 'h', explain: 'e', causes: ['Fuel costs', 'Fuel costs.', 'Naira', 'Supply'], compare: 'c', tips: ['t1', 't2', 't3'], answer: '' };
  return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(out) } }] }) }; };
const P = { item: 'Rice', quantity: '50 kg', location: 'Ogun', oldPrice: 92946, newPrice: 112000, months: 1, diff: 19054, change: 20.5, monthly: 20.5, yearly: 840, worth: 829.9, category: 'food', facts: { headline: 14.63, food: 19.59, label: 'September 2026', source: 'NBS' } };
(async () => {
  console.log('API (api/explain.js)');
  delete process.env.OPENAI_API_KEY;
  const ex = require('../api/explain');
  await ok('without a key the AI is switched off (503)', async () => assert.strictEqual((await call(ex, { body: P })).code, 503));
  process.env.OPENAI_API_KEY = 'test';
  await ok('a strange website is blocked (403)', async () => assert.strictEqual((await call(ex, { body: P, origin: 'https://evil.example' })).code, 403));
  await ok('missing prices are refused (400)', async () => assert.strictEqual((await call(ex, { body: { ...P, oldPrice: 'x' } })).code, 400));
  await ok('explains; repeated causes are removed', async () => { const r = await call(ex, { body: P }); assert.strictEqual(r.code, 200); assert.deepStrictEqual(r.data.causes, ['Fuel costs', 'Naira', 'Supply']); });
  await ok('explains in Yoruba when asked', async () => { await call(ex, { body: { ...P, lang: 'yo' } }); assert.ok(user.includes('"LANGUAGE":"Yoruba"')); });
  await ok('the AI is told never to calculate', () => assert.ok(sys.includes('Do NOT calculate anything')));
  await ok('same question again comes from memory', async () => { const b = calls; const r = await call(ex, { body: P }); assert.ok(r.data.cached); assert.strictEqual(calls, b); });
  await ok('Family Basket: explains our numbers; needs 2+ items', async () => {
    assert.strictEqual((await call(ex, { body: { mode: 'basket', items: [{ name: 'Rice', qty: 1, before: 1, now: 2 }] } })).code, 400);
    const r = await call(ex, { body: { mode: 'basket', lang: 'ha', items: [{ name: 'Rice', qty: 0.5, before: 70000, now: 88000, change: 25.7, share: 63.4 }, { name: 'Garri', qty: 4, before: 2500, now: 3200, change: 28, share: 19.7 }], basket: { before: 53000, now: 67200, change: 26.79, months: 12, yearly: 26.79 }, facts: { headline: 14.63, food: 19.59, label: 'September 2026' } } });
    assert.strictEqual(r.code, 200); assert.ok(user.includes('"family_inflation_percent":26.79') && user.includes('Hausa'));
    assert.strictEqual(r.data.drivers.length, 2, 'repeated drivers removed'); assert.strictEqual(r.data.tips.length, 3);
  });
  await ok('fair-use limit: 40 per hour', async () => { let last; for (let i = 0; i < 41; i++) last = await call(ex, { ip: '9.9.9.9', body: { ...P, oldPrice: 90000 + i } }); assert.strictEqual(last.code, 429); });
  console.log('Page, SEO / AEO / GEO');
  const h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  await ok('canonical, social preview, valid JSON-LD with FAQ', () => {
    assert.ok(h.includes('<link rel="canonical" href="https://inflation-explainer.vercel.app/">') && h.includes('og:image'));
    const ld = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]); assert.ok(ld['@graph'].some(x => x['@type'] === 'FAQPage'));
  });
  await ok('visible FAQ, Family Basket and 17 languages on the page', () => { assert.ok(h.includes('id="faq"') && h.includes('id="basket"')); assert.strictEqual((h.match(/<select id="lang">([\s\S]*?)<\/select>/)[1].match(/<option/g) || []).length, 17); });
  await ok('robots.txt welcomes AI search; sitemap and llms.txt exist', () => {
    assert.ok(fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8').includes('GPTBot'));
    assert.ok(fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8').startsWith('# Inflation Explainer AI'));
    assert.ok(fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').includes('<loc>'));
  });
  await ok('price library: every item has a page with reasons, tips and schema; no prices or dates in our words', () => {
    const L = require('./library'); const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    assert.ok(L.ITEMS.length >= 40); assert.strictEqual(new Set(L.ITEMS.map(i => i[0])).size, L.ITEMS.length);
    L.ITEMS.forEach(i => {
      i[4].forEach(k => assert.ok(L.DRIVERS[k], i[0] + ' reason ' + k)); i[6].forEach(k => assert.ok(L.TIPS[k], i[0] + ' tip ' + k));
      assert.ok(!/₦|\b20\d\d\b/.test(i.flat().join(' ')), i[0] + ' must not state a price or a year');
      const page = fs.readFileSync(path.join(ROOT, 'prices', i[0], 'index.html'), 'utf8');
      assert.ok(page.includes('Quick answer') && page.includes('"FAQPage"') && (page.match(/<h1/g) || []).length === 1 && (page.match(/rel="canonical"/g) || []).length === 1, i[0]);
      assert.ok(sm.includes('/prices/' + i[0] + '/'), i[0]);
    });
  });
  await ok('price library: crop links point to real Harvest Calendar pages (when that repo is beside this one)', () => {
    const L = require('./library'); const crops = path.join(ROOT, '../harvest-calendar-naija/crops');
    if (!fs.existsSync(crops)) return;
    L.ITEMS.filter(i => i[8]).forEach(i => assert.ok(fs.existsSync(path.join(crops, i[8])), i[0] + ' -> ' + i[8]));
  });
  await ok('money words: every topic has a page and the examples add up', () => {
    const L = require('./library');
    L.LEARN.forEach(x => assert.ok(fs.existsSync(path.join(ROOT, 'learn', x[0], 'index.html')), x[0]));
    assert.strictEqual(Math.round(10000 / 1.25), 8000); assert.strictEqual(1000 * 1.2, 1200);
  });
  console.log(`\nAll ${passed} checks passed.`);
})().catch(e => { console.error('\n  ✗ FAILED:', e.message); process.exit(1); });
