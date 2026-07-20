# 0003 — Groq for Gmail extraction only

**Date:** 2026-07-20
**Status:** Accepted

## Context

Gemini (`docs/DECISIONS/0002-gemini-ai-provider.md`) already powers chat,
inbox extraction, and syllabus extraction via the single `AI_PROVIDER`
switch in `getAIClient()` (`src/ai/index.ts`). The user wants Gmail
extraction specifically — the step that classifies each synced message as
an interview/confirmation/deadline/action/other candidate
(`src/lib/gmail/extract.ts`) — to run on Groq instead, while leaving
everything else on Gemini. This came up alongside a separate request to
widen Gmail sync's search query to cover more of the inbox (filtered down
via Gmail's own category/spam search operators); a cheaper/faster
classification-only model matters more once extraction runs against a
larger volume of messages.

## Decisions

1. **Scope:** Groq is wired in for `extractGmailMessage` only, never as the
   global `AI_PROVIDER`. `createGroqClient()` (`src/ai/providers/groq.ts`)
   implements the rest of the `AIClient` interface (`extractInboxItem`,
   `extractSyllabusItems`, `chat`, `embedText`) as throwing stubs — those
   stay on Gemini and should never reach this client.
2. **Selection:** a dedicated `getGmailAIClient()` (`src/ai/index.ts`),
   used only by `src/lib/gmail/extract.ts`. It returns a Groq client when
   `GROQ_API_KEY` is set, otherwise falls back to `getAIClient()` (Gemini) —
   so an unset/removed key degrades Gmail extraction back to Gemini rather
   than disabling it, matching the existing fail-soft convention.
3. **Model:** `openai/gpt-oss-120b`, OpenAI's open-weight model as hosted
   on Groq — strong instruction-following for structured classification,
   and Groq's LPU inference is materially faster/cheaper than typical
   GPU-hosted equivalents for this kind of short, low-latency extraction
   call.
4. **Structured output:** Groq's OpenAI-compatible API doesn't take a
   `responseSchema` parameter the way Gemini's does; `response_format:
   {"type": "json_object"}` guarantees valid JSON, and the exact shape is
   spelled out in the prompt text instead (`GMAIL_JSON_SHAPE` in
   `groq.ts`). The result is still re-validated with
   `GmailExtractionResultSchema` before use — same "AI output is untrusted
   regardless of requested schema" rule as Gemini.
5. **Integration style:** raw `fetch` against Groq's REST API, matching
   Gemini's adapter and every other external connector in this codebase —
   no SDK dependency added.

## Consequences

- Gmail extraction now depends on two provider configs instead of one:
  `GROQ_API_KEY` (optional) alongside `AI_PROVIDER`/`GEMINI_API_KEY`. Chat,
  inbox, and syllabus extraction are unaffected either way.
- If Groq's API changes or the key is revoked, Gmail extraction falls back
  to Gemini automatically rather than breaking — no code change needed to
  recover.
- This is a deliberate, narrow exception to the "one global provider"
  shape `getAIClient()` otherwise has — a second provider-selection
  function (`getGmailAIClient()`) exists specifically for this feature.
  Any future request to run a different provider for a different feature
  should follow this same pattern rather than growing `getAIClient()`
  itself into a per-feature dispatcher.
