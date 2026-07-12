# GYST — Product Brief

*One-page summary of `PLAN.md` sections 1-3. This file is stable; if it drifts from PLAN.md, PLAN.md wins.*

## What it is

GYST (Get Your Shit Together) is a private, single-user personal command center that turns commitments, worries, deadlines, opportunities, and half-formed thoughts into a realistic daily plan. It covers four areas without demanding equal attention every day:

1. **Today** — one calm view of what matters now.
2. **Recruiting** — summer 2027 opportunities, application tracking, networking, tailored prep.
3. **School** — Canvas deadlines, syllabus ingestion, workload estimates, plans that respect class/fencing schedules.
4. **Wellness** — lightweight check-ins plus optional Apple Watch/Health context, oriented around consistency and recovery, not punishment.

It should feel like a calm assistant under anxiety, a command center when planning, a coach during low momentum, and an accountability partner that never shames missed work.

This is a single-user personal project. Optimize for usefulness, low maintenance, low cost, privacy, and fun — not multi-user scale or startup architecture.

## Desired outcomes

- Everything enters through one fast brain-dump inbox.
- Every morning, the app proposes a feasible day around calendar, class, fencing, energy, and deadlines.
- Overdue work rolls forward intelligently, never into an impossible backlog.
- One-tap "I'm overwhelmed" produces a minimum viable day.
- Recruiting opportunities are collected, deduplicated, ranked, and tracked in one place.
- Canvas assignments become visible tasks and suggested study blocks.
- The chatbot recalls stored personal context and turns thoughts into tasks, plans, notes, or drafts.
- Installable on Mac and iPhone with restrained, useful notifications.
- Gamification rewards returning and recovering, not perfect streaks.

## Non-goals (v1)

- Auto-submitting job applications.
- Sending email/LinkedIn messages without review.
- Replacing Canvas, Gmail, Google Calendar, LinkedIn, Handshake, or Apple Health as systems of record.
- Medical diagnosis, fertility guidance, calorie prescriptions, or automated health interventions.
- Perfectly scraping every job board.
- A native iOS app before the web product proves useful.
- Multi-user permissions, billing, teams, or public launch infrastructure.

## Core design principles

1. **Capture first, organize second** — the inbox accepts messy text in seconds.
2. **One source of truth inside GYST** — external items normalize into common events, tasks, documents, and opportunities, linked back to source.
3. **Suggestions, not silent actions** — the app can read, classify, rank, schedule, and draft; it must ask before changing an external calendar and never sends messages or applications.
4. **Feasibility over ambition** — daily capacity is finite; fixed commitments, buffers, sleep, meals, and recovery reduce available planning time.
5. **Anxiety-aware UX** — no red wall of overdue work, guilt copy, broken-streak punishment, or endless notification escalation.
6. **Local-first feeling, cloud-backed convenience** — fast, cacheable UI; sync/automation run securely in the cloud.
7. **Progressive automation** — prove each workflow manually, then automate it.
8. **Every AI output is editable and attributable** — show what informed a recommendation; make corrections easy.

## Source

Full detail, including stack, data model, integrations, scheduling engine, and phased build plan, lives in [`PLAN.md`](../PLAN.md).
