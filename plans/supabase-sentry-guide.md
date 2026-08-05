# Kenri — Supabase & Sentry, from 0 to 100

A plain-English, hands-on guide to the two cloud services your app uses, plus a clear mental
model of what your app is doing "in the background." Written for you to run day-to-day even if
you've never touched a backend dashboard. Read it once top to bottom; after that, use the
**Weekly routine** at the end as your checklist.

Your specifics (so the guide is concrete):
- **Supabase project ref:** `zurahjqghjratswjjpsg` (region `ap-northeast-1`, Tokyo).
  Dashboard: https://supabase.com/dashboard → project **Kenri**.
- **Sentry org:** `vs3dman`, EU region. Issues: https://vs3dman.sentry.io/issues/
- Related in-repo docs: [`docs/supabase-rls-checklist.md`](../docs/supabase-rls-checklist.md),
  [`plans/manual-setup-checklist.txt`](manual-setup-checklist.txt),
  [`plans/security-review-v1.md`](security-review-v1.md).

---

## Part 0 — How your app actually works (the mental model)

Think of Kenri as **local-first**. Almost everything happens on the phone; the cloud is a
thin, optional layer.

**On the phone (no internet needed):**
- **Your progress lives locally.** The "time bank" (earned minutes), workout history, streaks,
  and settings are held in `contexts/TimeBank.tsx` and saved to **AsyncStorage** (a small
  key-value store on the device). This is why the app works offline.
- **Sensitive native state is encrypted.** The blocked-app list and time-bank value the Android
  blocker needs are stored in **EncryptedSharedPreferences** (`EarnScrollSecurePrefs`) — an
  encrypted file only your app can read.
- **Exercise detection is on-device.** The camera runs a pose model (MoveNet/TFLite) frame by
  frame to count reps. **Frames never leave the phone** — they're processed and discarded.
- **App blocking is on-device.** An Android **Accessibility Service** (`BlockerService`) watches
  which app comes to the foreground (just the package name, e.g. `com.instagram.android`). If
  your time bank is empty and that app is on your blocked list, it shows a blocking screen. It
  reads *only* the foreground package name — not screen content, not text you type.

**In the cloud (only sometimes, only with consent):**
- **Supabase = your accounts + optional analytics database.** It handles sign-in (email,
  Google, Apple, phone) and, *if the user opts in*, stores anonymous-ish usage events, session
  records, and diagnostic logs. If the user never signs in or never consents, Supabase barely
  gets touched.
- **Sentry = your crash camera.** *If the user opts into diagnostics*, and only in real
  (non-dev) builds, Sentry captures crash reports so you can see what broke in the wild.

So the flow is: **phone does the work → Supabase remembers who the user is and (optionally)
what they did → Sentry tells you when something crashed.** That's the whole picture.

---

## Part 1 — Supabase, from 0 to 100

### 1.1 What Supabase is
Supabase is a hosted **PostgreSQL database** plus batteries: **Auth** (sign-in), **Edge
Functions** (small serverless functions), and a web **Studio** (dashboard) to look at your data.
Your app talks to it through the `@supabase/supabase-js` client configured in
`utils/supabase.ts`.

### 1.2 The two keys (and why one is public)
- **anon key** — shipped inside the app (`utils/supabase.ts`). It is **meant to be public**. On
  its own it can't read anyone's data because **Row Level Security** (below) blocks it.
- **service_role key** — the master key that bypasses all security. It lives **only** on the
  server side (the delete-account Edge Function reads it from an environment secret). **Never**
  put it in the app, in git, or in a screenshot.

### 1.3 Your tables (what each one holds)
Open **Studio → Table Editor** to see rows. You have four app tables plus one audit table:

