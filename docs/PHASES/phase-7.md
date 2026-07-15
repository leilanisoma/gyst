# Phase 7 — Gmail-assisted automation

Goal: detect actionable recruiting and school messages without copying an
entire inbox. Source: `PLAN.md` §15 Phase 7, §8, §12.

## Checklist (task IDs map 1:1 to PLAN.md §15 Phase 7 bullets)

- [x] 7.1 Confirm whether Gmail and Google Calendar live on the same Google account; extend the `integrations`/`oauth_tokens` schema so Gmail can be a separate connection if not.
- [ ] 7.2 Configure Gmail OAuth and narrow read scopes.
- [ ] 7.3 Begin with user-created Gmail labels or strict searches.
- [ ] 7.4 Extract interview dates, application confirmations, deadlines, and requested actions.
- [ ] 7.5 Show every extracted item in a review queue.
- [ ] 7.6 Link back to the original Gmail message.
- [ ] 7.7 Add draft-only replies and follow-ups.
- [ ] 7.8 Add retention controls for message excerpts.

## Exit criteria

> Tested messages produce correct suggestions, no email is sent, and
> irrelevant personal mail is not stored.

## Notes

### 7.1 notes

- **Confirmed with the user: Gmail and Google Calendar are different Google accounts.** This rules out the "same account, just request an extra scope on the existing connection" option — Gmail needs its own OAuth connection, tokens, and account identity, exactly the case PLAN.md's task text flagged.
- **Fix is a new `provider = 'gmail'` value, not a change to `unique (user_id, provider)`.** The existing constraint already scopes one row per `(user_id, provider)` — Calendar's row is `provider = 'google'`; giving Gmail its own distinct provider string means it gets its own row (own `account_email`, `granted_scopes`, tokens, sync cursor) with zero collision, no constraint shape change needed. This is the same pattern Phase 6 used to add `'canvas'` alongside `'google'` (`20260712110001_school_schema.sql`), just applied to a second Google product instead of a second vendor.
- **Migration**: `supabase/migrations/20260714000001_gmail_provider.sql` widens the `provider` check constraints on `integrations`, `oauth_tokens`, and `sync_runs` to include `'gmail'` (mirroring the exact drop/add-constraint pattern Phase 6 used). No other schema change — `account_email`, `settings`, `granted_scopes`, and the token columns are all already generic enough to hold a second, independent Google connection as-is.
- **No code changes yet** — `src/lib/google/{integration,tokens}.ts` still hardcode `PROVIDER = "google"` for Calendar; a parallel Gmail module (own `PROVIDER = "gmail"` constant, own connect/callback routes, own scopes) is 7.2's job, not this one. `GOOGLE_CLIENT_ID`/`SECRET`/`REDIRECT_URI` can be reused unchanged for Gmail's OAuth flow — one registered OAuth app can authenticate multiple different Google accounts, since the account is chosen by whoever completes the consent screen, not by the client credentials.
- **Live-applied to the remote Supabase project** (`iygdvkgvjtiiyyfqlnfo`) via `supabase db push` — this sandbox only had `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` by default (enough for data reads/writes via `@supabase/supabase-js`, not enough for the CLI to push DDL), so the user supplied a `SUPABASE_ACCESS_TOKEN` for this one command; it was used only as an inline env var for the push and never written to a file or committed. `supabase migration list` confirms `20260714000001` now shows the same value on both `local` and `remote`.
- **`docs/ARCHITECTURE.md`/`docs/DATA_MODEL.md` updated** to reflect `gmail` as an allowed provider value; both had already anticipated this exact task ahead of time.
