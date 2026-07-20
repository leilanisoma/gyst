# Phase 9D — Spatial living-room redesign (planned, not started)

Goal: replace the dashboard-with-sidebar shell (Phase 1/9C) with a literal spatial "room" you click into — Animal Crossing / Club Penguin cozy-game feel, not a SaaS dashboard. Source: `PLAN.md` §Phase 9D, §13.

Split into sub-phases (2026-07-17) so each session ships one coherent slice: the shared foundation first (hub shell + all interaction mechanics), then one sub-phase per room. Do not start a room sub-phase before 9D-1's exit criteria pass — every room reuses `RoomDoorway`/`RoomHeader` and the hover/glow mechanics built there.

## Why (Ishani's direction, 2026-07-17)

- Hate the current sidebar and current color palette — both go away.
- The Today screen becomes a living room. Each destination is a room you click/zoom into, not a nav-bar tab: Wellness becomes a garden, and so on for the others.
- Clicking a room object triggers a "woosh" zoom-in transition into that destination's page — a shared-element expand, not a plain route swap.
- Hovering a room object should feel alive — expand/glow/lift, exact treatment still being felt out per object, not a single fixed rule.
- The palette shifts with time of day (dawn/day/dusk/night), not a single static cozy theme.
- The companion blob (Phase 9C) stops being a decorative status indicator and becomes the actual persistent chatbot launcher — reachable from every page, not just Today.
- The numeric XP/"days engaged" indicator (`PLAN.md` §13) goes away entirely. Progress is shown ambiently (a room element that grows/brightens) instead of a number. The underlying `xp_events` ledger and its insertion logic are unchanged — this is a display-only swap.

## Room map (confirmed 2026-07-17)

Not every current nav destination becomes a doorway. Two structural changes precede the visual redesign:

- **Tasks loses its standalone page/doorway.** The universal Kanban (cross-area: recruiting/school/wellness/general — `PLAN.md` §5/§6) is not school-only, so it doesn't move wholesale into School. Instead: the Today hub keeps a small ambient task list/widget for general and urgent items (same role the current Today task list already plays), and the School room is where the fuller board/detail view for school-linked tasks lives. There is no separate `/tasks`-as-a-room; `/tasks` may still exist as a route reached from either surface.
- **Inbox loses its standalone page/doorway.** It becomes a small ambient object in the main Living Room scene — a journal on the bedside table — not a room you zoom into. Opening it can still route to the existing `/inbox` page/flow; it's the *presentation* that shrinks, not the capture pipeline.
- **Settings loses its standalone page/doorway.** It becomes a wall-mounted thermostat/control panel object in the main room, same ambient-object treatment as the journal, not a full room.

Full rooms (doorways with shared-element zoom transitions):

| Destination | Room theme |
|---|---|
| Wellness | Garden |
| Gmail | Mailbox |
| Recruiting | Office / desk |
| School | Study nook (absorbs the fuller task board/detail view) |

Ambient objects (live inside the Living Room scene itself, not separate rooms):

| Destination | Object |
|---|---|
| Inbox | Journal on the bedside table |
| Settings | Wall thermostat / control panel |
| General/urgent tasks | Small ambient list widget (Today hub, not a separate surface) |

Chat (companion blob) and top-bar chrome (bell, sign-out, email) are unchanged from the original plan below.

## Room map v2 (revised later on 2026-07-17 — supersedes parts of the map above)

After 9D-1 shipped with flat-colored-circle placeholders, Ishani's reaction was that it needed to look genuinely illustrated (Animal Crossing: New Horizons + Cozy Grove/Spiritfarer), not hand-coded SVG. Two changes came out of that conversation, on top of the room map above:

- **Art pipeline:** background art is AI-generated via a local ComfyUI (Stable Diffusion) install on Ishani's Mac — not hand-coded SVG, not a cloud API. Style: DreamShaper XL (SFW Lightning) + an Animal Crossing SDXL LoRA. Full install instructions, model download commands, and the working prompt/denoise recipe live in `~/tools/gyst-art-gen/SESSION_RECAP.md` **on that machine only** (it includes an API key, so it's intentionally not committed here — ask Ishani or read that file directly if continuing this work).
- **Navigation mechanic changed for three of the four full rooms.** Wellness (Garden), School (Nook), and Recruiting (Study Desk) are no longer reached by clicking a doorway that zooms in — they're reached by **sliding left/right** through a filmstrip, order: Garden — Living Room — Nook — Study Desk, via arrow buttons and drag/swipe. Implemented in commit `2a3f2bf` (`src/lib/room-sequence.ts`, `RouteTransition`, `RoomSlideArrows`) — routing/motion shell only, no art wired in yet.
  - **Gmail stays a small icon object inside the Living Room** (alongside Inbox/journal and Settings/thermostat), not a separate room — this was genuinely reconsidered mid-session (Ishani first treated it as a full room like the table above says, then confirmed it should just be a mailbox icon like journal/thermostat once asked directly). Table above is stale on this point.
  - **Resolved 2026-07-20:** the `RoomDoorway`/`RoomHeader` shared-element zoom (`layoutId`) is removed — nothing needed it now that Gmail/Inbox/Settings are icons and Wellness/School/Recruiting slide via the filmstrip. `RoomDoorway` and `RoomHeader` remain as plain (non-shared-element) illustrated-card/header components; `RoomHeader` is now a server component (dropped `"use client"`, no more `motion.div`).

