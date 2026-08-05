import { createClient, processLock } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';

// These are PUBLIC keys — safe to embed in the app.
// Find them at: Supabase Dashboard > Settings > API
const SUPABASE_URL = 'https://zurahjqghjratswjjpsg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1cmFoanFnaGpyYXRzd2pqcHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTE2ODIsImV4cCI6MjA5MjAyNzY4Mn0.aWj7Uak80Oaq8vmOp35YyAA4VvMPEMusRQcN0--kGuw';

// Storage adapter using AsyncStorage (SecureStore has a 2048-byte limit
// which Supabase session JSON can exceed).
const SupabaseStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SupabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No window.location on native, so there is never a URL to read the
    // session out of. We hand the redirect URL to Supabase ourselves in
    // contexts/Auth.tsx.
    detectSessionInUrl: false,
    // PKCE keeps tokens out of the redirect URL entirely — the browser only
    // ever carries a single-use `code`, which is worthless without the
    // verifier held in this app's storage. Required for OAuth, magic links
    // and password-recovery links to be safe on mobile.
    flowType: 'pkce',
    // React Native has no `navigator.locks`; without an explicit lock,
    // concurrent refreshes can race and clobber the stored session.
    lock: processLock,
  },
});

// Supabase only refreshes the access token while a timer is running. On mobile
// that timer is frozen while the app is backgrounded, so a user who leaves the
// app for longer than the token lifetime comes back to a dead session unless
// we restart the refresher on foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
