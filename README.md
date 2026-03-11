# WhyOpen

> A Chrome extension that tells you exactly why you opened a tab — powered by AI.

WhyOpen monitors your browser tabs in the background, sends each page's URL and title to a local backend, and uses Google Gemini to classify your intent (Research, Shopping, Entertainment, etc.). Results are cached for 7 days so the AI is only called once per unique page. The extension popup shows a live intent badge for every open tab.

---

## How It Works

```
Tab opened / activated
       │
       ▼
background.js (service worker)
  ├─ Check chrome.storage.local cache
  │     └─ Cache hit → show intent immediately
  └─ Cache miss → POST /api/infer-intent
                        │
                        ▼
                 Express backend
                  ├─ Check IntentCache (Neon DB)
                  │     └─ DB hit → return cached result
                  └─ DB miss → call Gemini AI
                                    │
                                    ▼
                             Return intent + confidence
                             Upsert into DB (7-day TTL)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Browser Extension | Chrome Manifest V3, service worker |
| Backend | Node.js, Express 5 |
| ORM / Database | Prisma 7, Neon (serverless PostgreSQL) |
| AI — Primary | Google Gemini (`gemini-2.5-flash`) |
| AI — Optional | OpenAI (`gpt-4o-mini`, code present, commented out) |
| Runtime tooling | dotenv, nodemon, cors |

---

## Project Structure

```
WhyOpen/
│
├── backend/                        # Node.js API server
│   ├── server.js                   # Entry point — starts Express on PORT
│   ├── app.js                      # Express app setup, routes, CORS, error handler
│   ├── package.json
│   ├── prisma.config.ts            # Prisma 7 config (schema path, migrations, DB URL)
│   │
│   ├── prisma/
│   │   ├── schema.prisma           # IntentCache model definition
│   │   └── migrations/             # Auto-generated migration history
│   │
│   └── src/
│       ├── config/
│       │   ├── prisma.js           # PrismaClient instance (Neon HTTP adapter)
│       │   ├── openai.js           # OpenAI client instance
│       │   ├── gemini.js           # Google Generative AI client instance
│       │   └── intentCategories.js # The 11 intent category definitions
│       │
│       ├── routes/
│       │   └── intent.routes.js    # POST /api/infer-intent route handler
│       │
│       └── service/
│           └── inferIntentAI.js    # Builds AI prompt, calls Gemini, parses response
│
└── extension/                      # Chrome extension
    ├── manifest.json               # MV3 manifest — permissions, service worker, popup
    ├── background.js               # Service worker — tab events, inference queue, cache
    ├── popup.html                  # Popup shell
    ├── popup.js                    # Renders per-tab intent cards, live refresh
    └── popup.css                   # Popup styles (360px, green/orange badges)
```

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v8 or higher
- **Google Chrome** browser
- A **[Neon](https://neon.tech)** account (free tier works) — for the PostgreSQL database
- A **[Google AI Studio](https://aistudio.google.com)** API key — for Gemini

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/WhyOpen.git
cd WhyOpen
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=8000
DATABASE_URL="postgresql://your_user:your_password@your_host/your_db?sslmode=require"
DIRECT_URL="postgresql://your_user:your_password@your_direct_host/your_db?sslmode=require"
GEMINI_API_KEY="your_gemini_api_key_here"
OPENAI_API_KEY="your_openai_api_key_here"
```

