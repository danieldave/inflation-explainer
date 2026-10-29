# Inflation Explainer AI (Version 2)

Built with AI by Yewa College Bytebusters (Generative AI Team).

## Files
- `index.html`: the whole website (form, maths, privacy filter, price check, Price Watch board, night mode, results, About, footer).
- `api/explain.js`: the server route. It holds the AI instructions and calls OpenAI with the secret key.

## Put it online (Vercel, about 10 minutes)
1. Upload `index.html` and the `api` folder (keep the folder name) to a GitHub repository.
2. On vercel.com: **Add New → Project →** pick the repository → **Deploy**.
3. **Settings → Environment Variables →** add `OPENAI_API_KEY` (your key) and, optionally, `OPENAI_MODEL` = `gpt-4o-mini`.
4. **Deployments → Redeploy** so the key is picked up.
5. Press **Try an example**. The label above the AI's explanation should say **AI answer**.
   If it says **Offline demo answer**, check the key/model in Vercel → Logs.

## Monthly update (NBS publishes CPI around the 15th)
All three lists are at the top of the script in `index.html`.

1. **FACTS**: national headline and food inflation, last month's figures, the month label and the source.
2. **STATE_NOTICES**: one row per state. Set `foodYoY` and `headlineYoY` from the NBS state table
   (use `null` if there is no figure: the card shows "Awaiting NBS update"). Update `month`.
   Write a new `reason` in simple English. It must say "likely" and be different for each state.
3. **PRICE_RECORDS**: real prices for the price check (NBS Selected Food Price Watch or your own
   market survey, with `state`, `month` and `source` filled in).

Never type a number you did not get from NBS or your own survey.

## How the price check works
- No location chosen: prices are used exactly as typed.
- Location chosen and a matching record exists: a typing slip (extra or missing zero) is corrected
  and shown; a price that is just unusual is flagged, not changed; a blank price is filled from the record.
- No matching record: nothing is filled in. The site never makes up prices.

## Night mode
Follows the phone or computer setting on the first visit. The sun/moon button switches it, and the
choice is remembered on that device (the only thing the site saves).
