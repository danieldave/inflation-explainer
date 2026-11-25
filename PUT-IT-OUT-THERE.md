# Put It Out There: helping people find our websites

A guide for the **Centre Lead and the ByteBusters team at Yewa College, Ilaro**.
Do these steps **together**: the Centre Lead signs in, and the students read, point, click and type.

> **Be honest with the team from the start.** Getting into Google and Bing usually takes
> **days to weeks**, and getting to the *top* of the results can take months. Nobody can promise
> a ranking, not Google, not us, not anyone who offers to sell one. What we *can* do is make our
> sites easy to find, easy to read and worth sharing. That part is now done in the code. The steps
> below tell Google and Bing that our sites exist.

---

## Our six websites

| Website | Live address | Sitemap |
|---|---|---|
| Scam Shield | https://scam-shield-blond.vercel.app/ | https://scam-shield-blond.vercel.app/sitemap.xml |
| Harvest Calendar Naija | https://harvest-calendar-naija.vercel.app/ | https://harvest-calendar-naija.vercel.app/sitemap.xml |
| Apprentice Pathways Explorer | https://apprentice-pathway-explorer.vercel.app/ | https://apprentice-pathway-explorer.vercel.app/sitemap.xml |
| Community Voice AI | https://community-voice-ai-ziry.vercel.app/ | https://community-voice-ai-ziry.vercel.app/sitemap.xml |
| Inflation Explainer AI | https://inflation-explainer.vercel.app/ | https://inflation-explainer.vercel.app/sitemap.xml |
| Naija Career Compass AI | https://naija-career-compass-ai.vercel.app/ | https://naija-career-compass-ai.vercel.app/sitemap.xml |

Each site already has these files (open them in a browser to see them):

- `/robots.txt`: tells search robots they are welcome, and where the sitemap is.
- `/sitemap.xml`: the list of every page we want found.
- `/llms.txt` and `/llms-full.txt`: a plain-text summary for AI assistants. (This is a new idea that some AI tools use and some do not yet. It does no harm.)
- `/faq` page: real questions people type into Google, with short answers.
- `/about` page: says who built the site.

**Safety first:** use the **Centre Lead's ByteBusters Google and Microsoft accounts**, not students' own accounts. Google accounts are for people aged 13 and over, and the sites belong to the programme, not to one person.

---

## Step 1: Prove to Google that the site is ours (Google Search Console)

**What we learn:** websites have owners, and search engines check who the owner is before they share private data about a site.

1. Go to **https://search.google.com/search-console** and sign in.
2. Click **Add property**. You will see two boxes: *Domain* and *URL prefix*.
3. Choose **URL prefix**. Type the full address, for example `https://scam-shield-blond.vercel.app/`.
   - *Why not "Domain"?* Domain needs us to change DNS settings, and we do not own `vercel.app` (Vercel does). URL prefix is the right choice for our sites.
4. Google now asks us to prove ownership. Pick **one** of these two ways:

### Way A: the HTML tag (a hidden note in our home page)

Think of it like writing your name inside your exercise book.

1. Choose **HTML tag**. Google shows a line like
   `<meta name="google-site-verification" content="abc123...">`
2. Copy **only the code inside `content="..."`**.
3. Open the repo's `tools/site.json` and paste it as the `"googleVerify"` value.
   (Most of our sites already have a code there. If Google shows the **same** code, you do not need to change anything.)
4. Run the builder so the tag goes into the pages:
   ```
   node tools/build.js
   ```
5. Commit and push. Vercel puts the new version online in a minute or two (check the **Deployments** tab in Vercel).
6. Back in Search Console, click **Verify**.

### Way B: the HTML file (a special file in the main folder)

Think of it like leaving a note with a secret password at the front door.

1. Choose **HTML file**. Google gives you a file to download, named like `google1a2b3c4d5e.html`.
2. Put that file in the **main folder** of the repo (next to `index.html`). Do not rename it or change what is inside.
3. Commit and push, then wait for Vercel to finish.
4. Open `https://<our-site>/google1a2b3c4d5e.html` in a browser. If you see the text Google gave, it worked.
5. Click **Verify** in Search Console.

**Keep the tag or the file for ever.** If we delete it, Google may forget that we are the owners.

Do Step 1 for all six sites.

---

## Step 2: Hand Google our map (submit the sitemap)

**What we learn:** a sitemap is a list of every page, like a table of contents for robots.

1. In Search Console, pick the site at the top left.
2. Click **Sitemaps** in the left menu.
3. In "Add a new sitemap", type `sitemap.xml` and click **Submit**.
4. After a while the status should say **Success**, with the number of pages it found. If it says "Couldn't fetch", wait a day and try again: new sites are often slow at first.

---

## Step 3: Ask Google to look at our most important pages (request indexing)

**What we learn:** Google has to "crawl" (visit) and "index" (file away) a page before it can show it in results.

