# 0002 — Gemini as the initial AI provider

**Date:** 2026-07-15
**Status:** Accepted

## Context

Phase 0 (`docs/DECISIONS/0001-phase-0-foundational-decisions.md`) left the AI
provider decision open. The provider-neutral `AIClient` interface
(`src/ai/client.ts`) and its callers — Inbox extraction (Phase 1), syllabus
extraction (Phase 6 task 6.6), Gmail extraction (Phase 7 task 7.4) — were all
built and gated behind `getAIClient()`, which returned `null` until a
provider was chosen.

The user compared per-token pricing across Anthropic, OpenAI, and Google for
this single-user, low-volume app and chose Google Gemini for cost: Gemini
2.5 Flash-Lite ($0.10 / $0.40 per million input/output tokens) is roughly
10x cheaper than Claude Haiku 4.5 and undercuts OpenAI's cheapest tier, with
a free tier available for experimentation. PLAN.md §18 caps the AI budget
near $5/month; at this app's single-user volume, Gemini's pricing uses only
a small fraction of that.

## Decisions

1. **Provider:** Google Gemini, model `gemini-2.5-flash-lite`. Chosen for
   cost — see Context.
2. **Integration style:** Raw REST calls via `fetch`
   (`src/ai/providers/gemini.ts`), not the `@google/genai` SDK — matches
   every other external connector in this codebase (`src/lib/gmail/client.ts`,
   `src/lib/google/calendar.ts`, `src/lib/canvas/client.ts`), keeping
   dependencies minimal per CLAUDE.md's low-maintenance goal.
3. **Structured output:** Gemini's native `responseSchema` /
   `responseMimeType: "application/json"` forces JSON matching each
   extraction shape. Callers still re-validate with the matching Zod schema
   (`ExtractionResultSchema`, `SyllabusExtractionResultSchema`,
   `GmailExtractionResultSchema`) before use — AI output is untrusted model
   output regardless of the requested schema, same as CLAUDE.md's "treat all
   external content as untrusted" rule.
4. **Prompts moved to `src/ai/prompts/`** (one file per extraction task) per
   CLAUDE.md's "prompts are versioned files, not inline strings, once the AI
   layer exists" — the AI layer now exists. Provider adapters import these
   rather than embedding prompt text, so a future second provider reuses the
   same prompts.
5. **Selection:** `AI_PROVIDER=gemini` + `GEMINI_API_KEY` in `.env.local`
   (see updated `.env.example`). `getAIClient()` returns `null` if either is
   unset — same fail-safe behavior as before, so extraction features stay
   hidden rather than erroring.
6. **Local Ollama remains dev/experimentation-only** (PLAN.md §18) and is
   unaffected by this decision — `OLLAMA_BASE_URL` is not read by
   `getAIClient()` today. Wiring it up as a selectable `AI_PROVIDER=ollama`
   value is future work if ever needed, not required now.

## Consequences

- `isAIExtractionEnabled()` now returns `true` once `.env.local` has both
  variables set, activating the previously-inert Inbox, syllabus (Phase 6),
  and Gmail (Phase 7) extraction paths with no further plumbing — this was
  the intended effect of building those paths gated-but-ready.
- Switching providers later (e.g. adding an Anthropic or OpenAI adapter)
  means writing a new file implementing `AIClient` and adding a branch to
  `getAIClient()` — no changes to `src/lib/syllabus/extract.ts`,
  `src/lib/gmail/extract.ts`, or any UI, confirming the provider-neutral
  design worked as intended.
- `docs/PHASES/phase-0.md`'s "Decide initial AI provider" checklist item is
  now resolved. The other half of that item — an actual billing/budget
  alert on Google's dashboard — is still a manual step; this session has no
  browser access to click through it.
