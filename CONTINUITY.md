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
- 2026-09-02 [CODE] Implemented Step 3 & 6: Added in-memory sliding-window rate limiting (`lib/rate-limit.ts`) for `/api/itinerary` and `/api/places`, 24h Nominatim query cache, and updated `README.md` to Next.js 16 with architecture highlights.
- 2026-09-02 [CODE] Fixed Travel Journal day resolution by supporting `days` from itinerary and ISO date parsing; removed emojis from moods array.
- 2026-09-02 [CODE] Closed remaining persistence gaps: briefing refresh, briefing Q&A, trip PATCH (packing list), and revision routes now fully enforce canonical persisted-itinerary validation and optimistic concurrency.
- 2026-08-29 [CODE] Added canonical persisted-itinerary validation, server-authoritative journal IDs, and optimistic conflict responses for journal, diary, and revision writes.
- 2026-08-22 [CODE] Added authenticated journal CRUD, diary generation, UI, styling, and Zod validation.
- 2026-08-22 [CODE] Upgraded to Next.js 16 and ESLint 9; migrated dynamic params, typed routes, and lint config.

## Working set
- 2026-09-02 [CODE] `lib/rate-limit.ts`
- 2026-09-02 [CODE] `lib/places.ts`
- 2026-09-02 [CODE] `app/api/itinerary/route.ts`
- 2026-09-02 [CODE] `app/api/places/route.ts`
- 2026-09-02 [CODE] `README.md`
- 2026-09-02 [CODE] `components/travel-journal.tsx`

## Receipts
- 2026-09-02 [CODE] Rate limiter applies 10 req/10m for anonymous vs 30 req/10m for authenticated users on `/api/itinerary` with 429 Retry-After headers.
- 2026-09-02 [CODE] In-memory cache in `lib/places.ts` avoids repeat Nominatim lookups within 24h TTL.
- 2026-09-02 [CODE] Briefing refresh and trip PATCH routes refactored to preserve journalEntries, diary, and checklist items under `persistedItinerarySchema` with `updateItineraryIfCurrent`.



