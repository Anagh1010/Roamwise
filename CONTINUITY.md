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
- 2026-10-19 [CODE] Implemented balanced typography mix across the app: Google Sans (`--font-sans`) for headings, body copy, and narrative text; JetBrains Mono (`--font-mono`) for navigation, form labels, inputs, chips, buttons, dates/times, costs, tags, and data badges.
- 2026-09-13 [CODE] Configured base typography stack (Google Sans/JetBrains Mono) and scaled base sizes.
- 2026-09-02 [CODE] Activity location maps integration (`app/page.tsx`, `app/trips/[id]/page.tsx`, `app/styles/itinerary.css`).
- 2026-09-02 [CODE] Added sliding-window rate limiting (`lib/rate-limit.ts`) and Nominatim query cache (`lib/places.ts`).
- 2026-09-02 [CODE] Hardened persisted itinerary validation and optimistic concurrency across journal, briefing, revision, and trip PATCH routes.
- 2026-08-29 [CODE] Added canonical persisted-itinerary validation, server-authoritative journal IDs, and optimistic conflict responses.
- 2026-08-22 [CODE] Added authenticated journal CRUD, diary generation, and Zod validation.

## Working set
- 2026-10-19 [CODE] `app/layout.tsx`
- 2026-10-19 [CODE] `app/styles/variables.css`
- 2026-10-19 [CODE] `app/styles/base.css`
- 2026-10-19 [CODE] `app/styles/layout.css`
- 2026-10-19 [CODE] `app/styles/planner.css`
- 2026-10-19 [CODE] `app/styles/itinerary.css`
- 2026-10-19 [CODE] `app/styles/briefing.css`
- 2026-10-19 [CODE] `app/styles/packing.css`
- 2026-10-19 [CODE] `app/styles/trips.css`
- 2026-10-19 [CODE] `app/styles/journal.css`
- 2026-10-19 [CODE] `app/styles/auth.css`
- 2026-10-19 [CODE] `app/styles/account.css`

## Receipts
- 2026-10-19 [CODE] Font mix verified via `npm run build`: Google Sans for headlines/prose and JetBrains Mono for UI chrome, inputs, chips, dates, times, prices, and status indicators.
- 2026-09-13 [CODE] Font stack imported with preconnect in `app/layout.tsx` and variables in `app/styles/variables.css`.
- 2026-09-02 [CODE] Activity `.place` elements are clickable external links targeting `https://www.google.com/maps/search/?api=1&query=${place}, ${destination}`.
- 2026-09-02 [CODE] Rate limiter applies 10 req/10m for anonymous vs 30 req/10m for authenticated users on `/api/itinerary` with 429 Retry-After headers.
- 2026-09-02 [CODE] In-memory cache in `lib/places.ts` avoids repeat Nominatim lookups within 24h TTL.




