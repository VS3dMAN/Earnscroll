import { makeRedirectUri } from 'expo-auth-session';
import type { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

/**
 * Every Supabase auth round-trip (OAuth, email confirmation, password
 * recovery) comes back to this one URL. It must be listed verbatim under
 * Supabase Dashboard > Authentication > URL Configuration > Redirect URLs.
 *
 * `makeRedirectUri` resolves the scheme from app.json at runtime, so this
 * yields `earnscroll://auth/callback` in dev-client and release builds.
 */
export const AUTH_CALLBACK_PATH = 'auth/callback';

export const authRedirectUri = makeRedirectUri({ path: AUTH_CALLBACK_PATH });

export type CallbackParams = {
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** Supabase link type: 'recovery' | 'signup' | 'magiclink' | 'invite' | ... */
  type: string | null;
  errorCode: string | null;
  errorDescription: string | null;
};

/**
 * Supabase splits its response across the query string (PKCE / errors) and the
 * URL fragment (implicit flow), and which one you get depends on the flow, the
 * provider and whether the link was opened from mail. Read both.
 */
export function parseCallbackUrl(rawUrl: string): CallbackParams {
  let query = new URLSearchParams();
  let fragment = new URLSearchParams();

  try {
    const url = new URL(rawUrl);
    query = new URLSearchParams(url.search);
    fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
  } catch {
    // Not a URL the WHATWG parser accepts — fall back to a manual split so a
    // malformed redirect still surfaces a useful error instead of throwing.
    const hashIndex = rawUrl.indexOf('#');
    const queryIndex = rawUrl.indexOf('?');
    if (queryIndex !== -1) {
      const end = hashIndex === -1 ? rawUrl.length : hashIndex;
      query = new URLSearchParams(rawUrl.slice(queryIndex + 1, end));
    }
    if (hashIndex !== -1) {
      fragment = new URLSearchParams(rawUrl.slice(hashIndex + 1));
    }
  }

  const pick = (key: string) => query.get(key) ?? fragment.get(key);

  return {
    code: pick('code'),
    accessToken: pick('access_token'),
    refreshToken: pick('refresh_token'),
    type: pick('type'),
    errorCode: pick('error_code') ?? pick('error'),
    errorDescription: pick('error_description'),
  };
}

export type CallbackResult = {
  success: boolean;
  error?: string;
  authError?: AuthError;
  /** True when the link was a password-recovery link. */
  isRecovery?: boolean;
};

/**
 * Turns a redirect URL into a real session, handling both PKCE (`?code=`) and
 * implicit (`#access_token=`) responses.
 */
export async function completeAuthFromUrl(rawUrl: string): Promise<CallbackResult> {
  const params = parseCallbackUrl(rawUrl);
  const isRecovery = params.type === 'recovery';

  if (params.errorCode || params.errorDescription) {
    return {
      success: false,
      error: humanizeRedirectError(params.errorCode, params.errorDescription),
      isRecovery,
    };
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) return { success: false, error: error.message, authError: error, isRecovery };
    return { success: true, isRecovery };
  }

  if (params.accessToken && params.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    });
    if (error) return { success: false, error: error.message, authError: error, isRecovery };
    return { success: true, isRecovery };
  }

  return { success: false, error: 'Sign-in did not complete. Please try again.', isRecovery };
}

function humanizeRedirectError(code: string | null, description: string | null): string {
  const readable = description ? description.replace(/\+/g, ' ') : '';

  switch (code) {
    case 'access_denied':
      return 'Sign-in was cancelled.';
    case 'otp_expired':
      return 'That link has expired. Please request a new one.';
    case 'server_error':
      return readable || 'The sign-in provider returned an error. Please try again.';
    case 'provider_email_needs_verification':
      return 'Please verify your email with the provider first.';
    default:
      return readable || 'Sign-in failed. Please try again.';
  }
}
