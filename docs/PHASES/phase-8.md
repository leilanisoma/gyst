# Phase 8 — Universal chatbot and durable memory

Goal: make all stored information conversational without giving AI
uncontrolled access. Source: `PLAN.md` §15 Phase 8, §12. Estimated 5-8
sessions (PLAN.md) — implement one task ID per session; do not start a
later task in the same session (CLAUDE.md).

**Unblocked by:** `docs/DECISIONS/0002-gemini-ai-provider.md` — an AI
provider (Gemini) is now wired behind `AIClient`, so this phase's chat/tool
work has something real to call. No task below has been started yet.

## Checklist (task IDs map 1:1 to PLAN.md §15 Phase 8 bullets)

- [ ] 8.1 Build chat UI with streaming and conversation history.
- [ ] 8.2 Implement typed read tools for tasks, schedule, school, recruiting, and documents.
- [ ] 8.3 Add memory extraction/review and Memory management page.
- [ ] 8.4 Add semantic retrieval with citations to stored records.
- [ ] 8.5 Add proposed actions and approval previews.
- [ ] 8.6 Add prompt-injection defenses and tool authorization tests.
- [ ] 8.7 Add token tracking, caching, conversation compaction, and context limits.
- [ ] 8.8 Test that health data is excluded unless explicitly requested.

## Exit criteria

> The assistant answers cross-area questions accurately, cites its internal
> sources, remembers corrected preferences, and cannot perform unapproved
> writes.

Not yet met — no task started.

## Notes

Nothing implemented yet. Before starting 8.1, worth confirming against
PLAN.md §4/§12 and `docs/ARCHITECTURE.md`'s current `AIClient` shape:

- `AIClient` (`src/ai/client.ts`) today only has one-shot extraction methods
  (`extractInboxItem`, `extractSyllabusItems`, `extractGmailMessage`) with no
  streaming, multi-turn, or tool-calling surface — 8.1/8.2 will need to
  extend the interface (or add a parallel chat-oriented interface) rather
  than reuse these methods as-is.
- 8.6's prompt-injection defenses matter more here than in any prior phase:
  this is the first place a chatbot reads across *all* stored domains in one
  conversation, so injected content from any one of them (a Gmail excerpt, a
  job posting, a syllabus policy) is a bigger blast radius than the
  single-purpose extraction paths in Phases 1/6/7.
- 8.8's health-data exclusion needs Phase 9 (wellness data) to exist before
  it has anything real to test against — may need reordering or a stubbed
  fixture if Phase 9 hasn't landed first.
