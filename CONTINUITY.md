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
- 2026-09-02 [CODE] Fixed Travel Journal day resolution by supporting `days` from itinerary and ISO date parsing; removed emojis from moods array.
- 2026-09-02 [CODE] Closed remaining persistence gaps: briefing refresh, briefing Q&A, trip PATCH (packing list), and revision routes now fully enforce canonical persisted-itinerary validation and optimistic concurrency.
- 2026-08-29 [CODE] Added canonical persisted-itinerary validation, server-authoritative journal IDs, and optimistic conflict responses for journal, diary, and revision writes.
- 2026-08-22 [CODE] Added authenticated journal CRUD, diary generation, UI, styling, and Zod validation.
- 2026-08-22 [CODE] Upgraded to Next.js 16 and ESLint 9; migrated dynamic params, typed routes, and lint config.
- 2026-08-24 [TOOL] Deep audit found journal persistence validation gaps, public AI/place endpoints, stale docs/config, oversized files, and duplicated request/auth logic.

## Working set
- 2026-09-02 [CODE] `components/travel-journal.tsx`
- 2026-09-02 [CODE] `app/trips/[id]/page.tsx`
- 2026-09-02 [CODE] `app/api/trips/[id]/briefing/route.ts`
- 2026-09-02 [CODE] `app/api/trips/[id]/route.ts`
- 2026-09-02 [CODE] `lib/schemas/itinerary.ts`
- 2026-09-02 [CODE] `lib/api/trips.ts`

## Receipts
- 2026-09-02 [CODE] TravelJournal accepts `days` and parses ISO dates cleanly so all trip days (Day 1..N) appear in entry forms and feed filters.
- 2026-09-02 [CODE] Briefing refresh and trip PATCH routes refactored to preserve journalEntries, diary, and checklist items under `persistedItinerarySchema` with `updateItineraryIfCurrent`.


