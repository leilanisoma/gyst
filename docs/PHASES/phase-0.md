# Phase 0 — Decisions and foundation

Goal: establish constraints without building features. Source: `PLAN.md` §15.

## Checklist

- [x] Choose app name and create a private repository. — Name: `gyst`. Local git repo initialized; private GitHub remote not yet created (manual, user's call — see `docs/DECISIONS/0001-phase-0-foundational-decisions.md`).
- [x] Write a one-page product brief from sections 1-3. — `docs/PRODUCT_BRIEF.md`.
- [x] Create a data classification table: ordinary, private, highly sensitive. — `docs/DATA_CLASSIFICATION.md`.
- [ ] Create free Supabase and Vercel projects. — **Manual, not done.** Create at supabase.com and vercel.com; drop resulting keys into `.env.local` (see `.env.example`).
- [ ] Confirm Google account(s), Calendar account, Stanford Canvas domain, and whether Canvas personal tokens are allowed. — **Manual, not done.** Needs verification with Stanford IT/Canvas admin settings.
- [x] Decide initial AI provider and set a $5/month hard budget alert. — **Provider decided: Google Gemini** (`docs/DECISIONS/0002-gemini-ai-provider.md`), wired in via `src/ai/providers/gemini.ts`. **Budget alert is still manual** — set one on the Google AI Studio/Cloud Console billing dashboard; this session has no browser access to do it.
- [x] Create `.env.example`; ensure real secrets are ignored. — `.env.example` + `.gitignore` (excludes `.env`, `.env.local`, `.env.*.local`).
- [x] Save this plan under version control. — `PLAN.md` committed in the initial commit.

## Exit criteria status

> Local skeleton boots, cloud projects exist, and no secrets are committed.

- No secrets committed: **met** (`.gitignore` excludes all env files; `.env.example` has placeholders only).
- Local skeleton boots: **N/A at this phase** — no application code exists yet; Phase 1 introduces the Next.js scaffold. The repository itself is coherent and documented.
- Cloud projects exist: **open** — Supabase/Vercel project creation is a manual step for the user; not completed in this session.

## Remaining manual actions (for the user, outside this coding session)

1. Create a Supabase project (free tier) and a Vercel project; copy the resulting URL/keys into `.env.local`.
2. Confirm which Google account will hold the primary Calendar, and whether a second account is involved.
3. Confirm the Stanford Canvas domain and test whether a personal access token is permitted (see `PLAN.md` §8 Canvas section for fallback plan if not).
4. **Provider decided (Gemini).** Get a key at https://aistudio.google.com/apikey, set `AI_PROVIDER=gemini` and `GEMINI_API_KEY` in `.env.local`, and set a billing/budget alert on the Google AI Studio or Cloud Console billing dashboard — not done by this session.
5. Optionally create a private GitHub repo and push the local commit.

Do not start Phase 1 tasks in this file — see `docs/PHASES/phase-1.md` once created.
