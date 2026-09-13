# Continuity Ledger

## Snapshot
- 2026-08-24 [USER] Goal: finish and document Roamwise, an AI travel planner.
- 2026-08-24 [TOOL] Current state: feature-complete codebase audited for security, correctness, and redundancy.
- 2026-08-24 [USER] Production domain is UNCONFIRMED.

## Decisions
- 2026-09-01 [USER] D005 ACTIVE: Travel Journal is available only in saved-trip detail views; generated itineraries remain exploratory drafts.
- 2026-08-29 [CODE] D004 ACTIVE: Persisted itinerary JSON is versioned and validated before every implemented mutation.
- 2026-08-22 [CODE] D001 ACTIVE: Journal entries and diaries reside in the existing `Trip.itinerary` JSON; no database migration is required.
- 2026-08-24 [CODE] D002 ACTIVE: Persisted itinerary JSON must be validated before trust; current unvalidated paths are remediation priorities.
- 2026-08-24 [USER] D003 ACTIVE: Keep detailed audit findings in standalone `AUDIT.md`; keep only bounded references in this ledger.

## Done (recent)
- 2026-09-13 [CODE] Replaced typography with MangaFire font stack (Google Sans/JetBrains Mono) and scaled base and component font sizes (body 16.5px, enhanced readability for cards, form fields, and itinerary).
- 2026-09-02 [CODE] Added clickable Google Maps links for activity location names across generator and saved trip views (`app/page.tsx`, `app/trips/[id]/page.tsx`, `app/styles/itinerary.css`).
- 2026-09-02 [CODE] Implemented Step 3 & 6: Added in-memory sliding-window rate limiting (`lib/rate-limit.ts`) for `/api/itinerary` and `/api/places`, 24h Nominatim query cache, and updated `README.md` to Next.js 16 with architecture highlights.
- 2026-09-02 [CODE] Fixed Travel Journal day resolution by supporting `days` from itinerary and ISO date parsing; removed emojis from moods array.
- 2026-09-02 [CODE] Closed remaining persistence gaps: briefing refresh, briefing Q&A, trip PATCH (packing list), and revision routes now fully enforce canonical persisted-itinerary validation and optimistic concurrency.
- 2026-08-29 [CODE] Added canonical persisted-itinerary validation, server-authoritative journal IDs, and optimistic conflict responses for journal, diary, and revision writes.
- 2026-08-22 [CODE] Added authenticated journal CRUD, diary generation, UI, styling, and Zod validation.

## Working set
- 2026-09-13 [CODE] `app/layout.tsx`
- 2026-09-13 [CODE] `app/styles/variables.css`
- 2026-09-13 [CODE] `app/styles/base.css`
- 2026-09-13 [CODE] `tailwind.config.ts`
- 2026-09-13 [CODE] `app/styles/planner.css`
- 2026-09-13 [CODE] `app/styles/trips.css`
- 2026-09-13 [CODE] `app/styles/itinerary.css`
- 2026-09-13 [CODE] `app/styles/hero.css`
- 2026-09-13 [CODE] `app/styles/layout.css`
- 2026-09-13 [CODE] `app/styles/journal.css`
- 2026-09-13 [CODE] `app/styles/auth.css`

## Receipts
- 2026-09-13 [CODE] MangaFire font stack verified: Google Sans (`--font-sans`) and JetBrains Mono (`--font-mono`), imported via Google Fonts with preconnect in `app/layout.tsx` and variables in `app/styles/variables.css`.
- 2026-09-02 [CODE] Activity `.place` elements are clickable external links targeting `https://www.google.com/maps/search/?api=1&query=${place}, ${destination}`.
- 2026-09-02 [CODE] Rate limiter applies 10 req/10m for anonymous vs 30 req/10m for authenticated users on `/api/itinerary` with 429 Retry-After headers.
- 2026-09-02 [CODE] In-memory cache in `lib/places.ts` avoids repeat Nominatim lookups within 24h TTL.