> **Getting your Neon URLs:** In the [Neon dashboard](https://console.neon.tech), open your project → Connection Details. Copy the **pooled connection string** as `DATABASE_URL` and the **direct connection string** as `DIRECT_URL`. Remove `channel_binding=require` from both strings if present.

Generate the Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

Start the development server:

```bash
npm run dev
```

The backend will be running at `http://localhost:8000`.

### 3. Load the extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project

The WhyOpen icon will appear in your Chrome toolbar. Click it to see intent badges for all open tabs.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | Optional | Port for the Express server. Defaults to `3000`. |
| `DATABASE_URL` | Required | Neon PostgreSQL pooled connection string. |
| `DIRECT_URL` | Required | Neon PostgreSQL direct connection string (used by Prisma CLI for migrations). |
| `GEMINI_API_KEY` | Required | Google Gemini API key from [Google AI Studio](https://aistudio.google.com). |
| `OPENAI_API_KEY` | Optional | OpenAI API key. The code path exists but is currently commented out. |

---

## API Reference

Base URL: `http://localhost:8000`

---

### `POST /api/infer-intent`

Classifies the user's intent for a given URL and page title.

**Request body**

```json
{
  "url": "https://stackoverflow.com/questions/123",
  "title": "How to center a div in CSS",
  "searchQuery": "center div css"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | Yes | Full URL of the page |
| `title` | string | Yes | Page title |
| `searchQuery` | string | No | Search query that led to this page |

**Response — cache hit**

```json
{
  "intent": "Research",
  "confidence": 0.92,
  "cached": true,
  "source": "ai"
}
```

**Response — fresh AI inference**

```json
{
  "intent": "Research",
  "confidence": 0.92,
  "cached": false,
  "source": "ai"
}
```

| Field | Type | Description |
|---|---|---|
| `intent` | string | One of the 11 intent category names |
| `confidence` | number | AI confidence score between 0 and 1 |
| `cached` | boolean | `true` if the result came from the database cache |
| `source` | string | Always `"ai"` for AI-classified results |

**Error responses**

| Status | Cause |
|---|---|
| `400` | `url` or `title` missing from request body |
| `500` | Internal server error (AI failure, DB error, etc.) |

---

### `GET /health`

Health check endpoint.

**Response**

```json
{ "status": "Server is healthy." }
```

---

## Intent Categories

| Category | When it applies |
|---|---|
| Research | Documentation, articles, StackOverflow, technical reading |
| Learning | Tutorials, courses, educational videos, study material |
| Work | GitHub, coding tools, productivity apps, project tasks |
| Shopping | E-commerce sites (Amazon, Flipkart, etc.) |
| Comparison | Product reviews, spec comparisons, pricing pages |
| Entertainment | Movies, music, videos, gaming, leisure content |
| Social | Social media (Twitter/X, Instagram, Facebook, etc.) |
| Sports | Scores, teams, match highlights |
| News | Current events, journalism, news articles |
| Productivity | AI tools, Notion, Google Docs, task managers |
| Other | Anything that doesn't fit the above |

---

## Extension Internals

### Tab inference queue

`background.js` processes tabs **serially** through an in-memory queue with a `processingTabs` Set to prevent the same tab being queued twice. This avoids hammering the backend with concurrent requests when many tabs load at once.

### Local cache

Before calling the backend, the service worker checks `chrome.storage.local` using the key `url:title:searchQuery`. If a result already exists it is used immediately without a network request.

### Search query detection

When a tab loads a search results page, `background.js` extracts the query string from the URL and stores it as context for the next navigation. Supported engines:

| Engine | Parameter |
|---|---|
| Google | `?q=` |
| Bing | `?q=` |
| DuckDuckGo | `?q=` |
| YouTube | `?search_query=` |

---

## Scripts

Run all commands from the `backend/` directory.

| Command | Description |
|---|---|
| `npm run dev` | Start server with nodemon (auto-restarts on file changes) |
| `npm run start` | Start server with plain node |
| `npx prisma generate` | Regenerate the Prisma client after schema changes |
| `npx prisma migrate dev` | Create and apply a new migration (development) |
| `npx prisma migrate deploy` | Apply pending migrations (production / first setup) |
| `npx prisma studio` | Open the Prisma visual database browser |

---

## Database Schema

```prisma
model IntentCache {
  id             String   @id @default(uuid())
  normalizedUrl  String
  titleHash      String
  inferredIntent String
  confidence     Float
  source         String
  searchQuery    String?
  createdAt      DateTime @default(now())
  expiresAt      DateTime

  @@unique([normalizedUrl, titleHash])
}
```

Results are cached for **7 days** from inference time. Expired entries are ignored by the route handler and overwritten on the next request.

---

## License

ISC
