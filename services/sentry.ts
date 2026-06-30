import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = 'https://8ef7502a5075f46b7b59e26d9f7bfa29@o4511276915621888.ingest.de.sentry.io/4511276946686032';

let sentryInitialized = false;
let consentGranted = false;

function buildReleaseTag(): string | undefined {
  try {
    const cfg = Constants.expoConfig;
    const name = cfg?.slug ?? cfg?.name ?? 'earnscroll';
    const version = cfg?.version ?? '0.0.0';
    const runtime = cfg?.runtimeVersion ?? cfg?.sdkVersion ?? undefined;
    return runtime ? `${name}@${version}+${runtime}` : `${name}@${version}`;
  } catch {
    return undefined;
  }
}

function buildDistTag(): string | undefined {
  try {
    const versionCode = Constants.expoConfig?.android?.versionCode;
    return versionCode != null ? String(versionCode) : undefined;
  } catch {
    return undefined;
  }
}

function stripPii<T extends Sentry.Event>(event: T): T {
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
  }
  if (event.request?.url) {
    const idx = event.request.url.indexOf('?');
    if (idx >= 0) event.request.url = event.request.url.slice(0, idx);
  }
  if (event.request?.query_string) {
    delete event.request.query_string;
  }
  return event;
}

export function initSentry(
  userId?: string,
  diagnosticsEnabled: boolean = false
): void {
  if (!diagnosticsEnabled || sentryInitialized) return;

  consentGranted = true;

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    profilesSampleRate: 0,
    enableAutoSessionTracking: false,
    sendDefaultPii: false,
    attachStacktrace: true,
    debug: __DEV__,
    enabled: !__DEV__,
    release: buildReleaseTag(),
    dist: buildDistTag(),
    beforeSend: (event) => {
      // Defense in depth: drop entirely if consent has been revoked
      // mid-session (between init() and an in-flight capture).
      if (!consentGranted) return null;
      return stripPii(event);
    },
  });

  if (userId) {
    // Use anonymous ID — sendDefaultPii is already false, but be explicit.
    Sentry.setUser({ id: userId });
  }

  sentryInitialized = true;
}

export function setSentryUser(userId: string): void {
  if (!sentryInitialized) return;
  Sentry.setUser({ id: userId });
}

export function clearSentryUser(): void {
  if (!sentryInitialized) return;
  Sentry.setUser(null);
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (!sentryInitialized || !consentGranted) return;
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
): void {
  if (!sentryInitialized || !consentGranted) return;
  Sentry.captureMessage(message, level);
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  if (!sentryInitialized || !consentGranted) return;
  Sentry.addBreadcrumb(breadcrumb);
}

export async function closeSentry(): Promise<void> {
  if (!sentryInitialized) return;
  consentGranted = false;
  await Sentry.close();
  sentryInitialized = false;
}

export function isSentryInitialized(): boolean {
  return sentryInitialized;
}

export { Sentry };
