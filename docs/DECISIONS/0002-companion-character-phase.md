# 0002 — Add Phase 6B: cozy visual identity, motion, and companion character

**Date:** 2026-07-12
**Status:** Accepted

## Context

The user wants the app to feel cute, cozy, and interactive: satisfying hover/loading
animations, a "living room" spatial metaphor for the Today dashboard, and a small
blob-shaped companion character with a face that reflects current activity (fencing,
studying, recruiting, etc.). This extends `PLAN.md` §13's existing "cozy progress"
gamification philosophy (XP, tiny plant/room growth, no streaks/leaderboards) into a
concrete visual character.

## Decisions

1. **One phase, not two.** Motion/interaction polish and the companion character are
   bundled into a single new phase rather than a motion pass now and a character pass
   later, so shared UI (hover states, transitions) only gets touched once.
2. **Placement: Phase 6B, after School (Phase 6), before Gmail (Phase 7).** The
   companion's value is showing what you're actually doing — that needs real activity
   signal, which exists once Calendar (Phase 3), Recruiting (Phase 4-5), and School
   (Phase 6) have landed. Inserted as "6B" rather than renumbering Phases 7-10.
3. **No manual status-setting.** The companion reads existing signals (calendar events,
   task area, application stage) rather than asking the user to declare what they're
   doing — consistent with "suggestions, not additional chores."
4. **Color palette and animation timing:** colors are cheap to revisit at any time
   (centralized CSS variables from Phase 1); the motion/interaction system is
   deliberately deferred to Phase 6B rather than done incrementally, so it's built
   once across the full page surface instead of being retrofitted repeatedly.

## Consequences

- Phases 2-6 continue to ship with the Phase 1 placeholder theme and default
  (non-custom) transitions; that's expected, not a regression to fix mid-phase.
- `docs/PHASES/phase-6b.md` will be created when that phase becomes active, following
  the same format as `phase-0.md`/`phase-1.md`.
