# MyCMO — Full Okara Clone

A complete personal AI CMO. Real Reddit data, real Twitter/X data, live PageSpeed scores, SEO health checker, competitor tracking, documents, run history, daily cron automation, and a chat interface — all saved to Supabase.

---

## Setup Order (follow exactly)

### Step 1 — Supabase
1. Go to supabase.com → New Project
2. Once created: Settings → API → copy **Project URL** and **anon public** key and **service_role** key
3. Go to SQL Editor → paste the entire contents of `supabase-schema.sql` → Run

### Step 2 — Anthropic API Key
1. console.anthropic.com → API Keys → Create Key

### Step 3 — Google PageSpeed (free)
1. console.cloud.google.com → New Project
2. APIs & Services → Library → search "PageSpeed Insights API" → Enable
3. APIs & Services → Credentials → Create API Key

### Step 4 — Twitter/X API
1. developer.x.com → Sign in → Create Project → Create App
2. App Settings → User authentication settings → Enable OAuth 2.0
3. Set callback URL: `https://YOUR-VERCEL-URL.vercel.app/api/auth/callback/twitter`
4. Set website URL to your Vercel URL
5. Copy **Client ID**, **Client Secret**, and **Bearer Token**

### Step 5 — Fill in .env.local

```env
ANTHROPIC_API_KEY=sk-ant-...
PAGESPEED_API_KEY=AIza...
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
TWITTER_BEARER_TOKEN=...
NEXTAUTH_SECRET=           # run: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CRON_SECRET=               # run: openssl rand -base64 32
```

### Step 6 — Install and run
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Step 7 — Deploy to Vercel
```bash
npx vercel
```
- Add all .env.local values in Vercel → Settings → Environment Variables
- Change NEXTAUTH_URL to your Vercel URL (e.g. https://mycmo.vercel.app)
- Change Twitter callback URL to match your Vercel URL

---

## Daily Automation

Vercel cron runs every morning at 8am UTC automatically.
It processes every site you've previously analysed, runs all 6 agents, saves results to Supabase with diffs from the previous day.

**To test manually:**
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/daily-run
```

Results appear in the History tab of any analysed site.

---

## Features vs Okara

| Feature | MyCMO | Okara |
|---------|-------|-------|
| 6 AI agents (Reddit/SEO/Twitter/Content/HN/GEO) | ✅ | ✅ |
| Live PageSpeed scores | ✅ | ✅ |
| SEO health checklist | ✅ | ✅ |
| Live Reddit feed (real API) | ✅ | ✅ |
| Live Twitter/X feed (real API) | ✅ | ✅ |
| Chat with CMO | ✅ | ✅ |
| Daily cron automation | ✅ | ✅ |
| Daily diffs (what changed) | ✅ | ✅ |
| Run history | ✅ | ✅ |
| Documents (Brand Voice etc.) | ✅ | ✅ |
| Competitor tracking | ✅ | ✅ |
| Underlying AI model | Claude Sonnet (better) | Open-source models |
| Cost | ~$5/month API costs | $99/month |

---

## File Structure

```
app/
  page.tsx                        ← Full dashboard UI
  api/
    scrape/route.ts               ← URL scraper (Cheerio)
    pagespeed/route.ts            ← Google PageSpeed API
    agents/route.ts               ← AI agent runner
    chat/route.ts                 ← Streaming CMO chat
    reddit/route.ts               ← Live Reddit API
    twitter-feed/route.ts         ← Live Twitter/X API
    seo-health/route.ts           ← SEO checklist
    runs/route.ts                 ← Save/load runs (Supabase)
    documents/route.ts            ← Documents CRUD (Supabase)
    competitors/route.ts          ← Competitors CRUD (Supabase)
    auth/[...nextauth]/route.ts   ← Twitter OAuth
    cron/daily-run/route.ts       ← Daily automation
lib/
  agents.ts                       ← 6 agent system prompts
  supabase.ts                     ← Supabase clients
supabase-schema.sql               ← Run this in Supabase SQL editor
vercel.json                       ← Cron schedule
```
