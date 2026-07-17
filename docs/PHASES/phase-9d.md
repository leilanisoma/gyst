# Phase 9D — Spatial living-room redesign (planned, not started)

Goal: replace the dashboard-with-sidebar shell (Phase 1/9C) with a literal spatial "room" you click into — Animal Crossing / Club Penguin cozy-game feel, not a SaaS dashboard. Source: `PLAN.md` §Phase 9D, §13.

## Why (Ishani's direction, 2026-07-17)

- Hate the current sidebar and current color palette — both go away.
- The Today screen becomes a living room. Each destination is a room you click/zoom into, not a nav-bar tab: Wellness becomes a garden, and so on for the others.
- Clicking a room object triggers a "woosh" zoom-in transition into that destination's page — a shared-element expand, not a plain route swap.
- The palette shifts with time of day (dawn/day/dusk/night), not a single static cozy theme.
- The companion blob (Phase 9C) stops being a decorative status indicator and becomes the actual persistent chatbot launcher — reachable from every page, not just Today.
- The numeric XP/"days engaged" indicator (`PLAN.md` §13) goes away entirely. Progress is shown ambiently (a room element that grows/brightens) instead of a number. The underlying `xp_events` ledger and its insertion logic are unchanged — this is a display-only swap.

## Checklist

- [ ] Add a day-period helper (dawn/day/dusk/night, derived from local time) and rework `globals.css` design tokens into an Animal-Crossing-style pastel palette with per-period variants. Replace, don't layer on top of, the Phase 1/9C token set.
- [ ] Build a reusable room engine (`RoomDoorway` + `RoomHeader` or equivalent) using a Framer Motion shared-element (`layoutId`) transition so clicking a room object zooms into its destination page.
- [ ] Rebuild the Today page as the "Living Room" hub: existing widgets (capture, tasks, timeline) become scene objects; doorways to Inbox, Tasks, Recruiting, School, Gmail, Wellness, and Settings replace the sidebar as primary navigation.
- [ ] Retire `SidebarNav`/`MobileNav` as primary chrome. Relocate the notification bell, sign-out, and email display to whatever chrome remains (likely a minimal top bar).
- [ ] Replace the numeric XP indicator with an ambient room-growth visual driven by the same `xp_events` data — no changes to `xp_events` schema or insertion logic, display layer only.
- [ ] Promote the companion blob (Phase 9C) to a persistent, global, clickable chat launcher on every page, replacing the current floating chat button.
- [ ] (Phase 2 of this phase, one section per session) Give each of the 7 destination pages its own themed room dressing beyond a shared header treatment — Wellness as a garden is the confirmed example; theme the rest by analogy (e.g. School as a study nook, Recruiting as an office/desk) rather than reusing one generic room skin.

## Open questions to resolve before/while building

- Exact palette values per day-period (dawn/day/dusk/night) — not yet specified beyond "warmer, gamier, Animal Crossing-ish."
- Whether the zoom transition is purely visual (CSS/Framer Motion `layoutId`) or needs real route-level data preloading to avoid a flash of unstyled content on landing.
- What replaces the sidebar's utility items (bell, sign-out, email) once it's gone — candidate is a minimal top bar, not decided yet.
- Room dressing for the 6 non-Wellness destinations (Inbox, Tasks, Recruiting, School, Gmail, Settings) — only Wellness-as-garden is confirmed so far.

## Exit criteria

> The sidebar and numeric XP are gone; navigating between sections feels like moving through a spatial room rather than switching dashboard tabs; the companion blob is reachable as the chat entry point from anywhere in the app.
