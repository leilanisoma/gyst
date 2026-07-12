# 0001 — Phase 0 foundational decisions

**Date:** 2026-07-11
**Status:** Accepted

## Context

`PLAN.md` §15 Phase 0 requires choosing an app name, deciding an initial AI provider with a budget alert, and confirming account/repo setup before any feature work begins.

## Decisions

1. **App name:** `gyst` (matches the "Get Your Shit Together" acronym used throughout `PLAN.md`).
2. **AI provider:** Undecided. The `AIClient` interface (see `PLAN.md` §4 and `docs/ARCHITECTURE.md`) will be built provider-neutral so this can be resolved later without blocking Phase 0/1 work. No AI provider API keys or budget alerts exist yet — `.env.example` documents the expected variables (`AI_PROVIDER`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OLLAMA_BASE_URL`) but they are unset.
3. **Version control:** Initialize a local git repository and commit Phase 0 documents. No GitHub remote was created in this session — pushing to a private GitHub repo is deferred to whenever the user sets one up manually.
4. **Cloud projects (Supabase, Vercel) and account confirmations (Google, Canvas domain):** Left as manual, user-driven actions outside this session, since they require browser/account access this agent doesn't have. Tracked as open items in `docs/PHASES/phase-0.md`.

## Consequences

- Phase 1 scaffolding can proceed once the app name is settled (it is).
- AI-dependent work (Phase 1's "AI extraction behind a feature flag" and beyond) is blocked until an AI provider is chosen and its key is added to `.env.local`. This is expected — Phase 1's core capture/task flow does not require AI.
- Cloud-dependent work (auth, RLS, storage) is blocked until Supabase/Vercel projects exist and their keys are in `.env.local`.
