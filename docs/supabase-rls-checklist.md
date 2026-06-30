# Supabase RLS verification checklist

Run these checks **after** applying `supabase/migrations/20260521_rls_audit.sql`
to confirm every user-scoped table is locked down before submitting to Play.

You can run them in **Supabase Studio → SQL Editor**, or via psql / supabase CLI.

---

## 1. Tables in scope

| Table              | Source                       | Ownership column |
|--------------------|------------------------------|------------------|
| analytics_events   | `services/analytics.ts`      | `user_id`        |
| analytics_consent  | `services/analytics.ts`      | `user_id`        |
| user_sessions      | `services/analytics.ts`      | `user_id`        |
| diagnostic_logs    | `services/analytics.ts`      | `user_id`        |
| deletion_log       | `supabase/functions/delete-account` | `user_id` |

If your project has any other tables that store rows tied to a user, add them
to the migration and re-run.

---

## 2. Confirm RLS is enabled on every table

```sql
SELECT relname AS table_name,
       relrowsecurity AS rls_enabled,
       relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname IN (
  'deletion_log',
  'analytics_events',
  'analytics_consent',
  'user_sessions',
  'diagnostic_logs'
)
ORDER BY relname;
```

Expected: `rls_enabled = true` for every row. If any row shows `false`, RLS is
**off** and any anon-key client can read/write the table.

---

## 3. Confirm the expected policies exist

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'deletion_log',
    'analytics_events',
    'analytics_consent',
    'user_sessions',
    'diagnostic_logs'
  )
ORDER BY tablename, policyname;
```

Expected rows:

- `analytics_events`, `analytics_consent`, `user_sessions`, `diagnostic_logs` —
  one policy named **"user owns rows"** scoped to the `{authenticated}` role
  with `qual = (user_id = auth.uid())` and `with_check = (user_id = auth.uid())`.
- `deletion_log` — one policy named **"deletion_log: no client access"** for
  `{authenticated, anon}` with `qual = false` and `with_check = false`. Only
  the service-role key (used by the Edge Function) bypasses RLS and can write.

---

## 4. Confirm `anon` cannot read user data

Open a fresh psql or HTTP session that uses the **anon key** (NOT the service
role), then:

```sql
SET ROLE anon;
SELECT count(*) FROM public.analytics_events;
SELECT count(*) FROM public.user_sessions;
SELECT count(*) FROM public.diagnostic_logs;
SELECT count(*) FROM public.analytics_consent;
SELECT count(*) FROM public.deletion_log;
```

Expected: each query returns `0` (or `permission denied`, depending on
configuration). It should NOT return real rows.

---

## 5. Confirm Edge Function deletion still works end-to-end

After deploying the `delete-account` Edge Function:

1. Sign in with a throwaway test account.
2. Generate at least one analytics event (open the app, tap around).
3. From Settings → Delete Account, type `DELETE`, confirm.
4. In Supabase Studio, run:
   ```sql
   SELECT count(*) FROM public.analytics_events  WHERE user_id = '<test_uuid>';
   SELECT count(*) FROM public.analytics_consent WHERE user_id = '<test_uuid>';
   SELECT count(*) FROM public.user_sessions    WHERE user_id = '<test_uuid>';
   SELECT count(*) FROM public.diagnostic_logs  WHERE user_id = '<test_uuid>';
   SELECT count(*) FROM public.deletion_log     WHERE user_id = '<test_uuid>';
   SELECT count(*) FROM auth.users              WHERE id      = '<test_uuid>';
   ```
   Expected:
   - First four counts: `0`
   - `deletion_log` count: `1` (audit row)
   - `auth.users` count: `0`

If any row is left behind, add that table to the Edge Function's `steps`
array in `supabase/functions/delete-account/index.ts` and re-deploy.

---

## 6. Re-run after every schema change

Any time a new user-scoped table is added, repeat sections 2–4 and update
the migration + Edge Function in lockstep. This file should stay in sync
with `supabase/migrations/20260521_rls_audit.sql`.
