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

Art status as of 2026-07-20: all art is finished, generated, and wired in. The relighting pass for Garden/Nook/Study Desk ran to completion (12 images: `public/rooms/{garden,nook,studydesk}/{dawn,day,dusk,night}.png`), joining the already-finished Living Room hub set. `RoomBackground` (new component, `[data-room-bg-period]` rules in `globals.css`) renders the matching day-period image full-bleed behind the Today hub, Wellness, School, and Recruiting pages. The mailbox/journal/thermostat object icons are wired into `AmbientObject`, which now renders the real PNG (circle-cropped) instead of a Lucide icon on a flat accent-colored circle.

This pass also resolved the two items the previous session flagged as undecided:
- **Gmail moved from `ROOMS` to `AMBIENT_OBJECTS`** (mailbox icon, alongside Inbox/journal and Settings/thermostat) — matches the room-map v2 decision the code hadn't caught up to yet. Its page dropped `RoomHeader` for a plain `<h1>Gmail</h1>`, matching Inbox/Settings.
- **The Today hub's doorway grid for Wellness/School/Recruiting was removed entirely** — those three are only reached by sliding (`RoomSlideArrows`/drag), so a click grid duplicating that nav was dead weight. `RoomDoorway` had no remaining callers and was deleted.

Not yet done: the companion character redesign; and per-room dressing/content-layout polish (9D-2..9D-5 still open below) now that each room has its background. **Resolved 2026-07-20 (room map v4 below):** alpha-transparent cutouts for the three object icons — no longer circle-cropped from plain backgrounds.

## Room map v3 — strip the dashboard chrome, lean on the art (2026-07-20)

Wiring the finished art in behind the *existing* Phase 1/9C dashboard markup (flat `bg-card` boxes, a header bar, icon-in-circle badges) still read as "a SaaS dashboard with wallpaper," not a cozy-game room, once Ishani actually looked at it. Same session, immediate follow-up pass:

- **Top bar removed entirely.** `TopBar` → `FloatingChrome` (`src/components/nav/floating-chrome.tsx`): the same home link/notification bell/email/sign-out, but as small floating backdrop-blur pills (top-left, top-right) instead of a header strip, so every page gets the full viewport instead of losing a bar's worth of height. `top-bar.tsx` deleted.
- **`RoomHeader` dropped its icon-in-circle badge** — now just title/description text; `icon`/`accent` removed from `RoomDefinition` (`src/lib/rooms.ts`) since nothing needed them once `RoomDoorway` was already gone.
- **New `RoomContentPanel`** (`src/components/room/room-content-panel.tsx`) — a single frosted-glass (`bg-card/75 backdrop-blur-xl`) panel that scrolls internally, replacing per-page stacks of `bg-card` sections. Wellness/School/Recruiting/Gmail/Inbox/Settings each became `<main className="h-screen ...">` + `<RoomBackground>` + one `<RoomContentPanel>` wrapping that page's *existing* content unchanged — the page itself never scrolls, only the panel does if its content is tall. Gmail/Inbox/Settings reuse the Living Room background (they're objects inside that room, not separate rooms) since they have no dedicated art of their own.
- **Living Room hub reworked into a pure spatial scene**: `<main>` is `h-screen overflow-hidden`; the `CaptureForm` card is gone entirely (redundant — `/inbox` already renders it, so "capture" now just lives behind the journal icon); `AmbientObject` (`src/components/room/ambient-object.tsx`) dropped its card/circle wrapper for a big (~112-144px) chrome-less floating `<img>` positioned directly over the scene, glowing via a new `floatingObjectMotionProps()` (`src/lib/motion.ts`, drop-shadow filter instead of box-shadow) on hover instead of lifting a box. Mailbox/journal/thermostat coordinates are a first pass, picked by eye against the art — expect nudging once seen live. `CompanionChatLauncher` is now pathname-aware (`usePathname()`): on `/` it sits on the couch (absolute % position) instead of its usual fixed bottom-right spot everywhere else. Everything else that was stacked on the page (timeline, due-today/overdue, time-block suggestions, top outcomes, check-in, weekly goals, the Today/Week toggle, overwhelm mode) now lives in one `RoomContentPanel` docked to the right side, instead of six separate sections.
- **Fonts**: Geist Sans replaced by **Fredoka** (`--font-heading`) for titles/card headers and **Quicksand** (`--font-sans`) for body/UI text — both `next/font/google`, rounded/cozy rather than SaaS-neutral. Geist Mono left alone (`--font-mono`, one real usage in `cycle-import-card.tsx`).
- **Colors**: all four `[data-day-period]` blocks in `globals.css` retuned toward warmer, higher-chroma "storybook" hues (richer greens/oranges/blues, warmer cream/card backgrounds) instead of the muted Phase 1 pastels — same variable names/structure, so no component changes needed.

