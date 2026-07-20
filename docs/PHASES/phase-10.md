# Phase 10 — Polish and reliability (ongoing)

Source: `PLAN.md` §15, Phase 10. Unlike the numbered feature phases, this
one has no fixed exit criteria — it's a running log of reliability/polish
work as it happens, one dated session entry per pass. Reference the linked
decision docs for full rationale; this file just indexes what changed and
where.

## Session — 2026-07-20: production hardening and auth rebuild

Mostly reactive: took the first real production deploy and a live OAuth
walkthrough, and fixed everything that broke along the way.

### Google Calendar/Gmail token refresh no longer crashes the app

`refreshGoogleAccessToken`/the Gmail equivalent throwing on a bad refresh
(e.g. revoked grant) was uncaught, taking down the Settings page and the
sync routes. `runGoogleSync` (`src/lib/google/sync.ts`) and `runGmailSync`
(`src/lib/gmail/sync.ts`) now wrap the token fetch in try/catch and degrade
to `markGoogleError`/`markGmailError` + a clean `{ ok: false, error }`
instead of throwing. `settings-content.tsx` merged its token-fetch and
calendar-list-fetch into one guarded try/catch (previously only the list
call was guarded). `gmail/actions.ts`'s `pushGmailDraft` got the same
fix — token fetch moved inside the existing try block.

### OAuth account picker forced open

Gmail and Calendar use two separate Google OAuth clients by design
(different accounts: `ishanigyst@gmail.com` for Gmail,
`ishani.s.sood@gmail.com` for Calendar). Browser session state was
silently reusing whichever Google account was already logged in, making
it look like the wrong account was connected. Fixed by changing `prompt`
from `"consent"` to `"consent select_account"` in `src/lib/google/oauth.ts`
and `src/lib/gmail/oauth.ts`, forcing the account chooser every connect.

### Room popup positioning + scrollbar

Ambient-object popups (mailbox/journal/thermostat) were opening far down
the page with a visible "yellow flash" en route to centered. Root cause:
`.room-glass { position: relative; }` in `globals.css` was an *unlayered*
rule, which beats a Tailwind utility class (`.fixed` on `DialogContent`)
emitted inside `@layer` regardless of specificity — a CSS cascade-layers
gotcha, not a component bug. Removed that one declaration (the dialog
already gets its own `relative` independently). Also hid the visible
scrollbar track/thumb (`scrollbar-width: none` + `::-webkit-scrollbar {
display: none }` on `html` and `.room-glass`) while leaving scroll
functionality intact, and bumped `.room-glass`'s background opacity
45%→72% for readability.

### Settings page layout and readability

Removed seven `max-w-sm` constraints that were collapsing the glass panel
to a fraction of its available space, and bumped text sizes (`h1` →
`text-3xl`, section headers → `text-lg font-semibold`, body text →
`text-base`).

### Groq wired in for Gmail extraction only

See `docs/DECISIONS/0003-groq-for-gmail-extraction.md`. Chat/inbox/syllabus
extraction stay on Gemini; only `extractGmailMessage`
(`src/lib/gmail/extract.ts`) now runs through a dedicated
`getGmailAIClient()` (`src/ai/index.ts`), which prefers Groq
(`openai/gpt-oss-120b`, `src/ai/providers/groq.ts`) when `GROQ_API_KEY` is
set and falls back to Gemini otherwise.

### First production deploy

Deployed to Vercel (`ishanigyst.vercel.app`, after two domain-name changes
mid-session). Fixed along the way:

- **Missing env vars.** The Vercel project had zero environment variables
  configured — nothing carries over from `.env.local` automatically.
  Added the full set via the dashboard (Settings → Environment
  Variables → Production).
- **`NEXT_PUBLIC_APP_URL` / redirect URIs pointed at localhost.** These are
  baked into the build at build time — editing the env var alone doesn't
  fix an already-built deployment; requires a fresh deploy. Updated
  `NEXT_PUBLIC_APP_URL`, `GOOGLE_REDIRECT_URI`, `GMAIL_REDIRECT_URI` to the
  live domain, and added matching entries in Google Cloud Console
  (Credentials → each OAuth client → Authorized redirect URIs).
- **Vercel Hobby plan can't run the automations this app will eventually
  need** (2 cron jobs max, daily-only). Not resolved this session — see
  "Not done" below.

### Login rebuilt as password auth, replacing magic-link/OTP

See `docs/DECISIONS/0004-password-auth-for-login.md` for the full chain of
failures (email link prefetching burning single-use tokens, Supabase's
default mailer rate limit, a Resend sandbox sender/account mismatch, and
Supabase routing the same call through two different, independently-edited
email templates). Replaced entirely with
`supabase.auth.signInWithPassword` (`src/app/login/actions.ts`,
`src/app/login/login-card.tsx`); the password was set directly on the
existing Supabase auth user via the admin API, no email involved. Custom
SMTP (Resend) is still configured on the Supabase project for any other
Supabase-triggered email, but nothing in login depends on it anymore.
`/auth/callback` (PKCE code exchange) is now dead code, left in place.

### Docs updated

- `docs/ARCHITECTURE.md` — Auth row and the `login/`/`auth/callback/` file
  comments now describe password sign-in instead of magic link.
- `docs/DECISIONS/0003-groq-for-gmail-extraction.md` (new this session).
- `docs/DECISIONS/0004-password-auth-for-login.md` (new this session).

### Not done / carried forward

- **Scheduling beyond Vercel's cron limits.** Discussed moving to
  Supabase `pg_cron`/`pg_net` (call existing `/api/cron/*` routes via
  `net.http_post`, secret in Supabase Vault) to support more automations
  than Vercel Hobby's 2-job/daily-only cap allows. Not implemented — no
  migration written, no decision doc yet. Next session should pick this
  up before adding another automation.
- **No in-browser visual confirmation from this session** of the popup
  centering/scrollbar/Settings-layout fixes, or of the live
  Google/Gmail reconnect flow on the production domain — verified via
  `tsc`/tests only, consistent with this sandbox's usual auth-gated
  browser limitation (see Phase 4/5/6/9D notes). Ishani to confirm
  visually.
