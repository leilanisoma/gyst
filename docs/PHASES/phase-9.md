# Phase 9 — Wellness and HealthKit

Goal: add supportive health context after the core app is trustworthy.
Source: `PLAN.md` §15 Phase 9, §11.

Two steps, each implemented in one sitting (deviating from CLAUDE.md's "one
task ID per session" rule, at the user's explicit request, same as Phase 8).

**9B was descoped from a native companion to manual entry (2026-07-16).**
A server-side foundation for a native SwiftUI/HealthKit client (pairing
codes, device tokens, a Bearer-authenticated `/api/health/sync` endpoint)
was built and unit-tested first, on the assumption that a later session
with Xcode open and an Apple Developer Program enrollment would build the
client. Asked directly, the user declined the Developer Program enrollment
entirely — so that native client will never exist. Rather than leave
tested-but-permanently-unreachable device-auth code in the repo, it was
removed: `src/lib/health/pairing.ts`, `device-tokens.ts`, both `/api/health/pair`
and `/api/health/sync` routes, the `device_pairing_codes`/`device_tokens`
tables (dropped in `20260717000003_health_companion_manual_entry.sql`), and
the Settings pairing UI. In its place: a plain webapp form on the Wellness
page (`HealthSummaryForm`) that logs the same allowlisted fields
(sleep/steps/resting heart rate/active energy/workout minutes) directly
into `health_daily_summaries` through an authenticated server action —
no device, no token, no native client, ever. `health_daily_summaries` and
`cycle_observations` (and their Highly-sensitive tier, RLS, and chat
exclusion) are unaffected by this — only the *how it gets in* changed.

## Checklist — 9A (PWA check-ins)

- [x] Add optional lightweight wellness check-in.
- [x] Build private weekly trends with neutral language.
- [x] Add granular data visibility, export, and deletion.
- [x] Add health disclaimer and safe-response policy.

## Checklist — 9B (native companion), verbatim from PLAN.md §15 — abandoned

- [ ] ~~Create minimal SwiftUI iPhone app.~~ Not pursued — no Apple
  Developer Program enrollment (user's explicit choice, 2026-07-16).
- [ ] ~~Add Sign in and secure device-to-server token exchange.~~ Was built
  and unit-tested, then deleted once the native client was ruled out — no
  consumer would ever call it.
- [ ] ~~Request chosen HealthKit permissions contextually.~~ Not applicable
  without a native client.
- [x] Sync only approved daily summaries → resolved as **log** only
  approved daily summaries: the webapp form and its server action accept
  exactly the same allowlist (`dailySummaryMetricSchema`) the sync endpoint
  used to enforce.
- [x] Handle permission revocation and deleted Health data → resolved as
  "delete all logged health entries," the equivalent control for
  manually-entered data (there's no OS permission to revoke without a
  native client).
- [x] Evaluate Mira export/import without assuming an API → resolved via
  manual/CSV cycle-data import (unchanged by this descope).
- [x] Complete security/privacy review before real data sync → see the
  updated review below, now scoped to the manual-entry surface.

## What's built (9B, manual entry)

- [x] **Webapp form for daily health metrics** — `HealthSummaryForm`
  (`src/components/wellness/health-summary-form.tsx`) on the Wellness page,
  logging sleep/steps/resting-heart-rate/active-energy/workout-minutes for
  a chosen date via `upsertHealthDailySummary`
  (`src/app/(app)/wellness/actions.ts`), which validates against the same
  `dailySummaryMetricSchema` allowlist and calls `upsertDailySummaries`
  (`src/lib/health/daily-summaries.ts`) with `source: "manual_entry"`.
- [x] **Per-entry and delete-all controls** — `deleteHealthDailySummaryEntry`
  and `deleteAllHealthDailySummariesData`, mirroring the cycle-data pattern.
- [x] **Manual/CSV cycle-data import** — unchanged from before; still the
  resolution of "evaluate Mira export/import without assuming an API."
  `src/lib/health/cycle-observations.ts`.
- [x] **Security/privacy review** — see the dedicated section below,
  rewritten for the manual-entry surface (no device-auth surface remains
  to review).
- **Removed, not built:** `src/lib/health/pairing.ts`, `device-tokens.ts`,
  `/api/health/pair`, `/api/health/sync`, the Settings pairing card, and
  the `device_pairing_codes`/`device_tokens` tables (dropped in
  `20260717000003_health_companion_manual_entry.sql`).

## Exit criteria (9A)

> The main chatbot does not see wellness check-ins by default.

Met: no chat tool exists for `wellness_check_ins` (see Notes), and
`src/lib/chat/tools/health-exclusion.test.ts` asserts the registry stays
that way.

## Exit criteria (9B)

> Revoking Health permissions stops collection, deleting synced summaries
> works, and the main chatbot does not see them by default.

Re-read for manual entry (there's no OS permission to revoke without a
native client, so that clause maps to "stop logging" — trivially true,
it's just a form you stop filling in): deleting logged entries works
(`deleteHealthDailySummaryEntry`/`deleteAllHealthDailySummariesData`,
unit-tested against the fake Supabase client), and the main chatbot does
not see them by default — no chat tool reads `health_daily_summaries` or
`cycle_observations`, and `health-exclusion.test.ts` covers both by the
same generic assertion. Met, for the surface that now exists.

## Notes

**A second, separate check-in table by design.** Phase 2's `check_ins`
table (mood/energy/stress/sleep/note + `capacity_minutes`) feeds the
deterministic scheduler — it's Organization data, not Wellness data, per
`PLAN.md` §6. This phase adds `wellness_check_ins`
(`supabase/migrations/20260716000001_wellness_check_ins.sql`): same shape
plus `ate_consistently` (yes/somewhat/no/prefer_not_to_say) and `recovery`,
matching the exact field list PLAN.md §11 suggests. It has its own unique
`(user_id, check_in_date)` constraint, its own RLS policy, and is entirely
separate from the scheduler — filling it out (or not) never changes a
proposed time block. `docs/DATA_CLASSIFICATION.md` already anticipated this
table (added during Phase 8) as Private tier; no reclassification needed.
**Applied to the live Supabase project 2026-07-16** (`supabase db push`),
along with `20260717000001_health_companion_schema.sql` and the later
`20260717000003_health_companion_manual_entry.sql`.
`src/lib/supabase/database.types.ts` remains hand-edited rather than
regenerated: a `supabase gen types` diff on 2026-07-16 turned up unrelated
pre-existing drift on `document_chunks`/`memory_items` embedding typing
(a Supabase CLI version difference, not caused by this phase) that would
have introduced new `tsc` errors elsewhere — regenerating was deferred to
its own session rather than folded into this one.

**Every field is skippable, including energy** — unlike the Phase 2
check-in card, which requires energy because it drives capacity defaults.
`WellnessCheckInForm` (`src/components/wellness/wellness-check-in-form.tsx`)
has no required fields and no default value derivation; saving an
all-skipped check-in (just a date) is valid.

**Weekly trends are deterministic code, not AI** (`src/lib/wellness.ts`,
`weeklyTrendObservations` + `src/lib/wellness.test.ts`), per `PLAN.md` §4
"deterministic logic... lives in ordinary code, never inside a prompt."
Six rules (energy/mood/stress/sleep/eating/recovery) each count occurrences
of a "signal" value within the trailing 7 days; an observation is only
surfaced once a signal repeats on **2 or more** days, so a single rough day
never reads as a trend (anxiety-aware UX, `PLAN.md` §3). Phrasing is
strictly descriptive counts ("logged as low on 2 of the 3 days"), never
causal or diagnostic — the test suite has an explicit assertion against
diagnostic/causal language leaking into the generated strings.

**Granular visibility, export, deletion.** The Wellness page's History
section (`src/components/wellness/wellness-history.tsx`) lists every stored
check-in with a per-entry delete button — that's the "granular visibility"
half. `src/components/wellness/wellness-data-controls.tsx` provides the
other half: "Export as JSON" (client-side `Blob`/`URL.createObjectURL`
download of every field, built from `exportWellnessData` in
`src/app/(app)/wellness/actions.ts` — no server route needed) and "Delete
all wellness data" (`window.confirm`, then `deleteAllWellnessData`, matching
the existing destructive-action pattern from `purgeGmailData` in Settings).

**Disclaimer and safe-response policy.** Static copy on the Wellness page
states plainly that this isn't medical advice, encourages seeing a
clinician for a stopped period or concerning symptoms (`PLAN.md` §11
verbatim requirement), and states the data-exclusion policy in plain
language. The actual enforcement of that exclusion is structural, not
copy-based: no tool in `src/lib/chat/tools/` reads `wellness_check_ins`, and
`health-exclusion.test.ts` (updated this session — its comment was stale,
claiming no wellness table existed) asserts the registry has no
health/wellness-named tool and every tool's `dataTier` is an allowed value.
Attaching wellness data to a chat question on request (the "unless
explicitly attached" carve-out in `PLAN.md` §11/§14) is **not** built —
that's a chat-feature change out of scope for a check-ins phase, and isn't
in the 9A checklist above.

**Not built, deliberately, given 9A's scope:**
- `wellness_goals` (PLAN.md §6) — not in the 9A checklist; a goals feature
  is its own vertical slice.
- CSV export (JSON only) — no stated need yet for a single-user app whose
  only current consumer of the export is Ishani herself.
- Live end-to-end verification against a real Supabase project — same
  "unverified beyond mocks" caveat every schema-adding phase before this
  one has flagged; covered here by 8 unit tests on the trend logic plus
  `tsc`/`eslint`.

## Notes — 9B (manual entry)

**Why the device-auth code was removed rather than left dormant.**
CLAUDE.md's "no half-finished implementations" and "if unused, delete it
completely" guidance applied directly once the Developer Program decision
was final: `pairing.ts`/`device-tokens.ts` and the two API routes were
fully built and unit-tested, but with the native client permanently ruled
out, nothing would ever call `createPairingCode`, `redeemPairingCode`, or
`/api/health/sync` again. Keeping tested-but-dead auth surface area around
is a liability (more code implying more attack surface for zero benefit),
not a convenience — so it was deleted along with its tables, not just
stopped being referenced. If HealthKit is ever revisited, the recovery
comment in `20260717000003_health_companion_manual_entry.sql` points back
to the original `create table` statements.

**The allowlist is still the enforcement for "log only approved daily
summaries."** `dailySummaryMetricSchema`
(`src/lib/health/daily-summaries.ts`) names five fields — the exact ones
PLAN.md §8 lists ("sleep, workouts, activity, resting heart rate," plus
steps for "activity"). `upsertHealthDailySummary`
(`src/app/(app)/wellness/actions.ts`) validates the form's input against
this schema before writing, the same guard the deleted sync endpoint used
to apply to a device's payload — the enforcement point moved from an API
route to a server action, but the shape it enforces didn't change.

**Cycle data's CSV import is intentionally strict, not lenient.** PLAN.md
§8 rules out scraping and rules out assuming an API; the remaining option
it names is manual/CSV. `parseCycleCsv`
(`src/lib/health/cycle-observations.ts`) requires a `date` column, accepts
optional `flow`/`symptoms`/`note` columns, and — on any row with an invalid
date, an unrecognized flow value, or a symptom outside the fixed
`ALLOWED_SYMPTOMS` vocabulary — skips that one row and reports why, rather
than guessing or silently dropping just the bad field. `symptoms` is
semicolon-separated free-form-looking text but validated against a closed
enum, so a typo doesn't get silently stored as a permanent new "symptom."
The free-text `note` column is the one field that's genuinely open text,
which is exactly the field that gets AES-256-GCM'd before storage
(`note_encrypted`) — same asymmetry as `health_daily_summaries` having no
encrypted column at all (no free text to protect there).

**Deletion is still two independent controls**, matching PLAN.md §11's
explicit call for cycle data to have controls separate from general health
data: `deleteAllHealthSummaries` and `deleteAllCycleObservations` are two
separate delete-everything actions. Clearing all logged health metrics
does not touch cycle data, and clearing all cycle data does not touch
health metrics — both have to be pulled explicitly, which is why the
Wellness page exposes them as two separate destructive buttons rather than
one combined "turn off health stuff" toggle.

## Security/privacy review (9B manual-entry surface)

Scope: `health_daily_summaries` and `cycle_observations`, and the server
actions that read/write them. There is no device-auth surface left to
review — no tokens, no pairing codes, no Bearer-authenticated route — so
this review is narrower than the one it replaces, not broader.

- **RLS.** Both tables have `for all using (auth.uid() = user_id)`
  policies, matching every other table in this project. Every read/write
  now happens through a normal authenticated Supabase Auth session
  (`createClient()` in `wellness/actions.ts`), so RLS is the primary
  control here, not a backstop for a service-role path — there is no
  service-role access to either table anymore.
- **Input validation.** `dailySummaryMetricSchema` (Zod) strips any field
  outside the five-field allowlist rather than erroring on it, so a form
  (or future caller) sending extra data gets it silently dropped, not
  stored — `daily-summaries.test.ts` asserts this directly.
- **Encryption.** `cycle_observations.note_encrypted` reuses
  `src/lib/crypto.ts` (AES-256-GCM, the same `ENCRYPTION_KEY` already
  required for `oauth_tokens`/`gmail_items`) — no new key material, no new
  failure mode. `health_daily_summaries` has no free-text field, so nothing
  to encrypt there.
- **AI/chat exclusion.** Verified by construction
  (`registerTool` throws on `dataTier: "highly_sensitive"`) and by test
  (`health-exclusion.test.ts`) — not just by omission/oversight.
- **Removed attack surface.** Deleting the device-auth tables/routes
  removes the risks that used to be tracked here: no more Bearer token
  that could leak, no more pairing-code brute-force surface to rate-limit
  (was previously accepted as low-risk given 32^8 ≈ 1.1 × 10^12 possible
  codes, single-use, 10-minute expiry — now moot, there's nothing to
  guess). Net risk reduction, not a gap.
- **No open item carried forward.** The prior review flagged on-device
  Keychain storage and HealthKit permission-request UX as unreviewed risk
  to revisit once a native client existed. That client will never exist,
  so there is nothing left to carry forward — this review is complete for
  the surface that remains.
