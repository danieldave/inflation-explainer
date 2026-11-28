// node --test scripts/secret-scan.test.mjs — fake secrets are assembled at runtime so this file never contains one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanText } from './secret-scan.mjs';

const rnd = (n, set = 'abcdefghijkLMNOPQRstuvwxyz0123456789') => Array.from({ length: n }, (_, i) => set[(i * 7 + 3) % set.length]).join('');
const hex = (n) => rnd(n, '0123456789abcdef');
const cases = {
  'OpenAI key': 'const k = "' + 'sk-' + 'proj-' + rnd(48) + '";',
  'Paystack secret key': 'PAYSTACK=' + 'sk_' + 'live_' + rnd(40),
  'Twilio Account SID + token pair': 'sid=' + 'AC' + hex(32) + '\ntoken=' + hex(32),
  'GitHub token': 'gh=' + 'ghp_' + rnd(36),
  'Private key': '-----BEGIN ' + 'PRIVATE KEY-----',
  'Telegram bot token': 'TG=' + '123456789:AA' + rnd(33),
  'Password in a URL': 'db=' + 'postgres://admin:' + 'hunter2pass@db.example.org/x'.replace('example', 'prod-host'),
};

for (const [kind, text] of Object.entries(cases)) {
  test(`catches a ${kind}`, () => {
    const hits = scanText('src/config.js', text);
    assert.ok(hits.some(h => h.kind === kind), JSON.stringify(hits));
    assert.ok(hits.every(h => !('value' in h)), 'never returns the secret value');
  });
}

test('ignores placeholders and marked fakes', () => {
  assert.deepEqual(scanText('a.js', 'OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'), []);
  assert.deepEqual(scanText('a.js', 'k = "' + 'sk-' + rnd(40) + '" // secret-scan: allow'), []);
  assert.deepEqual(scanText('.env.example', 'PAYSTACK_SECRET_KEY=your_key_here'), []);
});

test('Firebase web keys are public by design only inside firebase config files', () => {
  const key = 'AIza' + rnd(35);
  assert.deepEqual(scanText('firebase.js', `apiKey: "${key}"`), []);
  assert.equal(scanText('app.js', `apiKey: "${key}"`).length, 1);
});

test('reports the right line number', () => {
  const hits = scanText('x.js', 'a\nb\n' + 'ghp_' + rnd(36));
  assert.equal(hits[0].line, 3);
});
