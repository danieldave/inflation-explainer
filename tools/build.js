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
  if (title.length > 68) title = title.replace(/ \| Inflation Explainer$/, '');
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
<nav class="gnav" aria-label="Main"><a href="/prices/">Why prices rise</a><a href="/learn/">Money words</a><a href="/#tool">Explain my price</a><a href="/#basket">Family Basket</a></nav>
<main class="guide">
  <nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((c, i) => i < crumbs.length - 1 ? `<a href="${c[1]}">${esc(c[0])}</a> › ` : esc(c[0])).join('')}</nav>
  <h1>${esc(h1)}</h1>
${body}
  <p class="updated">Written by the ${esc(SITE.publisher)}. Last updated <time datetime="${TODAY}">${TODAY}</time>. We explain reasons, not today's prices: prices differ by town and change every week. For official figures see the National Bureau of Statistics.</p>
</main>
<footer><p><a href="/prices/">Why prices rise</a> · <a href="/learn/">Money words</a> · <a href="/">Explain my own price</a> · <a href="${SITE.harvest}/">Harvest Calendar Naija</a></p><p>Built with AI by the ${esc(SITE.publisher)} · ByteBusters National Showcase 2026</p></footer>
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

// ---------- sitemap.xml, llms.txt, verification codes ----------
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>${URL_}${p.loc}</loc><lastmod>${TODAY}</lastmod><priority>${p.pri}</priority></url>`).join('\n')}\n</urlset>\n`);
const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8').split('\n## Why prices rise')[0].trimEnd();
write('llms.txt', llms + `\n\n## Why prices rise (one page per item; reasons, not prices)\n${L.ITEMS.map(i => `- [Why is the price of ${i[1]} going up in Nigeria?](${URL_}/prices/${i[0]}/): ${i[3]}`).join('\n')}\n\n## Money words\n${L.LEARN.map(x => `- [${x[1]}](${URL_}/learn/${x[0]}/): ${x[2]}`).join('\n')}\n`);
let index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/\n<meta name="(google-site-verification|msvalidate\.01)"[^>]*>/g, '');
if (VERIFY) index = index.replace(/(<link rel="canonical"[^>]*>)/, '$1' + VERIFY);
fs.writeFileSync(path.join(ROOT, 'index.html'), index);
console.log('Done:', pages.length, 'pages in the sitemap.');
