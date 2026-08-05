import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/utils/supabase';
import { authRedirectUri, completeAuthFromUrl, parseCallbackUrl } from '@/utils/authRedirect';
import { getAuthErrorMessage } from '@/utils/authErrors';
import { addBreadcrumb } from '@/services/sentry';
import type { Session, User, Provider } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

const GUEST_MODE_KEY = '@is_guest_mode';

const CANCELLED = 'Sign-in was cancelled.';

type AuthResult = {
  success: boolean;
  error?: string;
  /** Set when the account already exists and just needs email confirmation. */
  needsEmailConfirmation?: boolean;
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  // True between opening a password-recovery link and successfully setting a
  // new password. The root layout uses this to pin the user to the reset
  // screen — a recovery link produces a real session, so without this the
  // auth guard would drop them straight into the app.
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const isAuthenticated = session !== null;

  // Deep links that arrive while an in-app browser session is open are already
  // handled by openAuthSessionAsync; this guards against double-processing.
  const handlingBrowserFlow = useRef(false);

  // Restore session and guest state on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const [guestFlag, { data, error }] = await Promise.all([
          AsyncStorage.getItem(GUEST_MODE_KEY),
          supabase.auth.getSession(),
        ]);

        if (!mounted) return;

        if (error) {
          addBreadcrumb({ category: 'auth', message: `getSession failed: ${error.message}`, level: 'error' });
        }

        const existingSession = data?.session ?? null;
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        // Guest mode is only meaningful when there is no real session.
        setIsGuest(!existingSession && guestFlag === 'true');
      } catch (e) {
        // Never let a storage/network failure wedge the app on the splash
        // screen — fall through to the login screen instead.
        addBreadcrumb({ category: 'auth', message: `init failed: ${String(e)}`, level: 'error' });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      addBreadcrumb({ category: 'auth', message: event, level: 'info' });

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      // If user signs in, clear guest mode
      if (newSession) {
        setIsGuest(false);
        AsyncStorage.removeItem(GUEST_MODE_KEY);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle auth links opened from outside the app (email confirmation,
  // password recovery, or an OAuth redirect that came back after the in-app
  // browser was dismissed).
  useEffect(() => {
    const handleUrl = async (rawUrl: string) => {
      if (!rawUrl || handlingBrowserFlow.current) return;

      const params = parseCallbackUrl(rawUrl);
      const hasAuthPayload =
        params.code || params.accessToken || params.errorCode || params.errorDescription;
      if (!hasAuthPayload) return;

      // Mark recovery before exchanging so the auth guard never sees an
      // authenticated-but-not-yet-reset user outside the reset screen.
      if (params.type === 'recovery') setIsPasswordRecovery(true);

      const result = await completeAuthFromUrl(rawUrl);
      if (!result.success) {
        if (params.type === 'recovery') setIsPasswordRecovery(false);
        addBreadcrumb({ category: 'auth', message: `deep link failed: ${result.error}`, level: 'error' });
      }
    };

    // Cold start: the app was launched by the link.
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // Warm start: the app was already running.
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  // --- Auth Methods ---

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: authRedirectUri },
      });
      if (error) return { success: false, error: getAuthErrorMessage(error) };

      // With "Confirm email" enabled, Supabase deliberately returns a decoy
      // user for an address that is already registered rather than leaking
      // that it exists. The tell is an empty identities array.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return {
          success: false,
          error: 'An account with this email already exists. Try signing in instead.',
        };
      }

      // A session here means email confirmation is disabled and the user is
      // already signed in; otherwise they must confirm by email first.
      return { success: true, needsEmailConfirmation: !data.session };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return { success: false, error: getAuthErrorMessage(error) };
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, []);

  const resendConfirmationEmail = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: authRedirectUri },
      });
      if (error) return { success: false, error: getAuthErrorMessage(error) };
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, []);

  /**
   * Shared browser-based OAuth flow. With flowType 'pkce' the redirect carries
   * only a single-use code, which we exchange for a session locally.
   */
  const signInWithOAuthProvider = useCallback(async (provider: Provider): Promise<AuthResult> => {
    handlingBrowserFlow.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: authRedirectUri,
          skipBrowserRedirect: true,
          // Always show the account chooser so a user can switch accounts
          // instead of being silently re-signed-in as the last one.
          queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
        },
      });

      if (error) return { success: false, error: getAuthErrorMessage(error) };
      if (!data.url) return { success: false, error: 'Failed to get sign-in URL.' };

      const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectUri, {
        showInRecents: false,
      });

      if (result.type !== 'success') {
        // 'cancel' = user backed out, 'dismiss' = browser closed by the OS.
        return { success: false, error: CANCELLED };
      }

      const completion = await completeAuthFromUrl(result.url);
      if (!completion.success) {
        return { success: false, error: completion.error ?? 'Sign-in failed. Please try again.' };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    } finally {
      handlingBrowserFlow.current = false;
    }
  }, []);

  const signInWithGoogle = useCallback(
    () => signInWithOAuthProvider('google'),
    [signInWithOAuthProvider],
  );

  const signInWithApple = useCallback(async (): Promise<AuthResult> => {
    try {
      // Native Apple Sign In on iOS
      if (Platform.OS === 'ios') {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        if (!credential.identityToken) {
          return { success: false, error: 'Failed to get Apple credentials.' };
        }

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) return { success: false, error: getAuthErrorMessage(error) };
        return { success: true };
      }

      // Web redirect flow everywhere else
      return await signInWithOAuthProvider('apple');
    } catch (e) {
      // Apple sign-in cancelled by user
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'ERR_REQUEST_CANCELED') {
        return { success: false, error: CANCELLED };
      }
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [signInWithOAuthProvider]);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: authRedirectUri,
      });
      if (error) return { success: false, error: getAuthErrorMessage(error) };
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, []);

  /** Completes the forgot-password flow. Requires the recovery session. */
  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: getAuthErrorMessage(error) };
      setIsPasswordRecovery(false);
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, []);

  const cancelPasswordRecovery = useCallback(async () => {
    setIsPasswordRecovery(false);
    // The recovery session is only good for setting a password — don't leave
    // the user signed in with it if they back out.
    await supabase.auth.signOut();
  }, []);

  const continueAsGuest = useCallback(async () => {
    setIsGuest(true);
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
  }, []);

  const signOut = useCallback(async () => {
    setIsPasswordRecovery(false);

    if (isGuest) {
      setIsGuest(false);
      await AsyncStorage.removeItem(GUEST_MODE_KEY);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      // A failed server-side revoke (offline, already-expired token) must not
      // trap the user in a signed-in state — clear locally regardless.
      addBreadcrumb({ category: 'auth', message: `signOut failed: ${error.message}`, level: 'warning' });
    }
    setSession(null);
    setUser(null);
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
  }, [isGuest]);

  /**
   * Permanently deletes the account via the delete-account Edge Function.
   * Returns a message on failure so the caller can show the real reason.
   */
  const deleteAccount = useCallback(async (reason = 'user_initiated'): Promise<AuthResult> => {
    try {
      const { data: { session: current } } = await supabase.auth.getSession();
      if (!current) {
        return { success: false, error: 'You must be signed in to delete your account.' };
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { reason },
      });

      if (error) {
        // supabase-js throws FunctionsHttpError for any non-2xx and leaves
        // `data` null, so the real reason is only in the response body.
        let detail = error.message;
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          try {
            const body = await ctx.json();
            if (body && typeof body.error === 'string') detail = body.error;
          } catch { /* body was not JSON */ }
        }
        return { success: false, error: detail || 'Deletion failed. Please try again.' };
      }

      if (!data?.ok) {
        return {
          success: false,
          error: (typeof data?.error === 'string' && data.error) || 'Deletion failed. Please try again.',
        };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, []);

  return useMemo(
    () => ({
      session,
      user,
      isLoading,
      isAuthenticated,
      isGuest,
      isPasswordRecovery,
      signUpWithEmail,
      signInWithEmail,
      resendConfirmationEmail,
      signInWithGoogle,
      signInWithApple,
      resetPassword,
      updatePassword,
      cancelPasswordRecovery,
      continueAsGuest,
      signOut,
      deleteAccount,
    }),
    [
      session,
      user,
      isLoading,
      isAuthenticated,
      isGuest,
      isPasswordRecovery,
      signUpWithEmail,
      signInWithEmail,
      resendConfirmationEmail,
      signInWithGoogle,
      signInWithApple,
      resetPassword,
      updatePassword,
      cancelPasswordRecovery,
      continueAsGuest,
      signOut,
      deleteAccount,
    ],
  );
});
