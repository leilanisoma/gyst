# Phase 8 — Universal chatbot and durable memory

Goal: make all stored information conversational without giving AI
uncontrolled access. Source: `PLAN.md` §15 Phase 8, §12.

**Unblocked by:** `docs/DECISIONS/0002-gemini-ai-provider.md` — an AI
provider (Gemini) is wired behind `AIClient`, so this phase's chat/tool work
has something real to call.

All eight tasks below were implemented in one session (deviating from
CLAUDE.md's "one task ID per session" rule, at the user's explicit
request), so the notes are written per-task rather than per-session.

## Checklist (task IDs map 1:1 to PLAN.md §15 Phase 8 bullets)

- [x] 8.1 Build chat UI with streaming and conversation history.
- [x] 8.2 Implement typed read tools for tasks, schedule, school, recruiting, and documents.
- [x] 8.3 Add memory extraction/review and Memory management page.
- [x] 8.4 Add semantic retrieval with citations to stored records.
- [x] 8.5 Add proposed actions and approval previews.
- [x] 8.6 Add prompt-injection defenses and tool authorization tests.
- [x] 8.7 Add token tracking, caching, conversation compaction, and context limits.
- [x] 8.8 Test that health data is excluded unless explicitly requested.

## Exit criteria

> The assistant answers cross-area questions accurately, cites its internal
> sources, remembers corrected preferences, and cannot perform unapproved
> writes.

Met, within this session's scope (see Notes for what "cannot perform
unapproved writes" actually rests on, and what's still unverified against a
live model/database).

## Notes

**Schema.** One migration
(`supabase/migrations/20260715000001_chat_memory_schema.sql`) adds
`pgvector`, `conversations`, `messages`, `memory_items`, `memory_links`,
`assistant_actions`, `document_chunks`, `ai_usage_events`, and two RPC
functions (`match_memory_items`, `match_document_chunks`) for cosine-distance
search. RLS on every table, matching every prior phase's pattern.
**Not yet applied to the live Supabase project** — this sandbox has no
`SUPABASE_ACCESS_TOKEN`/`supabase login`, the same live-verification gap
flagged in every prior phase's Notes. `src/lib/supabase/database.types.ts`
was hand-edited to match the migration (same shape `supabase gen types`
would produce) so the app type-checks; run `supabase db push` then
`npm run db:types` against the real project before relying on this in
production, and diff the regenerated file against the hand-edit.

**AIClient extended, not replaced.** `chat()` (multi-turn, function-calling)
and `embedText()` were added to the existing `AIClient` interface alongside
the three Phase 1/6/7 extraction methods — same provider-neutral contract,
one more capability. `src/ai/providers/gemini.ts` implements both via raw
`fetch` (matching every other connector in this codebase — no SDK
dependency), including a JSON-Schema→Gemini-Schema type-casing translator so
`src/lib/chat/tools/` can author tool parameters in standard (lowercase)
JSON Schema instead of Gemini's uppercase `Type` enum.

