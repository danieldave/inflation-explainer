// Inflation Explainer AI — server route (Vercel serverless function)
// The OpenAI key lives in the Vercel setting OPENAI_API_KEY, never in the web page.

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
 "answer":""}`;

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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY is not set" });

  const b = req.body || {};
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

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(data) }
        ]
      })
    });
    if (!r.ok) return res.status(502).json({ error: "AI error " + r.status });
    const j = await r.json();
    const out = JSON.parse(j.choices[0].message.content);
    return res.status(200).json({
      headline: String(out.headline || ""),
      explain: String(out.explain || ""),
      causes: uniqueList(out.causes, deeper ? 4 : 3),
      compare: String(out.compare || ""),
      tips: uniqueList(out.tips, deeper ? 4 : 2),
      answer: String(out.answer || "")
    });
  } catch (e) {
    return res.status(500).json({ error: "Could not reach the AI" });
  }
};