| Table | What a row means | Written when |
|-------|------------------|--------------|
| `analytics_consent` | One row per user: did they turn analytics/diagnostics on or off, and when | User accepts/declines the consent prompt or toggles it in Settings |
| `analytics_events` | One in-app action (event name + a few properties, screen, app version, platform) | Only if analytics consent is ON |
| `user_sessions` | One app-open session (start, end, duration) | Only if analytics consent is ON |
| `diagnostic_logs` | An info/warn/error log line with context | Only if diagnostics consent is ON |
| `deletion_log` | An audit row when someone deletes their account (kept ~30 days) | The delete-account function writes it (service-role only) |

Auth data (email, phone, Google/Apple identifiers) lives in the built-in **`auth.users`** table,
which you view under **Authentication → Users**, not Table Editor.

### 1.4 Row Level Security (RLS) — the one concept that keeps you safe
RLS is a rule on each table that says **"a signed-in user can only see/change rows where
`user_id` = their own id."** Without RLS, the public anon key could read everyone's rows. With
RLS, even though the anon key is public, User A can never see User B's data. Your migration
`supabase/migrations/20260521_rls_audit.sql` turns RLS on and adds these policies.

**How to check RLS is really on** (Studio → SQL Editor → paste → Run):
```sql
SELECT relname, relrowsecurity FROM pg_class
WHERE relname IN ('analytics_events','analytics_consent','user_sessions','diagnostic_logs','deletion_log');
```
Every row must show `relrowsecurity = true` (`t`). If any is `false`, re-run the migration.
(The full walkthrough is in `docs/supabase-rls-checklist.md`.)

### 1.5 Reading your data day-to-day
- **Table Editor** — click a table, browse/filter rows visually. Good for a quick look.
- **SQL Editor** — run queries. Handy ones:
  ```sql
  -- How many users have opted into analytics?
  SELECT analytics_enabled, count(*) FROM analytics_consent GROUP BY analytics_enabled;

  -- Most common events in the last 7 days
  SELECT event_name, count(*) FROM analytics_events
  WHERE created_at > now() - interval '7 days'
  GROUP BY event_name ORDER BY 2 DESC;

  -- Recent errors your app logged
  SELECT created_at, message, context FROM diagnostic_logs
  WHERE level = 'error' ORDER BY created_at DESC LIMIT 50;
  ```
- **Authentication → Users** — see who signed up, which provider, last sign-in.

### 1.6 The delete-account Edge Function (how "Delete Account" works)
When a user types DELETE in the app (`app/delete-account.tsx`), the app calls
`supabase.functions.invoke('delete-account')`. The function
(`supabase/functions/delete-account/index.ts`):
1. Verifies the user's login token and figures out their `user_id` **from the token** (so
   nobody can delete someone else).
2. Writes a `deletion_log` audit row.
3. Deletes that user's rows from every app table.
4. Deletes the user from `auth.users`.

**Deploying / updating it** (from the repo root, after installing the Supabase CLI and
`supabase login`):
```bash
supabase functions deploy delete-account
```
It needs the service-role secret set once:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<from Studio → Settings → API>
supabase secrets list   # confirm it's there
```
**Test it** with a throwaway account, then confirm the tables and `auth.users` no longer hold
that user.

### 1.7 Auth providers
Under **Authentication → Providers** you toggle Email, Google, Apple, Phone. Each external
provider needs credentials (Google/Apple OAuth client). If a provider is off,
tapping it in the app just errors — enable only the ones you ship. Redirect URL must include
`earnscroll://auth/callback` (matches the app's scheme). Details are in `manual-setup-checklist.txt`
Step 5.

### 1.8 Health checks Supabase gives you for free
- **Advisors** (Studio → Advisors) — Supabase auto-flags security/performance problems
  (e.g. a table without RLS). Check this after any schema change.
- **Logs** (Studio → Logs) — API, Auth, and Edge Function logs. First place to look when
  "sign-in isn't working" or "delete failed."
- **Project status** — a free project **pauses after inactivity**; if auth/analytics suddenly
  fail everywhere, check the project isn't paused and click **Restore**.

---

## Part 2 — Sentry, from 0 to 100

