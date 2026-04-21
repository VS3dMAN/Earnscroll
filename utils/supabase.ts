import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your Supabase project credentials.
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
    detectSessionInUrl: false,
  },
});
