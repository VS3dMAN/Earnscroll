# Auth diagnosis & fix report

Date: 2026-08-05
Supabase project: `zurahjqghjratswjjpsg` (EarnScroll, ap-northeast-1)

---

## Why the login page never worked

Four independent faults, stacked. The first two alone made an account
impossible to create, which is why nothing downstream had ever been exercised —
`auth.users` had **0 rows, 0 identities, 0 sessions** at the start of this work.

### 1. The Supabase project was paused

Status was `INACTIVE`. Every auth request hit a dead host, surfacing in the app
as a generic network error. Restored to `ACTIVE_HEALTHY`.

### 2. A broken signup trigger — the actual root cause

`auth.users` has an `on_auth_user_created` trigger running
`public.handle_new_user()`, which did:

```sql
INSERT INTO profiles (id, email) VALUES (NEW.id, NEW.email);
```

`public.profiles` did not exist. The insert raised `42P01`, aborted the
enclosing transaction, and turned **every** signup into:

```
500 unexpected_failure — "Database error saving new user"
```

Confirmed directly in the auth logs:

```
ERROR: relation "profiles" does not exist (SQLSTATE 42P01)
```

Fixed by creating the table *and* hardening the function, because either alone
leaves the trap in place:

- `public.profiles` created, RLS on, owner-scoped policy
- `handle_new_user()` now schema-qualifies its target, pins `search_path = ''`
  (it is `SECURITY DEFINER`), uses `ON CONFLICT DO NOTHING`, and swallows its
  own errors into a `RAISE WARNING`. A profile row is a convenience, not a
  precondition for having an account — it must never fail signup again.
- `EXECUTE` revoked from `anon`/`authenticated`; as a `SECURITY DEFINER`
  function in `public` it was exposed at `/rest/v1/rpc/handle_new_user`.

### 3. The `public` schema was empty

`20260521_rls_audit.sql` guarded four of its five tables behind `IF EXISTS`, so
on a fresh project it only ever created `deletion_log`. Consequences:

- every analytics/diagnostics write failed silently
- **account deletion was impossible** — the Edge Function failed on its first
  step, `deletion_log.insert`

All five tables now exist with RLS enabled and owner-scoped policies:
`deletion_log`, `analytics_consent`, `user_sessions`, `analytics_events`,
`diagnostic_logs`. Schemas derived from `services/analytics.ts`.

### 4. `profiles_id_fkey` did not cascade

The inline `id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
came back as `NO ACTION`. `auth.admin.deleteUser()` then failed with
`violates foreign key constraint "profiles_id_fkey"`, so account deletion
still returned 500 even after the tables existed. Re-declared as an explicit
named constraint and verified as `confdeltype = 'c'`.

---

## Client-side fixes

**`utils/supabase.ts`**
- `flowType: 'pkce'` — the redirect now carries a single-use code instead of
  live tokens in a URL fragment.
- `lock: processLock` — React Native has no `navigator.locks`; without it
  concurrent refreshes can race and clobber the stored session.
- `AppState` listener driving `startAutoRefresh`/`stopAutoRefresh`. The refresh
  timer is frozen while backgrounded, so without this a user who left the app
  longer than the token lifetime returned to a dead session.

**`utils/authRedirect.ts`** (new) — one canonical redirect URI plus a parser
that reads *both* the query string and the fragment, so PKCE codes, implicit
tokens and provider errors are all handled, and exchanges whichever it finds
for a session.

**`contexts/Auth.tsx`**
- Google/Apple OAuth share one hardened PKCE path; `prompt=select_account` so
  users can switch Google accounts instead of being silently re-signed-in.
- `Linking` listener for auth links opened from *outside* the app (email
  confirmation, password recovery) — cold start and warm start. Previously
  nothing handled these at all.
- `updatePassword` + `isPasswordRecovery` — **the forgot-password flow had no
  completion step**. A reset link produced a session and the auth guard waved
  the user into the app without them ever setting a password.
- `resendConfirmationEmail`, duplicate-account detection, `deleteAccount` that
  reads the real error out of the `FunctionsHttpError` body.
- `init()` wrapped so a storage/network failure can't wedge the splash screen.

**Screens**
- `app/(auth)/reset-password.tsx` (new) — the missing end of the reset flow.
- `app/_layout.tsx` — pins a recovering user to the reset screen.
- `app/(auth)/signup.tsx` — only shows "check your email" when confirmation is
  actually required (it is currently disabled, so the old code stranded users
  on a dead-end panel).
- `app/(auth)/login.tsx` — resend-confirmation path for unconfirmed accounts.
- `app/delete-account.tsx` — surfaces the real failure reason. It read
  `data.error`, but supabase-js leaves `data` null on any non-2xx.

**URL scheme: `myapp` → `earnscroll`** (`app.json` + `AndroidManifest.xml`).
`myapp` is the Expo template default, so any other dev build on the same device
claims the same scheme and can intercept the OAuth redirect.

---

## Verified working

Run against the live project; all test users and audit rows removed afterward.

| # | Flow | Result |
|---|------|--------|
| 1 | Signup | account created, session issued |
| 2 | Login | access + refresh token returned |
| 3 | Wrong password | `invalid_credentials` |
| 4 | Duplicate signup | `user_already_exists` |
| 5 | Profile trigger | row auto-created |
| 6 | RLS | anon reads return nothing |
| 7 | Session refresh | new token issued |
| 8 | Password reset | `recover` returns 200 |
| 9 | Account deletion | `{"ok":true}`, rows cascaded |
| 10 | Post-deletion token | `user_not_found` |

---

## Still requires dashboard access — Google sign-in will NOT work until done

`GET /auth/v1/settings` currently reports `google: false`, `apple: false`,
`phone: false`. The Google button returns
`"Unsupported provider: provider is not enabled"`. The client code is ready;
these are pure configuration.

1. **Google Cloud Console** → create an OAuth 2.0 **Web application** client.
   Authorized redirect URI:
   `https://zurahjqghjratswjjpsg.supabase.co/auth/v1/callback`
   (This is the Supabase callback, *not* the app scheme. Supabase brokers the
   handshake, so one Web client covers both Android and iOS.)

2. **Supabase → Authentication → Providers → Google** → enable, paste the
   Client ID and Client Secret.

3. **Supabase → Authentication → URL Configuration → Redirect URLs** → add
   `earnscroll://auth/callback`. Without this Supabase refuses the redirect and
   the browser never returns to the app.

4. **Rebuild the native app** — the scheme change only takes effect through
   `npx expo prebuild` + a fresh dev/release build. It is not an OTA change.

### Also worth deciding

- **Phone sign-in has been removed** at the product owner's request — the
  screen, context methods, validation schemas and login-screen button are all
  gone. Nothing collects a phone number any more; update the Play Console data
  safety declaration accordingly.
- **Apple sign-in** is disabled and required by App Store review if you ship
  any other social login on iOS.
- **SMTP**: the project uses Supabase's default mailer, which only delivers to
  team members and is rate-limited to a few messages per hour. Password reset
  will not work for real users until a custom SMTP provider is configured.
- **Leaked-password protection** is off (flagged by the security advisor).
  Authentication → Policies → enable the HaveIBeenPwned check.
- **Email confirmation** is currently disabled (`mailer_autoconfirm: true`), so
  signups sign straight in. The code handles both modes; if you turn it on,
  SMTP above becomes a hard prerequisite.
