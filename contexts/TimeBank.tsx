import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { NativeModules, Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { z } from 'zod';
import {
  setSignedItem,
  setSignedItemWithRetry,
  setAsyncItemWithRetry,
  getSignedItem,
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  clampMinutes,
  initSecureStorage,
  LIMITS,
} from '@/utils/secureStorage';

const EarnScrollModule = Platform.OS !== 'web' ? NativeModules.EarnScrollModule : null;

// LAUNCH MODE — unlock every Pro feature for everyone.
// Flip to `false` after payment integration is ready; the Free/Pro split
// below returns to its original behavior with zero other code changes.
export const FREE_LAUNCH_MODE = true;

const EarningRatiosSchema = z.object({
  squats: z.number().min(0).max(LIMITS.MAX_EARNING_RATIO),
  pushups: z.number().min(0).max(LIMITS.MAX_EARNING_RATIO),
  planks: z.number().min(0).max(LIMITS.MAX_EARNING_RATIO),
});

const DailyWorkoutSchema = z.object({
  squats: z.number().min(0).default(0),
  pushups: z.number().min(0).default(0),
  plank: z.number().min(0).default(0),
});

const WorkoutHistorySchema = z.record(z.string(), DailyWorkoutSchema);

const VALID_FREE_EXERCISES = ['squats', 'pushups', 'planks'] as const;

const TIME_BANK_KEY = '@time_bank_minutes';
const EARNING_RATIOS_KEY = '@earning_ratios';
const LAST_WORKOUT_DATE_KEY = '@last_workout_date';
const CURRENT_STREAK_KEY = '@current_streak';
const EMERGENCY_PAUSES_KEY = '@emergency_pauses_remaining';
const LAST_PAUSE_RESET_KEY = '@last_pause_reset_date';
const EMERGENCY_PAUSE_MINUTES_KEY = '@emergency_pause_minutes';
const WORKOUT_HISTORY_KEY = '@workout_history';
const DEVELOPER_MODE_KEY = '@developer_mode';
const IS_USER_PRO_KEY = '@is_user_pro';
const HAS_COMPLETED_ONBOARDING_KEY = '@has_completed_onboarding';
const USER_FREE_EXERCISE_KEY = '@user_free_exercise';

export type EarningRatios = {
  squats: number;
  pushups: number;
  planks: number;
};

export type DailyWorkout = {
  squats: number;
  pushups: number;
  plank: number;
};

export type WorkoutHistory = {
  [date: string]: DailyWorkout;
};

export type FreeExerciseType = 'squats' | 'pushups' | 'planks' | null;

const DEFAULT_EARNING_RATIOS: EarningRatios = {
  squats: 1,
  pushups: 1,
  planks: 1,
};

export const [TimeBankProvider, useTimeBank] = createContextHook(() => {
  const [earnedMinutes, setEarnedMinutes] = useState<number>(0);
  const [earningRatios, setEarningRatios] = useState<EarningRatios>(DEFAULT_EARNING_RATIOS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [emergencyPausesRemaining, setEmergencyPausesRemaining] = useState<number>(3);
  const [lastPauseResetDate, setLastPauseResetDate] = useState<string | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory>({});
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(false);
  const [emergencyPauseMinutes, setEmergencyPauseMinutes] = useState<number>(5);
  const [isUserPro, setIsUserPro] = useState<boolean>(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [userFreeExercise, setUserFreeExercise] = useState<FreeExerciseType>(null);
  const hasRecordedTodayRef = useRef<boolean>(false);
  const lastWorkoutDateRef = useRef<string | null>(null);
  const currentStreakRef = useRef<number>(0);

  // Single batched load: pre-warm HMAC key, then read all storage in parallel
  useEffect(() => {
    const loadAll = async () => {
      try {
        // 1. Pre-warm the HMAC key so all subsequent getSignedItem calls hit cache
        await initSecureStorage();

        // 2. Batch all plain AsyncStorage reads into one multiGet call
        const asyncKeys = [
          LAST_WORKOUT_DATE_KEY,
          CURRENT_STREAK_KEY,
          EMERGENCY_PAUSES_KEY,
          LAST_PAUSE_RESET_KEY,
          EMERGENCY_PAUSE_MINUTES_KEY,
          HAS_COMPLETED_ONBOARDING_KEY,
          USER_FREE_EXERCISE_KEY,
        ];

        // 3. Fire all reads in parallel: multiGet + signed items + secure items
        const [asyncPairs, timeBankRaw, ratiosRaw, historyRaw, devModeRaw, proStatusRaw] = await Promise.all([
          AsyncStorage.multiGet(asyncKeys),
          getSignedItem(TIME_BANK_KEY),
          getSignedItem(EARNING_RATIOS_KEY),
          getSignedItem(WORKOUT_HISTORY_KEY),
          __DEV__ ? getSecureItem(DEVELOPER_MODE_KEY) : Promise.resolve(null),
          getSecureItem(IS_USER_PRO_KEY),
        ]);

        // 4. Unpack multiGet results into a map
        const asyncMap = new Map(asyncPairs);

        // -- Time bank --
        if (timeBankRaw !== null) {
          setEarnedMinutes(clampMinutes(parseFloat(timeBankRaw)));
        }

        // -- Earning ratios --
        if (ratiosRaw !== null) {
          try {
            const parsed = EarningRatiosSchema.safeParse(JSON.parse(ratiosRaw));
            if (parsed.success) setEarningRatios(parsed.data);
          } catch {}
        }

        // -- Streak data --
        const storedDate = asyncMap.get(LAST_WORKOUT_DATE_KEY) ?? null;
        const storedStreak = asyncMap.get(CURRENT_STREAK_KEY) ?? null;
        if (storedDate !== null) {
          setLastWorkoutDate(storedDate);
          lastWorkoutDateRef.current = storedDate;
        }
        if (storedStreak !== null) {
          const parsed = parseInt(storedStreak, 10);
          if (!isNaN(parsed)) {
            setCurrentStreak(parsed);
            currentStreakRef.current = parsed;
          }
        }
        hasRecordedTodayRef.current = storedDate === new Date().toDateString();

        // -- Emergency pauses --
        const storedPauses = asyncMap.get(EMERGENCY_PAUSES_KEY) ?? null;
        const storedResetDate = asyncMap.get(LAST_PAUSE_RESET_KEY) ?? null;
        const today = new Date().toDateString();
        if (storedResetDate === null || storedResetDate !== today) {
          setEmergencyPausesRemaining(3);
          setLastPauseResetDate(today);
          AsyncStorage.setItem(EMERGENCY_PAUSES_KEY, '3').catch(() => {});
          AsyncStorage.setItem(LAST_PAUSE_RESET_KEY, today).catch(() => {});
        } else {
          if (storedPauses !== null) {
            const pauses = parseInt(storedPauses, 10);
            if (!isNaN(pauses)) setEmergencyPausesRemaining(pauses);
          }
          setLastPauseResetDate(storedResetDate);
        }

        // -- Emergency pause minutes --
        const storedMinutes = asyncMap.get(EMERGENCY_PAUSE_MINUTES_KEY) ?? null;
        if (storedMinutes !== null) {
          const parsed = parseInt(storedMinutes, 10);
          if (!isNaN(parsed) && parsed > 0 && parsed <= LIMITS.MAX_EMERGENCY_PAUSE_MINUTES) {
            setEmergencyPauseMinutes(parsed);
          }
        }

        // -- Workout history --
        if (historyRaw !== null) {
          try {
            const parsed = WorkoutHistorySchema.safeParse(JSON.parse(historyRaw));
            if (parsed.success) {
              const entries = Object.entries(parsed.data);
              const limited = entries.length > LIMITS.MAX_WORKOUT_HISTORY_DAYS
                ? Object.fromEntries(entries.slice(-LIMITS.MAX_WORKOUT_HISTORY_DAYS))
                : parsed.data;
              setWorkoutHistory(limited);
            }
          } catch {}
        }

        // -- Developer mode --
        if (__DEV__ && devModeRaw !== null) {
          setIsDeveloperMode(devModeRaw === 'true');
        }

        // -- Freemium data --
        if (proStatusRaw !== null) {
          setIsUserPro(proStatusRaw === 'true');
        }
        const storedOnboarding = asyncMap.get(HAS_COMPLETED_ONBOARDING_KEY) ?? null;
        if (storedOnboarding !== null) {
          setHasCompletedOnboarding(storedOnboarding === 'true');
        }
        const storedFreeExercise = asyncMap.get(USER_FREE_EXERCISE_KEY) ?? null;
        if (storedFreeExercise !== null && VALID_FREE_EXERCISES.includes(storedFreeExercise as any)) {
          setUserFreeExercise(storedFreeExercise as FreeExerciseType);
        }
      } catch (error) {
        console.error('Failed to load app data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, []);

  // Sync earned minutes to the native BlockerService
  useEffect(() => {
    if (EarnScrollModule?.setMinutesFloat) {
      EarnScrollModule.setMinutesFloat(earnedMinutes);
    } else if (EarnScrollModule?.setMinutes) {
      EarnScrollModule.setMinutes(Math.floor(earnedMinutes));
    }
  }, [earnedMinutes]);

  // When EarnScroll returns to foreground, read back natively-drained minutes
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active' && EarnScrollModule?.getMinutes) {
        try {
          const nativeMinutes: number = await EarnScrollModule.getMinutes();
          setEarnedMinutes(prev => {
            const clamped = clampMinutes(nativeMinutes);
            if (clamped < prev) {
              setSignedItem(TIME_BANK_KEY, clamped.toString()).catch(() => {});
              return clamped;
            }
            return prev;
          });
        } catch (_) {}
      }
    });
    return () => sub.remove();
  }, []);

  const calculateStreakFromHistory = useCallback((history: WorkoutHistory): number => {
    const dates = Object.keys(history).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (dates.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mostRecentDate = new Date(dates[0]);
    mostRecentDate.setHours(0, 0, 0, 0);

    const daysSinceLastWorkout = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastWorkout > 1) {
      return 0;
    }

    let streak = 1;
    let expectedDate = new Date(mostRecentDate);
    expectedDate.setDate(expectedDate.getDate() - 1);

    for (let i = 1; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      currentDate.setHours(0, 0, 0, 0);

      if (currentDate.getTime() === expectedDate.getTime()) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, []);

  const updateStreak = useCallback(async () => {
    const today = new Date();
    const todayString = today.toDateString();
    const lastDate = lastWorkoutDateRef.current;
    const streak = currentStreakRef.current;

    if (!lastDate) {
      setCurrentStreak(1);
      currentStreakRef.current = 1;
      setLastWorkoutDate(todayString);
      lastWorkoutDateRef.current = todayString;
      await AsyncStorage.setItem(LAST_WORKOUT_DATE_KEY, todayString);
      await AsyncStorage.setItem(CURRENT_STREAK_KEY, '1');
      return;
    }

    const lastDateObj = new Date(lastDate);
    const timeDiff = today.getTime() - lastDateObj.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no streak update
    } else if (daysDiff === 1) {
      const newStreak = streak + 1;
      setCurrentStreak(newStreak);
      currentStreakRef.current = newStreak;
      setLastWorkoutDate(todayString);
      lastWorkoutDateRef.current = todayString;
      await AsyncStorage.setItem(LAST_WORKOUT_DATE_KEY, todayString);
      await AsyncStorage.setItem(CURRENT_STREAK_KEY, newStreak.toString());
    } else {
      setCurrentStreak(1);
      currentStreakRef.current = 1;
      setLastWorkoutDate(todayString);
      lastWorkoutDateRef.current = todayString;
      await AsyncStorage.setItem(LAST_WORKOUT_DATE_KEY, todayString);
      await AsyncStorage.setItem(CURRENT_STREAK_KEY, '1');
    }
  }, []);

  const addMinutes = useCallback(async (minutes: number) => {
    if (!Number.isFinite(minutes) || minutes <= 0) return;

    setEarnedMinutes(prev => {
      const newTotal = clampMinutes(prev + minutes);
      // Retry on failure so a transient write error can't permanently desync the
      // time bank (the app's core currency) from what's shown on screen.
      setSignedItemWithRetry(TIME_BANK_KEY, newTotal.toString());
      return newTotal;
    });

    if (!hasRecordedTodayRef.current) {
      hasRecordedTodayRef.current = true;
      updateStreak();
    }
  }, [updateStreak]);

  const resetTimeBank = useCallback(async () => {
    setEarnedMinutes(0);
    try {
      await setSignedItem(TIME_BANK_KEY, '0');
      console.log('✓ Time bank reset');
    } catch (error) {
      console.error('Failed to reset time bank:', error);
    }
  }, []);

  const updateEarningRatios = useCallback(async (newRatios: Partial<EarningRatios>) => {
    setEarningRatios(prev => {
      const updated = { ...prev, ...newRatios };
      // Validate before persisting
      const validated = EarningRatiosSchema.safeParse(updated);
      if (!validated.success) return prev;
      setSignedItem(EARNING_RATIOS_KEY, JSON.stringify(validated.data)).catch(error => {
        console.error('Failed to save earning ratios:', error);
      });
      console.log('✓ Updated earning ratios:', validated.data);
      return validated.data;
    });
  }, []);

  const addExerciseToHistory = useCallback(async (exerciseType: 'squats' | 'pushups' | 'planks', amount: number) => {
    const today = new Date().toISOString().split('T')[0];

    setWorkoutHistory(prev => {
      const updated = { ...prev };

      if (!updated[today]) {
        updated[today] = { squats: 0, pushups: 0, plank: 0 };
      }

      if (exerciseType === 'planks') {
        updated[today].plank += amount;
      } else {
        updated[today][exerciseType] += amount;
      }

      setSignedItemWithRetry(WORKOUT_HISTORY_KEY, JSON.stringify(updated));

      console.log(`✓ Added to history [${today}]:`, exerciseType, amount, '→', updated[today]);

      const newStreak = calculateStreakFromHistory(updated);
      setCurrentStreak(newStreak);
      setAsyncItemWithRetry(CURRENT_STREAK_KEY, newStreak.toString());

      return updated;
    });
  }, [calculateStreakFromHistory]);

  const triggerEmergencyPause = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (isDeveloperMode) {
      await addMinutes(emergencyPauseMinutes);
      return {
        success: true,
        message: `Emergency access granted! ${emergencyPauseMinutes} minutes added. (Developer Mode - Unlimited)`
      };
    }

    if (emergencyPausesRemaining <= 0) {
      console.log('[EMERGENCY] No pauses remaining');
      return { success: false, message: 'No emergency pauses remaining for today.' };
    }

    const newPausesRemaining = emergencyPausesRemaining - 1;
    setEmergencyPausesRemaining(newPausesRemaining);

    await addMinutes(emergencyPauseMinutes);

    try {
      await AsyncStorage.setItem(EMERGENCY_PAUSES_KEY, newPausesRemaining.toString());
      console.log(`[EMERGENCY] Used emergency pause. Remaining: ${newPausesRemaining}`);
      return {
        success: true,
        message: `Emergency access granted! ${emergencyPauseMinutes} minutes added. ${newPausesRemaining} pause${newPausesRemaining === 1 ? '' : 's'} remaining.`
      };
    } catch (error) {
      console.error('Failed to save emergency pauses:', error);
      return { success: true, message: `${emergencyPauseMinutes} minutes added to your time bank!` };
    }
  }, [emergencyPausesRemaining, addMinutes, isDeveloperMode, emergencyPauseMinutes]);

  const generateMockWorkoutHistory = useCallback(async (daysBack: number = 30) => {
    const mockHistory: WorkoutHistory = {};
    const today = new Date();

    for (let i = 0; i < daysBack; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      if (Math.random() > 0.3) {
        mockHistory[dateString] = {
          squats: Math.floor(Math.random() * 50) + 10,
          pushups: Math.floor(Math.random() * 30) + 5,
          plank: Math.floor(Math.random() * 120) + 30,
        };
      }
    }

    setWorkoutHistory(mockHistory);
    await setSignedItem(WORKOUT_HISTORY_KEY, JSON.stringify(mockHistory));

    const newStreak = calculateStreakFromHistory(mockHistory);
    setCurrentStreak(newStreak);
    await AsyncStorage.setItem(CURRENT_STREAK_KEY, newStreak.toString());

    console.log(`✓ Generated ${Object.keys(mockHistory).length} days of mock workout data`);
    return mockHistory;
  }, [calculateStreakFromHistory]);

  const clearAllWorkoutHistory = useCallback(async () => {
    setWorkoutHistory({});
    setCurrentStreak(0);
    currentStreakRef.current = 0;
    setLastWorkoutDate(null);
    lastWorkoutDateRef.current = null;
    hasRecordedTodayRef.current = false;

    try {
      await AsyncStorage.multiRemove([
        CURRENT_STREAK_KEY,
        LAST_WORKOUT_DATE_KEY,
      ]);
      await setSignedItem(WORKOUT_HISTORY_KEY, JSON.stringify({}));
      await AsyncStorage.setItem(CURRENT_STREAK_KEY, '0');
    } catch (error) {
      console.error('Failed to clear workout history:', error);
    }
  }, []);

  const enableDeveloperMode = useCallback(async () => {
    if (FREE_LAUNCH_MODE) return; // Developer mode disabled in launch builds
    if (!__DEV__) return; // Only in development builds
    setIsDeveloperMode(true);
    await setSecureItem(DEVELOPER_MODE_KEY, 'true');
    console.log('✓ Developer mode enabled');
  }, []);

  const disableDeveloperMode = useCallback(async () => {
    setIsDeveloperMode(false);
    await setSecureItem(DEVELOPER_MODE_KEY, 'false');
    console.log('✓ Developer mode disabled');
  }, []);

  const updateEmergencyPauseMinutes = useCallback(async (minutes: number) => {
    const clamped = Math.max(1, Math.min(minutes, LIMITS.MAX_EMERGENCY_PAUSE_MINUTES));
    setEmergencyPauseMinutes(clamped);
    await AsyncStorage.setItem(EMERGENCY_PAUSE_MINUTES_KEY, clamped.toString());
    console.log(`✓ Emergency pause minutes updated to: ${clamped}`);
  }, []);

  const toggleProStatus = useCallback(async () => {
    // Dev-only manual override for testing the Free/Pro split.
    // Real Pro status will be set by the Google Play Billing flow (see services/billing.ts).
    if (FREE_LAUNCH_MODE) return isUserPro;
    if (!__DEV__) return isUserPro;
    const newProStatus = !isUserPro;
    setIsUserPro(newProStatus);
    await setSecureItem(IS_USER_PRO_KEY, newProStatus.toString());
    console.log(`✓ Pro status toggled to: ${newProStatus}`);
    return newProStatus;
  }, [isUserPro]);

  const completeOnboarding = useCallback(async (selectedExercise: 'squats' | 'pushups' | 'planks' = 'squats') => {
    setUserFreeExercise(selectedExercise);
    setHasCompletedOnboarding(true);
    await Promise.all([
      AsyncStorage.setItem(USER_FREE_EXERCISE_KEY, selectedExercise),
      AsyncStorage.setItem(HAS_COMPLETED_ONBOARDING_KEY, 'true'),
    ]);
    console.log(`✓ Onboarding completed with free exercise: ${selectedExercise}`);
  }, []);

  const resetOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(false);
    setUserFreeExercise(null);
    setIsUserPro(false);
    setEarnedMinutes(0);
    setWorkoutHistory({});
    setCurrentStreak(0);
    currentStreakRef.current = 0;
    setLastWorkoutDate(null);
    lastWorkoutDateRef.current = null;
    setEmergencyPausesRemaining(3);

    await AsyncStorage.multiRemove([
      HAS_COMPLETED_ONBOARDING_KEY,
      USER_FREE_EXERCISE_KEY,
      TIME_BANK_KEY,
      WORKOUT_HISTORY_KEY,
      CURRENT_STREAK_KEY,
      LAST_WORKOUT_DATE_KEY,
      EMERGENCY_PAUSES_KEY,
    ]);
    // Remove secure items separately
    await removeSecureItem(IS_USER_PRO_KEY);

    hasRecordedTodayRef.current = false;
    console.log('✓ Onboarding and all data reset');
  }, []);

  return useMemo(
    () => ({
      earnedMinutes,
      earningRatios,
      isLoading,
      lastWorkoutDate,
      currentStreak,
      emergencyPausesRemaining,
      emergencyPauseMinutes,
      lastPauseResetDate,
      workoutHistory,
      isDeveloperMode: FREE_LAUNCH_MODE ? false : isDeveloperMode,
      isUserPro: FREE_LAUNCH_MODE ? true : isUserPro,
      hasCompletedOnboarding,
      userFreeExercise,
      addMinutes,
      resetTimeBank,
      updateEarningRatios,
      triggerEmergencyPause,
      addExerciseToHistory,
      calculateStreakFromHistory,
      generateMockWorkoutHistory,
      clearAllWorkoutHistory,
      enableDeveloperMode,
      disableDeveloperMode,
      updateEmergencyPauseMinutes,
      toggleProStatus,
      completeOnboarding,
      resetOnboarding,
    }),
    [
      earnedMinutes,
      earningRatios,
      isLoading,
      lastWorkoutDate,
      currentStreak,
      emergencyPausesRemaining,
      emergencyPauseMinutes,
      lastPauseResetDate,
      workoutHistory,
      isDeveloperMode,
      isUserPro,
      hasCompletedOnboarding,
      userFreeExercise,
      addMinutes,
      resetTimeBank,
      updateEarningRatios,
      triggerEmergencyPause,
      addExerciseToHistory,
      calculateStreakFromHistory,
      generateMockWorkoutHistory,
      clearAllWorkoutHistory,
      enableDeveloperMode,
      disableDeveloperMode,
      updateEmergencyPauseMinutes,
      toggleProStatus,
      completeOnboarding,
      resetOnboarding,
    ]
  );
});
