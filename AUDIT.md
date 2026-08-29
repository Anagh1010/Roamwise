# Roamwise Audit Findings

_Audit date: 2026-08-24._  
_Scope: application architecture, authorization boundaries, data persistence, AI integrations, dependency/configuration risks, and code redundancy._

## Executive Summary

- The app uses authenticated, owner-scoped trip APIs and Zod validation for incoming itinerary payloads.
- Static checks pass: ESLint reports only 8 warnings and TypeScript reports no errors.
- The most important issue is inconsistent validation of persisted `Trip.itinerary` JSON. Journal mutations trust existing database JSON, while revision silently drops extension fields.
- Public AI and geocoding endpoints need abuse controls before public deployment.
- The production build could not be completed in the current environment because Turbopack could not bind a local worker port.

## High-Priority Findings

### H1. Persisted journal JSON is trusted during mutations

**Risk:** Stored-data integrity / potential persistence of arbitrary nested JSON.

Journal `POST`, `PATCH`, and `DELETE` handlers read:

```ts
const itinerary = (trip.itinerary as Record<string, unknown>) || {};
```

They then spread that unvalidated object into Prisma updates. Existing entries are cast rather than validated. A malformed or malicious-looking legacy row can therefore be carried forward through later writes.

Evidence:

- `app/api/trips/[id]/journal/route.ts:24`
- `app/api/trips/[id]/journal/route.ts:47`
- `app/api/trips/[id]/journal/route.ts:94`
- `app/api/trips/[id]/journal/route.ts:124`

**Recommendation:** Validate the entire persisted itinerary before mutation. Reconstruct updates from validated fields only; do not spread raw database JSON.

### H2. Revision silently drops unvalidated itinerary extensions

**Risk:** Data loss.

The revision route parses persisted JSON with `itinerarySchema.safeParse(trip.itinerary)`. That schema does not declare `journalEntries` or `diary`, and Zod’s default object behavior strips unknown keys. The route then persists `revision.itinerary`, so journal and diary fields can disappear.

Evidence:

- `app/api/trips/[id]/revise/route.ts:22`
- `app/api/trips/[id]/revise/route.ts:25`
- `lib/planner.ts:24`

**Recommendation:** Define one persisted-itinerary schema that includes all supported extension fields. Use it consistently for reads, revisions, briefings, diaries, and checklist updates.

### H3. Diary generation trusts malformed persisted data

**Risk:** Runtime failure or propagation of invalid stored content.

The diary route casts `trip.itinerary as unknown as Itinerary` without validating it. Invalid or partial rows can enter generation prompts and be combined with newly generated output.

Evidence:

- `app/api/trips/[id]/journal/diary/route.ts:20`

**Recommendation:** Parse with the shared persisted-itinerary schema before calling diary generation.

## Security Findings

### S1. Public paid-AI endpoint lacks abuse controls

`POST /api/itinerary` invokes Gemini without requiring authentication or explicit rate limiting. Anonymous users can repeatedly consume provider quota.

Evidence: `app/api/itinerary/route.ts:17`.

**Recommendation:** Require authentication for AI-backed generation or add durable per-IP/user throttling plus deployment-level request limits.

### S2. Public Nominatim proxy lacks abuse controls

`GET /api/places` forwards arbitrary user input to OpenStreetMap Nominatim without auth or rate limiting. This creates denial-of-wallet/service and provider-policy risk.

Evidence: `app/api/places/route.ts:4`, `lib/places.ts:3`.

**Recommendation:** Cache deliberately, enforce same-origin/authenticated use, and apply durable rate limits consistent with Nominatim policy.

### S3. Authorization is repeated instead of centrally enforced

Every API handler independently verifies Bearer tokens and ownership. Current routes appear owner-scoped, but this design leaves no single enforcement point and makes regressions likely as routes grow.

Evidence:

- `app/api/trips/route.ts:10`
- `app/api/trips/route.ts:25`
- `app/api/trips/[id]/route.ts:11`
- `app/api/trips/[id]/route.ts:27`
- `app/api/trips/[id]/route.ts:51`

**Recommendation:** Extract reusable guard/context helpers, and add tests proving cross-user access is rejected for every route and method.

### S4. Production Supabase redirects are UNCONFIRMED

