# Roamwise — AI Travel Planner

Build personalised, editable itineraries based on dates, budget, interests, accessibility needs, and travel pace. The app has a complete no-key demo mode and supports only free options for AI, maps, and the database.

## Run it

```bash
npm install
cp .env.example .env.local
npm run db:push # only required after adding DATABASE_URL
npm run dev
```

## Free services

| Feature | Free option | Environment variable |
| --- | --- | --- |
| AI itineraries | [Google AI Studio](https://aistudio.google.com/apikey) Gemini API key | `GEMINI_API_KEY` |
| Place coordinates | OpenStreetMap Nominatim | No key required |
| Saved trips | [Supabase Free](https://supabase.com/pricing) PostgreSQL | `DATABASE_URL` |

Gemini is optional: with no AI key, Roamwise provides a deterministic demo itinerary. The AI route uses `gemini-2.5-flash` by default; set `GEMINI_MODEL` only if you want to select a different Gemini model.

The public Nominatim service is used only for a user-triggered destination lookup and responses are cached for a day. Keep usage below its [one-request-per-second limit](https://operations.osmfoundation.org/policies/nominatim/) if you deploy this publicly.
# Roamwise
