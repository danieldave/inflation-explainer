// Inflation Explainer AI — server route (Vercel serverless function)
// The OpenAI key lives in the Vercel setting OPENAI_API_KEY, never in the web page.
// v2: answers in 17 Nigerian languages, a "basket" mode for the Family Basket,
//     and a front door (our website only, fair-use limit, saved answers, timeout).
const S = require("./_lib/shared");

const SYSTEM_PROMPT = `You are Inflation Explainer AI, built by Nigerian secondary school students at Yewa College (ByteBusters) to help families understand rising prices.
Act like a friendly commissioner of economics who is careful with numbers like an accountant.

RULES
- Never ask for or repeat personal details (names, phone numbers, addresses, ages). If the input contains [removed], ignore it.
- Use simple English a 12-year-old understands. Be warm, accurate and practical for Nigeria.
- Do NOT calculate anything. Use ONLY the numbers given to you in the user message (prices, diff, change, monthly, yearly, worth, facts). Never invent statistics, prices or dates.
- Give causes in general terms only (fuel and transport, exchange rate, supply, weather/season, demand, cost of running a business) and always say "likely", because you cannot know the exact cause for this one item.
- Every cause must be a DIFFERENT reason. Never repeat the same idea in different words. The same goes for tips.
- Fit the causes and tips to the item type and quality (e.g. Ofada rice vs parboiled rice) and to the location if given.
- If the price went down, explain why prices can fall.
- If the user asked a question, answer it briefly in "answer" using only the given numbers; otherwise set "answer" to "".

Reply with ONLY JSON in this exact shape:
{"headline":"one sentence with the change in naira and percent",
 "explain":"NORMAL: max 70 words. DEEPER: max 150 words",
 "causes":["NORMAL: 3 short likely causes. DEEPER: 4"],
 "compare":"one sentence comparing the item's yearly rate with the national food rate (for food) or headline rate (for other things). If state figures are given (not null), also mention the user's state rate in the same sentence",
 "tips":["NORMAL: 2 practical ways a family can cope. DEEPER: 4"],
 "answer":""}
Write every text field in the LANGUAGE named in the user message (default English). Keep numbers, naira signs and percent signs exactly as given.`;

const BASKET_PROMPT = `You are Inflation Explainer AI, built by Nigerian secondary school students at Yewa College (ByteBusters).
A family typed the prices of what they buy every month, before and now. OUR CODE has already done all the maths: the basket total before and now, the family's own inflation rate, and how much each item added to the rise.
RULES
- Do NOT calculate anything. Use ONLY the numbers given. Never invent prices, statistics or dates.
- Simple, warm English a 12-year-old understands (or the LANGUAGE named), practical for Nigeria. Causes are always "likely".
- Never ask for or repeat personal details.
- If the family's basket rose faster than Nigeria's rate, say so kindly; if slower, say so. If the months are less than 12 apart, say the comparison is rough.
- Tips must be different from each other and fit the biggest items in the basket.
Reply with ONLY JSON: {"headline":"one sentence with the family's basket change in naira and percent","explain":"max 90 words","drivers":["2 or 3 short sentences about the items that pushed the basket up most, using their numbers"],"tips":["3 practical, different tips"]}`;

function privacyFilter(text) {
  return String(text || "")
    .replace(/my name is\s+[A-Za-z'-]+(\s+[A-Za-z'-]+)?/gi, "my name is [removed]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[removed]")
    .replace(/(\+?234|0)[\s-]?[789][01]\d([\s-]?\d){7}/g, "[removed]")
    .replace(/\b\d{10,}\b/g, "[removed]")
    .slice(0, 300);
}