Supabase requires exact allow-listed redirect URLs. No confirmed production domain exists in project documentation or configuration.

**Recommendation:** Set Site URL and Redirect URLs explicitly for every deployed environment before release.

## Correctness Findings

### C1. Production build blocked by environment restriction

`next build` fails because Turbopack’s PostCSS worker cannot bind a local port:

```text
Operation not permitted (os error 1)
```

This occurred both sandboxed and outside sandbox. It appears environmental rather than application-specific.

### C2. Dependency audit was unavailable

`npm audit` could not reach the npm registry in this environment, so current advisory status is UNCONFIRMED. Installed versions include Next 16.3.2, React 18.3.1, Prisma 5.22.0, Supabase JS 2.110.9, and Zod 3.25.76.

Run from a network-enabled environment:

```bash
npm audit --omit=dev
npm audit
```

### C3. Client/server journal state can diverge

The client constructs entry IDs/timestamps and applies optimistic state before relying on server persistence. Current responses do not appear to replace client-generated IDs, so divergence is limited now, but the pattern will break if IDs become server-authoritative.

Evidence: `components/travel-journal.tsx:89`, `components/travel-journal.tsx:125`.

**Recommendation:** Treat the server response as authoritative and replace local candidate objects with returned records.

### C4. Documentation and environment examples disagree

- README says Next.js 14 but dependencies/config reflect Next.js 16 (`README.md:23`).
- `.env.example.original` remains tracked despite being superseded by `.env.example`.

**Recommendation:** Update README and remove the obsolete example after confirming it has no historical value.

## Redundant Code

| Area | Issue | Evidence |
| --- | --- | --- |
| Gemini integration | Five near-identical request/response blocks duplicate URL construction, headers, payload shape, status handling, JSON extraction, and parsing. | `lib/planner.ts:216`, `lib/planner.ts:235`, `lib/planner.ts:255`, `lib/planner.ts:304`, `lib/planner.ts:355` |
| Authenticated fetch | Eleven call sites repeat `getSession()` and manual `Authorization` headers. | `app/page.tsx:85`, `app/trips/page.tsx:52`, `app/trips/page.tsx:72`, `app/trips/[id]/page.tsx:50`, `components/travel-journal.tsx:113` |
| Route guards | Auth/database/AI precondition logic repeats across nearly every handler. | `app/api/trips/**/route.ts` |
| Trip patch API | Supports arbitrary replacement of packing list, journal entries, and diary, but no UI calls this generic endpoint path. | `app/api/trips/[id]/route.ts:49` |
| Journal update API | Dedicated PATCH schema/handler exists, but UI only creates/deletes entries today. | `app/api/trips/[id]/journal/route.ts:74` |
| Currency type | `CurrencyCode` is exported but unused. | `lib/currency.ts:14` |
| Demo generator | Local `currency` variable is unused. | `lib/demo-itinerary.ts:186` |

## Modularization Findings

- `lib/planner.ts` is 385 lines and mixes schemas, response contracts, prompt construction, provider transport, revision rules, diary generation, and itinerary creation.
- `components/travel-journal.tsx` is 547 lines and violates the project’s 300-line source-file limit.

**Recommended split:**

1. `lib/schemas/itinerary.ts`, `journal.ts`, `briefing.ts`, and Gemini response contracts.
2. `lib/ai/gemini-client.ts` for one reusable request helper.
3. `lib/ai/itinerary.ts`, `revision.ts`, `briefing.ts`, and `diary.ts`.
4. Journal UI split into form, feed, expense summary, diary panel, and an authenticated-fetch module.

## Validation Receipts

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 8 non-blocking warnings |
| `npx tsc --noEmit` | Passed |
| `npm audit` | UNCONFIRMED — registry access blocked |
| `npm run build` | Failed — Turbopack worker port binding blocked (`Operation not permitted`) |

## Recommended Remediation Order

1. Introduce and adopt one validated persisted-itinerary schema across every write/read path.
2. Add regression tests for journal CRUD, revision preservation, and cross-user authorization.
3. Protect anonymous AI/place endpoints with authentication or durable rate limits.
4. Extract shared Gemini transport and route-guard helpers.
5. Split oversized planner and journal files into focused modules.
6. Update documentation/environment examples and rerun lint/typecheck/build/audit from an unrestricted environment.
