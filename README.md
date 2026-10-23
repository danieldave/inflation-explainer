# Inflation Explainer AI

Built by Yewa College (ByteBusters) Generative AI team.

## Files
- `index.html` — the whole website (form, maths, privacy filter, price check, results, About, footer).
- `api/explain.js` — the server route. It holds the AI instructions and calls OpenAI with the secret key.

## Put it online (Vercel, about 10 minutes)
1. Make a new GitHub repository and upload `index.html` and the `api` folder (keep the folder name).
2. On vercel.com: **Add New → Project →** pick the repository → **Deploy**.
3. In the project: **Settings → Environment Variables →** add
   - `OPENAI_API_KEY` = your OpenAI key
   - `OPENAI_MODEL` = `gpt-4o-mini` (optional; change if your account uses another model)
4. Go to **Deployments → Redeploy** so the key is picked up.
5. Open the link, press **Explain**. The label above the answer should say **AI answer**.
   If it says **Offline demo answer**, the key or model is wrong (check Vercel → Logs).

## Things students can change
- **New inflation figures:** edit `FACTS` at the top of the script in `index.html`
  (NBS publishes CPI around the 15th of each month).
- **Price records for the price check:** add rows to `PRICE_RECORDS`. Use only real prices
  from NBS or your own market survey, and fill in `state`, `month` and `source`.
  Example for your own survey:
  `{ match:["garri"], kind:"White garri", qty:1, unit:"kg-loose", price:900, state:"Ogun", month:"2026-10", source:"Our Ilaro market survey, Oct 2026" }`

## How the price check works
- No location chosen → the prices are used exactly as typed.
- Location chosen and a matching record exists:
  - a typing slip (extra or missing zero) is corrected and shown to the user;
  - a price far from the record but not a typing slip is flagged, not changed;
  - a blank price is filled from the record, with its source shown.
- No matching record → nothing is filled in. The site never makes up prices.
