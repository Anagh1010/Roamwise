# Roamwise — AI Travel Planner

Roamwise is a full-stack travel-planning app that turns a destination, dates, budget, pace, interests, and accessibility needs into a personalized, editable day-by-day itinerary. Travelers can save plans, refine them with AI, prepare with a destination briefing and packing list, then capture the trip in a live journal and AI-generated travel diary.

## Features

- Generate personalized itineraries with activities, timings, estimated costs, packing tips, and a currency-aware budget.
- Use Gemini structured JSON output with Zod validation, plus a deterministic demo fallback when no API key is configured.
- Refine saved itineraries with natural-language requests while preserving existing trip context.
- Create AI travel briefings with etiquette, local customs, useful phrases, and safety guidance; ask follow-up briefing questions.
- Save authenticated trips with Supabase Auth, PostgreSQL, Prisma ORM, and owner-scoped API routes.
- Maintain an editable packing checklist that persists to the saved itinerary.
- Record notes, memories, optional photo URLs, and categorized expenses in a Travel Journal.
- Track live spending against the trip budget with category totals and day-filtered timeline entries.
- Generate and persist an AI Travel Diary from the itinerary, journal entries, memories, and recorded expenses.
- Resolve destination coordinates with OpenStreetMap Nominatim and provide a map link.
- Switch between dark and light themes with responsive layouts for mobile screens.

## Tech stack

| Area | Technologies |
| --- | --- |
| Front end | Next.js 14 App Router, React 18, TypeScript, CSS, Lucide icons |
| AI and validation | Google Gemini API, structured JSON responses, Zod |
| Authentication and data | Supabase Auth, PostgreSQL, Prisma ORM |
| Location data | OpenStreetMap Nominatim |

## Run locally

```bash
npm install
cp .env.example .env
npm run db:push # required after adding DATABASE_URL and DIRECT_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

```env
# PostgreSQL via Supabase
DATABASE_URL=""
DIRECT_URL=""

# Optional: enables AI itinerary, briefing, revision, and diary generation
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-3.5-flash"

# Required to sign in and save trips
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
```

Gemini is optional. Without an API key, Roamwise generates a deterministic demo itinerary and travel diary so the full planning and journal experience remains explorable. Set `GEMINI_MODEL` only when selecting a different Gemini model.

For Supabase, copy the URLs from **Connect → ORM → Prisma**: use the transaction-pooler URL (port `6543`) for `DATABASE_URL` and the session-pooler URL (port `5432`) for `DIRECT_URL`.

## Validation and build

```bash
npx tsc --noEmit
npm run build
```

## Free services

| Feature | Free option | Environment variable |
| --- | --- | --- |
| AI itineraries, briefings, diaries | [Google AI Studio](https://aistudio.google.com/apikey) | `GEMINI_API_KEY` |
| Authentication and saved trips | [Supabase](https://supabase.com/pricing) | Supabase URL/key + database URLs |
| Place coordinates | [OpenStreetMap Nominatim](https://operations.osmfoundation.org/policies/nominatim/) | None |

Nominatim is called only for a user-triggered destination lookup and responses are cached for one day. If deploying publicly, keep usage within its [one-request-per-second policy](https://operations.osmfoundation.org/policies/nominatim/).
