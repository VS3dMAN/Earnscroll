-- 20260521_rls_audit.sql
-- ============================================================================
-- Idempotent RLS audit migration.
-- Run from Supabase SQL editor or `supabase db push`.
-- Each statement is safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- deletion_log: written ONLY by the delete-account Edge Function (service role)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deletion_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  deleted_at  timestamptz NOT NULL DEFAULT now(),
  reason      text
);

CREATE INDEX IF NOT EXISTS deletion_log_deleted_at_idx
  ON public.deletion_log (deleted_at);

ALTER TABLE public.deletion_log ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE for `anon` or `authenticated`. The Edge
-- Function uses the service role, which bypasses RLS, so it can still write.
DROP POLICY IF EXISTS "deletion_log: no client access" ON public.deletion_log;
CREATE POLICY "deletion_log: no client access"
  ON public.deletion_log
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- ----------------------------------------------------------------------------
-- analytics_events: per-user ownership, authenticated only.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analytics_events') THEN
    EXECUTE 'ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "user owns rows" ON public.analytics_events';
    EXECUTE $p$
      CREATE POLICY "user owns rows" ON public.analytics_events
        FOR ALL TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
    $p$;
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- analytics_consent: per-user ownership, authenticated only.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analytics_consent') THEN
    EXECUTE 'ALTER TABLE public.analytics_consent ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "user owns rows" ON public.analytics_consent';
    EXECUTE $p$
      CREATE POLICY "user owns rows" ON public.analytics_consent
        FOR ALL TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
    $p$;
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- user_sessions: per-user ownership, authenticated only.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
    EXECUTE 'ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "user owns rows" ON public.user_sessions';
    EXECUTE $p$
      CREATE POLICY "user owns rows" ON public.user_sessions
        FOR ALL TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
    $p$;
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- diagnostic_logs: per-user ownership, authenticated only.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'diagnostic_logs') THEN
    EXECUTE 'ALTER TABLE public.diagnostic_logs ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "user owns rows" ON public.diagnostic_logs';
    EXECUTE $p$
      CREATE POLICY "user owns rows" ON public.diagnostic_logs
        FOR ALL TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
    $p$;
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- Verification queries (run by hand, see docs/supabase-rls-checklist.md):
--   SELECT relname, relrowsecurity, relforcerowsecurity
--   FROM pg_class
--   WHERE relname IN ('deletion_log','analytics_events','analytics_consent','user_sessions','diagnostic_logs');
--
--   SELECT schemaname, tablename, policyname, permissive, roles, cmd
--   FROM pg_policies
--   WHERE schemaname = 'public'
--     AND tablename IN ('deletion_log','analytics_events','analytics_consent','user_sessions','diagnostic_logs');
-- ----------------------------------------------------------------------------