Art status as of 2026-07-17: Living Room hub (4 day-period backgrounds) and the mailbox/journal/thermostat object icons are finished and committed (`public/rooms/`, commit `4b6a7d5`) but **not wired into any component**. Garden/Nook/Study Desk each have a locked base composition but still need their day-period relighting pass (~12 more images, ~60-65 min on Ishani's Mac) — queued but not run when the session ended.

## Open questions to resolve before/while building

- Exact palette values per day-period (dawn/day/dusk/night) — not yet specified beyond "warmer, gamier, Animal Crossing-ish."
- Exact hover mechanics per object type (expand vs. glow vs. lift/shadow) — not yet specified; likely varies by object rather than one universal rule.
- Whether the zoom transition is purely visual (CSS/Framer Motion `layoutId`) or needs real route-level data preloading to avoid a flash of unstyled content on landing.
- Whether the journal/thermostat ambient objects open as inline modals/panels or still navigate to their existing `/inbox` and `/settings` routes.
- Whether School's task view should be the same `/tasks` board pre-filtered to school, or a school-specific detail view — not yet decided.

---

## 9D-1 — Foundation: the big room + shared mechanics

**Goal:** ship the Living Room hub shell and every reusable interaction/visual mechanic a room needs, with placeholder dressing. No individual room gets its final theme yet — that's 9D-2 onward.

- [x] Add a day-period helper (dawn/day/dusk/night, derived from local time) and rework `globals.css` design tokens into an Animal-Crossing-style pastel palette with per-period variants. Replace, don't layer on top of, the Phase 1/9C token set.
- [x] Build a reusable room engine (`RoomDoorway` + `RoomHeader`). Originally used a Framer Motion shared-element (`layoutId`) "zoom" transition; removed 2026-07-20 as dead weight once Wellness/School/Recruiting moved to filmstrip sliding and Gmail/Inbox/Settings became plain icons — nothing landed on the shared element anymore. Navigation is now a plain route swap or filmstrip slide.
- [x] Build the shared hover/interaction mechanics for room objects (expand, glow, lift — whichever combination reads best) as a reusable primitive, not per-object one-offs. → `roomObjectMotionProps()` in `src/lib/motion.ts`.
- [x] Rebuild the Today page as the "Living Room" hub: existing widgets (capture, timeline) become scene objects; placeholder doorways for Gmail/Recruiting/School/Wellness (theming deferred to 9D-2..9D-5) replace the sidebar as primary navigation. Inbox (journal) and Settings (thermostat) become ambient objects in the same scene; a small ambient task list stays on the hub for general/urgent items.
- [x] Retire `SidebarNav`/`MobileNav` as primary chrome. Relocate the notification bell, sign-out, and email display to whatever chrome remains (likely a minimal top bar). → `TopBar`; `NAV_ITEMS`/`NavLink` deleted as dead weight.
- [x] Replace the numeric XP indicator with an ambient room-growth visual driven by the same `xp_events` data — no changes to `xp_events` schema or insertion logic, display layer only. → `XpGrowthVisual` (a little plant, `growthStage()` in `gamification.ts`).
- [x] Promote the companion blob (Phase 9C) to a persistent, global, clickable chat launcher on every page, replacing the current floating chat button. → `CompanionChatLauncher`; companion-state derivation moved from the Today page into the `(app)` layout so it's live everywhere, not just Today.

**Exit:** the sidebar and numeric XP are gone; the Today page is a working Living Room hub with all four doorways, both ambient objects, the ambient task list, the growth visual, and the global chat launcher functional — even before individual rooms get their final themed dressing; hover/zoom mechanics feel polished enough to reuse as-is for every room below. **Not yet verified in-browser** — auth-gated pages need Ishani's own session; she's checking visually herself (2026-07-17 call).

## 9D-2 — Wellness room: the garden

- [ ] Theme the Wellness destination as a garden using the mechanics/tokens from 9D-1 — no new interaction primitives, just dressing + content layout for that page.

## 9D-3 — Gmail room: the mailbox

- [ ] Theme the Gmail destination as a mailbox using the mechanics/tokens from 9D-1.

## 9D-4 — Recruiting room: the office

- [ ] Theme the Recruiting destination as an office/desk using the mechanics/tokens from 9D-1.

## 9D-5 — School room: the study nook

- [ ] Theme the School destination as a study nook using the mechanics/tokens from 9D-1, including how the fuller task board/detail view is presented there (see open questions).

## Exit criteria (whole phase)

> The sidebar and numeric XP are gone; navigating between sections feels like moving through a spatial room rather than switching dashboard tabs; the companion blob is reachable as the chat entry point from anywhere in the app; all four rooms (garden/mailbox/office/study nook) have their own themed dressing, not a shared generic skin.
