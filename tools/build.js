#!/usr/bin/env node
/* =====================================================================
   tools/build.js  -  makes the Price Library pages
   ---------------------------------------------------------------------
     /prices/                 every item
     /prices/<item>/          "Why is the price of ___ going up in Nigeria?"
     /learn/                  money words explained
     /learn/<topic>/          "What is inflation?" and friends
     sitemap.xml and llms.txt
   Run:  node tools/build.js      The address comes from tools/site.json.
   ===================================================================== */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = JSON.parse(fs.readFileSync(path.join(__dirname, 'site.json'), 'utf8'));
const URL_ = SITE.url.replace(/\/$/, ''), TODAY = new Date().toISOString().slice(0, 10);
const L = require('./library');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const short = s => s.length > 155 ? s.slice(0, 150).replace(/\s\S*$/, '') + '…' : s;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const pages = [{ loc: '/', pri: '1.0' }];
const write = (rel, text) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const VERIFY = (SITE.googleVerify ? `\n<meta name="google-site-verification" content="${SITE.googleVerify}">` : '') + (SITE.bingVerify ? `\n<meta name="msvalidate.01" content="${SITE.bingVerify}">` : '');
const ORG = { '@type': 'EducationalOrganization', '@id': URL_ + '/#org', name: SITE.publisher, url: URL_ + '/' };
const faqSchema = list => ({ '@type': 'FAQPage', mainEntity: list.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const article = (h, d, loc) => ({ '@type': 'Article', headline: h, description: d, inLanguage: 'en-NG', datePublished: '2026-11-13', dateModified: TODAY, author: { '@id': URL_ + '/#org' }, publisher: { '@id': URL_ + '/#org' }, mainEntityOfPage: URL_ + loc, image: URL_ + '/og-image.png' });

function page({ rel, title, description, h1, crumbs, body, schema }) {
  const url = URL_ + '/' + rel.replace(/index\.html$/, '');
  description = short(description);
  // Google shows about 60 letters of a title
  if (title.length > 60) title = title.replace(/ \| Inflation Explainer$/, '');
  for (let n = 58; title.length > 60 && n > 30; n -= 4) title = title.replace(/…$/, '').slice(0, n).replace(/\s\S*$/, '') + '…';
  return `<!doctype html>
<html lang="en-NG">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">${VERIFY}
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Inflation Explainer AI">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${URL_}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${URL_}/og-image.png">
<meta name="theme-color" content="#0F3D22">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230F3D22'/%3E%3Ctext x='32' y='45' font-size='38' text-anchor='middle' fill='%23E9A80F' font-family='Arial' font-weight='700'%3E%E2%82%A6%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Nunito+Sans:opsz,wght@6..12,400;6..12,700;6..12,800&display=swap">
<link rel="stylesheet" href="/guide.css">
<script>try { var t = localStorage.getItem("iea-theme"); if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t); } catch (e) {}</script>
<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: URL_ + c[1] })) }].concat(schema || []) })}</script>
</head>
<body>
<header class="bar"><a class="brand" href="/"><span class="logo" aria-hidden="true">₦</span><span>Inflation Explainer AI</span></a></header>
<nav class="gnav" aria-label="Main"><a href="/prices/">Why prices rise</a><a href="/learn/">Money words</a><a href="/#tool">Explain my price</a><a href="/price-diary/">My Price Diary</a><a href="/#basket">Family Basket</a></nav>
<main class="guide">
  <nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((c, i) => i < crumbs.length - 1 ? `<a href="${c[1]}">${esc(c[0])}</a> › ` : esc(c[0])).join('')}</nav>
  <h1>${esc(h1)}</h1>
${body}
  <p class="updated">Written by the ${esc(SITE.publisher)}. Last updated <time datetime="${TODAY}">${TODAY}</time>. We explain reasons, not today's prices: prices differ by town and change every week. For official figures see the National Bureau of Statistics.</p>
</main>
<footer><p><a href="/prices/">Why prices rise</a> · <a href="/learn/">Money words</a> · <a href="/">Explain my own price</a> · <a href="/price-diary/">My Price Diary</a> · <a href="/faq/">FAQ</a> · <a href="/about/">About / who built this</a> · <a href="/whats-new/">What's new</a> · <a href="${SITE.harvest}/">Harvest Calendar Naija</a></p><p>Built with AI by the ${esc(SITE.publisher)} · ByteBusters National Showcase 2026</p></footer>
</body>
</html>
`;
}
const cta = item => `<div class="cta"><a class="btn" href="/?item=${encodeURIComponent(item || '')}#tool">Explain my own price with AI</a><a class="btn ghost" href="/#basket">Work out my family's inflation</a></div>`;
const grid = list => `<ul class="grid">${list.map(([href, b, sm]) => `<li><a href="${href}"><b>${esc(b)}</b><small>${esc(sm || '')}</small></a></li>`).join('')}</ul>`;
const calc = name => `<div class="calc"><div class="row"><label>Price before (₦)<input id="cOld" inputmode="decimal" placeholder="e.g. 1,000"></label><label>Price now (₦)<input id="cNew" inputmode="decimal" placeholder="e.g. 1,500"></label></div>
  <output id="cOut">Type the two prices you paid for ${esc(name)}.</output></div>
  <script>(function () { var o = document.getElementById("cOld"), n = document.getElementById("cNew"), out = document.getElementById("cOut");
    function num(v) { return parseFloat(String(v).replace(/[^0-9.]/g, "")); }
    function go() { var a = num(o.value), b = num(n.value); if (!(a > 0) || !(b > 0)) { out.className = ""; out.textContent = "Type the two prices you paid."; return; }
      var p = (b - a) / a * 100, buys = Math.round(a / b * 1000);
      out.className = p > 0 ? "up" : p < 0 ? "down" : "";
      out.textContent = (p > 0 ? "Up " : p < 0 ? "Down " : "No change: ") + Math.abs(p).toFixed(1).replace(/\\.0$/, "") + "%. ₦1,000 now buys what ₦" + buys.toLocaleString("en-NG") + " bought before."; }
    o.oninput = n.oninput = go; })();</script>`;

// ---------- /prices/<item>/ ----------
L.ITEMS.forEach(([slug, name, group, answer, drivers, fact, tips, swap, crop]) => {
  const loc = `/prices/${slug}/`, h1 = `Why is the price of ${name} going up in Nigeria?`;
  const reasons = drivers.map(k => { if (!L.DRIVERS[k]) throw new Error(slug + ': unknown reason ' + k); return L.DRIVERS[k]; });
  const tipList = tips.map(k => { if (!L.TIPS[k]) throw new Error(slug + ': unknown tip ' + k); return L.TIPS[k]; }).concat(swap);
  const related = L.ITEMS.filter(x => x[0] !== slug && x[2] === group).slice(0, 6);
  const faq = [[h1, answer + ' ' + fact], [`How can a family save money on ${name}?`, tipList.join(' ')], [`Will the price of ${name} come down?`, `Prices of ${name} fall when the things that pushed them up ease: ${reasons.slice(0, 3).map(r => r[0].toLowerCase()).join(', ')}. ${drivers.includes('season') ? 'Because it is seasonal, it usually gets cheaper around harvest.' : 'Prices usually rise fast and fall slowly, so slower rises are more common than real falls.'}`]];
  write(`prices/${slug}/index.html`, page({
    rel: `prices/${slug}/index.html`, title: `Why is ${name.replace(/ \(.*\)$/, '')} so expensive in Nigeria? | Inflation Explainer`, description: short(answer), h1,
    crumbs: [['Home', '/'], ['Why prices rise', '/prices/'], [cap(name), loc]],
    body: `
  <p class="answer-box"><b>Quick answer:</b> ${esc(answer)}</p>
  <h2>The ${reasons.length} main reasons</h2>
  <ol class="reasons">${reasons.map(r => `<li><b>${esc(r[0])}</b>${esc(r[1])}</li>`).join('')}</ol>
  <h2>One thing to know</h2>
  <p class="fact">${esc(fact)}</p>
  ${crop ? `<p><a class="harvest" href="${SITE.harvest}/crops/${crop}/" rel="noopener">🌱 See when this crop is planted and harvested in your state on Harvest Calendar Naija →</a></p>` : ''}
  <h2>How much has your ${esc(name)} gone up?</h2>
  ${calc(name)}
  <h2>What a family can do</h2>
  <ul class="tips">${tipList.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
  <h2>Questions people ask</h2>
  ${faq.slice(1).map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
  ${cta(cap(name.replace(/ \(.*\)$/, '')))}
  <h2>More in ${esc(group.toLowerCase())}</h2>
  ${grid(related.map(x => [`/prices/${x[0]}/`, cap(x[1]), short(x[3]).slice(0, 90) + '…']))}`,
    schema: [article(h1, answer, loc), faqSchema(faq)]
  }));
  pages.push({ loc, pri: '0.8' });
});
const groups = [...new Set(L.ITEMS.map(i => i[2]))];
write('prices/index.html', page({
  rel: 'prices/index.html', title: `Why are things so expensive in Nigeria? ${L.ITEMS.length} prices explained`,
  description: 'Plain-English reasons why the prices of rice, garri, bread, petrol, cooking gas, transport, data, school fees and more keep rising in Nigeria, with tips for families.',
  h1: 'Why are things so expensive in Nigeria?', crumbs: [['Home', '/'], ['Why prices rise', '/prices/']],
  body: `
  <p class="answer-box"><b>Quick answer:</b> Most prices in Nigeria rise for the same few reasons: fuel and transport cost more, the naira buys fewer dollars so imports cost more, farms produce less because of insecurity, weather and storage losses, and power for factories is expensive. Pick an item to see which reasons matter most for it.</p>
  ${groups.map(g => `<h2>${esc(g)}</h2>${grid(L.ITEMS.filter(i => i[2] === g).map(x => [`/prices/${x[0]}/`, cap(x[1]), short(x[3]).slice(0, 90) + '…']))}`).join('')}
  <h2>The reasons, one by one</h2>
  <ol class="reasons">${Object.values(L.DRIVERS).map(r => `<li><b>${esc(r[0])}</b>${esc(r[1])}</li>`).join('')}</ol>
  ${cta('')}`,
  schema: [faqSchema([['Why are things so expensive in Nigeria?', 'Most prices in Nigeria rise for the same few reasons: fuel and transport cost more, the naira buys fewer dollars so imports cost more, farms produce less because of insecurity, weather and storage losses, and power for factories is expensive.']]),
    { '@type': 'CollectionPage', name: 'Why prices rise in Nigeria', hasPart: L.ITEMS.map(i => ({ '@type': 'Article', headline: `Why is the price of ${i[1]} going up in Nigeria?`, url: URL_ + `/prices/${i[0]}/` })) }]
}));
pages.push({ loc: '/prices/', pri: '0.9' });

// ---------- /learn/<topic>/ ----------
L.LEARN.forEach(([slug, q, answer, more, example]) => {
  const loc = `/learn/${slug}/`;
  write(`learn/${slug}/index.html`, page({
    rel: `learn/${slug}/index.html`, title: `${q} | Inflation Explainer`, description: short(answer), h1: q,
    crumbs: [['Home', '/'], ['Money words', '/learn/'], [q, loc]],
    body: `
  <p class="answer-box"><b>Quick answer:</b> ${esc(answer)}</p>
  <p>${esc(more)}</p>
  <h2>An everyday example</h2>
  <p class="fact">${esc(example)}</p>
  <h2>Try it with your own numbers</h2>
  ${calc('anything')}
  ${cta('')}
  <h2>Keep learning</h2>
  ${grid(L.LEARN.filter(x => x[0] !== slug).slice(0, 6).map(x => [`/learn/${x[0]}/`, x[1], short(x[2]).slice(0, 90) + '…']))}`,
    schema: [article(q, answer, loc), faqSchema([[q, answer + ' ' + more]])]
  }));
  pages.push({ loc, pri: '0.7' });
});
write('learn/index.html', page({
  rel: 'learn/index.html', title: 'Inflation and money words explained simply | Inflation Explainer',
  description: 'Short, simple answers: what inflation is, what causes it in Nigeria, CPI, exchange rate, subsidy, shrinkflation, purchasing power and how to budget.',
  h1: 'Money words, explained simply', crumbs: [['Home', '/'], ['Money words', '/learn/']],
  body: `<p class="answer-box"><b>Quick answer:</b> Inflation means prices rise over time so the same money buys less. These pages explain the words you hear in the news, each with an everyday Nigerian example.</p>
  ${grid(L.LEARN.map(x => [`/learn/${x[0]}/`, x[1], short(x[2]).slice(0, 90) + '…']))}${cta('')}`,
  schema: [faqSchema(L.LEARN.map(x => [x[1], x[2]]))]
}));
pages.push({ loc: '/learn/', pri: '0.9' });

// ---------- /my-prices/ : My Price Story ----------
write('my-prices/index.html', page({
  rel: 'my-prices/index.html', title: 'My Price Story: work out your own inflation',
  description: 'Type what you paid for up to five things before and what you pay now. See your own inflation rate, what your money has lost, and a card you can share.',
  h1: 'My Price Story: your own inflation', crumbs: [['Home', '/'], ['My Price Story', '/my-prices/']],
  body: `
  <p class="answer-box"><b>What this does:</b> the news gives one inflation number for all of Nigeria. Your own number depends on what <b>you</b> buy. Type up to five things, the price you remember from before and the price now. Nothing you type leaves your phone.</p>
  <div class="mp">
    <label class="mp-when">The "before" prices are from about <select id="mpYears"><option value="1">1 year ago</option><option value="2">2 years ago</option><option value="3">3 years ago</option><option value="5">5 years ago</option></select></label>
    <div class="mp-head"><span>Thing I buy</span><span>Price before (₦)</span><span>Price now (₦)</span></div>
    <div id="mpRows"></div>
    <p><button class="btn" type="button" id="mpGo">Show my price story</button> <button class="btn ghost" type="button" id="mpFill">Try an example</button></p>
    <p id="mpErr" class="mp-err" role="alert"></p>
    <div id="mpOut" class="mp-out" hidden aria-live="polite"></div>
  </div>
  <p class="note">This is simple arithmetic on the prices you typed, not an official figure. The official rate comes from the National Bureau of Statistics each month.</p>
  <style>.mp{max-width:720px}.mp-when{display:block;font-weight:700;margin:14px 0}.mp select,.mp input{font:inherit;padding:10px 12px;border-radius:10px;border:1.5px solid #d8cfc0;background:#fff;color:#222;width:100%;min-width:0}.mp-when select{width:auto}
  .mp-head,.mp-row{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:8px;margin-bottom:8px}.mp-head{font-weight:700;font-size:14px}.mp-err{color:#b3261e;font-weight:700;min-height:22px}
  .mp-out{border-radius:20px;padding:20px;background:linear-gradient(135deg,#1f3a2e,#2f6b4f);color:#fff;margin-top:8px}.mp-out h2{color:#ffd166;margin:0 0 6px;font-size:clamp(26px,6vw,40px)}.mp-out p{margin:6px 0}.mp-out table{width:100%;border-collapse:collapse;margin:12px 0;font-size:15px}.mp-out td,.mp-out th{padding:6px 4px;border-bottom:1px solid rgba(255,255,255,.2);text-align:left}.mp-out td:last-child,.mp-out th:last-child{text-align:right}
  .mp-bar{height:14px;border-radius:8px;background:rgba(255,255,255,.2);overflow:hidden;margin:4px 0 10px}.mp-bar i{display:block;height:100%;background:#ffd166}
  @media(max-width:520px){.mp-head{display:none}.mp-row{grid-template-columns:1fr 1fr}.mp-row input:first-child{grid-column:1/-1}}</style>
  <script>
  (function () {
    var rows = document.getElementById("mpRows"), out = document.getElementById("mpOut"), err = document.getElementById("mpErr");
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var naira = function (n) { return "₦" + Math.round(n).toLocaleString("en-NG"); };
    var hint = ["e.g. bag of rice", "e.g. bread", "e.g. transport to school", "e.g. data bundle", "e.g. a crate of eggs"];
    rows.innerHTML = hint.map(function (h) { return '<div class="mp-row"><input maxlength="30" placeholder="' + h + '" aria-label="Thing I buy"><input type="number" min="1" inputmode="numeric" placeholder="before" aria-label="Price before"><input type="number" min="1" inputmode="numeric" placeholder="now" aria-label="Price now"></div>'; }).join("");
    document.getElementById("mpFill").onclick = function () { var ex = [["Bread", 700, 1500], ["Transport to school", 200, 500], ["Data bundle", 1000, 1500]];
      rows.querySelectorAll(".mp-row").forEach(function (r, i) { var f = r.querySelectorAll("input"), e = ex[i] || ["", "", ""]; f[0].value = e[0]; f[1].value = e[1]; f[2].value = e[2]; }); document.getElementById("mpYears").value = "2"; };
    document.getElementById("mpGo").onclick = function () {
      var items = []; err.textContent = "";
      rows.querySelectorAll(".mp-row").forEach(function (r) { var f = r.querySelectorAll("input"), a = Number(f[1].value), b = Number(f[2].value); if (a > 0 && b > 0) items.push({ n: f[0].value.trim() || "Item " + (items.length + 1), a: a, b: b }); });
      if (!items.length) { err.textContent = "Type at least one thing with a price before and a price now."; out.hidden = true; return; }
      var years = Number(document.getElementById("mpYears").value), before = 0, now = 0;
      items.forEach(function (i) { before += i.a; now += i.b; });
      var total = (now / before - 1) * 100, perYear = (Math.pow(now / before, 1 / years) - 1) * 100, worth = 1000 * before / now;
      var word = total >= 0 ? "up" : "down", top = items.slice().sort(function (x, y) { return y.b / y.a - x.b / x.a; })[0];
      out.hidden = false;
      out.innerHTML = "<p>My prices went " + word + " by</p><h2>" + Math.abs(total).toFixed(0) + "% in " + years + " year" + (years > 1 ? "s" : "") + "</h2>" +
        (years > 1 ? "<p>That is about <b>" + Math.abs(perYear).toFixed(0) + "% every year</b>.</p>" : "") +
        "<p>₦1,000 from back then buys what <b>" + naira(worth) + "</b> buys today.</p><div class='mp-bar'><i style='width:" + Math.max(3, Math.min(100, worth / 10)) + "%'></i></div>" +
        "<table><tr><th>Thing</th><th>Before</th><th>Now</th><th>Change</th></tr>" + items.map(function (i) { var c = (i.b / i.a - 1) * 100; return "<tr><td>" + esc(i.n) + "</td><td>" + naira(i.a) + "</td><td>" + naira(i.b) + "</td><td>" + (c >= 0 ? "+" : "") + c.toFixed(0) + "%</td></tr>"; }).join("") + "</table>" +
        (items.length > 1 ? "<p>Biggest rise: <b>" + esc(top.n) + "</b>.</p>" : "") +
        '<p><button class="btn" type="button" id="mpShare">📣 Share my price story</button> <a class="btn ghost" href="/?item=' + encodeURIComponent(top.n) + '">Why did ' + esc(top.n) + ' go up? →</a></p><p id="mpNote"></p>';
      var text = "My prices went " + word + " " + Math.abs(total).toFixed(0) + "% in " + years + " year" + (years > 1 ? "s" : "") + ". ₦1,000 from then buys what " + naira(worth) + " buys now. Work out yours: " + location.origin + "/my-prices/";
      document.getElementById("mpShare").onclick = function () { if (navigator.share) navigator.share({ text: text }).catch(function () {}); else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { document.getElementById("mpNote").textContent = "Copied. Paste it in WhatsApp."; }); };
      out.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
  })();
  </script>`,
  schema: [{ '@type': 'WebApplication', name: 'My Price Story: personal inflation calculator', applicationCategory: 'FinanceApplication', operatingSystem: 'Any', isAccessibleForFree: true }]
}));
pages.push({ loc: '/my-prices/', pri: '0.8' });

// ---------- /price-diary/ : My own inflation this month, share card, price diary (v4) ----------
const PD_FAQ = [
  ['How do I work out my own inflation for this month?', 'List the things you buy, how many of each you buy in a month, and the price last month and this month. Multiply each price by how many you buy, add them up for each month, then take (this month − last month) ÷ last month × 100. My Price Diary does this maths for you on your phone.'],
  ['Why is my own inflation different from the NBS figure?', 'NBS measures the average price change of many items across Nigeria, usually compared with the same month last year. Your number uses only the things you buy, your own prices, and one month of change, so it can be higher or lower.'],
  ['Is my price diary private?', 'Yes. Your prices are saved only on your phone. Nothing is sent to us unless you press "Explain with AI", which sends only the item names and numbers. You can download your diary as a CSV file.']
];
write('price-diary/index.html', page({
  rel: 'price-diary/index.html', title: 'My Price Diary: track prices and your own inflation',
  description: 'Work out your own inflation this month from what you buy, see your biggest price movers, keep a market price diary with charts, and share a card.',
  h1: 'My Price Diary: your own inflation this month', crumbs: [['Home', '/'], ['My Price Diary', '/price-diary/']],
  body: `
  <p class="answer-box"><b>What this does:</b> type the things you buy, how many a month, and the price <b>last month</b> and <b>this month</b>. Our code works out your own inflation, shows the biggest movers and explains it in plain English. Keep a price diary every market day to see a line for each item. Everything stays <b>on this phone</b>. <a href="#pd-help">How it works</a></p>
  <datalist id="pdItems">${L.ITEMS.map(i => `<option value="${esc(cap(i[1].replace(/ \(.*\)$/, '')))}">`).join('')}</datalist>
  <section class="pd-card" id="my-inflation" aria-labelledby="pd-h-mine">
    <h2 id="pd-h-mine">1. My own inflation: <span data-last-month></span> → <span data-this-month></span></h2>
    <div class="pd-table-wrap" role="table" aria-label="My basket">
      <div class="pd-row pd-head" role="row"><span role="columnheader">Item (and size)</span><span role="columnheader">How many a month</span><span role="columnheader">Last month (₦)</span><span role="columnheader">This month (₦)</span><span role="columnheader"><span class="visually-hidden">Remove</span></span></div>
      <div id="pdRows"></div>
    </div>
    <div class="cta"><button class="btn ghost" type="button" id="pdAdd">+ Add item</button><button class="btn ghost" type="button" id="pdFromDiary">📒 Fill from my diary</button><button class="btn ghost" type="button" id="pdExample">Try an example</button><button class="btn ghost" type="button" id="pdClear">Clear</button></div>
    <p><button class="btn" type="button" id="pdGo">Work out my inflation</button></p>
    <p class="pd-err" id="pdErr" role="alert"></p>
    <div id="pdOut" aria-live="polite"></div>
  </section>
  <section class="pd-card" id="diary" aria-labelledby="pd-h-diary">
    <h2 id="pd-h-diary">2. My price diary</h2>
    <p>Each market day, save the price of a few things you always buy. Use the same size every time (for example "1 mudu" or "50kg bag") so the line is fair.</p>
    <form id="pdDiaryForm" class="pd-form" novalidate>
      <label>Item<input id="pdItem" list="pdItems" maxlength="40" placeholder="e.g. Rice" required></label>
      <label>Size or unit <small>(optional)</small><input id="pdUnit" maxlength="30" placeholder="e.g. 1 mudu"></label>
      <label>Price (₦)<input id="pdPrice" inputmode="decimal" placeholder="e.g. 2,000" required></label>
      <label>Date<input id="pdDate" type="date" required></label>
      <label>Market or shop <small>(optional)</small><input id="pdPlace" maxlength="40" placeholder="e.g. Ilaro market"></label>
      <button class="btn" type="submit">💾 Save price</button>
    </form>
    <p class="pd-note" id="pdDiaryMsg" aria-live="polite"></p>
    <p class="pd-sub" id="pdDiaryCount"></p>
    <div id="pdDiaryList" class="pd-items"></div>
    <div class="cta"><button class="btn ghost" type="button" id="pdCsv">⬇️ Download CSV</button><label class="btn ghost pd-file">📥 Load CSV<input type="file" id="pdImport" accept=".csv,text/csv"></label><button class="btn ghost" type="button" id="pdDiaryClear">🧹 Delete diary</button></div>
  </section>
  <p class="pd-toast" id="pdToast" role="status" aria-live="polite"></p>
  <h2 id="pd-help">How it works</h2>
  ${PD_FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n  ')}
  <p class="note">This is simple arithmetic on prices <b>you</b> typed, not an official figure. Official rates come from the National Bureau of Statistics (NBS); see the latest on our <a href="/">home page</a>.</p>
  <div class="cta"><a class="btn ghost" href="/#basket">Family Basket (compare any two months)</a><a class="btn ghost" href="/my-prices/">My Price Story (years ago vs now)</a></div>
  <script src="/price-diary.js" defer></script>`,
  schema: [{ '@type': 'WebApplication', name: 'My Price Diary: personal monthly inflation calculator', url: URL_ + '/price-diary/', applicationCategory: 'FinanceApplication', operatingSystem: 'Any', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' }, creator: { '@type': 'Organization', name: 'ByteBusters team at Yewa College, Ilaro' } }, faqSchema(PD_FAQ)]
}));
pages.push({ loc: '/price-diary/', pri: '0.8' });

// ---------- /whats-new/ ----------
write('whats-new/index.html', page({
  rel: 'whats-new/index.html', title: "What's new in Inflation Explainer AI",
  description: 'New: work out your own inflation this month, keep a market price diary with charts and a CSV download, and share a card of your basket.',
  h1: "What's new in Inflation Explainer AI", crumbs: [['Home', '/'], ["What's new", '/whats-new/']],
  body: `
  <p class="answer-box"><b>Version 4 (November 2026):</b> three new tools, added by <b>the ByteBusters team at Yewa College</b>, Ilaro, Ogun State. They work on a basic phone, need no account, and keep your prices on your own phone.</p>
  <h2>📊 My own inflation this month</h2>
  <p>Type what you buy, how many a month, and last month's and this month's price. Our code works out your own inflation, shows your <b>biggest movers</b> and explains the result in plain English. It can fill itself from your price diary. If you like, the AI can explain it in one of 17 Nigerian languages (only item names and numbers are sent).</p>
  <h2>📒 Price diary</h2>
  <p>Save market prices over time. Each item gets its own small line chart (tap a dot to see the date and price) and a table. Download everything as a <b>CSV</b> file for Excel, Google Sheets or a class project, and load it again on another phone.</p>
  <h2>📣 Share card</h2>
  <p>One tap makes a picture that says "My basket went up X% this month" with your top movers, ready for your WhatsApp status, plus a ready-made WhatsApp message.</p>
  <p class="note"><b>Your data:</b> all of it stays in your phone's browser storage. We never see your prices, and we never make up prices: every number comes from you.</p>
  <div class="cta"><a class="btn" href="/price-diary/">Open My Price Diary</a><a class="btn ghost" href="/">Explain one price</a></div>`,
  schema: [{ '@type': 'WebPage', name: "What's new in Inflation Explainer AI", url: URL_ + '/whats-new/', datePublished: '2026-11-27', dateModified: TODAY, publisher: { '@id': URL_ + '/#org' }, creator: { '@type': 'Organization', name: 'ByteBusters team at Yewa College, Ilaro' } }]
}));
pages.push({ loc: '/whats-new/', pri: '0.5' });

// ---------- /faq/ : what people in Nigeria ask about rising prices (AEO) ----------
const LQ = id => L.LEARN.find(x => x[0] === id), IT = id => L.ITEMS.find(x => x[0] === id);
const learnQA = id => [LQ(id)[1], LQ(id)[2], `/learn/${id}/`];
const SITE_FAQ = [
  learnQA('what-is-inflation'),
  learnQA('what-causes-inflation'),
  ['What is Nigeria\'s inflation rate now?', 'The National Bureau of Statistics (NBS) publishes Nigeria\'s official headline and food inflation rates every month in its Consumer Price Index (CPI) report, usually around the 15th. Our home page shows the latest NBS figures; we never make up a rate.', '/learn/who-measures-inflation/'],
  ['Why is food so expensive in Nigeria?', LQ('what-is-food-inflation')[2] + ' Food prices go up when transport and fuel cost more, harvests are hit by weather or insecurity, and imported inputs cost more because of the exchange rate.', '/learn/what-is-food-inflation/'],
  ['Why is the price of rice going up in Nigeria?', IT('rice')[3], '/prices/rice/'],
  learnQA('what-is-the-exchange-rate'),
  ['How do I calculate how much a price has gone up?', 'Take the new price, subtract the old price, divide by the old price and multiply by 100. For example, if something went from ₦1,000 to ₦1,500, it went up by 500 ÷ 1,000 × 100 = 50%. Our price checker does this maths for you.', '/'],
  learnQA('what-is-shrinkflation'),
  learnQA('saving-and-inflation'),
  learnQA('how-to-budget-in-inflation'),
  [PD_FAQ[0][0], PD_FAQ[0][1], '/price-diary/'],
  learnQA('who-measures-inflation'),
  ['Is Inflation Explainer AI financial advice? Who built it?', 'No, it is a free learning tool, not financial advice. It was built by students of the ByteBusters coding club at Yewa College, Ilaro, Ogun State, a programme of Odu\'a Investment Foundation.', '/about/']
];
write('faq/index.html', page({
  rel: 'faq/index.html', title: 'Inflation questions and answers for Nigeria | Inflation Explainer',
  description: 'Simple answers about rising prices in Nigeria: what inflation is, what causes it, why food and rice cost more, the exchange rate and saving.',
  h1: 'Inflation questions and answers', crumbs: [['Home', '/'], ['FAQ', '/faq/']],
  body: `
  <p class="answer-box"><b>Quick answer:</b> inflation means prices of most things rise over time, so the same naira buys less. In Nigeria the main drivers are fuel and transport costs, the exchange rate, food supply problems and more money chasing the same goods.</p>
  ${SITE_FAQ.map(([q, a, href]) => `<h2>${esc(q)}</h2>\n  <p>${esc(a)} <a href="${href}">Read more</a></p>`).join('\n  ')}
  ${cta('')}`,
  schema: [faqSchema(SITE_FAQ)]
}));
pages.push({ loc: '/faq/', pri: '0.8' });

// ---------- /about/ : who built this ----------
write('about/index.html', page({
  rel: 'about/index.html', title: 'About Inflation Explainer AI and who built it',
  description: "Inflation Explainer AI was built by students of the ByteBusters coding club at Yewa College, Ilaro, Ogun State, a programme of Odu'a Investment Foundation.",
  h1: 'About Inflation Explainer AI: who built this', crumbs: [['Home', '/'], ['About', '/about/']],
  body: `
  <p class="answer-box"><b>In short:</b> a free website that explains why prices rise in Nigeria, made by secondary school students in the ByteBusters coding club at Yewa College, Ilaro, Ogun State. ByteBusters is run by Odu'a Investment Foundation.</p>
  <h2>Why we built it</h2>
  <p>Our families talk about rising prices every week: rice, garri, transport, data, school fees. We wanted a simple tool that shows exactly how much a price has changed and explains the likely reasons in plain words and in Nigerian languages.</p>
  <h2>Who built it</h2>
  <p>A team of students at the Yewa College ByteBusters centre, the Generative AI Team, planned the app, wrote the explanations and coded the website, with guidance from the ByteBusters Centre Lead. We learned HTML, CSS, JavaScript, how to make code do the maths so the AI never invents numbers, how to put a website online with Vercel, and how search engines read pages.</p>
  <h2>What it is, and is not</h2>
  <ul>
    <li>It is a free learning tool. The maths is done by code; the AI only explains.</li>
    <li>It is <b>not</b> financial advice, and it does not show today's market prices. Official figures come from the National Bureau of Statistics (NBS).</li>
  </ul>
  <p>Read the <a href="/faq/">questions and answers</a> or go back to the <a href="/">price checker</a>.</p>
  ${cta('')}`,
  schema: [{ '@type': 'AboutPage', name: 'About Inflation Explainer AI', url: URL_ + '/about/', publisher: { '@id': URL_ + '/#org' } }]
}));
pages.push({ loc: '/about/', pri: '0.5' });

// ---------- 404.html : friendly "page not found" (not in the sitemap) ----------
write('404.html', page({
  rel: '404.html', title: 'Page not found | Inflation Explainer',
  description: 'This page could not be found. Check a price, read why prices rise, or learn the money words.',
  h1: 'Sorry, we could not find that page', crumbs: [['Home', '/'], ['Page not found', '/404.html']],
  body: `
  <p>The link may be old or mistyped. Try one of these:</p>
  <ul><li><a href="/">Explain my price</a></li><li><a href="/prices/">Why prices rise</a></li><li><a href="/learn/">Money words</a></li><li><a href="/faq/">FAQ</a></li></ul>`
}).replace('<meta name="robots" content="index, follow', '<meta name="robots" content="noindex, follow').replace(/\n<link rel="canonical"[^>]*>/, ''));

// ---------- sitemap.xml, llms.txt, verification codes ----------
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>${URL_}${p.loc}</loc><lastmod>${TODAY}</lastmod><priority>${p.pri}</priority></url>`).join('\n')}\n</urlset>\n`);
const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8').split('\n## Why prices rise')[0].trimEnd();
write('llms.txt', llms + `\n\n## Why prices rise (one page per item; reasons, not prices)\n${L.ITEMS.map(i => `- [Why is the price of ${i[1]} going up in Nigeria?](${URL_}/prices/${i[0]}/): ${i[3]}`).join('\n')}\n\n## Money words\n${L.LEARN.map(x => `- [${x[1]}](${URL_}/learn/${x[0]}/): ${x[2]}`).join('\n')}\n`);
let index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/\n<meta name="(google-site-verification|msvalidate\.01)"[^>]*>/g, '');
if (VERIFY) index = index.replace(/(<link rel="canonical"[^>]*>)/, '$1' + VERIFY);
fs.writeFileSync(path.join(ROOT, 'index.html'), index);
// ---------- llms-full.txt (GEO): the summary plus every answer in full ----------
write('llms-full.txt', fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8') + `
## About
Inflation Explainer AI was built by students of the ByteBusters coding club at Yewa College, Ilaro, Ogun State, Nigeria, with guidance from the ByteBusters Centre Lead. ByteBusters is a programme of Odu'a Investment Foundation. Free; a learning tool, not financial advice. About page: ${URL_}/about/

## Questions and answers (also at ${URL_}/faq/)
${SITE_FAQ.map(([q, a]) => `### ${q}\n${a}\n`).join('\n')}
## Money words in full
${L.LEARN.map(x => `### ${x[1]}\n${x[2]}\nGuide: ${URL_}/learn/${x[0]}/\n`).join('\n')}`);
console.log('Done:', pages.length, 'pages in the sitemap.');
