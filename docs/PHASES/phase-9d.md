# Phase 9D — Spatial living-room redesign (planned, not started)

Goal: replace the dashboard-with-sidebar shell (Phase 1/9C) with a literal spatial "room" you click into — Animal Crossing / Club Penguin cozy-game feel, not a SaaS dashboard. Source: `PLAN.md` §Phase 9D, §13.

Split into sub-phases (2026-07-17) so each session ships one coherent slice: the shared foundation first (hub shell + all interaction mechanics), then one sub-phase per room. Do not start a room sub-phase before 9D-1's exit criteria pass — every room reuses `RoomDoorway`/`RoomHeader` and the hover/glow mechanics built there.

**Order decided 2026-07-21:** do `docs/PHASES/phase-11.md` (automations reliability) first — it's a silent correctness gap, not polish. Then 9D-2/9D-4/9D-5 (the three remaining room-visual passes below). Companion redesign is now its own sub-phase, 9D-6, and goes last.

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
- **All three ambient objects are draggable, position persisted per device.** `AmbientObject` (`src/components/room/ambient-object.tsx`) now has a `drag` motion value on top of its CSS rest position (the `className` position stays the base/fallback), and saves the drag offset to `localStorage` (`gyst:room-object-drag:<id>`) on drop, restored on mount — a per-device UI preference, not worth a DB migration for one user. A `draggedRef` guard swallows the click Framer/the browser would otherwise fire right after a real drag, so dropping the journal doesn't also pop its dialog open, and dropping mailbox/thermostat doesn't also navigate.

## Room map v5 — greeting becomes a popup too, companion is draggable, day/night typography (2026-07-20, same day)

