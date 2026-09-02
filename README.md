# Roamwise — AI Travel Planner

Roamwise is a full-stack travel-planning application that turns destinations, dates, budgets, pacing, interests, and accessibility needs into personalized, editable day-by-day itineraries. Travelers can save plans, refine them with AI, prepare with destination briefings and packing checklists, and capture their journeys in a live travel journal and AI-generated memoir diary.

## Features

- **Personalized AI Itineraries**: Generates comprehensive day-by-day schedules with activity timings, estimated costs, packing tips, and currency-aware budgets.
- **Deterministic Demo Fallback**: Works seamlessly out of the box without requiring an API key.
- **Natural-Language AI Revisions**: Refine existing saved plans via conversational requests while preserving existing journal entries, packing items, and trip context.
- **Travel Briefings & Interactive Q&A**: Destination-specific etiquette, local customs, safety advice, and useful phrases, with follow-up Q&A.
- **Travel Journal & Expense Tracker**: Log notes, photo memories, and categorized expenses with live spending summaries against budget limits.
- **AI Travel Memoir & Diary**: Synthesize itineraries, logged notes, expenses, and photos into a narrative memoir and highlights reel.
- **Robust Persistence & Concurrency**: Enforces canonical Zod schema versioning, server-authoritative UUIDs, and optimistic concurrency locking (`updatedAt` matching) to prevent data corruption or overwrite races.
- **Built-in Abuse Controls**: In-memory sliding-window rate limiting for AI endpoints (`/api/itinerary`) and 24-hour geocoding cache for OpenStreetMap Nominatim (`/api/places`).
- **Responsive Theme**: Dark and light modes with responsive layouts for mobile, tablet, and desktop viewports.

## Tech stack

| Area | Technologies |
| --- | --- |
| **Front end** | Next.js 16 App Router, React 18, TypeScript, CSS, Lucide icons |
| **AI & Validation** | Google Gemini API, structured JSON responses, Zod schemas |
| **Auth & Database** | Supabase Auth, PostgreSQL, Prisma ORM |
| **Security & Utilities** | Optimistic Concurrency Control (OCC), in-memory sliding-window rate limiting |
| **Location Data** | OpenStreetMap Nominatim with in-memory caching |

## Run locally

```bash
npm install
cp .env.example .env
npm run db:push # required after configuring DATABASE_URL and DIRECT_URL
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

*Note:* Gemini is optional. Without an API key, Roamwise generates deterministic demo itineraries and travel diaries so the full planning and journal experience remains explorable.

For Supabase, copy the URLs from **Connect → ORM → Prisma**: use the transaction-pooler URL (port `6543`) for `DATABASE_URL` and the session-pooler URL (port `5432`) for `DIRECT_URL`.

## Typecheck and validation

```bash
npx tsc --noEmit
npm run lint
```

