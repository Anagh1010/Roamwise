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
- 2026-08-29 [CODE] Added canonical persisted-itinerary validation, server-authoritative journal IDs, and optimistic conflict responses for journal, diary, and revision writes.
- 2026-08-22 [CODE] Added authenticated journal CRUD, diary generation, UI, styling, and Zod validation.
- 2026-08-22 [CODE] Upgraded to Next.js 16 and ESLint 9; migrated dynamic params, typed routes, and lint config.
- 2026-08-24 [TOOL] Deep audit found journal persistence validation gaps, public AI/place endpoints, stale docs/config, oversized files, and duplicated request/auth logic.
- 2026-08-24 [TOOL] Full findings recorded in `AUDIT.md`; remediation order starts with unified persisted-itinerary validation and regression tests.
- 2026-08-24 [TOOL] `npm run lint` passes with 8 warnings; `npx tsc --noEmit` passes.
- 2026-08-24 [TOOL] `next build` currently fails because Turbopack worker port binding is blocked in this environment (`Operation not permitted`), even outside sandbox.

## Working set
- 2026-08-24 [CODE] `app/api/trips/[id]/journal/route.ts`
- 2026-08-24 [CODE] `app/api/trips/[id]/journal/diary/route.ts`
- 2026-08-24 [CODE] `lib/planner.ts`
- 2026-08-24 [CODE] `lib/supabase.ts`
- 2026-08-24 [CODE] `components/travel-journal.tsx`
- 2026-08-24 [CODE] `README.md`, `.env.example`, `.env.example.original`

## Receipts
- 2026-08-29 [TOOL] `npx tsc --noEmit` passes after persistence hardening; lint previously passed with 8 warnings.
- 2026-08-24 [TOOL] Zod default strips unknown keys; `itinerarySchema.safeParse(trip.itinerary)` therefore drops unvalidated extras such as `journalEntries`.
- 2026-08-24 [TOOL] Journal POST/PATCH/DELETE spread raw DB JSON into updates without validating existing entries or full itinerary.
- 2026-08-24 [TOOL] `/api/itinerary` and `/api/places` have no auth or explicit rate limiting.
- 2026-08-24 [TOOL] Local npm registry access was unavailable, so live `npm audit` was UNCONFIRMED.