### 2.1 What Sentry is
Sentry catches **crashes and errors in the wild** and shows you the stack trace, device, and
app version — so you learn about bugs from a dashboard instead of from angry reviews.

### 2.2 How it's wired in your app (and the guardrails)
See `services/sentry.ts`:
- **Off in development:** `enabled: !__DEV__`. You'll only get events from real release/preview
  builds — so don't expect anything in Sentry while running the dev server.
- **Consent-gated:** Sentry only initializes if the user opted into diagnostics, and
  `beforeSend` **drops** any event if consent was revoked mid-session.
- **PII stripped:** `beforeSend`/`stripPii` removes email, username, IP, and query strings
  before anything is sent. `sendDefaultPii: false`.
- **Low overhead:** `tracesSampleRate: 0.1` (10% performance traces), `profilesSampleRate: 0`,
  `enableAutoSessionTracking: false`.
- **DSN is public** (safe). The **auth token** (`SENTRY_AUTH_TOKEN`, in `.env`, gitignored) is
  the secret — it's used at build time to upload source maps.

### 2.3 Source maps (why crashes are readable)
Release JS is minified, so a raw stack trace is gibberish. During a release build, the Sentry
plugin uploads **source maps** using `SENTRY_AUTH_TOKEN`, which lets Sentry show real file
names and line numbers. If your Sentry traces look minified, the token wasn't available at
build time — add it as an EAS secret:
```bash
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value <token from .env>
```

### 2.4 Reading Sentry day-to-day
- **Issues** (https://vs3dman.sentry.io/issues/) — grouped errors, newest/most-frequent first.
  Click one to see the stack trace, breadcrumbs (what happened before), device, OS, and
  **release** (app version) it happened in.
- **Releases** — confirms each app version uploaded its source maps and shows crash-free rate.
- **Triage flow:** open an issue → read the top frame of the stack → find that file:line in the
  repo → fix → ship a new version → mark the issue **Resolved** (Sentry reopens it if it
  recurs in a later release).

### 2.5 Verifying the privacy promise
Because you told Google this is consent-gated, sanity-check it before launch: in a release
build, **decline** diagnostics, force an error, and confirm **nothing** appears in the Sentry
inbox. Then accept, force an error, and confirm it **does** appear with no email/PII attached.

---

## Part 3 — Your weekly ops routine (5 minutes)

1. **Supabase → Project status:** active, not paused.
2. **Supabase → Advisors:** no new security/performance warnings (especially "RLS disabled").
3. **Supabase → Table Editor:** glance at row counts — steady growth is normal; a sudden spike
   in `diagnostic_logs` errors is a signal to investigate.
4. **Supabase → Logs:** skim Auth + Edge Function logs for repeated failures.
5. **Sentry → Issues:** any new unresolved crash? Triage the top one.
6. **Sentry → Releases:** latest app version has source maps + a healthy crash-free rate.
7. **Once per release:** confirm `SENTRY_AUTH_TOKEN` is in EAS secrets and `.env`/service-role
   key are still out of git.

## Part 4 — "Something's broken" quick reference

| Symptom | Most likely cause | Where to look |
|---------|-------------------|---------------|
| Sign-in / analytics fail for everyone | Supabase project paused, or provider misconfigured | Supabase project status; Auth → Providers; Logs |
| A user says "I can see the wrong data" | RLS off on a table | Run the `pg_class` RLS check (§1.4); re-apply migration |
| Delete Account errors | Edge function not deployed, or missing service-role secret | `supabase functions list`; `supabase secrets list`; Logs |
| Sentry stack traces are minified | Source maps not uploaded | Ensure `SENTRY_AUTH_TOKEN` set at build (EAS secret) |
| No events in Sentry at all | You're in a dev build, or user declined diagnostics | Sentry is `!__DEV__` + consent-gated — use a release build & accept consent |
| New table leaks data | Forgot RLS + delete-function + privacy-policy update | Follow the "ongoing maintenance" list in `play-store-fixes-manual-user-work.txt` §F |
