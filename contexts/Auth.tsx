import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/utils/supabase';
import { getAuthErrorMessage } from '@/utils/authErrors';
import type { Session, User } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

const GUEST_MODE_KEY = '@is_guest_mode';

type AuthResult = {
  success: boolean;
  error?: string;
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const isAuthenticated = session !== null;

  // Restore session and guest state on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Check guest mode first
      const guestFlag = await AsyncStorage.getItem(GUEST_MODE_KEY);
      if (mounted && guestFlag === 'true') {
        setIsGuest(true);
        setIsLoading(false);
        return;
      }

      // Try to restore Supabase session
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        setIsLoading(false);
      }
    };

    init();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
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

  // --- Auth Methods ---

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return { success: false, error: getAuthErrorMessage(error) };
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: getAuthErrorMessage(error) };
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      const redirectTo = makeRedirectUri({ scheme: 'myapp', path: 'auth/callback' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) return { success: false, error: getAuthErrorMessage(error) };
      if (!data.url) return { success: false, error: 'Failed to get sign-in URL.' };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== 'success') {
        return { success: false, error: 'Sign-in was cancelled.' };
      }

      // Extract tokens from the redirect URL
      const url = new URL(result.url);
      // Supabase returns tokens in the URL fragment
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        return { success: false, error: 'Failed to complete sign-in.' };
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) return { success: false, error: getAuthErrorMessage(sessionError) };
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, []);

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

      // Web redirect flow for Android
      const redirectTo = makeRedirectUri({ scheme: 'myapp', path: 'auth/callback' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) return { success: false, error: getAuthErrorMessage(error) };
      if (!data.url) return { success: false, error: 'Failed to get sign-in URL.' };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== 'success') {
        return { success: false, error: 'Sign-in was cancelled.' };
      }

      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        return { success: false, error: 'Failed to complete sign-in.' };
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) return { success: false, error: getAuthErrorMessage(sessionError) };
      return { success: true };
    } catch (e) {
      // Apple sign-in cancelled by user
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'ERR_REQUEST_CANCELED') {
        return { success: false, error: 'Sign-in was cancelled.' };
      }
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, []);

  const signInWithPhone = useCallback(async (phone: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) return { success: false, error: getAuthErrorMessage(error) };
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, otp: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
      if (error) return { success: false, error: getAuthErrorMessage(error) };
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const redirectTo = makeRedirectUri({ scheme: 'myapp', path: 'auth/callback' });
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) return { success: false, error: getAuthErrorMessage(error) };
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, []);

  const continueAsGuest = useCallback(async () => {
    setIsGuest(true);
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
  }, []);

  const signOut = useCallback(async () => {
    if (isGuest) {
      setIsGuest(false);
      await AsyncStorage.removeItem(GUEST_MODE_KEY);
      return;
    }
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, [isGuest]);

  return useMemo(
    () => ({
      session,
      user,
      isLoading,
      isAuthenticated,
      isGuest,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signInWithApple,
      signInWithPhone,
      verifyPhoneOtp,
      resetPassword,
      continueAsGuest,
      signOut,
    }),
    [
      session,
      user,
      isLoading,
      isAuthenticated,
      isGuest,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signInWithApple,
      signInWithPhone,
      verifyPhoneOtp,
      resetPassword,
      continueAsGuest,
      signOut,
    ],
  );
});
