/* =====================================================================
   price-diary.js  -  My Price Diary (version 4, by the ByteBusters team
   at Yewa College). Used by /price-diary/ (made by tools/build.js).
   ---------------------------------------------------------------------
   1. MY OWN INFLATION THIS MONTH: items, how many a month, last month's
      price, this month's price -> your own inflation %, biggest movers,
      and a plain-English explanation written by OUR CODE (no AI needed).
      Optional: ask the AI to explain it in a Nigerian language
      (it reuses /api/explain, mode "basket"; only item names and
      numbers are sent, never anything personal).
   2. SHARE CARD: a picture "My basket went up X% this month" + WhatsApp text.
   3. PRICE DIARY: save market prices over time, a small line chart per
      item, export or load a CSV file.
   Everything is saved ON THIS PHONE only (localStorage). We never make
   up prices: every number here was typed by you.
   ===================================================================== */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var BASKET = "iea-mybasket", DIARY = "iea-diary", MAX_ENTRIES = 2000;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var naira = function (n) { return "₦" + Math.round(n).toLocaleString("en-NG"); };
  var num = function (v) { var t = String(v == null ? "" : v).replace(/[₦,\s]/g, ""); if (!t) return null; var n = Number(t); return isFinite(n) && n > 0 ? n : NaN; };
  var pct = function (p) { return (p > 0 ? "+" : p < 0 ? "−" : "") + Math.abs(p).toFixed(1).replace(/\.0$/, "") + "%"; };
  var clean = function (s, max) { return String(s || "").replace(/[<>]/g, "").replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "").replace(/\+?\d[\d\s-]{8,}\d/g, "").trim().slice(0, max); };
  function get(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { toast("This phone's storage is full."); return false; } }
  function toast(t) { var el = $("pdToast"); el.textContent = t; clearTimeout(toast.t); toast.t = setTimeout(function () { el.textContent = ""; }, 3500); }
  function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function monthName(d) { return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }); }
  var now = new Date(), thisMonth = new Date(now.getFullYear(), now.getMonth(), 1), lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var THIS_KEY = ymd(thisMonth).slice(0, 7), LAST_KEY = ymd(lastMonth).slice(0, 7);
  document.querySelectorAll("[data-this-month]").forEach(function (e) { e.textContent = monthName(thisMonth); });
  document.querySelectorAll("[data-last-month]").forEach(function (e) { e.textContent = monthName(lastMonth); });

  /* ---------- 1. MY OWN INFLATION ---------- */
  function rowHTML(r, i) {
    return '<div class="pd-row" role="row">' +
      '<label class="pd-cell" role="cell"><span class="pd-cl">Item ' + (i + 1) + ' (and size)</span><input data-k="name" maxlength="40" list="pdItems" placeholder="e.g. Rice (1 mudu)" value="' + esc(r.name || "") + '"></label>' +
      '<label class="pd-cell" role="cell"><span class="pd-cl">How many a month</span><input data-k="qty" type="number" min="0" step="any" inputmode="decimal" value="' + esc(r.qty == null ? 1 : r.qty) + '"></label>' +
      '<label class="pd-cell" role="cell"><span class="pd-cl">Last month (₦)</span><span class="pd-naira"><span aria-hidden="true">₦</span><input data-k="last" inputmode="decimal" placeholder="last month" value="' + (r.last ? Number(r.last).toLocaleString("en-NG") : "") + '"></span></label>' +
      '<label class="pd-cell" role="cell"><span class="pd-cl">This month (₦)</span><span class="pd-naira"><span aria-hidden="true">₦</span><input data-k="now" inputmode="decimal" placeholder="this month" value="' + (r.now ? Number(r.now).toLocaleString("en-NG") : "") + '"></span></label>' +
      '<button type="button" class="pd-del" role="cell" aria-label="Remove item ' + (i + 1) + '">✕</button></div>';
  }
  function draw(rows) { $("pdRows").innerHTML = rows.map(rowHTML).join(""); }
  function read() {
    return [].map.call(document.querySelectorAll("#pdRows .pd-row"), function (row) {
      var v = function (k) { return row.querySelector('[data-k="' + k + '"]').value; };
      var a = num(v("last")), b = num(v("now"));
      return { name: clean(v("name"), 40), qty: Number(v("qty")) || 0, last: a > 0 ? a : null, now: b > 0 ? b : null, bad: Number.isNaN(a) || Number.isNaN(b) };
    });
  }
  function save() { put(BASKET, { rows: read().map(function (r) { return { name: r.name, qty: r.qty, last: r.last, now: r.now }; }) }); }

  // All the maths, in one place (also used by the tests in tools/test.js)
  function maths(rows) {
    var items = rows.filter(function (r) { return r.name && r.qty > 0 && r.last > 0 && r.now > 0; });
    if (!items.length) return null;
    var before = 0, after = 0;
    items.forEach(function (r) { before += r.last * r.qty; after += r.now * r.qty; });
    var rise = after - before, change = rise / before * 100;
    var list = items.map(function (r) {
      var extra = (r.now - r.last) * r.qty;
      return { name: r.name, qty: r.qty, last: r.last, now: r.now, extra: extra, change: (r.now - r.last) / r.last * 100, share: rise !== 0 ? extra / rise * 100 : 0 };
    }).sort(function (a, b) { return b.extra - a.extra; });
    return { items: list, before: before, after: after, rise: rise, change: change, yearIf: (Math.pow(after / before, 12) - 1) * 100 };
  }
  window.PDMaths = maths;

  function explain(k) {
    var up = k.rise > 0, flat = Math.abs(k.change) < 0.05, top = k.items[0], fell = k.items.filter(function (i) { return i.extra < 0; });
    var p = [];
    p.push("Last month, the things in your list cost you " + naira(k.before) + ". This month the same things cost " + naira(k.after) + ". " +
      (flat ? "That is about the same, so your own prices did not really change." : "That is " + naira(Math.abs(k.rise)) + (up ? " more" : " less") + ", so your own prices went " + (up ? "up" : "down") + " by " + Math.abs(k.change).toFixed(1) + "% in one month."));
    if (up && top && top.extra > 0) p.push("The biggest mover was " + top.name + ": it went from " + naira(top.last) + " to " + naira(top.now) + " (" + pct(top.change) + "). Because you buy it " + top.qty + " time" + (top.qty === 1 ? "" : "s") + " a month, it added " + naira(top.extra) + ", which is " + Math.round(top.share) + "% of your whole rise.");
    if (fell.length) p.push("Good news: " + fell.map(function (i) { return i.name; }).slice(0, 3).join(", ") + (fell.length === 1 ? " got" : " got") + " cheaper, which helped a little.");
    if (up && !flat) p.push("If prices kept rising at this speed every month for a whole year, the same list would cost about " + Math.round(k.yearIf) + "% more. One month can jump because of the season (for example tomatoes or pepper), so check again next month before you worry.");
    p.push("Remember: Nigeria's official inflation rate from the National Bureau of Statistics usually compares prices with the same month LAST YEAR, so it is a different measure from your one-month change.");
    return p;
  }

  var last = null;
  function run() {
    $("pdErr").textContent = ""; save();
    var rows = read();
    if (rows.some(function (r) { return r.bad; })) { $("pdErr").textContent = "Prices must be numbers bigger than 0, like 1500 or 1,500."; return; }
    var k = maths(rows);
    if (!k) { $("pdErr").textContent = "Fill in at least one item with how many a month, last month's price and this month's price."; return; }
    last = k;
    var up = k.rise > 0, max = Math.max.apply(null, k.items.map(function (i) { return Math.abs(i.extra); }).concat(1));
    $("pdOut").innerHTML = '<div class="pd-result ' + (up ? "up" : "dn") + '">' +
        '<p class="pd-kicker">My own inflation, ' + esc(monthName(lastMonth)) + ' → ' + esc(monthName(thisMonth)) + '</p>' +
        '<p class="pd-big">' + pct(k.change) + '</p>' +
        '<p>' + naira(k.before) + ' → ' + naira(k.after) + ' a month · ' + (k.rise >= 0 ? "+" : "−") + naira(Math.abs(k.rise)) + '</p></div>' +
      '<h3>Biggest movers</h3><div class="pd-bars">' + k.items.slice(0, 5).map(function (i) {
        return '<div class="pd-brow"><span>' + esc(i.name) + '<small>' + naira(i.last) + ' → ' + naira(i.now) + ' (' + pct(i.change) + ')</small></span>' +
          '<div class="pd-track"><i style="width:' + Math.max(3, Math.abs(i.extra) / max * 100) + '%;background:' + (i.extra < 0 ? "var(--fall)" : "var(--rise)") + '"></i></div><b>' + (i.extra >= 0 ? "+" : "−") + naira(Math.abs(i.extra)) + '</b></div>';
      }).join("") + '</div>' +
      '<h3>What it means</h3><div class="pd-explain">' + explain(k).map(function (s) { return "<p>" + esc(s) + "</p>"; }).join("") + '</div>' +
      '<div class="cta"><button class="btn" type="button" id="pdShare">📣 Share card (picture)</button><a class="btn ghost" id="pdWa" target="_blank" rel="noopener" href="#">💬 WhatsApp text</a><button class="btn ghost" type="button" id="pdAI">🤖 Explain with AI</button></div>' +
      '<label class="pd-lang">AI language <select id="pdLang">' + LANGS.map(function (l) { return '<option value="' + l[0] + '">' + l[1] + "</option>"; }).join("") + '</select></label>' +
      '<div id="pdAIOut" aria-live="polite"></div>';
    $("pdWa").href = "https://wa.me/?text=" + encodeURIComponent(shareText(k));
    $("pdShare").addEventListener("click", function () { shareCard(k); });
    $("pdAI").addEventListener("click", function () { askAI(k); });
    try { var l = localStorage.getItem("iea-lang"); if (l) $("pdLang").value = l; } catch (e) {}
    $("pdOut").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  var LANGS = [["en", "English"], ["yo", "Yorùbá"], ["ha", "Hausa"], ["ig", "Igbo"], ["pcm", "Pidgin"], ["ff", "Fulfulde"], ["kr", "Kanuri"], ["tiv", "Tiv"], ["ibb", "Ibibio"], ["efi", "Efik"], ["ijc", "Izon (Ijaw)"], ["bin", "Edo (Bini)"], ["nup", "Nupe"], ["urh", "Urhobo"], ["igl", "Igala"], ["idu", "Idoma"], ["igb", "Ebira"]];

  function askAI(k) {
    var out = $("pdAIOut"), items = k.items.slice(0, 12);
    if (items.length < 2) { out.innerHTML = '<p class="pd-note">The AI needs at least two items. Our explanation above already covers one item.</p>'; return; }
    out.innerHTML = '<p class="pd-note">The AI is explaining your numbers…</p>';
    var ctrl = new AbortController(), timer = setTimeout(function () { ctrl.abort(); }, 25000);
    fetch("/api/explain", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
      body: JSON.stringify({ mode: "basket", lang: $("pdLang").value, items: items.map(function (i) { return { name: i.name, qty: i.qty, before: i.last, now: i.now, change: +i.change.toFixed(1), share: +i.share.toFixed(1) }; }),
        basket: { before: Math.round(k.before), now: Math.round(k.after), change: +k.change.toFixed(2), months: 1, yearly: +k.yearIf.toFixed(2) } }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.headline) throw new Error(j.error || "no answer"); return j; }); })
      .then(function (j) {
        out.innerHTML = '<div class="pd-ai"><span class="pd-who">AI answer · check it against the numbers above</span><p><b>' + esc(j.headline) + '</b></p><p>' + esc(j.explain) + '</p>' +
          '<ul>' + (j.tips || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + '</ul></div>';
      })
      .catch(function () { out.innerHTML = '<p class="pd-note">The AI is not available right now. The explanation above was worked out by our code and is complete without it.</p>'; })
      .then(function () { clearTimeout(timer); });
  }

  /* ---------- 2. SHARE CARD ---------- */
  function shareText(k) {
    var top = k.items[0];
    return "My basket went " + (k.rise >= 0 ? "up " : "down ") + Math.abs(k.change).toFixed(1) + "% this month (" + naira(k.before) + " → " + naira(k.after) + ")." +
      (top && top.extra > 0 ? " Biggest mover: " + top.name + " " + pct(top.change) + "." : "") + " Work out your own inflation: " + location.origin + "/price-diary/";
  }
  function drawCard(k) {
    var W = 1080, H = 1080, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var g = cv.getContext("2d"), up = k.rise >= 0;
    var F = function (w, z) { return w + " " + z + 'px "Bricolage Grotesque", "Nunito Sans", Arial, sans-serif'; };
    var fit = function (t, w, z, maxW) { g.font = F(w, z); while (g.measureText(t).width > maxW && z > 22) { z -= 2; g.font = F(w, z); } };
    g.fillStyle = "#0F3D22"; g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(233,168,15,.12)"; for (var y = 30; y < H; y += 60) for (var x = (y / 60 % 2) * 30 + 30; x < W; x += 60) { g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "#E9A80F"; g.fillRect(0, 0, W, 16);
    g.fillStyle = "#FFF8E6"; g.font = F("800", 64); g.fillText("My basket went " + (up ? "up" : "down"), 80, 150);
    g.fillStyle = up ? "#FF8A57" : "#5CCB85"; g.font = F("800", 210); g.fillText(Math.abs(k.change).toFixed(1).replace(/\.0$/, "") + "%", 70, 370);
    g.fillStyle = "#FFF8E6"; g.font = F("700", 46); g.fillText("this month", 80, 440);
    g.fillStyle = "#E9C77A"; fit(monthName(lastMonth) + " → " + monthName(thisMonth), "600", 34, W - 160); g.fillText(monthName(lastMonth) + " → " + monthName(thisMonth), 80, 495);
    g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(60, 540, W - 120, 330);
    g.fillStyle = "#E9A80F"; fit(naira(k.before) + "  →  " + naira(k.after) + " a month", "800", 50, W - 200); g.fillText(naira(k.before) + "  →  " + naira(k.after) + " a month", 90, 610);
    g.fillStyle = "#FFF8E6"; g.font = F("700", 34); g.fillText("Biggest movers", 90, 670);
    k.items.slice(0, 3).forEach(function (i, n) {
      var t = (n + 1) + ". " + i.name + "  " + pct(i.change);
      g.fillStyle = "#FFF8E6"; fit(t, "600", 36, W - 200); g.fillText(t, 90, 725 + n * 50);
    });
    g.fillStyle = "#B9D9BF"; g.font = F("600", 28); g.fillText("My own prices, typed by me. Not an official NBS figure.", 80, 940);
    g.fillStyle = "#B9D9BF"; g.font = F("600", 30); g.fillText("Work out yours free: Inflation Explainer AI", 80, 985);
    g.fillStyle = "#E9C77A"; g.font = F("600", 26); g.fillText("inflation-explainer.vercel.app · Built by Yewa College ByteBusters", 80, 1030);
    return cv;
  }
  function shareCard(k) {
    var cv = drawCard(k), name = "my-basket-" + THIS_KEY + ".png";
    cv.toBlob(function (blob) {
      var file = blob && typeof File === "function" ? new File([blob], name, { type: "image/png" }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: shareText(k) }).catch(function () {});
        return;
      }
      var a = document.createElement("a"); a.download = name; a.href = cv.toDataURL("image/png"); document.body.appendChild(a); a.click(); a.remove();
      toast("Card saved. Post it on your WhatsApp status");
    }, "image/png");
  }
  window.PDCard = drawCard;

  /* ---------- 3. PRICE DIARY ---------- */
  var diary = get(DIARY, []);
  function keyOf(e) { return (e.item + (e.unit ? " (" + e.unit + ")" : "")).toLowerCase(); }
  function label(e) { return e.item + (e.unit ? " (" + e.unit + ")" : ""); }
  function groups() {
    var m = {};
    diary.forEach(function (e) { var k = keyOf(e); (m[k] = m[k] || { name: label(e), list: [] }).list.push(e); });
    return Object.keys(m).map(function (k) { var g = m[k]; g.list.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.t - b.t; }); g.key = k; return g; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); });
  }
  // one small line chart per item: thin 2px line, 8px markers, recessive grid, a title on every point for hover/tap
  function chart(g) {
    var pts = g.list, W = 320, H = 150, L = 58, R = 12, T = 12, B = 30;
    var vals = pts.map(function (p) { return p.price; }), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (lo === hi) { lo = lo * 0.9; hi = hi * 1.1; }
    var pad = (hi - lo) * 0.1; lo = Math.max(0, lo - pad); hi = hi + pad;
    var t0 = new Date(pts[0].date + "T12:00:00").getTime(), t1 = new Date(pts[pts.length - 1].date + "T12:00:00").getTime();
    var X = function (p, i) { return pts.length === 1 ? (L + W - R) / 2 : t1 === t0 ? L + i / (pts.length - 1) * (W - L - R) : L + (new Date(p.date + "T12:00:00").getTime() - t0) / (t1 - t0) * (W - L - R); };
    var Y = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
    var short = function (v) { return v >= 1e6 ? "₦" + (v / 1e6).toFixed(1).replace(/\.0$/, "") + "m" : v >= 1e4 ? "₦" + Math.round(v / 1e3) + "k" : "₦" + Math.round(v).toLocaleString("en-NG"); };
    var dshort = function (d) { return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }); };
    var grid = [hi - pad, (hi + lo) / 2, lo + pad].map(function (v) { return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" class="pd-grid"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" class="pd-axis">' + short(v) + "</text>"; }).join("");
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + X(p, i).toFixed(1) + " " + Y(p.price).toFixed(1); }).join(" ");
    var dots = pts.map(function (p, i) { return '<circle cx="' + X(p, i).toFixed(1) + '" cy="' + Y(p.price).toFixed(1) + '" r="4" class="pd-dot"><title>' + esc(dshort(p.date) + ": " + naira(p.price) + (p.place ? " at " + p.place : "")) + "</title></circle>"; }).join("");
    return '<svg class="pd-chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc("Price of " + g.name + " from " + dshort(pts[0].date) + " (" + naira(pts[0].price) + ") to " + dshort(pts[pts.length - 1].date) + " (" + naira(pts[pts.length - 1].price) + ")") + '">' +
      grid + (pts.length > 1 ? '<path d="' + line + '" class="pd-line"/>' : "") + dots +
      '<text x="' + L + '" y="' + (H - 8) + '" class="pd-axis">' + esc(dshort(pts[0].date)) + "</text>" + (pts.length > 1 ? '<text x="' + (W - R) + '" y="' + (H - 8) + '" text-anchor="end" class="pd-axis">' + esc(dshort(pts[pts.length - 1].date)) + "</text>" : "") + "</svg>";
  }
  function drawDiary() {
    var box = $("pdDiaryList"), gs = groups();
    $("pdDiaryCount").textContent = diary.length ? diary.length + " price" + (diary.length === 1 ? "" : "s") + " saved for " + gs.length + " item" + (gs.length === 1 ? "" : "s") : "";
    if (!gs.length) { box.innerHTML = '<p class="pd-note">No prices yet. Each time you go to the market, save the price of a few things you always buy. After two visits you will see a line for each one.</p>'; return; }
    box.innerHTML = gs.map(function (g) {
      var first = g.list[0], lastE = g.list[g.list.length - 1], ch = (lastE.price - first.price) / first.price * 100;
      return '<article class="pd-item"><h3>' + esc(g.name) + '</h3><p class="pd-sub">Latest ' + naira(lastE.price) + " · " + (g.list.length > 1 ? pct(ch) + " since " + esc(new Date(first.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })) : "1 price so far") + "</p>" +
        chart(g) +
        '<details><summary>See the ' + g.list.length + ' price' + (g.list.length === 1 ? "" : "s") + ' (table)</summary><table class="pd-table"><thead><tr><th>Date</th><th>Price</th><th>Place</th><th><span class="visually-hidden">Delete</span></th></tr></thead><tbody>' +
        g.list.slice().reverse().map(function (e) { return "<tr><td>" + esc(e.date) + "</td><td>" + naira(e.price) + "</td><td>" + esc(e.place || "") + '</td><td><button type="button" class="pd-del" data-del="' + e.t + '" aria-label="Delete ' + esc(label(e) + " " + e.date) + '">✕</button></td></tr>'; }).join("") +
        "</tbody></table></details></article>";
    }).join("");
  }
  $("pdDiaryForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var item = clean($("pdItem").value, 40), unit = clean($("pdUnit").value, 30), price = num($("pdPrice").value), date = $("pdDate").value, place = clean($("pdPlace").value, 40);
    if (item.length < 2) { $("pdDiaryMsg").textContent = "Type the name of the item."; return; }
    if (!(price > 0) || price > 1e9) { $("pdDiaryMsg").textContent = "Type the price as a number, like 1500."; return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > ymd(new Date())) { $("pdDiaryMsg").textContent = "Choose the date you saw this price (not a future date)."; return; }
    diary.push({ t: Date.now(), item: item, unit: unit, price: price, date: date, place: place });
    if (diary.length > MAX_ENTRIES) diary = diary.slice(-MAX_ENTRIES);
    if (!put(DIARY, diary)) return;
    $("pdPrice").value = ""; $("pdDiaryMsg").textContent = "Saved: " + label({ item: item, unit: unit }) + " " + naira(price) + " ✓"; drawDiary(); $("pdPrice").focus();
  });
  $("pdDiaryList").addEventListener("click", function (e) {
    var b = e.target.closest("[data-del]"); if (!b) return;
    if (!confirm("Delete this price from your diary?")) return;
    var t = Number(b.getAttribute("data-del")); diary = diary.filter(function (x) { return x.t !== t; }); put(DIARY, diary); drawDiary();
  });
  function csvCell(s) { s = String(s == null ? "" : s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  $("pdCsv").addEventListener("click", function () {
    if (!diary.length) { $("pdDiaryMsg").textContent = "Your diary is empty."; return; }
    var lines = ["date,item,size_or_unit,price_naira,place"].concat(diary.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).map(function (e) { return [e.date, e.item, e.unit, e.price, e.place].map(csvCell).join(","); }));
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" })); a.download = "my-price-diary.csv";
    document.body.appendChild(a); a.click(); a.remove(); $("pdDiaryMsg").textContent = "CSV downloaded. It opens in Excel, Google Sheets or WPS.";
  });
  function parseCsv(text) {
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }
  $("pdImport").addEventListener("change", function (e) {
    var f = e.target.files[0]; if (!f) return; e.target.value = "";
    if (f.size > 500000) { $("pdDiaryMsg").textContent = "That file is too big."; return; }
    f.text().then(function (text) {
      var rows = parseCsv(text.replace(/^﻿/, "")), n = 0, seen = {};
      diary.forEach(function (x) { seen[x.date + "|" + keyOf(x) + "|" + x.price] = 1; });
      rows.slice(1).forEach(function (r, i) {
        var en = { t: Date.now() + i, date: (r[0] || "").trim(), item: clean(r[1], 40), unit: clean(r[2], 30), price: num(r[3]), place: clean(r[4], 40) };
        if (!/^\d{4}-\d{2}-\d{2}$/.test(en.date) || en.item.length < 2 || !(en.price > 0)) return;
        var k = en.date + "|" + keyOf(en) + "|" + en.price; if (seen[k]) return; seen[k] = 1;
        diary.push(en); n++;
      });
      if (diary.length > MAX_ENTRIES) diary = diary.slice(-MAX_ENTRIES);
      put(DIARY, diary); drawDiary(); $("pdDiaryMsg").textContent = "Loaded " + n + " price" + (n === 1 ? "" : "s") + " from the file.";
    }).catch(function () { $("pdDiaryMsg").textContent = "Could not read that file."; });
  });
  $("pdDiaryClear").addEventListener("click", function () { if (!diary.length || !confirm("Delete your whole price diary from this phone? Download the CSV first if you want to keep it.")) return; diary = []; put(DIARY, diary); drawDiary(); });

  // Fill "my own inflation" from the diary: the latest price of each item in last month and in this month
  $("pdFromDiary").addEventListener("click", function () {
    var rows = [], cur = read().filter(function (r) { return r.name; });
    groups().forEach(function (g) {
      var a = g.list.filter(function (e) { return e.date.slice(0, 7) === LAST_KEY; }).pop(), b = g.list.filter(function (e) { return e.date.slice(0, 7) === THIS_KEY; }).pop();
      if (a && b) { var old = cur.filter(function (r) { return r.name.toLowerCase() === g.name.toLowerCase(); })[0]; rows.push({ name: g.name, qty: old ? old.qty : 1, last: a.price, now: b.price }); }
    });
    if (!rows.length) { $("pdErr").textContent = "Your diary needs a price for the same item in " + monthName(lastMonth) + " and in " + monthName(thisMonth) + "."; return; }
    $("pdErr").textContent = ""; draw(rows); save(); toast("Filled " + rows.length + " item" + (rows.length === 1 ? "" : "s") + " from your diary. Check how many you buy a month.");
  });

  /* ---------- start ---------- */
  var saved = get(BASKET, null);
  draw(saved && saved.rows && saved.rows.length ? saved.rows : [{ qty: 1 }, { qty: 1 }, { qty: 1 }, { qty: 1 }]);
  $("pdAdd").addEventListener("click", function () { var r = read(); r.push({ qty: 1 }); draw(r); $("pdRows").lastElementChild.querySelector("input").focus(); });
  $("pdRows").addEventListener("click", function (e) { var b = e.target.closest(".pd-del"); if (!b) return; b.closest(".pd-row").remove(); save(); });
  $("pdRows").addEventListener("change", save);
  $("pdGo").addEventListener("click", run);
  $("pdExample").addEventListener("click", function () {
    draw([{ name: "Rice (1 mudu)", qty: 4, last: 1800, now: 2000 }, { name: "Garri (1 paint bucket)", qty: 2, last: 2500, now: 2400 }, { name: "Bread (big loaf)", qty: 8, last: 1300, now: 1500 }, { name: "Transport to school", qty: 20, last: 300, now: 300 }]);
    toast("Example prices (made up for practice). Replace them with your own."); save();
  });
  $("pdClear").addEventListener("click", function () { draw([{ qty: 1 }, { qty: 1 }, { qty: 1 }, { qty: 1 }]); try { localStorage.removeItem(BASKET); } catch (e) {} $("pdOut").innerHTML = ""; });
  $("pdDate").value = ymd(new Date()); $("pdDate").max = ymd(new Date());
  drawDiary();
})();
