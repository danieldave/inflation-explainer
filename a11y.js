/*! Olusoji Access \u2014 one accessibility menu for every Olusoji product. No dependencies, no tracking, no network.
 *  Add once per page:  <script src="/a11y.js" defer></script>
 *  Options (on the script tag): data-position="left|right"  data-lang="en-NG"
 *  Keyboard: Alt+A opens the menu. Settings are remembered on this device only.
 */
(function () {
  'use strict';
  if (window.__oA11y) return; window.__oA11y = true;
  var D = document, H = D.documentElement, KEY = 'o-a11y-v1';
  var me = D.currentScript || D.querySelector('script[src*="a11y.js"]');
  var POS = (me && me.getAttribute('data-position')) || 'left';
  var LANG = (me && me.getAttribute('data-lang')) || H.lang || 'en-NG';

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var S = load();
  var mq = function (q) { return window.matchMedia && matchMedia(q).matches; };
  if (S.motion === undefined && mq('(prefers-reduced-motion: reduce)')) S.motion = true;
  if (S.contrast === undefined && mq('(prefers-contrast: more)')) S.contrast = true;

  /* ---------- page-level styles (light, scoped by html classes) ---------- */
  var PAGE_CSS = [
    'html.oa-t1{font-size:112.5%!important}html.oa-t2{font-size:125%!important}html.oa-t3{font-size:150%!important}',
    /* Sites sized in px ignore the root font size; for them we fall back to zoom (detected at runtime). */
    'html.oa-t1 :is(img,video,canvas,iframe,table,pre),html.oa-t2 :is(img,video,canvas,iframe,table,pre),html.oa-t3 :is(img,video,canvas,iframe,table,pre){max-width:100%!important}',
    'html.oa-t1 :is(img,video,canvas),html.oa-t2 :is(img,video,canvas),html.oa-t3 :is(img,video,canvas){height:auto!important}',
    'html.oa-t2 body,html.oa-t3 body{overflow-wrap:break-word}',
    'html.oa-zoom.oa-t1 body{zoom:1.12}html.oa-zoom.oa-t2 body{zoom:1.25}html.oa-zoom.oa-t3 body{zoom:1.45}',
    'html.oa-contrast{--o-muted:var(--o-ink,#111);--muted:var(--ink,#111);--mut:var(--ink,#111);--o-line:currentColor}',
    'html.oa-contrast body :not(.oa-keep) {text-shadow:none!important}',
    'html.oa-contrast a{text-decoration:underline!important;text-underline-offset:.18em}',
    'html.oa-contrast :focus-visible,html.oa-focus :focus-visible{outline:3px solid #ffbf00!important;outline-offset:2px!important;box-shadow:0 0 0 6px #111!important}',
    'html.oa-font body,html.oa-font body *:not(code):not(pre):not(kbd):not(.oa-keep){font-family:Verdana,Tahoma,"Segoe UI",system-ui,sans-serif!important;letter-spacing:.04em!important;word-spacing:.14em!important}',
    'html.oa-font p,html.oa-font li,html.oa-font dd{line-height:1.75!important;max-width:70ch}',
    'html.oa-links a{background:#fff3b0!important;color:#111!important;outline:2px solid #111;outline-offset:1px;text-decoration:underline!important}',
    'html.oa-motion *,html.oa-motion *::before,html.oa-motion *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}',
    'html.oa-lite img:not(.oa-keep),html.oa-lite picture,html.oa-lite video,html.oa-lite svg image{visibility:hidden!important}',
    'html.oa-lite [style*="background-image"]{background-image:none!important}',
    'html.oa-lite *{box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
    '.oa-skip{position:fixed;left:12px;top:-60px;z-index:2147483647;background:#111;color:#fff;padding:10px 14px;border-radius:10px;font:600 15px/1.2 system-ui,sans-serif;text-decoration:none}',
    '.oa-skip:focus{top:12px}',
    '.oa-guide{position:fixed;left:0;right:0;height:2.6em;pointer-events:none;z-index:2147483645;background:rgba(255,214,0,.16);border-top:2px solid rgba(17,17,17,.55);border-bottom:2px solid rgba(17,17,17,.55);display:none}',
    'html.oa-guide-on .oa-guide{display:block}',
    '.oa-speaking{background:#fff3b0!important;color:#111!important;border-radius:4px}'
  ].join('\n');

  function addSheet(css, root) {
    try {
      var sh = new CSSStyleSheet(); sh.replaceSync(css);
      root.adoptedStyleSheets = (root.adoptedStyleSheets || []).concat(sh); return;
    } catch (e) {}
    var st = D.createElement('style'); st.textContent = css;
    (root === D ? D.head : root).appendChild(st);
  }

  /* ---------- the panel (Shadow DOM: host CSS cannot break it, it cannot break the host) ---------- */
  var UI_CSS = [
    ':host{all:initial}',
    '*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
    '.fab{position:fixed;bottom:18px;' + POS + ':18px;z-index:2147483646;width:48px;height:48px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:#14161c;color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.28),0 1px 2px rgba(0,0,0,.2);transition:transform .15s ease}',
    '.fab:hover{transform:translateY(-1px)}.fab:focus-visible{outline:3px solid #ffbf00;outline-offset:3px}',
    '.fab svg{width:26px;height:26px}',
    '.panel{position:fixed;bottom:76px;' + POS + ':18px;z-index:2147483646;width:min(360px,calc(100vw - 24px));max-height:min(78vh,640px);overflow:auto;background:#fff;color:#14161c;border:1px solid #e4e6eb;border-radius:18px;box-shadow:0 24px 60px rgba(15,18,30,.22),0 2px 6px rgba(15,18,30,.08);padding:16px 16px 12px}',
    '.panel[hidden]{display:none}',
    '@media (prefers-color-scheme:dark){.panel{background:#16181f;color:#eef0f4;border-color:#2a2e38}.row,.size button{background:#1e212a!important;border-color:#2c303b!important;color:#eef0f4!important}.sub{color:#a7adba!important}.size button[aria-pressed=true]{background:#eef0f4!important;color:#14161c!important}.row[aria-pressed=true]{background:#1b2540!important;border-color:#5b8cff!important}.row[aria-pressed=true] .sub{color:#c3cde6!important}}',
    'h2{font-size:16px;margin:0;font-weight:650;letter-spacing:-.01em}',
    '.head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}',
    '.x{border:0;background:transparent;color:inherit;font-size:22px;line-height:1;cursor:pointer;width:36px;height:36px;border-radius:10px}',
    '.x:focus-visible,.row:focus-visible,.size button:focus-visible,.foot button:focus-visible{outline:3px solid #ffbf00;outline-offset:2px}',
    '.lbl{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin:12px 2px 6px}',
    '.size{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}',
    '.size button{min-height:44px;border:1px solid #e4e6eb;background:#f6f7f9;color:#14161c;border-radius:12px;cursor:pointer;font-weight:600}',
    '.size button[aria-pressed=true]{background:#14161c;color:#fff;border-color:#14161c}',
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
    '.row{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;min-height:64px;padding:10px 12px;border:1px solid #e4e6eb;background:#f6f7f9;color:#14161c;border-radius:12px;cursor:pointer;font-size:14px;font-weight:600;position:relative}',
    '.row .sub{font-size:12px;font-weight:450;color:#6b7280}',
    '.row[aria-pressed=true]{border-color:#2f6bff;box-shadow:inset 0 0 0 1px #2f6bff;background:#eef3ff;color:#14161c}',
    '.row[aria-pressed=true] .sub{color:#3a4a6b}',
    '.row[aria-pressed=true]::after{content:"\u2713";position:absolute;top:8px;right:10px;font-size:13px;color:#2f6bff}',
    '.read{grid-column:1/-1}',
    '.foot{display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:12px;color:#6b7280}',
    '.foot button{border:0;background:transparent;color:#2f6bff;font-weight:600;cursor:pointer;padding:8px;border-radius:8px}',
    '@media (prefers-reduced-motion:reduce){.fab{transition:none}}'
  ].join('\n');

  var TOGGLES = [
    ['contrast', 'Stronger contrast', 'Darker text, underlined links'],
    ['font', 'Readable font', 'Dyslexia-friendly spacing'],
    ['links', 'Highlight links', 'See every link at a glance'],
    ['guide', 'Reading guide', 'A band that follows your line'],
    ['motion', 'Stop motion', 'No animations or sliding'],
    ['lite', 'Lighter page', 'Hide images & videos, save data'],
    ['captions', 'Captions on', 'Turn on subtitles in videos'],
    ['focus', 'Clear focus', 'Bold outline when using a keyboard']
  ];

  var host, root, panel, fab, guide, speaking = false;

  var baseFont = 0, FACTOR = { 1: 1.125, 2: 1.25, 3: 1.5 };
  function apply() {
    H.classList.remove('oa-t1', 'oa-t2', 'oa-t3');
    scaleText(1);
    if (D.body && !baseFont) baseFont = probe();
    if (S.size) {
      H.classList.add('oa-t' + S.size);
      // If text did not grow, the site uses fixed px sizes: scale each element's text instead.
      // Unlike zoom, this lets the layout re-wrap, so nothing is pushed off-screen.
      if (D.body && baseFont && Math.abs(probe() - baseFont) < 0.5) scaleText(FACTOR[S.size]);
    }
    ['contrast', 'font', 'links', 'motion', 'lite', 'focus'].forEach(function (k) { H.classList.toggle('oa-' + k, !!S[k]); });
    H.classList.toggle('oa-guide-on', !!S.guide);
    if (S.lite) liteMedia(); else restoreMedia();
    if (S.captions) captions();
    if (S.motion) D.querySelectorAll('video[autoplay]').forEach(function (v) { try { v.pause(); } catch (e) {} });
    sync();
  }

  var scaled = [];
  function scaleText(f) {
    scaled.forEach(function (e) { e.style.fontSize = e.getAttribute('data-oa-fs-inline') || ''; e.removeAttribute('data-oa-fs-inline'); });
    scaled = [];
    if (f === 1 || !D.body) return;
    var els = D.body.querySelectorAll('*'), sizes = [];
    for (var i = 0; i < els.length; i++) sizes.push(parseFloat(getComputedStyle(els[i]).fontSize) || 0); // read all first: no layout thrash
    for (var j = 0; j < els.length; j++) {
      var e = els[j]; if (!sizes[j] || /^(SCRIPT|STYLE|SVG|PATH|USE|IMG|VIDEO|IFRAME|CANVAS|BR|HR)$/i.test(e.tagName)) continue;
      e.setAttribute('data-oa-fs-inline', e.style.fontSize || '');
      e.style.fontSize = (sizes[j] * f).toFixed(2) + 'px'; scaled.push(e);
    }
  }
  function probe() {
    var t = D.querySelector('main p, article p, p, li, main, body');
    return t ? parseFloat(getComputedStyle(t).fontSize) || 0 : 0;
  }

  function liteMedia() {
    D.querySelectorAll('iframe[src]:not([data-oa-src])').forEach(function (f) {
      if (f.closest && f.closest('.oa-keep')) return;
      f.setAttribute('data-oa-src', f.src); f.removeAttribute('src');
      var b = D.createElement('button'); b.type = 'button'; b.className = 'oa-load';
      b.textContent = 'Video/embed hidden to save data. Tap to load.';
      b.style.cssText = 'display:block;width:100%;min-height:56px;margin:6px 0;border:1px dashed currentColor;border-radius:10px;background:transparent;color:inherit;font:inherit;cursor:pointer';
      b.onclick = function () { f.src = f.getAttribute('data-oa-src'); f.removeAttribute('data-oa-src'); f.classList.add('oa-keep'); b.remove(); };
      f.parentNode.insertBefore(b, f);
    });
    D.querySelectorAll('img:not([loading])').forEach(function (i) { i.loading = 'lazy'; });
    D.querySelectorAll('video').forEach(function (v) { try { v.pause(); v.preload = 'none'; } catch (e) {} });
  }
  function restoreMedia() {
    D.querySelectorAll('iframe[data-oa-src]').forEach(function (f) { f.src = f.getAttribute('data-oa-src'); f.removeAttribute('data-oa-src'); });
    D.querySelectorAll('.oa-load').forEach(function (b) { b.remove(); });
  }
  function captions() {
    D.querySelectorAll('video').forEach(function (v) { for (var i = 0; i < v.textTracks.length; i++) { var t = v.textTracks[i]; if (t.kind === 'captions' || t.kind === 'subtitles') { t.mode = 'showing'; break; } } });
    D.querySelectorAll('iframe[src*="youtube"],iframe[data-oa-src*="youtube"]').forEach(function (f) {
      var a = f.hasAttribute('data-oa-src') ? 'data-oa-src' : 'src', u = f.getAttribute(a);
      if (u && u.indexOf('cc_load_policy') < 0) f.setAttribute(a, u + (u.indexOf('?') < 0 ? '?' : '&') + 'cc_load_policy=1');
    });
  }

  /* ---------- read aloud ---------- */
  function readable() {
    var sel = (window.getSelection && String(getSelection())).trim();
    if (sel) return [sel];
    var main = D.querySelector('main,[role=main],article') || D.body, out = [];
    main.querySelectorAll('h1,h2,h3,p,li,blockquote,figcaption,td,dt,dd').forEach(function (el) {
      if (el.closest('[hidden],[aria-hidden=true],nav,script,style')) return;
      var t = (el.innerText || '').replace(/\s+/g, ' ').trim(); if (t.length > 1) out.push(t);
    });
    return out.length ? out : [(main.innerText || '').slice(0, 4000)];
  }
  function voice() {
    var vs = speechSynthesis.getVoices(), want = LANG.toLowerCase();
    return vs.find(function (v) { return v.lang.toLowerCase() === want; }) ||
      vs.find(function (v) { return v.lang.toLowerCase().indexOf(want.split('-')[0]) === 0; }) || null;
  }
  function read() {
    if (!('speechSynthesis' in window)) { btnRead.querySelector('.sub').textContent = 'Not supported on this browser'; return; }
    if (speaking) { speechSynthesis.cancel(); speaking = false; sync(); return; }
    var parts = readable(), v = voice(); speaking = true; sync();
    parts.forEach(function (t, i) {
      for (var j = 0; j < t.length; j += 220) {
        var u = new SpeechSynthesisUtterance(t.slice(j, j + 220)); u.lang = LANG; if (v) u.voice = v; u.rate = 0.95;
        if (i === parts.length - 1 && j + 220 >= t.length) u.onend = function () { speaking = false; sync(); };
        speechSynthesis.speak(u);
      }
    });
  }

  /* ---------- build ---------- */
  var btnRead;
  function el(tag, attrs, text) { var e = D.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (text) e.textContent = text; return e; }

  function build() {
    addSheet(PAGE_CSS, D);
    host = el('div', { class: 'oa-host oa-keep', 'data-oa': '' });
    root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    addSheet(UI_CSS, root);

    fab = el('button', { class: 'fab', type: 'button', 'aria-label': 'Accessibility options (Alt+A)', 'aria-expanded': 'false', 'aria-controls': 'oa-panel', title: 'Accessibility (Alt+A)' });
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="4.2" r="2" fill="currentColor"/><path d="M4.5 8.2c2.4.7 4.9 1 7.5 1s5.1-.3 7.5-1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 9.4v4.4m0 0-3 6.2m3-6.2 3 6.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    panel = el('div', { class: 'panel', id: 'oa-panel', role: 'dialog', 'aria-label': 'Accessibility options', hidden: '' });
    var head = el('div', { class: 'head' }); head.appendChild(el('h2', {}, 'Make this page easier'));
    var x = el('button', { class: 'x', type: 'button', 'aria-label': 'Close' }, '\u00d7'); x.onclick = close; head.appendChild(x);
    panel.appendChild(head);

    panel.appendChild(el('div', { class: 'lbl', id: 'oa-size-l' }, 'Text size'));
    var size = el('div', { class: 'size', role: 'group', 'aria-labelledby': 'oa-size-l' });
    [['', 'A'], ['1', 'A+'], ['2', 'A++'], ['3', 'A+++']].forEach(function (s) {
      var b = el('button', { type: 'button', 'data-size': s[0], 'aria-label': s[0] ? 'Text size ' + s[1] : 'Normal text size' }, s[1]);
      b.onclick = function () { S.size = s[0] || undefined; save(); apply(); };
      size.appendChild(b);
    });
    panel.appendChild(size);

    panel.appendChild(el('div', { class: 'lbl' }, 'Reading & seeing'));
    var grid = el('div', { class: 'grid' });
    btnRead = el('button', { type: 'button', class: 'row read', 'data-k': 'read' });
    btnRead.appendChild(D.createTextNode('\ud83d\udd0a Read aloud')); btnRead.appendChild(el('span', { class: 'sub' }, 'Reads the page, or just what you select'));
    btnRead.onclick = read; grid.appendChild(btnRead);
    TOGGLES.forEach(function (t) {
      var b = el('button', { type: 'button', class: 'row', 'data-k': t[0], 'aria-pressed': 'false' });
      b.appendChild(D.createTextNode(t[1])); b.appendChild(el('span', { class: 'sub' }, t[2]));
      b.onclick = function () { S[t[0]] = !S[t[0]]; save(); apply(); };
      grid.appendChild(b);
    });
    panel.appendChild(grid);

    var foot = el('div', { class: 'foot' });
    foot.appendChild(el('span', {}, 'Saved on this device only'));
    var reset = el('button', { type: 'button' }, 'Reset all'); reset.onclick = function () { S = {}; save(); apply(); };
    foot.appendChild(reset); panel.appendChild(foot);

    fab.onclick = function () { panel.hidden ? open() : close(); };
    root.appendChild(fab); root.appendChild(panel);
    H.appendChild(host); // outside <body>, so page zoom/filters never affect the menu

    guide = el('div', { class: 'oa-guide oa-keep', 'aria-hidden': 'true' }); H.appendChild(guide);
    D.addEventListener('mousemove', function (e) { if (S.guide) guide.style.top = (e.clientY - guide.offsetHeight / 2) + 'px'; }, { passive: true });
    D.addEventListener('touchmove', function (e) { if (S.guide && e.touches[0]) guide.style.top = (e.touches[0].clientY - 60) + 'px'; }, { passive: true });

    D.addEventListener('keydown', function (e) {
      if (e.altKey && (e.key === 'a' || e.key === 'A' || e.code === 'KeyA')) { e.preventDefault(); panel.hidden ? open() : close(); }
      else if (e.key === 'Escape' && !panel.hidden) { close(); }
    });
    D.addEventListener('click', function (e) { if (!panel.hidden && !e.composedPath().includes(host)) close(); });

    skipLink();
    lift(); setTimeout(lift, 800);
    var lt; addEventListener('resize', function () { clearTimeout(lt); lt = setTimeout(lift, 150); }, { passive: true });
    if (S.lite || S.captions) new MutationObserver(function () { if (S.lite) liteMedia(); if (S.captions) captions(); }).observe(D.body, { childList: true, subtree: true });
  }

  // Keep the button clear of fixed bottom bars (tab bars, cookie bars, sticky CTAs) on the same side.
  function lift() {
    if (!fab) return;
    var vw = innerWidth, vh = innerHeight, need = 0;
    var all = D.body.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) {
      var e = all[i]; if (e === host || e === guide) continue;
      var cs = getComputedStyle(e); if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      var r = e.getBoundingClientRect(); if (r.height < 20 || r.height > vh * 0.4) continue;
      var nearBottom = r.bottom >= vh - 4 && r.top > vh * 0.5;
      var onSide = POS === 'left' ? r.left < 80 : r.right > vw - 80;
      if (nearBottom && onSide) need = Math.max(need, vh - r.top);
    }
    var b = (need ? need + 12 : 18);
    fab.style.bottom = b + 'px'; panel.style.bottom = (b + 58) + 'px';
  }

  function open() { panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); var f = panel.querySelector('.size button'); if (f) f.focus(); }
  function close() { if (panel.hidden) return; panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); fab.focus(); }

  function sync() {
    if (!panel) return;
    panel.querySelectorAll('.size button').forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-size') || undefined) === (S.size || undefined))); });
    panel.querySelectorAll('.row[data-k]').forEach(function (b) { var k = b.getAttribute('data-k'); if (k !== 'read') b.setAttribute('aria-pressed', String(!!S[k])); });
    if (btnRead) { btnRead.firstChild.nodeValue = speaking ? '\u23f9 Stop reading' : '\ud83d\udd0a Read aloud'; btnRead.setAttribute('aria-pressed', String(speaking)); }
    var on = !!(S.size || TOGGLES.some(function (t) { return S[t[0]]; }));
    fab && fab.setAttribute('data-on', on ? '1' : '0');
  }

  function skipLink() {
    if (D.querySelector('a[href^="#"].skip, a.skip-link, a[href="#main"], a[href="#content"], .oa-skip')) return;
    var target = D.querySelector('main,[role=main],#main,#content');
    if (!target) return;
    if (!target.id) target.id = 'oa-main';
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    var a = el('a', { class: 'oa-skip oa-keep', href: '#' + target.id }, 'Skip to main content');
    D.body.insertBefore(a, D.body.firstChild);
  }

  // Apply saved settings as early as possible (before paint when loaded in <head> without defer).
  apply();
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function () { build(); apply(); }); else { build(); apply(); }
})();
