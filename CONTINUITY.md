# Continuity Ledger

## Snapshot
- 2026-08-22 [USER] Goal: finish and document Roamwise, an AI travel planner.
- 2026-08-22 [CODE] Current state: Travel Journal, expense tracking, and AI diary are implemented; README documents setup and features.
- 2026-08-22 [USER] Goal: remediation completed for the npm audit findings.
- 2026-08-22 [ASSUMPTION] Production domain is UNCONFIRMED.

## Decisions
- 2026-08-22 [CODE] D001 ACTIVE: Journal entries and diaries reside in the existing `Trip.itinerary` JSON; no database migration is required.

## Done (recent)
- 2026-08-22 [CODE] Added authenticated journal CRUD, diary-generation endpoint, UI, responsive/light-theme styling, and Zod validation.
- 2026-08-22 [TOOL] `npx tsc --noEmit` and `npm run build` passed after the journal work.
- 2026-08-22 [CODE] Expanded README with stack, features, environment variables, local setup, and validation instructions.
- 2026-08-22 [TOOL] `npm audit` reported 5 high-severity package findings: direct `next@14.2.35`, direct `eslint-config-next@14.2.35`, and transitive `postcss@8.4.31` and `glob@10.3.10`.
- 2026-08-22 [CODE] Upgraded to `next@16.3.2`, `eslint-config-next@16.3.2`, and ESLint 9; migrated dynamic route params, typed-routes config, and lint configuration.
- 2026-08-22 [TOOL] `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed after the upgrade; lint emits 8 non-blocking warnings.

## Working set
- 2026-08-22 [CODE] `README.md`
- 2026-08-22 [CODE] `app/account/page.tsx`
- 2026-08-22 [CODE] `lib/supabase.ts`
- 2026-08-22 [CODE] `.env.example`
- 2026-08-22 [CODE] `package.json`
- 2026-08-22 [CODE] `package-lock.json`
- 2026-08-22 [CODE] `eslint.config.mjs`

## Receipts
- 2026-08-22 [TOOL] Supabase Redirect URLs documentation: set Site URL and allow-list the URLs used in `redirectTo`; exact production paths are recommended.
- 2026-08-22 [TOOL] Workspace had no `CONTINUITY.md` before this ledger was created.
- 2026-08-22 [TOOL] Audit remediation offered by npm is a semver-major upgrade to `next@16.3.2` and `eslint-config-next@16.3.2`; no package changes were made.
- 2026-08-22 [TOOL] Final `npm audit --omit=dev` reported 0 vulnerabilities.
