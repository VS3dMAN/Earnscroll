-- 20260805_auth_user_tables.sql
-- ============================================================================
-- Creates every user-scoped table the app writes to, with RLS locked to the
-- owning user. Idempotent — safe to re-run.
--
-- Why this exists: the earlier 20260521_rls_audit.sql guarded four of the five
-- tables behind `IF EXISTS`, so on a fresh project it only ever created
-- deletion_log. The public schema was empty, which meant:
--   * every analytics/diagnostics write failed silently
--   * delete-account failed on step 1 (deletion_log.insert) -> account
--     deletion was impossible
--
-- Column names/types are derived from services/analytics.ts and
-- supabase/functions/delete-account/index.ts.
-- ============================================================================

-- ============================================================================
-- PART 1 — THE SIGNUP BLOCKER
--
-- auth.users has an `on_auth_user_created` trigger running
-- public.handle_new_user(), which does `INSERT INTO profiles (id, email)`.
-- public.profiles did not exist, so the insert raised 42P01, aborted the
-- surrounding transaction and turned EVERY signup into:
--     500 unexpected_failure / "Database error saving new user"
-- That is why no account could ever be created and the login page never worked.
--
-- Fixed two ways, because either alone leaves a trap:
--   1. create the missing table
--   2. harden the function so a future failure degrades instead of taking
--      the whole signup down with it
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY,
  email      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Declared as a separate named constraint rather than inline on the column:
-- an inline `PRIMARY KEY REFERENCES ... ON DELETE CASCADE` came back as
-- NO ACTION on this project, which made auth.admin.deleteUser() fail with
-- "violates foreign key constraint profiles_id_fkey" and broke account
-- deletion. Doing it explicitly is verifiable and cannot silently degrade.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user owns profile" ON public.profiles;
CREATE POLICY "user owns profile" ON public.profiles
  FOR ALL TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

-- SECURITY DEFINER + an empty search_path: without the pinned search_path a
-- caller could shadow `profiles` with a temp table and have this run against
-- it as the definer. Schema-qualify everything now that search_path is empty.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- A profile row is a convenience, not a precondition for having an account.
  -- Never let it fail the signup transaction again.
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- A SECURITY DEFINER function living in `public` is exposed by PostgREST at
-- /rest/v1/rpc/handle_new_user. It is a trigger function and nothing but the
-- trigger should ever call it, so take it off the public API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Backfill any users created before this migration.
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 2 — user-scoped application tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- deletion_log: written ONLY by the delete-account Edge Function (service role)
-- No FK to auth.users — the audit row must outlive the deleted user.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deletion_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  reason     text
);
CREATE INDEX IF NOT EXISTS deletion_log_deleted_at_idx ON public.deletion_log (deleted_at);

-- ---------------------------------------------------------------------------
-- analytics_consent: one row per user. `user_id` is UNIQUE because
-- Analytics.setConsent() upserts with onConflict: 'user_id'.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_consent (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  diagnostics_enabled boolean NOT NULL DEFAULT false,
  analytics_enabled   boolean NOT NULL DEFAULT false,
  consent_given_at    timestamptz,
  consent_revoked_at  timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- user_sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  session_start    timestamptz NOT NULL DEFAULT now(),
  session_end      timestamptz,
  duration_seconds integer,
  app_version      text,
  platform         text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx
  ON public.user_sessions (user_id, session_start DESC);

-- ---------------------------------------------------------------------------
-- analytics_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_name       text NOT NULL,
  event_properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  screen_name      text,
  session_id       uuid,
  app_version      text,
  platform         text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx
  ON public.analytics_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_name_idx
  ON public.analytics_events (event_name, created_at DESC);

-- ---------------------------------------------------------------------------
-- diagnostic_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostic_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  level       text NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  message     text NOT NULL,
  context     jsonb NOT NULL DEFAULT '{}'::jsonb,
  app_version text,
  platform    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS diagnostic_logs_user_id_idx
  ON public.diagnostic_logs (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- auth.uid() is wrapped in a scalar subquery so Postgres evaluates it once per
-- statement instead of once per row.
-- ---------------------------------------------------------------------------
ALTER TABLE public.deletion_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_logs   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deletion_log: no client access" ON public.deletion_log;
CREATE POLICY "deletion_log: no client access"
  ON public.deletion_log FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "user owns rows" ON public.analytics_consent;
CREATE POLICY "user owns rows" ON public.analytics_consent
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user owns rows" ON public.user_sessions;
CREATE POLICY "user owns rows" ON public.user_sessions
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user owns rows" ON public.analytics_events;
CREATE POLICY "user owns rows" ON public.analytics_events
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user owns rows" ON public.diagnostic_logs;
CREATE POLICY "user owns rows" ON public.diagnostic_logs
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
