# WhyOpen

A Chrome extension that tells you exactly why you opened a tab. It runs quietly in the background, watches your browsing, and uses AI to classify the intent behind each page — whether that's Research, Learning, Work, Shopping, or something else. Every result is cached for 7 days so the AI is only called once per unique page. Click the extension popup and you get a live intent badge for every tab you have open.



## 🛠️ Technologies

- Chrome Extension (Manifest V3, Service Worker)
- Node.js + Express 5 (Backend)
- Prisma 7 (ORM)
- Neon (Serverless PostgreSQL)
- Google Gemini AI (gemini-2.5-flash)
- JavaScript, HTML, CSS



## ✨ Features

- Automatically classifies your intent for every tab you open — Research, Learning, Work, Shopping, Entertainment, Social, Sports, News, Productivity, Comparison, or Other
- Runs as a Chrome extension using a Manifest V3 service worker — no manual input needed, it just works in the background
- Shows a live intent badge for all open tabs in the popup
- Results are cached in the database for 7 days — the AI is only called when a URL is seen for the first time
- Also checks the local chrome.storage cache before hitting the backend at all, making repeat lookups instant
- Detects search queries from Google, Bing, DuckDuckGo, and YouTube to give the AI better context
- Processes tabs in a serial queue to avoid hammering the backend when multiple tabs load at once



## 🪟 The Moment You Realize "Entertainment" Popped Up While You Were Supposed to Be Working

Most people have 20+ tabs open and no idea why half of them are there. WhyOpen doesn't just label your tabs — it makes you slightly more self-aware about where your attention is actually going. It's a small thing, but once you see "Entertainment" pop up when you thought you were working, it hits differently.



## 🔧 Process

I started with the core question: how does a Chrome extension talk to an AI? The answer turned out to be a service worker in the background that listens to tab events and forwards URL + title to a Node.js backend, which then calls Gemini and returns the intent.

The caching layer came next because calling Gemini on every tab load would be both slow and wasteful. I added a Prisma + Neon database to store results keyed by URL and title hash, with a 7-day expiry. Before hitting the backend, the service worker also checks chrome.storage.local, so frequently visited pages feel instant.

Building the Chrome extension was the most unfamiliar part. Manifest V3 is meaningfully different from its predecessors — service workers don't persist the way background pages used to, so you have to be careful about state management. The tab event queue I built processes tabs serially with a processing Set to prevent duplicates.

The popup UI was the finishing touch — a simple card per tab showing the intent, confidence, and a color-coded badge. Kept it clean and small at 360px.



## 📚 What I Learned

- **Chrome Manifest V3** — how service workers replace persistent background pages, the constraints that come with that, and how to manage state without a long-lived background process
- **Building a Chrome extension from scratch** — manifest structure, permissions, messaging between background/popup/content scripts
- **Prisma + Neon** — setting up a serverless PostgreSQL database and using Prisma as the ORM, including migrations and the Neon HTTP adapter
- **AI prompt design for classification** — how to structure a prompt that consistently returns one of N categories with a confidence score
- **Caching strategy** — layering a local cache (chrome.storage) on top of a DB cache on top of an AI call



## 🌱 Overall Growth

WhyOpen pushed me into Chrome extension development for the first time, which is its own ecosystem with its own rules. It also made me think more carefully about caching — not just "add a cache" but layering multiple levels of caching intelligently so the user experience is fast without wasting API calls.



## 🚀 Running the Project
```bash
git clone https://github.com/SarthakKala/WhyOpen.git
cd WhyOpen/backend && npm install

# Create backend/.env:
# PORT=8000
# DATABASE_URL=your_neon_pooled_connection_string
# DIRECT_URL=your_neon_direct_connection_string
# GEMINI_API_KEY=your_google_ai_studio_key

npx prisma generate
npx prisma migrate deploy
npm run dev  # http://localhost:8000
```

Load the extension:
1. Go to chrome://extensions
2. Enable Developer Mode
3. Click "Load unpacked" → select the `extension/` folder



<!--
---

## 🎥 Video
-->

<!-- Attach your demo video here -->
