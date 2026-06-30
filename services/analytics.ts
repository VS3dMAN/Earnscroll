import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';

const CONSENT_CACHE_KEY = '@analytics_consent';
const APP_VERSION = '1.0.0';
const FLUSH_INTERVAL_MS = 30_000;

type ConsentStatus = {
  diagnostics: boolean;
  analytics: boolean;
};

type BufferedEvent = {
  user_id: string;
  event_name: string;
  event_properties: Record<string, unknown>;
  screen_name: string | null;
  session_id: string | null;
  app_version: string;
  platform: string;
};

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const platform = Platform.OS;

let userId: string | null = null;
let consentStatus: ConsentStatus = { diagnostics: false, analytics: false };
let currentSessionId: string | null = null;
let sessionRowId: string | null = null;
let sessionStartTime: Date | null = null;
let eventBuffer: BufferedEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let initialized = false;

async function loadConsentFromSupabase(uid: string): Promise<ConsentStatus> {
  try {
    const { data, error } = await supabase
      .from('analytics_consent')
      .select('diagnostics_enabled, analytics_enabled')
      .eq('user_id', uid)
      .single();

    if (error || !data) {
      return { diagnostics: false, analytics: false };
    }

    return {
      diagnostics: data.diagnostics_enabled,
      analytics: data.analytics_enabled,
    };
  } catch {
    return { diagnostics: false, analytics: false };
  }
}

async function loadConsentFromCache(): Promise<ConsentStatus | null> {
  try {
    const cached = await AsyncStorage.getItem(CONSENT_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
}

async function cacheConsent(consent: ConsentStatus): Promise<void> {
  try {
    await AsyncStorage.setItem(CONSENT_CACHE_KEY, JSON.stringify(consent));
  } catch {}
}

export const Analytics = {
  async init(uid: string): Promise<ConsentStatus> {
    userId = uid;

    // Load from cache first for fast startup, then sync with Supabase
    const cached = await loadConsentFromCache();
    if (cached) {
      consentStatus = cached;
    }

    const remote = await loadConsentFromSupabase(uid);
    consentStatus = remote;
    await cacheConsent(remote);

    // Start flush timer
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = setInterval(() => {
      Analytics.flush();
    }, FLUSH_INTERVAL_MS);

    initialized = true;

    // Auto-start session if analytics enabled
    if (consentStatus.analytics) {
      await Analytics.startSession();
    }

    return consentStatus;
  },

  async hasConsentRecord(uid: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('analytics_consent')
        .select('id')
        .eq('user_id', uid)
        .single();
      return !error && !!data;
    } catch {
      return false;
    }
  },

  trackEvent(name: string, properties: Record<string, unknown> = {}): void {
    if (!initialized || !userId || !consentStatus.analytics) return;

    eventBuffer.push({
      user_id: userId,
      event_name: name,
      event_properties: properties,
      screen_name: null,
      session_id: currentSessionId,
      app_version: APP_VERSION,
      platform,
    });
  },

  trackScreenView(screenName: string): void {
    if (!initialized || !userId || !consentStatus.analytics) return;

    eventBuffer.push({
      user_id: userId,
      event_name: 'screen_view',
      event_properties: { screen_name: screenName },
      screen_name: screenName,
      session_id: currentSessionId,
      app_version: APP_VERSION,
      platform,
    });
  },

  async startSession(): Promise<void> {
    if (!initialized || !userId || !consentStatus.analytics) return;

    currentSessionId = generateUUID();
    sessionStartTime = new Date();

    try {
      const { data } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_start: sessionStartTime.toISOString(),
          app_version: APP_VERSION,
          platform,
        })
        .select('id')
        .single();

      if (data) {
        sessionRowId = data.id;
      }
    } catch {}

    Analytics.trackEvent('app_opened', { session_id: currentSessionId });
  },

  async endSession(): Promise<void> {
    if (!currentSessionId || !sessionStartTime) return;

    const durationSeconds = Math.round(
      (Date.now() - sessionStartTime.getTime()) / 1000
    );

    if (sessionRowId) {
      try {
        await supabase
          .from('user_sessions')
          .update({
            session_end: new Date().toISOString(),
            duration_seconds: durationSeconds,
          })
          .eq('id', sessionRowId);
      } catch {}
    }

    await Analytics.flush();

    currentSessionId = null;
    sessionRowId = null;
    sessionStartTime = null;
  },

  async log(
    level: 'info' | 'warn' | 'error',
    message: string,
    context: Record<string, unknown> = {}
  ): Promise<void> {
    if (!initialized || !userId || !consentStatus.diagnostics) return;

    try {
      await supabase.from('diagnostic_logs').insert({
        user_id: userId,
        level,
        message,
        context,
        app_version: APP_VERSION,
        platform,
      });
    } catch {}
  },

  async setConsent(
    diagnostics: boolean,
    analytics: boolean
  ): Promise<void> {
    if (!userId) return;

    const now = new Date().toISOString();
    const anyEnabled = diagnostics || analytics;

    consentStatus = { diagnostics, analytics };
    await cacheConsent(consentStatus);

    try {
      await supabase.from('analytics_consent').upsert(
        {
          user_id: userId,
          diagnostics_enabled: diagnostics,
          analytics_enabled: analytics,
          consent_given_at: anyEnabled ? now : null,
          consent_revoked_at: !anyEnabled ? now : null,
          updated_at: now,
        },
        { onConflict: 'user_id' }
      );
    } catch {}

    // Start or stop session based on new consent
    if (analytics && !currentSessionId) {
      await Analytics.startSession();
    } else if (!analytics && currentSessionId) {
      await Analytics.endSession();
    }
  },

  getConsent(): ConsentStatus {
    return { ...consentStatus };
  },

  async flush(): Promise<void> {
    if (eventBuffer.length === 0) return;

    const events = [...eventBuffer];
    eventBuffer = [];

    try {
      await supabase.from('analytics_events').insert(events);
    } catch {
      // Put events back on failure (drop if buffer too large)
      if (eventBuffer.length < 500) {
        eventBuffer = [...events, ...eventBuffer];
      }
    }
  },

  async destroy(): Promise<void> {
    await Analytics.endSession();

    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }

    userId = null;
    consentStatus = { diagnostics: false, analytics: false };
    eventBuffer = [];
    initialized = false;

    try {
      await AsyncStorage.removeItem(CONSENT_CACHE_KEY);
    } catch {}
  },

  isInitialized(): boolean {
    return initialized;
  },

  getUserId(): string | null {
    return userId;
  },
};
