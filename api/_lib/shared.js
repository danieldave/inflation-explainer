/* =====================================================================
   Inflation Explainer AI - shared helpers for the API (runs on Vercel, NOT in the browser)
   ---------------------------------------------------------------------
   Files in a folder that starts with "_" are helpers: Vercel does not
   turn them into web addresses. Only api/explain.js is.

   The secret keys live in Vercel > Project > Settings > Environment Variables:
     OPENAI_API_KEY        required for the AI helper
     OPENAI_MODEL          optional (default gpt-4o-mini)
     ALLOWED_ORIGINS       optional: extra sites allowed to call the API, comma-separated
   A key is NEVER written in any file of this project.
   ===================================================================== */
'use strict';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_TEXT = 2000;

// ---------- 1. Hide personal details BEFORE anything leaves the server ----------
function hidePersonal(text) {
  return String(text)
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[hidden email]')
    .replace(/\+?\d[\d\s-]{6,}\d/g, '[hidden number]')
    .slice(0, MAX_TEXT);
}

// ---------- 2. Fair use: each visitor gets a limited number of calls per hour ----------
// This memory lives inside one running copy of the function. It is a good first
// guard. When the site grows, swap it for a shared store (for example Upstash Redis)
// so every copy counts together. See README.md, "Scaling up".
const hits = new Map();
function allowed(ip, limit) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 3600000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();             // never let the memory grow forever
  return list.length <= limit;
}
function visitor(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

// ---------- 3. Save answers: the same question twice costs only once ----------
const cache = new Map();
function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.t > 6 * 3600000) { cache.delete(key); return null; }   // keep for 6 hours
  return hit.v;
}
function cacheSet(key, v) {
  if (cache.size > 500) cache.delete(cache.keys().next().value);              // drop the oldest
  cache.set(key, { t: Date.now(), v });
}
function keyFor(prefix, text) {
  return prefix + ':' + require('crypto').createHash('sha256').update(text.toLowerCase().replace(/\s+/g, ' ').trim()).digest('hex');
}

// ---------- 4. Who may call the API ----------
function allowOrigin(req, res) {
  const origin = req.headers.origin || '';
  const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const host = req.headers.host || '';
  const ok = !origin || origin === 'https://' + host || /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) ||
    extra.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
  if (origin && ok) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  return ok;
}

// A small "front door" every API file uses: checks method, origin, size and limits.
async function frontDoor(req, res, { limit }) {
  if (!allowOrigin(req, res)) { res.status(403).json({ error: 'This website is not allowed to use the Harvest Calendar helper.' }); return null; }
  if (req.method === 'OPTIONS') { res.status(204).end(); return null; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Send a POST request.' }); return null; }
  if (!process.env.OPENAI_API_KEY) { res.status(503).json({ error: 'The AI helper is not switched on yet.', offline: true }); return null; }
  if (!allowed(visitor(req), limit)) { res.status(429).json({ error: 'You have used the AI helper a lot this hour. Please try again later.' }); return null; }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  return body || {};
}

// ---------- 5. Talk to OpenAI and always get JSON back ----------
async function askOpenAI(system, user, maxTokens, model) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);                 // give up after 25 seconds
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
      body: JSON.stringify({
        model: model || MODEL,
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
      })
    });
    if (!r.ok) throw new Error('OpenAI said ' + r.status);
    const data = await r.json();
    return JSON.parse(data.choices[0].message.content);
  } finally {
    clearTimeout(timer);
  }
}

// ---------- 6. The languages we speak ----------
const LANGUAGES = {
  en: 'English', ha: 'Hausa', yo: 'Yoruba', ig: 'Igbo', pcm: 'Nigerian Pidgin English',
  ff: 'Fulfulde (Fula, as spoken in northern Nigeria)', kr: 'Kanuri', tiv: 'Tiv', ibb: 'Ibibio', efi: 'Efik',
  ijc: 'Izon (Ijaw)', bin: 'Edo (Bini)', nup: 'Nupe', urh: 'Urhobo', igl: 'Igala', idu: 'Idoma', igb: 'Ebira'
};

module.exports = { hidePersonal, frontDoor, allowOrigin, allowed, visitor, askOpenAI, cacheGet, cacheSet, keyFor, LANGUAGES, MAX_TEXT, MODEL };