- **The drag-and-persist mechanic moved into a shared hook**, `useDraggablePosition` (`src/lib/use-draggable-position.ts`) — `AmbientObject` and `CompanionChatLauncher` both use it now rather than duplicating the same Framer `x`/`y` + `localStorage` + click-guard logic. `CompanionChatLauncher`'s couch/bottom-right anchor is a plain-CSS outer `<div>`; the inner draggable `<motion.button>` owns Framer's drag transform — kept on separate elements so the CSS anchor's `translate(-50%,-50%)` and Framer's drag transform don't fight over the same element's `transform` property.
- **The greeting is now a popup, matching the journal.** New `PlannerPopup` (`src/components/room/planner-popup.tsx`) wraps the greeting in the same floating-pill/backdrop-blur treatment as `FloatingChrome`'s pills, with `font-heading` (previously plain body font). Clicking it opens the timeline/overdue/due-today/time-block-suggestions/weekly-goals/overwhelm-mode/Today-Week-toggle content that used to sit in the journal popup (moved from `JournalPopup`, which keeps just capture/check-in/top-outcomes — reflection stuff — vs. the planner's schedule/task stuff). Both popups' near-identical `DialogContent` shape got pulled into a shared `RoomPopupContent` (`src/components/room/room-popup-content.tsx`).
- **The greeting text is now cheeky and time-of-day-based** — `getGreetingPhrase`/`greetingPhraseFromHour` (`src/lib/greeting.ts`, new, own hour buckets, deliberately separate from `DayPeriod`'s 4 broad art/palette buckets since "good morning" needs finer granularity than "day" 8am-5pm covers) picks "Still up?" / "Up early?" / "Good morning" / "Good afternoon" / "Good evening" by local hour. Rendered by a small client `Greeting` component (`src/components/today/greeting.tsx`) that corrects itself against the real device clock on mount, same accepted-tradeoff pattern as `DayPeriodProvider`. The display name itself got a light cleanup too (`firstNameFromEmail` in `page.tsx`) — `ishani.s.sood@...` now shows "Ishani", not the raw local-part.
- **Night gets a moodier heading font.** New `Playfair Display` (`next/font/google`, `--font-playfair-display`) swapped in for `.font-heading` only at night, via `[data-day-period="night"] .font-heading { font-family: var(--font-playfair-display), ...; }` in `globals.css`. This targets the class directly rather than overriding the `--font-heading` theme variable — confirmed by inspecting the compiled CSS that Tailwind v4's `@theme inline` inlines `--font-heading`'s value straight into the generated `.font-heading` rule at build time (referencing `--font-fredoka` directly), so overriding `--font-heading` itself at any cascade layer would do nothing. Verified live (forcing `data-day-period="night"` via Playwright against `/login`, which has a `.font-heading` element via the login card's title) that the swap actually takes effect. Applies to every `.font-heading` element app-wide (Card/Dialog/Sheet titles, the greeting), not just the greeting specifically.

## Room map v6 — mailbox and thermostat become popups too (2026-07-20, same day)

Ishani confirmed she wanted the deferred item from room map v4: mailbox and thermostat should open in place, "like the good morning ishani thing," instead of navigating to `/gmail`/`/settings`.

- **`/gmail` and `/settings` split into a content component + a thin route wrapper.** New `GmailContent`/`SettingsContent` (`src/app/(app)/gmail/gmail-content.tsx`, `src/app/(app)/settings/settings-content.tsx`) hold the actual data-fetching and markup; each route's `page.tsx` is now just `<main><RoomBackground/><RoomContentPanel><XContent/></RoomContentPanel></main>` — a non-async wrapper, since React/Next.js happily awaits an async Server Component rendered as JSX (`<GmailContent />`) even from a sync parent. This split means the Today page can render the exact same content inside a popup without duplicating any of the Supabase queries or decrypt/integration logic.
- **`JournalPopup` generalized into `AmbientObjectPopup`** (`src/components/room/ambient-object-popup.tsx`, replacing `journal-popup.tsx`) — takes `id`/`label`/`title`/`image`/`accent` instead of being journal-specific, since mailbox/thermostat need the identical Dialog+`AmbientObject`+`RoomPopupContent` shape. The Today page now renders `<GmailContent />` and `<SettingsContent />` as the popup's `children`, meaning Today's server render now also runs Gmail's and Settings' queries (OAuth status, decrypted email items, drafts, calendar list, schedules, notification prefs, chat token usage) in addition to its own — a heavier single page load, but the project is explicitly single-user/low-scale (`CLAUDE.md`), so this tradeoff is fine.
- `/gmail` and `/settings` still exist as standalone routes (unchanged, same content) for direct navigation/deep-linking — only the *hub's* click behavior changed from navigate to popup.

## Room map v7 — "liquid glass" panels (2026-07-20, same day)

Ishani wanted the Wellness/School/Recruiting panels (and "the other" — Gmail/Settings/Inbox/the popups, same surface) to read as an Apple-style shiny, translucent, saturated glass material rather than the flatter `bg-card/75 backdrop-blur-xl` look from room map v3.

- New `.room-glass` class in `globals.css`, replacing the ad hoc `bg-card/75 ring-foreground/10 shadow-cozy backdrop-blur-xl` classes on both `RoomContentPanel` and `RoomPopupContent`/`DialogContent` — so a page and its matching hub popup (Gmail, Settings) still look identical. Layers: `backdrop-filter: blur(28px) saturate(2.1)` (the saturation boost is what makes the room art behind it read as vivid/HD rather than muddy — the actual "vibrancy" Apple's real material does), a `color-mix()`-based translucent tint using the existing `--card` token (so it still themes per day-period automatically), a diagonal glass-sheen `::before` pseudo-element blended with `mix-blend-mode: overlay`, and three stacked shadows (inset top highlight = the glass edge catching light, inset bottom shadow = curvature/depth, outer drop shadow = elevation off the room art).
- Plain rule, outside any `@layer` — same reasoning as the night-font rule above: Tailwind's own utilities live inside a cascade layer, and unlayered rules always win regardless of source order or specificity, so `.room-glass` reliably beats leftover `bg-popover`/`bg-card` utility classes on callers without needing `!important`.
- Hit one real bug getting here: `backdrop-filter` (unprefixed) was silently disappearing from the compiled CSS — inspecting the actual build output (not just trusting the source) showed only `-webkit-backdrop-filter` survived when the unprefixed property was written *before* the prefixed one; swapping the order (prefixed first, standard second — the conventional order) fixed it. Verified live via Playwright (composited a `.room-glass` div over the actual Garden background PNG and screenshotted it) rather than assuming the CSS was right.

## Room map v8 — no more flat-color loading flash (2026-07-20, same day)

Ishani noticed a "yellow screen" flash switching between rooms. Root cause: `src/app/(app)/loading.tsx` (pre-9D — plain gray `Skeleton` bars on a bare `<main>`, no `RoomBackground`) is Next.js's automatic `<Suspense>` fallback shown the instant a route's async Server Component starts fetching, and it applied to every `(app)` route without its own more specific `loading.tsx` (none existed). With `--background` now a warm cream/yellow for the day period (room map v3's retheme), that bare fallback read as a jarring flat-yellow flash mid-navigation — exactly the "internal vs external" split Ishani asked for (data fetching should stay invisible; something else should show instead) was already the *intent* of `loading.tsx`, just not room-aware.

- New `RoomLoading` (`src/components/room/room-loading.tsx`) — the room's own `RoomBackground` plus a pulsing `Skeleton`-filled `RoomContentPanel` (so it's already wearing the liquid-glass look from room map v7), instead of a flat color.
- `wellness/loading.tsx`, `school/loading.tsx`, `recruiting/loading.tsx` each render `RoomLoading` with their own `ROOMS.*.background`; the root `(app)/loading.tsx` renders it with `"living-room"` as the fallback for everything else (Gmail/Inbox/Settings, which already use the Living Room background themselves, plus anything without its own `loading.tsx`).

Ishani reported the flash was still there after this. The `loading.tsx` fix was real but incomplete — the deeper bug was in `RouteTransition` itself: its `AnimatePresence` used `mode="wait"`, which fully unmounts the exiting page before mounting the next one. For the slide transition that defeats the entire point (the two rooms can't actually slide past each other if only one is ever mounted at a time), and worse, it leaves a genuine gap — nothing rendered at all — between the exit animation finishing and the next page committing, long enough to show the bare page background straight through. Fixed by dropping `mode="wait"` (default/sync mode overlaps exit and enter) and giving both the exiting and entering `motion.div` `absolute top-0 left-0 w-full` inside a new `relative` wrapper, so they stack on the same spot instead of both occupying normal document flow — the screen is always covered by one or both layers, never nothing.

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

- [x] Theme the Wellness destination as a garden using the mechanics/tokens from 9D-1 — no new interaction primitives, just dressing + content layout for that page.

**Done 2026-07-21.** Decided with Ishani up front (asked before starting, per her request): split the single centered panel into two smaller `RoomContentPanel`s placed left/right so the greenhouse's bench-and-rug centerpiece stays visible instead of being covered; today's check-in + weekly trends stay always-visible in the left panel (the "star"), while history/health-metrics/cycle-tracking/data-controls collapse behind native `<details>` in a right "More" panel; added a new ambient growth visual — `GrowthPlant` (`src/components/room/growth-plant.tsx`, extracted from the hub's `XpGrowthVisual` so both share the animation code), a small potted plant fed by `checkInDaysThisWeek`/`wellnessGrowthStage` (`src/lib/wellness.ts`) rather than XP, since wellness check-ins don't feed `xp_events` — sitting in the open floor gap between the bench and rug. Caught and fixed two real bugs via actual Playwright screenshots against the running dev server (not just code review): the bare growth-plant SVG was nearly invisible at low stages against the busy art (fixed by adding an optional terracotta-pot backing, `pot` prop, so it reads as an object even at stage 0), and its leaves render in `--chart-2` which is blue, not green — invisible at the hub's tiny inline scale, obvious once rendered 3x bigger standalone (fixed via a new `leafColor` prop, default unchanged for the hub, `--chart-1` — an existing green token — for Wellness). Also fixed a mobile-only regression the new layout introduced: the top panel's `top-4` collided with `FloatingChrome`'s fixed top-left/top-right pills; moved to `top-16` on mobile only.

**Decided as the shared template** (Ishani, 2026-07-21) for 9D-4/9D-5: split-panel layout with one "star" panel always visible and secondary content collapsed behind `<details>`, unless Recruiting/School's content clearly needs something different.

## 9D-3 — Gmail room: the mailbox

- [ ] Theme the Gmail destination as a mailbox using the mechanics/tokens from 9D-1.

## 9D-4 — Recruiting room: the office

- [x] Theme the Recruiting destination as an office/desk using the mechanics/tokens from 9D-1.

**Done 2026-07-21**, bundled with a substantial functional expansion Ishani asked for in the same pass ("let's do the refactor for recruiting... a tracking dashboard, yada yada super functional shit") — asked clarifying questions first (scope: Recruiting only this session; functionality and visual theming together, not staged), same as 9D-2.

Layout: same split-panel/collapse template as Wellness, sized up for Recruiting's much larger content — a left "Now" panel (add-opportunity form, `DeadlineTimeline`, `AnalyticsSection`) always visible over the office desk/chair/rug, a right "More" panel (Discovery queue, Pipeline board/table, Documents, Contacts, Sources & capture) collapsed behind `<details>` over the dresser.

**New functionality, not just dressing:**
- `DeadlineTimeline` (`src/lib/recruiting-timeline.ts` + `src/components/recruiting/deadline-timeline.tsx`) replaces the old separate `ClosingSoon`/`FollowUpsDue` text-list cards — one date-sorted timeline merging opportunity deadlines and application next-actions, since both were really the same "what's coming up" question asked twice.
- `isGhosted`/`GHOSTED_THRESHOLD_DAYS` (`src/lib/recruiting-analytics.ts`) — an application sitting in `applied` with no stage movement for 60+ days. Surfaced as a dashboard count and a per-row badge in the table.
- Weekly application goal (`recruiting_preferences.weekly_application_goal`, same jsonb column as `target_grad_year`, no migration) + `computeWeeklyGoalProgress` + `WeeklyGoalMeter` — counts distinct applications that reached `applied` this week via `application_events`, not `created_at` (an opportunity can sit `saved` for weeks before actually being submitted).
- `ApplicationTable` gained a direct link-to-posting column and the ghosted badge — the "general overview" ask (role/company/link/stage in one place). Scoped to the table only, not the Kanban board (which already had a posting link on its cards and is a different, already-visual working surface).

**Dashboard visuals, per the dataviz skill:** ran the skill properly (`choosing-a-form.md`/`color-formula.md`) rather than eyeballing colors. Findings:
- The stage funnel is ordinal (position in a sequence), not categorical — kept one hue with a lightness step per stage rather than a rainbow.
- Weekly goal progress is "a single ratio against a limit," i.e. a Meter, not a chart — `WeeklyGoalMeter`, fill colored by pace (on-track vs behind), not a gauge/pie.
- Source-effectiveness and role-family-conversion (`GroupEffectivenessChart`, new, shared by both) are genuine 3-series comparisons (saved/applied+/offers per nominal category) — ran `scripts/validate_palette.js` from the dataviz skill against this app's real `--chart-1..5` oklch tokens (converted to hex via a canvas pixel readback, since Chromium preserves `oklch()` in `getComputedStyle` rather than resolving it). **Found a real, pre-existing gap**: the tokens fail the six-checks validator in both modes — light mode's chart-3 fails contrast (1.95:1) on its own; night mode fails outright, every one of the 5 hues sits above the dark-mode lightness band. Worked around it for this feature by using the one 3-slot subset that validates clean in light mode (chart-1/chart-2/chart-5, always with direct value labels — mandatory secondary encoding for its WARN-band adjacent pairs) and flagging night mode's categorical palette as a real follow-up, not fixed here — redesigning it is a bigger, separate task than "add a recruiting dashboard."
- Deadline/timeline is a sorted list with status-colored markers, not a formal chart — the skill's own guidance ("sometimes the right form is not a chart") for a handful of dated items.

Visually verified against the running dev server via Playwright, same pattern as Wellness — including seeding temporary test data (companies/opportunities/applications/events) directly in the (otherwise completely empty — 0 real applications exist yet) live dev database to actually see the dashboard/timeline/ghosted-badge render with real values, then deleting all of it afterward via the service-role client, confirmed back to 0 applications. Caught and fixed one real layout bug this way: the two comparison charts used a `sm:grid-cols-2` grid, which responds to *viewport* width, not the ~400px panel's actual width — wrapped awkwardly at desktop sizes; changed to always-stacked.

### Same-day follow-up: the "More" panel became an expand-left tab rail, Pipeline became a big searchable table

Ishani's next ask, same session: "for the 'more' when i click on it it should expand to the left and then close if i click off of it... like the individual ones" plus "recruiting should be like a big table that should be able to expand and then search through and then shows some key data points on the top." Asked clarifying questions first (which sections get the behavior, how big the table gets, what the top-of-table stats are) before building, per her preference.

- **`RoomSideTabs`** (`src/components/room/room-side-tabs.tsx`, new, desktop-only) replaces the static "More" `RoomContentPanel` + `<details>` accordion — a persistent narrow tab rail docked at the right edge (Discovery queue / Pipeline / Documents / Contacts / Sources & capture, all five behaving identically per Ishani's answer). Clicking a tab grows its content pane to the left of the rail (a `w-0 → w-[width]` transition, `overflow-hidden`); a `pointerdown` listener on the outer container closes it when the click lands outside. Only one tab open at a time. Per-tab `width` override lets Pipeline get a much wider pane than the others.
- **`PipelineTabContent`** (`src/components/recruiting/pipeline-tab-content.tsx`, new) — Pipeline's expanded content: stat-tile badges across the top (total applications, a badge per stage that has any, ghosted count — Ishani's answer was simple counts, not the full dashboard), a search box (client-side substring match on role title/company name, applied before rendering), then the existing `ApplicationsView` (board/table toggle, unchanged) underneath. Sized to `w-[min(820px,80vw)]` — "wide panel, still anchored to the right side," not a full-screen takeover, per her answer.
- **Mobile has no fallback for the rail mechanic** (no room for a rail + an 820px flyout below the `md` breakpoint) — the old static "More" panel + `<details>` accordion is kept as a `md:hidden` block alongside the new `hidden md:flex` tab rail, so nothing regressed on mobile.
- Deliberately **not** applied to Wellness's "More" panel in this pass — Ishani separately said Wellness's own changes wait for a later session; `RoomSideTabs` is written generically enough that applying the same rail there later is a small, mostly copy-paste change, not a redesign.
- Verified live via Playwright: collapsed rail, Discovery queue expanding, Pipeline expanding (search box + "0 total" stat tile, since the dev database has no real applications), and a deliberate click on the empty room area confirming the panel actually closes. No console errors.

## 9D-5 — School room: the study nook

- [ ] Theme the School destination as a study nook using the mechanics/tokens from 9D-1, including how the fuller task board/detail view is presented there (see open questions).

## 9D-6 — Companion character redesign and per-room presence

**Goal:** the companion's *state logic* (Phase 9C) is done and stays as-is — this is display-layer only. Two problems to fix:

- [ ] Replace `CompanionBlob`'s hand-coded SVG with art that actually matches the illustrated Animal-Crossing-style room art (garden/nook/study-desk/living-room PNGs) instead of reading as a vector shape dropped onto a photo-real background. Likely the same ComfyUI pipeline used for the room backgrounds/object cutouts (see room map v2/v4 above for that pipeline's location and prior art), producing a small sprite sheet or per-state PNG set rather than one SVG with swapped face paths.
- [ ] Give the companion a real position and behavior on Wellness/Recruiting/School, not the generic fixed-bottom-right `CompanionChatLauncher` spot it currently falls back to outside the hub (`src/components/chat/companion-chat-launcher.tsx`, pathname-aware only for `/` today). Each room should place it somewhere that makes sense in that scene (e.g. on the garden path, on the study desk), the same way the hub places it on the couch.

**Exit:** the companion reads as part of the illustrated world in every room, not a leftover UI blob; its position and idle behavior vary sensibly per room the way its couch placement already does on the hub.

## Exit criteria (whole phase)

> The sidebar and numeric XP are gone; navigating between sections feels like moving through a spatial room rather than switching dashboard tabs; the companion blob is reachable as the chat entry point from anywhere in the app and visually belongs in every room; all four rooms (garden/mailbox/office/study nook) have their own themed dressing, not a shared generic skin.
