import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/contexts/Auth';
import { Analytics } from '@/services/analytics';
import {
  initSentry,
  setSentryUser,
  clearSentryUser,
  closeSentry,
  addBreadcrumb,
} from '@/services/sentry';

export const [AnalyticsProvider, useAnalytics] = createContextHook(() => {
  const { user, isAuthenticated, isGuest } = useAuth();
  const [consent, setConsent] = useState({ diagnostics: false, analytics: false });
  const [showConsentPrompt, setShowConsentPrompt] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const shouldTrack = isAuthenticated && !isGuest && !!user;

  // Initialize analytics when user authenticates
  useEffect(() => {
    if (!shouldTrack || !user) {
      // Tear down if user signs out or enters guest mode
      if (Analytics.isInitialized()) {
        Analytics.destroy();
        closeSentry();
        clearSentryUser();
      }
      setIsReady(false);
      setShowConsentPrompt(false);
      return;
    }

    let cancelled = false;

    const initialize = async () => {
      // Check if user has a consent record
      const hasRecord = await Analytics.hasConsentRecord(user.id);

      if (cancelled) return;

      if (!hasRecord) {
        setShowConsentPrompt(true);
        setIsReady(true);
        return;
      }

      // Has consent record — initialize with stored preferences
      const consentResult = await Analytics.init(user.id);
      if (cancelled) return;

      setConsent(consentResult);
      setShowConsentPrompt(false);
      setIsReady(true);

      // Initialize Sentry if diagnostics enabled
      if (consentResult.diagnostics) {
        initSentry(user.id, true);
        setSentryUser(user.id);
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [shouldTrack, user?.id]);

  // Handle AppState changes for session tracking
  useEffect(() => {
    if (!isReady || !consent.analytics) return;

    const handleAppState = (nextState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        Analytics.startSession();
        addBreadcrumb({ category: 'app', message: 'App foregrounded' });
      } else if (
        appStateRef.current === 'active' &&
        nextState.match(/inactive|background/)
      ) {
        Analytics.endSession();
        addBreadcrumb({ category: 'app', message: 'App backgrounded' });
      }
      appStateRef.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [isReady, consent.analytics]);

  const updateConsent = useCallback(
    async (diagnostics: boolean, analytics: boolean) => {
      await Analytics.setConsent(diagnostics, analytics);
      setConsent({ diagnostics, analytics });

      if (diagnostics && user) {
        initSentry(user.id, true);
        setSentryUser(user.id);
      } else if (!diagnostics) {
        await closeSentry();
      }

      setShowConsentPrompt(false);

      // If this is first consent and analytics enabled, start tracking
      if (!Analytics.isInitialized() && (diagnostics || analytics) && user) {
        await Analytics.init(user.id);
      }
    },
    [user]
  );

  const dismissConsentPrompt = useCallback(async () => {
    // User chose "Not Now" — save both as false
    if (user) {
      await Analytics.setConsent(false, false);
    }
    setShowConsentPrompt(false);
  }, [user]);

  const trackEvent = useCallback(
    (name: string, properties?: Record<string, unknown>) => {
      Analytics.trackEvent(name, properties);
    },
    []
  );

  const trackScreenView = useCallback((screenName: string) => {
    Analytics.trackScreenView(screenName);
  }, []);

  const log = useCallback(
    (
      level: 'info' | 'warn' | 'error',
      message: string,
      context?: Record<string, unknown>
    ) => {
      Analytics.log(level, message, context);
    },
    []
  );

  return useMemo(
    () => ({
      consent,
      showConsentPrompt,
      isReady,
      updateConsent,
      dismissConsentPrompt,
      trackEvent,
      trackScreenView,
      log,
    }),
    [
      consent,
      showConsentPrompt,
      isReady,
      updateConsent,
      dismissConsentPrompt,
      trackEvent,
      trackScreenView,
      log,
    ]
  );
});
