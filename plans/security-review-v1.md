# EarnScroll — Security Review for v1 Play Store Launch

**Date:** 2026-07-03
**Scope:** Whole-repo review focused on what actually matters for a first public v1 release
(secrets, backend/RLS, auth token handling, native Android surface, data/PII handling,
deep links). This is deliberately concrete (file:line + fix), not a generic checklist.

## Verdict

**OK to ship v1.** There are no exploitable data-leak paths: every user table has RLS, the
account-deletion function validates the caller's JWT (no IDOR), Sentry strips PII, analytics
is opt-in, and native secrets live in EncryptedSharedPreferences. The only *blocking* issue
found was a **build-breaker** (missing Android backup-rule XML), which is **fixed in this
pass** via a config-plugin change. Everything else is either safe-by-design, already
mitigated, or a low-risk v1.1 backlog item.

---

## Findings table

| # | Finding | Severity | Where | Status |
|---|---------|----------|-------|--------|
| 1 | Android manifest referenced backup-rule XML files that didn't exist → resource-linking build failure | **High (build-breaker)** | `android/app/src/main/AndroidManifest.xml` (`android:fullBackupContent`/`dataExtractionRules`) + missing `res/xml/*` | **Fixed** |
| 2 | `SENTRY_AUTH_TOKEN` present in local `.env` | Critical-looking | `.env` | **Already safe** (gitignored, never committed) |
| 3 | Supabase session tokens stored in AsyncStorage (not encrypted) | Medium | `utils/supabase.ts`, `contexts/Auth.tsx` | v1.1 backlog |
| 4 | A few `console.log`s not gated behind `__DEV__` | Low | e.g. `contexts/TimeBank.tsx`, `app/developer-menu.tsx` | v1.1 backlog |
| 5 | Web-only hardcoded HMAC fallback key | Low | `utils/secureStorage.ts` (`'web-dev-key-not-secure'`) | Accept (dev/web-only) |
| 6 | Hardcoded Supabase anon key + Sentry DSN | Low (informational) | `utils/supabase.ts`, `services/sentry.ts` | **Safe by design** |

---

## 1. Build-breaker — FIXED in this pass

**What was wrong:** the committed `AndroidManifest.xml` `<application>` element set
`android:fullBackupContent="@xml/secure_store_backup_rules"` and
`android:dataExtractionRules="@xml/secure_store_data_extraction_rules"`, but neither file
existed under `android/app/src/main/res/xml/` (only `accessibility_service_config.xml` was
there) and **no config plugin generated them**. Android resource linking fails with
"resource xml/secure_store_backup_rules not found," so a release build cannot complete. Because
`android/` is committed and EAS builds it directly, this would fail CI/EAS builds.

**Why it also mattered for security:** those two files are what keep the app's
`EncryptedSharedPreferences` store (`EarnScrollSecurePrefs` — holds the time-bank state and
blocked-app list; see `EarnScrollModule.kt:38`, `BlockerService.kt:32`) out of Google cloud
backups and device-to-device transfers. Missing files = protection silently absent.

**The fix (`plugins/withEarnScrollNative.js`):** the change is made in the plugin, not by
hand-editing the generated tree, so it survives `expo prebuild --clean`:
- The dangerous-mod that already writes `accessibility_service_config.xml` now also writes
  `secure_store_backup_rules.xml` and `secure_store_data_extraction_rules.xml`, both
  excluding `EarnScrollSecurePrefs.xml`.
- The `withAndroidManifest` mod now sets `android:fullBackupContent` and
  `android:dataExtractionRules` on the `<application>` element, so the attributes and their
  target files are always generated together.

**Verify:** after `npx expo prebuild --clean`,
`ls android/app/src/main/res/xml/` shows both new files and the manifest attributes resolve.

## 2. `SENTRY_AUTH_TOKEN` in `.env` — already safe

`.env` contains a real `SENTRY_AUTH_TOKEN` (used for source-map upload). This is
**not a leak**: `.env` is gitignored (`.gitignore`: `.env`, `.env*.local`) and
`git log --all --full-history -- .env` returns nothing — it was never committed to any
branch and is not on the GitHub remote. Keep it out of git. For CI/EAS builds, provide it via
`eas secret:create --name SENTRY_AUTH_TOKEN` (per the manual checklist), never by committing.
*Optional hygiene:* rotate the token once in Sentry (User Settings → Auth Tokens) since it has
sat in a working tree; not required for launch.

