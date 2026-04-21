import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { digestStringAsync, CryptoDigestAlgorithm, randomUUID } from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// HMAC secret derived from a device-stable seed.
// In a future version with user auth, this should come from the server.
const HMAC_KEY_STORAGE = '@_hmac_key';

let cachedHmacKey: string | null = null;
let hmacKeyPromise: Promise<string> | null = null;

/**
 * Get or create an HMAC key unique to this device/install.
 * Stored in SecureStore so it survives app restarts but not uninstalls.
 * Uses a shared promise to avoid duplicate SecureStore reads when called concurrently.
 */
async function getHmacKey(): Promise<string> {
  if (cachedHmacKey) return cachedHmacKey;
  if (hmacKeyPromise) return hmacKeyPromise;

  hmacKeyPromise = _loadHmacKey();
  return hmacKeyPromise;
}

async function _loadHmacKey(): Promise<string> {

  if (Platform.OS === 'web') {
    cachedHmacKey = 'web-dev-key-not-secure';
    return cachedHmacKey;
  }

  try {
    const existing = await SecureStore.getItemAsync(HMAC_KEY_STORAGE);
    if (existing) {
      cachedHmacKey = existing;
      return existing;
    }

    const newKey = randomUUID();
    await SecureStore.setItemAsync(HMAC_KEY_STORAGE, newKey);
    cachedHmacKey = newKey;
    return newKey;
  } catch {
    cachedHmacKey = 'fallback-key';
    return cachedHmacKey;
  }
}

/**
 * Pre-warm the HMAC key cache. Call once at app startup before any getSignedItem calls.
 */
export async function initSecureStorage(): Promise<void> {
  await getHmacKey();
}

/**
 * Compute a SHA-256 HMAC-like digest for integrity verification.
 * Uses SHA-256(key + ":" + value) as a simple integrity check.
 */
async function computeDigest(value: string): Promise<string> {
  const key = await getHmacKey();
  const message = `${key}:${value}`;
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, message);
}

/**
 * Store a value with integrity signature.
 * Saves both the value and its HMAC digest.
 */
export async function setSignedItem(storageKey: string, value: string): Promise<void> {
  const digest = await computeDigest(value);
  const payload = JSON.stringify({ v: value, d: digest });
  await AsyncStorage.setItem(storageKey, payload);
}

/**
 * Retrieve a value and verify its integrity signature.
 * Returns null if the value is missing or tampered with.
 */
export async function getSignedItem(storageKey: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw === null) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.v !== 'string' || typeof parsed.d !== 'string') {
      // Legacy unsigned data - migrate it
      return raw;
    }

    const expectedDigest = await computeDigest(parsed.v);
    if (expectedDigest !== parsed.d) {
      // Tampered! Return null to force reset to default
      console.warn(`Integrity check failed for ${storageKey}`);
      await AsyncStorage.removeItem(storageKey);
      return null;
    }

    return parsed.v;
  } catch {
    return null;
  }
}

/**
 * Store sensitive data in SecureStore (encrypted, hardware-backed).
 * Falls back to AsyncStorage on web.
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Fallback to signed AsyncStorage if SecureStore fails
    await setSignedItem(key, value);
  }
}

/**
 * Retrieve sensitive data from SecureStore.
 * Falls back to AsyncStorage on web.
 */
export async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    // Fallback to signed AsyncStorage
    return getSignedItem(key);
  }
}

/**
 * Remove an item from SecureStore.
 */
export async function removeSecureItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.removeItem(key);
  }
}

// Maximum allowed values for input validation
export const LIMITS = {
  MAX_TIME_BANK_MINUTES: 1440, // 24 hours
  MAX_EARNING_RATIO: 10,
  MAX_EMERGENCY_PAUSE_MINUTES: 60,
  MAX_BLOCKED_PACKAGES: 200,
  MAX_WORKOUT_HISTORY_DAYS: 365,
} as const;

/**
 * Validate a numeric value is finite and within bounds.
 */
export function clampMinutes(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, LIMITS.MAX_TIME_BANK_MINUTES);
}
