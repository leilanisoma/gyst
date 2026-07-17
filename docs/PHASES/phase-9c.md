# Phase 9C — Cozy visual identity, motion, and companion character

Goal: give the app its own emotional identity — satisfying interactions and a companion that reflects what you're actually doing. Source: `PLAN.md` §Phase 9C, §13.

## Checklist

- [x] Build a shared motion/animation utility layer (easing curves, spring configs, durations) reused across the app.
- [x] Add satisfying hover/press micro-interactions to core primitives (buttons, task cards, capture field) - expand/scale/spring on hover.
- [x] Smooth page and loading transitions (route changes, skeleton states) instead of abrupt swaps.
- [x] Finalize/refine the color palette and cozy design tokens established in Phase 1.
- [x] Reframe the Today dashboard with a "living room" spatial metaphor (zones for capture, tasks, and the companion).
- [x] Design and build the companion blob: base shape and face, idle animation, and a small set of expressive states.
- [x] Wire the companion's state to real activity signals already available by this point (calendar events, task area, application stage) - fencing/studying/recruiting/resting - no manual status-setting required.
- [x] Keep gamification "cozy progress" per PLAN.md §13: cosmetic-only companion reactions, no streaks, no loss aversion.

## What's built

- **Motion vocabulary** (`src/lib/motion.ts` + `--motion-*`/`--shadow-cozy` custom properties in `globals.css`): shared durations, easings, and spring presets. CSS variables drive plain Tailwind transitions (buttons, cards, capture field); the numeric constants drive `motion/react` (companion, route transitions). The two are kept in sync by hand — there's a comment at each end pointing to the other.
- **Micro-interactions**: `Button` and `TaskCard` scale up slightly on hover and down on press (`hover:scale-[1.0x]` / `active:scale-[0.9x]`), using the shared timing tokens. The capture textarea gets a subtle `focus-within` lift instead, since a text field scaling under the cursor while typing would be distracting.
- **Route transitions**: `src/components/nav/route-transition.tsx` wraps `AppShell`'s content in a `motion/react` `AnimatePresence` keyed on `usePathname()`, fading/lifting each route in instead of an abrupt swap.
- **Loading skeleton**: `src/app/(app)/loading.tsx` (generic — Next's App Router Suspense boundary means one `loading.tsx` at this segment covers first-load skeletons for every authenticated route).
- **Companion state** (`src/lib/companion.ts`, deterministic, unit-tested): maps real signals — an active fencing/class recurring schedule or synced calendar event, in-progress task areas, today's check-in energy, and recruiting next-actions due/overdue — to one of six states (`fencing`, `studying`, `recruiting`, `resting`, `focused`, `idle`), in that priority order. No manual status-setting, no AI call.
- **Companion blob** (`src/components/companion/companion-blob.tsx`): an SVG blob with a face (eyes/mouth vary by state) and a small `lucide-react` accessory icon, gently bobbing at idle and popping to a new expression via spring when state changes. Colors reuse existing chart/primary/secondary tokens — no new hexes.
- **Today "living room" layout**: the companion and capture form now sit in their own zone (`src/app/(app)/page.tsx`), alongside the main planning column — side-by-side on `lg+`, with the companion appearing first on mobile (`order-first`/`order-last`) so it's present without pushing the day's content down.

## Notes

- Google-synced calendar events don't carry a structured category (only `kind: "fixed" | "flexible"`); fencing/class detection for synced events falls back to a title regex (`/fenc/i`, `/class|lecture|exam|.../i`) plus `course_id` presence for Canvas-linked items. Manually entered recurring schedules already have a real `category` column and are checked first.
- The companion only reads `check_ins` (the capacity check-in already surfaced on Today), not `wellness_check_ins`/`health_daily_summaries` — those stay excluded from anything outside the Wellness page per `docs/DATA_CLASSIFICATION.md`, and the companion's rendered state never reaches chat/AI context.
- Visually verified in a real browser (dev server + a scripted authenticated session): the living-room layout, companion states, hover/press micro-interactions, and route transitions all render correctly with no console errors, on both a 1280px desktop width and a 390px mobile width.

## Exit criteria

> Hovering or interacting with core UI feels satisfying and intentional, and the Today screen's companion visibly reflects your actual current context without manual input.