## 3. Supabase session tokens in AsyncStorage — accept for v1, fix in v1.1

`utils/supabase.ts` uses an AsyncStorage adapter (SecureStore has a 2048-byte limit the
session JSON can exceed). On a non-rooted device this is protected by OS app-sandboxing and
full-disk encryption, so real-world risk is low, but it is weaker than Keystore-backed
storage. **v1.1:** either chunk the session (store the refresh token via SecureStore) or use
the existing signed-storage helpers in `utils/secureStorage.ts` (`setSignedItem`/
`getSignedItem`). No user-facing data is exposed by this today.

## 4. `console.log` not fully gated — cosmetic, v1.1

Several logs (e.g. dev-data generation in `contexts/TimeBank.tsx`, `app/developer-menu.tsx`)
run outside `__DEV__`. None print tokens, emails, or PII, so this is log-noise hygiene, not a
data-exposure issue. Wrap in `if (__DEV__)` when convenient.

## 5. Web HMAC fallback key — accept

`utils/secureStorage.ts` uses `'web-dev-key-not-secure'` on `Platform.OS === 'web'`. The web
build is a dev/preview target, not the shipped Android artifact, and no sensitive data is
persisted through it. Fine for v1; treat web as non-production.

## 6. Hardcoded anon key + Sentry DSN — safe by design (do NOT "fix")

- `SUPABASE_ANON_KEY` (`utils/supabase.ts`) is meant to be public; per-user access is enforced
  by RLS, not by key secrecy.
- The Sentry **DSN** (`services/sentry.ts`) is a public client identifier. The secret is the
  auth *token* (see #2), which is not in the DSN.

Removing these into env vars adds no security and would just break the build. Leave as-is.

---

## Things that are correct (verified — no action)

- **RLS on every user table.** `supabase/migrations/20260521_rls_audit.sql` enables RLS and a
  `user_id = auth.uid()` policy on `analytics_events`, `analytics_consent`, `user_sessions`,
  `diagnostic_logs`; `deletion_log` is service-role-write only. Anon role has no read policy.
- **Delete-account has no IDOR.** `supabase/functions/delete-account/index.ts` calls
  `admin.auth.getUser(accessToken)` and derives `user_id` from the verified token — it never
  trusts a body-supplied id, so a user can only delete themselves.
- **Sentry PII stripping.** `services/sentry.ts` `beforeSend`/`stripPii` removes
  `user.email`, `username`, `ip_address`, strips query strings, and drops the event entirely
  when analytics consent is revoked. Sentry is also `enabled: !__DEV__`.
- **Native secrets encrypted.** `EncryptedSharedPreferences` with AES256-SIV keys /
  AES256-GCM values (`EarnScrollModule.kt`, `BlockerService.kt`).
- **Accessibility service is `exported="false"`** and gated by
  `BIND_ACCESSIBILITY_SERVICE`; the disclosure screen (`app/accessibility-disclosure.tsx`)
  explains the access. Standard, correct pattern.
- **Deep links are inert.** `app/+native-intent.tsx` redirects all deep links to `/`, and
  `/go-pro` hard-redirects home while `FREE_LAUNCH_MODE` is true — no unlaunched screen or
  price can be surfaced by a crafted link.
- **Analytics is opt-in** and off by default; nothing is sent before explicit consent.

---

## Pre-launch operational checks (YOUR action — outside the repo)

These are not code issues but must be true before submitting:
1. Apply the RLS migration to prod, then verify every table reports RLS on:
   ```sql
   SELECT relname, relrowsecurity FROM pg_class
   WHERE relname IN ('deletion_log','analytics_events','analytics_consent','user_sessions','diagnostic_logs');
   ```
   All rows must show `relrowsecurity = t`.
2. Deploy and end-to-end test `delete-account` (sign in with a throwaway account, generate an
   event, delete, confirm the tables and `auth.users` no longer contain that `user_id`).
3. Keep `.env`, `sentry.properties`, and any future `google-service-account.json` out of git
   (all currently gitignored). Put build secrets in EAS.
4. **Website accuracy (privacy):** the marketing homepage currently implies data is stored
   "locally only / no cloud uploads." That is misleading because consented analytics/session/
   diagnostic rows go to Supabase. Soften that copy (e.g. "camera frames are processed on-device
   and never uploaded; optional, consent-based analytics may be stored securely in the cloud").
   This lives in the separate `website/` repo.
