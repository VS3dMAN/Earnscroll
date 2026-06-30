// Supabase Edge Function: delete-account
//
// Deletes all user-scoped rows then deletes the auth user. Runs with the
// service-role key (server-side), so RLS does not block the cleanup.
//
// Caller must include `Authorization: Bearer <user_access_token>`. We verify
// the token to extract user_id; the function never trusts client-supplied IDs.
//
// Deploy with:
//   supabase functions deploy delete-account
// Requires secrets:
//   supabase secrets set SUPABASE_URL=...                 (auto-populated in some setups)
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
//
// Pre-req tables (run docs/supabase-rls-checklist.md migration before deploy):
//   deletion_log (user_id uuid, deleted_at timestamptz, reason text)

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type DeleteResult =
  | { ok: true; deletedAt: string }
  | { ok: false; error: string };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ ok: false, error: 'misconfigured' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!accessToken) return json({ ok: false, error: 'missing_token' }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify the token and resolve user_id.
  const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
  if (userErr || !userData?.user?.id) {
    return json({ ok: false, error: 'invalid_token' }, 401);
  }
  const userId = userData.user.id;

  // Optional body parameter — a short, non-PII string the user provides.
  let reason = 'user_initiated';
  try {
    const body = await req.json().catch(() => null);
    if (body && typeof body.reason === 'string' && body.reason.length < 200) {
      reason = body.reason;
    }
  } catch { /* ignore */ }

  const deletedAt = new Date().toISOString();

  // We do not have a single Postgres transaction across the JS client —
  // run cleanup in deterministic order and bail on the first hard failure.
  // Each user-scoped table delete is idempotent.
  const steps: Array<[string, () => Promise<{ error: any }>]> = [
    ['deletion_log.insert', () => admin.from('deletion_log').insert({ user_id: userId, deleted_at: deletedAt, reason })],
    ['analytics_events.delete', () => admin.from('analytics_events').delete().eq('user_id', userId)],
    ['analytics_consent.delete', () => admin.from('analytics_consent').delete().eq('user_id', userId)],
    ['user_sessions.delete', () => admin.from('user_sessions').delete().eq('user_id', userId)],
    ['diagnostic_logs.delete', () => admin.from('diagnostic_logs').delete().eq('user_id', userId)],
  ];

  for (const [label, fn] of steps) {
    const { error } = await fn();
    if (error) {
      console.error(`[delete-account] ${label} failed`, error);
      return json({ ok: false, error: `${label}_failed` }, 500);
    }
  }

  const { error: adminErr } = await admin.auth.admin.deleteUser(userId);
  if (adminErr) {
    console.error('[delete-account] auth.admin.deleteUser failed', adminErr);
    return json({ ok: false, error: 'auth_delete_failed' }, 500);
  }

  return json({ ok: true, deletedAt } satisfies DeleteResult, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });
}
