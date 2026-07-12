# Phase 4 — Recruiting MVP

Goal: create a trustworthy opportunity and application command center before
automating discovery. Source: `PLAN.md` §15, §6, §9.

## Checklist (task IDs map 1:1 to PLAN.md §15 Phase 4 bullets)

- [x] 4.1 Schema: `companies`, `opportunities`, `applications`, `application_events`, `contacts`, `interactions`, `documents`, `drafts` + Storage bucket for documents + RLS.
- [x] 4.2 Paste-a-job-URL / manual opportunity entry.
- [x] 4.3 Upload resume versions, transcript, and writing samples (`documents`).
- [x] 4.4 Transparent job scoring (PLAN.md §9, 100-point breakdown) with editable preferences.
- [x] 4.5 Kanban and table application views.
- [x] 4.6 Next-action and follow-up reminders.
- [x] 4.7 Contact CRM and networking timeline.
- [x] 4.8 Truthful cover-letter/recruiter-message drafts with evidence links.
- [x] 4.9 Role/company-specific prep notes (no separate interview-prep product).
- [x] 4.10 Funnel analytics and source tracking.

## Exit criteria

> One real application can go from saved job through submission tracking and
> follow-up without another spreadsheet.
>
> Verified: every capture/scoring/stage-transition/document/contact/draft/
> analytics code path was round-tripped against the live Supabase project
> (insert → read back → cleanup) in addition to the unit suite and a
> production build. What's *not* verified is a real end-to-end session
> through the authenticated browser UI — this sandbox has no way to complete
> the magic-link sign-in — so the golden path (paste a job → watch it score →
> drag it through stages → attach a resume → log a follow-up) still wants one
> manual pass in the actual browser before this phase is trusted the way
> Phase 3's Google OAuth round-trip was flagged as unverified.

## Notes

- **Every opportunity gets an application automatically.** PLAN.md §6 keeps `opportunities` and `applications` as separate tables, but this app's capture flow is manual curation, not passive discovery — there's no large firehose of low-interest postings to triage before deciding to track something. So `createOpportunity` inserts the matching `applications` row (stage `saved`) and its first `application_events` row in the same action. `opportunities.active` still exists independently for "is this posting still open" (feeds the scoring hard-exclusion), separate from the application's own stage.
- **Scoring is seeded deterministically, then fully user-editable.** Per PLAN.md §9's "show the score breakdown and let Ishani correct it": role family, eligibility, established-company, and deadline-urgency are computed from the opportunity's own fields (`src/lib/job-scoring.ts`, unit-tested). Skills/experience, interest/industry, and user feedback have no reliable signal without AI or a real resume-to-JD comparison, so they seed at a neutral default and are the only three dimensions exposed as editable in the score-edit UI — editing them recomputes the total but never touches the computed dimensions.
- **Hard exclusions are computed, not a separate `active` toggle the user has to remember.** Closed role, pure SWE, pure finance, and ineligible graduation year (checked against a new `preferences.recruiting_preferences.target_grad_year`, default 2027) all zero the score and set `job_scores.excluded`/`exclusion_reason`. Excluded opportunities still render (sorted last, with the reason as a badge) rather than disappearing — the user chose to add it, so silently hiding it would be confusing.
- **`job_scores` and `application_events` have no `user_id` column.** Ownership — and RLS — is derived through `opportunities.user_id` / `applications.user_id` respectively (a `using (exists (select 1 from ... where ... user_id = auth.uid()))` policy), the same pattern PLAN.md implies by calling `application_events` an "immutable stage history" of an owned `applications` row.
- **Documents upload straight from the browser to Storage**, not through a server action — the private `documents` bucket's RLS (`storage.objects`, folder-scoped to `auth.uid()`) already enforces ownership at the storage layer, so proxying the file bytes through a Next.js server action would just add latency and a body-size limit to work around. The server action only records metadata (`documents-actions.ts`) once the client-side upload succeeds.
- **Drafts stay manual — same `isAIExtractionEnabled()` gate as Inbox's AI extraction** (`src/ai/index.ts` still returns `null`; no provider chosen yet). The draft form shows a note that AI-assisted drafting isn't available and lets the user write the draft directly, pick a resume version, check off which documents it's evidenced by, and maintain a free-text "unsupported claims to review" list (`drafts.unsupported_claims`) by hand instead of AI flagging them.
- **Funnel analytics compute live from `applications`/`application_events`; `recruiting_insights` (PLAN.md §6) was never created.** At single-user scale there's nothing to cache — recomputing on every page load is cheap and avoids a stale-materialized-table bug class entirely. Revisit only if computation cost ever actually shows up.
- **Stage funnel counts "ever reached," not "currently at."** A rejected application that made it to `interview` still counts toward the `interview` milestone — `computeStageFunnel` derives this from the distinct `to_stage` values in `application_events` rather than each application's current `stage`, so a later rejection doesn't erase earlier progress from the funnel.