1. Paste a page address into the **search bar at the very top** of Search Console (URL Inspection).
2. If it says **"URL is not on Google"**, click **Request indexing**.
3. Google lets us do only **a few of these each day**, so choose the most useful pages first:
   - the home page
   - the FAQ page
   - 3 to 5 of the best guide pages (for example, on Scam Shield, the fake bank alert page; on Harvest Calendar, the maize and cassava pages)
4. You do **not** need to request every page. The sitemap tells Google about the rest.

Messages you might see, in plain words:

- **"Discovered, currently not indexed"**: Google knows the page exists but has not visited yet. Be patient.
- **"Crawled, currently not indexed"**: Google visited but has not filed it yet. Keep improving the page and sharing it.
- **"Page with redirect"** or **"Excluded by noindex"**: usually fine. Some pages (like "My Letters", "My Dashboard" and the 404 page) are private or not useful in search on purpose.

---

## Step 4: Tell Bing too (Bing Webmaster Tools)

**What we learn:** there is more than one search engine. Bing's results are also used by other search tools.

1. Go to **https://www.bing.com/webmasters** and sign in (a Microsoft account, or the same Google account).
2. Choose **Import from Google Search Console**. Allow it, then tick our six sites. Bing copies the sites **and** their sitemaps. No extra code needed.
3. If importing does not work, add each site by hand and choose the **meta tag** method. Paste the code into `"bingVerify"` in `tools/site.json`, run `node tools/build.js`, then commit and push.
4. Check **Sitemaps** in Bing for each site. If a sitemap is missing, add `https://<our-site>/sitemap.xml`.

---

## Step 5: Share the links the right way

**What we learn:** real people sharing real links is how good websites grow. Tricks get sites punished.

**Good places to share (always with permission):**

- **The school website**: ask the school to add a "Built by our ByteBusters students" section with the six links.
- **Odu'a Investment Foundation social posts**: send the links, one screenshot per site, and a one-line description to the Odu'a team, and ask if they can share them. Do not post on their pages without their approval.
- **WhatsApp status**: one site per day, with a short "what it does" message. For example: *"Got a strange bank alert? Check it on Scam Shield, made by Yewa College students: https://scam-shield-blond.vercel.app/"*
- **Community and parents' groups** (PTA, church or mosque groups, market and farmers' groups, NYSC groups): ask the group admin first, then share the site that fits that group. Share Harvest Calendar with farmers, Apprentice Pathways with young people looking for a trade, Community Voice with the CDA.
- **Our own sites link to each other** already. Keep doing that when we add new pages.

**Not allowed. Do not do these:**

- **Do not add our sites to Wikipedia.** Wikipedia does not allow people to add links to their own projects (it calls this "conflict of interest" and "self-promotion"). The links get removed and the account can be blocked. If our work ever becomes news, someone independent may write about it. That is the only right way.
- Do not pay anyone for "backlinks", "guaranteed page 1" or "SEO packages".
- Do not post the same link again and again in groups or comment sections (spam).
- Do not write fake reviews or ask people to.
- Do not copy other websites' text to make more pages.

Google's own rules say tricks like these can push a site **down** or remove it from results.

---

## Weekly checklist (about 20 minutes, every week)

Pick one student as **"Search Captain"** each week to read the list aloud and tick it off.

- [ ] Open Search Console. Look at **Performance** for each site: how many **clicks** and **impressions** (times we appeared in results)? Write the numbers in the class notebook.
- [ ] Look at **Queries**: what words did people search to find us? Is there a question we should add to the FAQ?
- [ ] Look at **Pages** (Indexing): did the number of indexed pages go up? Any new errors?
- [ ] Request indexing for **up to 3** new or improved pages.
- [ ] Check Bing Webmaster Tools the same way (once a month is fine).
- [ ] Search Google for `site:scam-shield-blond.vercel.app` (and the other five) to see which pages Google has.
- [ ] Share **one** site in **one** new place, with permission.
- [ ] If we changed any content, run `node tools/build.js`, commit and push so the sitemap stays up to date.
- [ ] Write one sentence: "This week we learned..."

---

## What students learn at each step

| Step | What we do | What we learn |
|---|---|---|
| Robots, sitemap, llms.txt | Read our own `/robots.txt` and `/sitemap.xml` | How search robots and AI tools read a website |
| Verify ownership | Add a tag or a file, push, click Verify | Who owns a website, and what deploying means |
| Submit sitemap | Type `sitemap.xml` and submit | How Google discovers pages |
| Request indexing | Inspect a URL and ask Google to visit | Crawling and indexing, and choosing what matters most |
| Bing | Import from Search Console | There is more than one search engine; reuse work smartly |
| Share legitimately | Ask permission, write one honest line | Digital marketing ethics and online safety |
| Weekly checklist | Read the numbers and write them down | Clicks, impressions and patience: reading data over time |

---

## Remember

- **Ranking takes weeks. There are no guarantees.** Many good sites wait a month or more before people start finding them.
- The best thing we can do is keep the pages **true, useful and up to date**, and keep sharing them honestly.
- Celebrate small wins: the first indexed page, the first click, the first search question that brought someone to us.