Known limitation carried forward, not fixed this pass: the object icons still aren't alpha-transparent, so a faint white/plain edge is visible around each floating PNG — the "no background" look is closer but not exact until a real cutout pass happens (see "Not yet done" above). Not verified in-browser past `/login` (which sits outside the `(app)` layout) — every other page is auth-gated behind `ALLOWED_USER_EMAIL`, so Ishani needs to check them herself.

## Room map v4 — real cutouts, a chrome-less companion, journal-as-popup (2026-07-20, same day)

Ishani looked at v3 live and pushed back on three things immediately: the object icons still didn't read as "no background," the companion still had a floating card behind it, and most of the docked side panel on the hub didn't need to exist there.

- **Object icons are now genuinely alpha-transparent.** Rather than wait on a ComfyUI background-removal model (not installed) or hand this back to Ishani, background removal was done locally with a small one-off Python/Pillow script (BFS flood-fill from the image corners, following local pixel-to-pixel color continuity rather than a single global color threshold — needed because the source backgrounds are soft vignette gradients, not flat white; a naive global-threshold cutout left a visible ring). Applied to `public/rooms/objects/{journal,mailbox,thermostat}.png` in place — same filenames, now `RGBA`. Mailbox and journal came out clean; thermostat has a faint partial ring artifact around its wooden bezel (the wood's specular highlight is close enough to the background color that a more aggressive tolerance started eating the ring itself) — acceptable for now, flagged as a possible future re-generation candidate rather than re-attempted with more image-processing time.
- **Companion blob has zero chrome now.** `CompanionChatLauncher`'s trigger was a `Button` with `bg-card/90 shadow-cozy ... backdrop-blur` (a pill behind the blob) — replaced with a bare, unstyled `<button>` (just position + `cursor-pointer`), so only the blob itself is visible. `CompanionBlob` gained a `showLabel` prop (default `true`, only caller passing `false` is the launcher) to drop its little state-caption text underneath too — "just a big blob, that's it."
- **Journal is now a popup, not a route.** New `JournalPopup` (`src/components/room/journal-popup.tsx`) wraps the existing base-ui `Dialog` (already ships a zoom+fade in/out transition — no new animation code needed for the "fizzles in and out" ask) around the journal `AmbientObject`; clicking it opens the popup in place on the hub instead of navigating to `/inbox`. `AmbientObject` now accepts `onClick` as an alternative to `href` for exactly this. The hub's old docked `RoomContentPanel` (timeline, overdue/due-today, time-block suggestions, top outcomes, check-in, weekly goals, the Today/Week toggle, overwhelm mode) is gone — all of that content, plus `CaptureForm`, now lives inside the journal popup instead, since the Today page already fetches everything it needs (no new queries). A small "View full inbox" link inside the popup still routes to `/inbox` for the raw capture-triage list, which isn't duplicated into the popup.
- **Mailbox and thermostat still navigate** (to `/gmail` and `/settings`) rather than becoming true in-place popups like the journal — those two pages have substantial server-fetched integration content (OAuth status, decrypted email items, drafts, calendar lists) that would need real restructuring (e.g. extracting each page's content into a function the hub could also call, or Next.js intercepting routes) to embed without duplicating data-fetching. Deferred rather than attempted under time pressure; what *did* ship for these two: `RouteTransition`'s non-sequence branch changed from a flat fade to a zoom-in/zoom-out "pop" (`SPRINGS.snappy`, scale 0.94→1 on enter), so navigating from the hub at least feels like something opened rather than a plain page swap. Converting these two into true popups (matching the journal exactly) is a reasonable next step if it still bothers Ishani once seen live.

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
- [x] Rebuild the Today page as the "Living Room" hub: existing widgets (capture, timeline) become scene objects. Originally had placeholder doorways for Gmail/Recruiting/School/Wellness replacing the sidebar as primary navigation; superseded 2026-07-17/2026-07-20 by the sliding filmstrip for Recruiting/School/Wellness (doorway grid removed as dead weight) and Gmail/Inbox (journal)/Settings (thermostat) as ambient objects in the scene; a small ambient task list stays on the hub for general/urgent items.
- [x] Retire `SidebarNav`/`MobileNav` as primary chrome. Relocate the notification bell, sign-out, and email display to whatever chrome remains. → originally `TopBar` (a header strip); replaced 2026-07-20 by `FloatingChrome` (floating pills, no bar) once a header strip itself started reading as leftover dashboard chrome — see "Room map v3" above. `NAV_ITEMS`/`NavLink` deleted as dead weight.
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
