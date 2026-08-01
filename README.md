# Roamwise — AI Travel Planner

Build personalised, editable itineraries based on dates, budget, interests, accessibility needs, and travel pace. The app has a complete no-key demo mode and supports only free options for AI, maps, and the database.

## Run it

```bash
npm install
cp .env.example .env
npm run db:push # only required after adding DATABASE_URL
npm run dev
```

## Free services

| Feature | Free option | Environment variable |
| --- | --- | --- |
| AI itineraries | [Google AI Studio](https://aistudio.google.com/apikey) Gemini API key | `GEMINI_API_KEY` |
| Place coordinates | OpenStreetMap Nominatim | No key required |
| Saved trips | [Supabase Free](https://supabase.com/pricing) PostgreSQL | `DATABASE_URL` |

Gemini is optional: with no AI key, Roamwise provides a deterministic demo itinerary. The AI route uses Gemini's `gemini-3.5-flash-lite` model by default; set `GEMINI_MODEL` only if you want to select a different Gemini model. Keep the variables in the root `.env` file—both Next.js and Prisma load it.

For Supabase, paste both URLs from **Connect → ORM → Prisma**: the transaction-pooler URL (port `6543`) as `DATABASE_URL`, and the session-pooler URL (port `5432`) as `DIRECT_URL`. Prisma uses the session-pooler URL for queries and schema changes.

The public Nominatim service is used only for a user-triggered destination lookup and responses are cached for a day. Keep usage below its [one-request-per-second limit](https://operations.osmfoundation.org/policies/nominatim/) if you deploy this publicly.