function uniqueList(arr, max) {
  const seen = new Set();
  return (Array.isArray(arr) ? arr : [])
    .map(String)
    .filter(c => {
      const key = c.toLowerCase().replace(/[^a-z]/g, "").slice(0, 28);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, max);
}

async function basket(b, lang, res) {
  const num = v => (typeof v === "number" && isFinite(v) ? v : null);
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 15).map(x => ({
    item: privacyFilter(x && x.name).slice(0, 40), times_per_month: num(x && x.qty), price_before: num(x && x.before), price_now: num(x && x.now),
    change_percent: num(x && x.change), share_of_rise_percent: num(x && x.share)
  })).filter(x => x.item && x.price_before != null && x.price_now != null);
  if (items.length < 2) return res.status(400).json({ error: "Add at least two items with both prices." });
  const k = b.basket || {};
  const data = { LANGUAGE: S.LANGUAGES[lang], items,
    basket_before_per_month: num(k.before), basket_now_per_month: num(k.now), family_inflation_percent: num(k.change),
    months_between: num(k.months), yearly_pace_percent: num(k.yearly),
    nigeria: { headline_inflation_percent: num(b.facts && b.facts.headline), food_inflation_percent: num(b.facts && b.facts.food), period: privacyFilter(b.facts && b.facts.label) } };
  const key = S.keyFor("basket", JSON.stringify(data));
  const saved = S.cacheGet(key);
  if (saved) return res.status(200).json({ ...saved, cached: true });
  try {
    const out = await S.askOpenAI(BASKET_PROMPT, JSON.stringify(data), 700);
    const answer = { headline: String(out.headline || ""), explain: String(out.explain || ""), drivers: uniqueList(out.drivers, 3), tips: uniqueList(out.tips, 3), lang };
    S.cacheSet(key, answer);
    return res.status(200).json(answer);
  } catch (e) { return res.status(502).json({ error: "Could not reach the AI" }); }
}

module.exports = async function handler(req, res) {
  // Front door: our website only, POST only, 40 explanations per hour per visitor, key switched on
  const b = await S.frontDoor(req, res, { limit: 40 });
  if (!b) return;
  const lang = S.LANGUAGES[b.lang] ? b.lang : "en";
  if (b.mode === "basket") return basket(b, lang, res);

  const num = v => (typeof v === "number" && isFinite(v) ? v : null);
  const deeper = !!b.deeper;

  // Rebuild the data so only safe, expected fields reach the AI.
  const data = {
    item: privacyFilter(b.item),
    quantity: privacyFilter(b.quantity),
    location: privacyFilter(b.location),
    oldPrice: num(b.oldPrice), newPrice: num(b.newPrice),
    oldMonth: privacyFilter(b.oldMonth), newMonth: privacyFilter(b.newMonth),
    months: num(b.months), diff: num(b.diff), change_percent: num(b.change),
    monthly_percent: num(b.monthly), yearly_pace_percent: num(b.yearly),
    what_1000_naira_buys_now: num(b.worth),
    category: ["food", "transport", "service", "goods"].includes(b.category) ? b.category : "goods",
    question: b.question ? privacyFilter(b.question) : "",
    mode: deeper ? "DEEPER" : "NORMAL",
    LANGUAGE: S.LANGUAGES[lang],
    facts: {
      headline_inflation_percent: num(b.facts && b.facts.headline),
      food_inflation_percent: num(b.facts && b.facts.food),
      period: privacyFilter(b.facts && b.facts.label),
      source: privacyFilter(b.facts && b.facts.source),
      // State figures come from our STATE_NOTICES list. null means "awaiting NBS update": do not guess it.
      state: b.facts && b.facts.state ? privacyFilter(b.facts.state) : "",
      state_food_inflation_percent: num(b.facts && b.facts.stateFood),
      state_headline_inflation_percent: num(b.facts && b.facts.stateHeadline)
    }
  };
  if (data.oldPrice == null || data.newPrice == null) return res.status(400).json({ error: "Prices missing" });

  const key = S.keyFor("explain", JSON.stringify(data));
  const saved = S.cacheGet(key);
  if (saved) return res.status(200).json({ ...saved, cached: true });
  try {
    const out = await S.askOpenAI(SYSTEM_PROMPT, JSON.stringify(data), 900);
    const answer = {
      headline: String(out.headline || ""),
      explain: String(out.explain || ""),
      causes: uniqueList(out.causes, deeper ? 4 : 3),
      compare: String(out.compare || ""),
      tips: uniqueList(out.tips, deeper ? 4 : 2),
      answer: String(out.answer || ""),
      lang
    };
    S.cacheSet(key, answer);
    return res.status(200).json(answer);
  } catch (e) {
    return res.status(500).json({ error: "Could not reach the AI" });
  }
};
