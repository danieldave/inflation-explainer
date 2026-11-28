#!/usr/bin/env node
// Secret scan: fails if a real-looking API key, token or private key is committed.
// No dependencies. Runs on every push (.github/workflows/secret-scan.yml) and locally:
//   node scripts/secret-scan.mjs            scan the tracked files
//   node scripts/secret-scan.mjs --all      scan every file on disk (except node_modules/.git)
// Mark a deliberate fake on its line with:  secret-scan: allow
// It prints only the file, line and kind of secret — never the value.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const RULES = [
  ['OpenAI key', /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{32,}/],
  ['Anthropic key', /\bsk-ant-[A-Za-z0-9_-]{30,}/],
  ['Paystack secret key', /\bsk_(?:live|test)_[A-Za-z0-9]{30,}/],
  ['Lemon Squeezy / JWT-style token', /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/],
  ['Twilio Account SID + token pair', /\bAC[0-9a-f]{32}\b[\s\S]{0,200}?\b[0-9a-f]{32}\b/],
  ['Twilio API key', /\bSK[0-9a-f]{32}\b/],
  ['Stripe secret key', /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}/],
  ['GitHub token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{50,}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['AWS access key', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['Slack token', /\bxox[abpors]-[A-Za-z0-9-]{10,}/],
  ['Telegram bot token', /\b\d{8,10}:AA[A-Za-z0-9_-]{33}\b/],
  ['Resend key', /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}/],
  ['Private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/],
  ['Upstash REST token', /UPSTASH_REDIS_REST_TOKEN\s*[=:]\s*["']?A[A-Za-z0-9_-]{30,}/],
  ['Supabase service role key', /service_role["'\s:=]+eyJ[A-Za-z0-9_-]{20,}/i],
  ['Password in a URL', /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]{2,}:[^\s:@/]{6,}@[^\s/]+/i],
];

// Google's browser keys (Firebase web config) are public by design; flagged only outside firebase config files.
const PUBLIC_BY_DESIGN = [{ kind: 'Google API key', file: /(^|\/)(firebase[^/]*\.(js|json)|google-services\.json)$/i }];
const PLACEHOLDER = /(x{6,}|0{12,}|your[_-]?(key|token|secret)|example|placeholder|dummy|fake|redacted|<[^>]+>|\.\.\.)/i;
const SKIP_FILE = /(^|\/)(node_modules|\.git|dist|build|\.next|\.vercel)(\/|$)|\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|woff2?|ttf|mp4|mp3|sb3|enc|lock)$|package-lock\.json$/i;
const MAX_BYTES = 1_500_000;

export function scanText(file, text) {
  const hits = [];
  const lines = text.split('\n');
  for (const [kind, re] of RULES) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text))) {
      const line = text.slice(0, m.index).split('\n').length;
      const src = lines[line - 1] || '';
      if (/secret-scan:\s*allow/.test(src)) continue;
      if (PLACEHOLDER.test(m[0])) continue;
      if (PUBLIC_BY_DESIGN.some(p => p.kind === kind && p.file.test(file))) continue;
      hits.push({ file, line, kind });
      if (m[0].length === 0) g.lastIndex++;
    }
  }
  return hits;
}

function listFiles(root, all) {
  if (!all) {
    try { return execSync('git ls-files -z', { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 }).split('\0').filter(Boolean); }
    catch { /* not a git checkout: fall through */ }
  }
  const out = [];
  (function walk(d) {
    for (const f of fs.readdirSync(path.join(root, d), { withFileTypes: true })) {
      const rel = d ? d + '/' + f.name : f.name;
      if (SKIP_FILE.test(rel + (f.isDirectory() ? '/' : ''))) continue;
      f.isDirectory() ? walk(rel) : out.push(rel);
    }
  })('');
  return out;
}

export function scanRepo(root = process.cwd(), { all = false } = {}) {
  const hits = [];
  for (const rel of listFiles(root, all)) {
    if (SKIP_FILE.test(rel)) continue;
    const p = path.join(root, rel);
    let st; try { st = fs.statSync(p); } catch { continue; }
    if (!st.isFile() || st.size > MAX_BYTES) continue;
    const buf = fs.readFileSync(p);
    if (buf.includes(0)) continue; // binary
    hits.push(...scanText(rel, buf.toString('utf8')));
  }
  return hits;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const hits = scanRepo(process.cwd(), { all: process.argv.includes('--all') });
  if (!hits.length) { console.log('✓ secret scan: no keys, tokens or private keys found'); process.exit(0); }
  for (const h of hits) console.log(`✗ ${h.file}:${h.line}  looks like a ${h.kind}`);
  console.log(`\n${hits.length} possible secret(s). Remove them, rotate the real ones, and move values to Vercel/GitHub secrets.`);
  console.log('A deliberate fake can be marked on its line with:  secret-scan: allow');
  process.exit(1);
}
