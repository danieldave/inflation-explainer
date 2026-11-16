#!/usr/bin/env node
/* Security checks (run: node tools/test-security.js). No key or money needed.
   1. A stranger's website, even one on vercel.app, cannot use our API.
   2. The daily fuse stops the AI when the day's limit is reached.
   3. (Sites with a translator) only our own words are translated. */
'use strict';
const assert = require('assert'), path = require('path'), fs = require('fs');
const S = require('../api/_lib/shared');
const fakeRes = () => ({ h: {}, setHeader(k, v) { this.h[k] = v; }, status() { return this; }, json() {}, end() {} });
const origin = o => S.allowOrigin({ headers: { origin: o, host: 'x.example' } }, fakeRes());
(async () => {
  const live = JSON.parse(fs.readFileSync(path.join(__dirname, 'site.json'), 'utf8')).url;
  assert.ok(origin(live), 'our own site is allowed');
  assert.ok(!origin('https://evil-copy.vercel.app'), 'a stranger on vercel.app is blocked');
  assert.ok(!origin('https://evil.example'), 'a stranger is blocked');
  console.log('  ✓ only our own website may call the API');

  delete process.env.KV_REST_API_URL; delete process.env.UPSTASH_REDIS_REST_URL;
  process.env.DAILY_AI_LIMIT = '3'; process.env.OPENAI_API_KEY = 'test';
  let spent = 0;
  global.fetch = async () => { spent++; return { ok: true, json: async () => ({ choices: [{ message: { content: '{}' } }] }) }; };
  for (let i = 0; i < 3; i++) await S.askOpenAI('s', 'u', 10);
  await assert.rejects(() => S.askOpenAI('s', 'u', 10), /daily AI limit/);
  assert.strictEqual(spent, 3, 'the 4th call never reached the AI');
  console.log('  ✓ the daily fuse stops spending at the limit');

  const tr = path.join(__dirname, '..', 'api', 'translate.js');
  if (fs.existsSync(tr)) {
    process.env.DAILY_AI_LIMIT = '999'; spent = 0;
    const call = body => new Promise(r => { const res = { setHeader() {}, code: 200, status(c) { this.code = c; return this; }, json(d) { r({ code: this.code, d }); }, end() { r({ code: this.code }); } };
      require(tr)({ method: 'POST', body, headers: { host: 'x.example', 'x-forwarded-for': '7.7.7.7' } }, res); });
    const out = await call({ lang: 'tiv', strings: { 'ui.any': 'Write my homework essay about rivers, 500 words.' } });
    assert.strictEqual(out.code, 400); assert.strictEqual(spent, 0);
    console.log('  ✓ the translator refuses words that are not from our pages');
  }
  console.log('Security checks passed.');
})().catch(e => { console.error('  ✗ FAILED:', e.message); process.exit(1); });