**Chat entry point is a floating widget, not a nav tab.** Per explicit
follow-up feedback after this phase's first pass, "Chat" was removed from
`NAV_ITEMS` — the assistant is meant to be reachable from any page, not a
separate destination competing with Tasks/Recruiting/School for a tab slot.
`AppShell` now renders `FloatingChat` (a corner button + `Sheet`, gated on
`getAIClient()` being configured) on every authenticated page. This forced
`ChatShell` to stop assuming it's always driven by a server-rendered page's
props: it now takes a `mode: "page" | "floating"` prop and an `initial`
data bundle (`ChatPanelData`, `src/lib/chat/panel-data.ts`, shared by the
`/chat` page's server render and the new `getChatPanelData` server action).
`mode="page"` keeps the conversation sidebar and reflects the active
conversation in the URL; `mode="floating"` drops the sidebar (no room in a
corner widget — it just continues the most recent conversation, with
"Open full chat"/"Memory" links for anything needing the full page) and
never touches the URL. Every mutation (send/approve/reject/new/delete) now
refetches via `getChatPanelData` and updates local state directly instead
of `router.refresh()`, which was the page-only mechanism the floating
widget has no equivalent of (it isn't tied to a server-rendered route).
Switching conversations in page mode uses a `key={activeConversationId}`
remount rather than an effect syncing `initial` into state, per React's
own "reset state via key, don't sync props in an effect" guidance
(`react-hooks/set-state-in-effect` flagged the effect-based version).

**Streaming is transport-level, not generation-level.** `AIClient.chat()` is
a single non-streaming request — the tool-call loop
(`src/lib/chat/orchestrator.ts`) needs the full response to decide whether
to call a tool anyway, and Gemini's SSE `streamGenerateContent` format adds
real complexity (partial function-call framing) for a single-user app with
no concurrent-request cost pressure. `/api/chat` gets one complete answer
from the orchestrator and then flushes it to the browser word-by-word over
real SSE, so the UI still renders incrementally — task 8.1 is satisfied at
the transport layer, not the model layer. Upgrading to real token streaming
later is an isolated change to `generateChat` in `gemini.ts` plus the tool
loop's error handling; nothing in the DB schema or tool registry would need
to change.

**Read tools (8.2) return flat per-table lists, not embedded joins.** Every
tool (`get_tasks`, `get_schedule`, `get_school_overview`,
`get_recruiting_overview`, `get_documents`) does simple filtered
single-table queries and lets the model correlate rows by id (e.g. an
application's `opportunity_id` against the `opportunities` list in the same
response) rather than using Supabase's embedded-resource select syntax
(`opportunity:opportunities(...)`, used elsewhere in this codebase — see
`src/app/(app)/recruiting/page.tsx`). Kept every tool's query testable
against `FakeSupabase` without extending it to simulate joins.

**Memory (8.3).** `save_memory` is a tool the model can call any time —
always when Ishani explicitly says to remember something, and otherwise
when it judges something durable is worth keeping (`trigger` field
distinguishes the two for provenance, but both land in `memory_items` with
`status: 'pending'`; neither path auto-confirms, per PLAN.md §12). The
Memory page (`/chat/memory`) is the reviewable queue: confirm/edit/archive/
delete/export. Deleting a memory item hard-deletes the row
(`memory_links` cascades via FK); the `deleted` status value in the CHECK
constraint exists for a possible future soft-delete but isn't used by any
code path today.

**Semantic retrieval (8.4).** `document_chunks` stores chunked plaintext +
embeddings per document (Private tier, no encryption needed — see updated
`docs/DATA_CLASSIFICATION.md`). Indexing is manual, not automatic on
upload — a "Index for search" button on the Memory page calls
`indexDocumentForSearch` (`src/lib/chat/document-index.ts`), which chunks by
paragraph (PDF pages chunked separately so page citations stay accurate),
hashes each chunk, and skips re-embedding any chunk whose content hash
already has a stored embedding (PLAN.md §4 "cache results by input hash").
`search_documents`/`search_memory` tools call the two pgvector RPCs.
Recruiting/School's existing document upload flows were **not** wired to
auto-index — that would touch upload code in two other phases' UI for a
feature this phase owns; indexing stays a deliberate, visible action on the
Memory page instead.

**Proposed actions (8.5).** `propose_action` is the only write-shaped tool,
and it never writes to the real target table — it always inserts an
`assistant_actions` row with `status: 'proposed'` and a human-readable
preview. The action allowlist is exactly three types today: `create_task`,
`update_task`, `create_goal` (`src/lib/chat/action-schemas.ts`). Approving
(`approveAssistantAction`, `src/lib/chat/approve-action.ts`) re-validates
the stored `arguments` against the same Zod schema before executing —
tampered or stale arguments fail closed (`status: 'failed'`), not silently.
Rejecting or re-approving an already-resolved action is a no-op (`status`
must be `'proposed'`). This is deliberately narrower than "any tool can
propose any action" — expanding the allowlist means adding a schema and a
matching `executeApprovedAction` case, one type at a time, not a generic
passthrough.

**Prompt-injection defenses (8.6).** Three independent layers, since no
single one is sufficient on its own: (1) the system prompt
(`src/ai/prompts/chat-system.ts`) explicitly tells the model that anything
inside `<untrusted_data>` tags is data, never instructions; (2) every tool
result gets wrapped in that tag (`src/lib/chat/untrusted-content.ts`),
which also neutralizes any literal `</untrusted_data>` sequence inside the
content so injected text can't forge a fake instructions section; (3) tool
authorization is structural, not prompt-based — `getRegisteredTool` rejects
any name not in the server-side registry, `argsSchema.safeParse` rejects
malformed arguments before a tool's `execute` ever runs, and no tool can
perform a real write regardless of what a model call claims (see 8.5). The
tool-call loop is capped at 6 round-trips per turn as a cost/safety
backstop against a model that never stops calling tools.

**Health exclusion (8.8) has no live data to test against yet.** Phase 9
(wellness/HealthKit) hasn't landed, so there's no `health_daily_summaries`
or `cycle_observations` table to query — exactly the gap this file flagged
before starting. What's real today: `registerTool` throws at module-load
time if a tool declares `dataTier: "highly_sensitive"`
(`src/lib/chat/tools/types.ts`), so no such tool can exist in the registry
even if a future author tries; `src/lib/chat/tools/health-exclusion.test.ts`
asserts the current registry has no health/wellness-named tool and that
every registered tool's tier is one of the two allowed values. When Phase 9
adds real health tables, this guard is what will keep them out of chat by
construction rather than by omission — no new enforcement code needed then,
just don't write a tool for them.

**Token tracking/caching/compaction (8.7).** Every `chat()` call's
`usageMetadata` is recorded to `ai_usage_events`
(`src/lib/chat/usage.ts`); a daily cap (`AI_CHAT_DAILY_TOKEN_LIMIT`, default
200k, generous for single-user volume) blocks new turns before calling the
model at all once exceeded, checked in `runChatTurn` before anything is
persisted. Settings shows today's usage against the cap (PLAN.md §4 "AI
usage page"). Caching is content-hash-based for document chunk embeddings
(8.4) — there's no cross-turn prompt cache in this phase since Gemini's
context-caching API wasn't evaluated; noted here as a candidate cost
optimization once real usage volume exists. Compaction
(`src/lib/chat/compaction.ts`) folds everything but the last 10 messages of
a conversation into `conversations.summary` once it passes 20 messages, via
one extra AI call — the summary is appended to the system instruction on
later turns instead of resending the full history.

**Not built, deliberately, given the scope of this session:**
- Real per-token model streaming (see above).
- Conversation rename in the chat UI (the server action exists and is
  tested via the `renameConversation` export; no UI control calls it yet).
- Auto-indexing documents into `document_chunks` on upload.
- A prompt-cache integration for repeated system-instruction tokens.
- Live end-to-end verification against a real Gemini API key and a real
  Supabase project — same "unverified beyond mocks" caveat every AI/OAuth-
  gated phase before this one has flagged; covered here by 271 unit tests
  (provider, tools, orchestrator, approval, compaction, usage, chunking,
  injection-wrapping) plus `tsc`/`eslint`/a successful `next build`.
