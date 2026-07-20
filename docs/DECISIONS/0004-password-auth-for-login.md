# 0004 — Password auth for login, replacing magic-link/OTP

**Date:** 2026-07-20
**Status:** Accepted

## Context

Login (`src/app/login/`) originally used Supabase's email-based
passwordless sign-in (`signInWithOtp`), first as a clickable magic link,
then as a 6-digit code after the link version proved unworkable. In
practice this single mechanism failed for a chain of unrelated reasons
before ever completing successfully:

- Gmail/mail-security link prefetching burned the single-use magic-link
  token before the user could click it (`otp_expired` on first click,
  every time).
- Supabase's default built-in mailer rate-limits email sending very
  aggressively (a handful of emails/hour) — quickly exhausted during
  troubleshooting.
- Custom SMTP via Resend initially rejected sends because the Resend
  account's own email didn't match `ALLOWED_USER_EMAIL`, and Resend's
  sandbox sender can only deliver to the account owner without a
  verified domain.
- Supabase routes the same `signInWithOtp` call through different email
  templates (`Magic Link` vs `Confirm signup`) depending on whether the
  target user is already confirmed — the code was never visible because
  the *other* template hadn't been edited to include `{{ .Token }}`.

Each of these is individually fixable, but together they made a
single-user personal app's login fragile and high-maintenance for no
real benefit — there's exactly one allowed account
(`ALLOWED_USER_EMAIL`), so passwordless email delivery wasn't buying any
meaningful security or convenience over a password.

## Decisions

1. **Login now uses `supabase.auth.signInWithPassword`**
   (`src/app/login/actions.ts` — `signInWithPassword`), not
   `signInWithOtp`. The login form (`src/app/login/login-card.tsx`) is a
   single password field, no email input (the email is fixed to
   `ALLOWED_USER_EMAIL` server-side, same as before).
2. **The password was set directly on the existing Supabase auth user via
   the admin API** (`supabase.auth.admin.updateUserById` with the service
   role key), not through a password-reset email — there is no
   self-service "forgot password" flow. If it needs to change, it's set
   the same way: a one-off script using `SUPABASE_SERVICE_ROLE_KEY`.
3. **No email delivery is involved in login at all anymore.** Custom SMTP
   (Resend) can stay configured for other Supabase-triggered emails, but
   nothing in the login path depends on it.
4. **`/auth/callback` (PKCE code exchange) is now unused dead code.** It
   existed only to complete the magic-link flow's redirect. It's left in
   place (harmless, still allow-listed as a public path in
   `src/lib/supabase/middleware.ts`) but does not fire in the current
   login flow. It's fine to remove in a future cleanup pass — not done
   here to keep this change scoped to auth behavior.

## Consequences

- Login has zero moving parts outside this app's own database (no email
  provider, no template routing, no link-prefetch/rate-limit failure
  modes). Matches the project's "low maintenance" goal
  (`CLAUDE.md`/`PLAN.md`) better than passwordless email ever did for a
  single, fixed account.
- Changing the password is an operator action (a script against the
  Supabase admin API), not a user-facing flow. Acceptable for a
  single-user app; would need revisiting if this app ever supported more
  than one account.
- `ARCHITECTURE.md`'s description of `login/` and the Auth row updated
  to reflect password sign-in instead of magic link.
