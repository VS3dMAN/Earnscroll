import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { z } from 'zod';

const EarningRatiosSchema = z.object({
  squats: z.number().min(0),
  pushups: z.number().min(0),
  planks: z.number().min(0),
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
  const [isUserPro, setIsUserPro] = useState<boolean>(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [userFreeExercise, setUserFreeExercise] = useState<FreeExerciseType>(null);
  const hasRecordedTodayRef = useRef<boolean>(false);
  const lastWorkoutDateRef = useRef<string | null>(null);
  const currentStreakRef = useRef<number>(0);

  useEffect(() => {
    loadTimeBank();
    loadEarningRatios();
    loadStreakData();
    loadEmergencyPausesData();
    loadWorkoutHistory();
    loadDeveloperMode();
    loadFreemiumData();
  }, []);

  const loadTimeBank = async () => {
    try {
      const stored = await AsyncStorage.getItem(TIME_BANK_KEY);
      if (stored !== null) {
        setEarnedMinutes(parseFloat(stored));
      }
    } catch (error) {
      console.error('Failed to load time bank:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEarningRatios = async () => {
    try {
      const stored = await AsyncStorage.getItem(EARNING_RATIOS_KEY);
      if (stored !== null) {
        const parsed = EarningRatiosSchema.safeParse(JSON.parse(stored));
        if (parsed.success) {
          setEarningRatios(parsed.data);
        } else {
          console.warn('Invalid earning ratios in storage, using defaults');
          setEarningRatios(DEFAULT_EARNING_RATIOS);
        }
      }
    } catch (error) {
      console.error('Failed to load earning ratios:', error);
    }
  };

  const loadStreakData = async () => {
    try {
      const [storedDate, storedStreak] = await Promise.all([
        AsyncStorage.getItem(LAST_WORKOUT_DATE_KEY),
        AsyncStorage.getItem(CURRENT_STREAK_KEY),
      ]);

      if (storedDate !== null) {
        setLastWorkoutDate(storedDate);
        lastWorkoutDateRef.current = storedDate;
      }
      if (storedStreak !== null) {
        const parsed = parseInt(storedStreak, 10);
        setCurrentStreak(parsed);
        currentStreakRef.current = parsed;
      }

      const today = new Date().toDateString();
      hasRecordedTodayRef.current = storedDate === today;

      console.log('✓ Loaded streak data:', { lastWorkoutDate: storedDate, currentStreak: storedStreak, hasRecordedToday: hasRecordedTodayRef.current });
    } catch (error) {
      console.error('Failed to load streak data:', error);
    }
  };

  const loadEmergencyPausesData = async () => {
    try {
      const [storedPauses, storedResetDate] = await Promise.all([
        AsyncStorage.getItem(EMERGENCY_PAUSES_KEY),
        AsyncStorage.getItem(LAST_PAUSE_RESET_KEY),
      ]);

      const today = new Date().toDateString();

      if (storedResetDate === null || storedResetDate !== today) {
        console.log('[EMERGENCY] New day detected, resetting pauses to 3');
        setEmergencyPausesRemaining(3);
        setLastPauseResetDate(today);
        await AsyncStorage.setItem(EMERGENCY_PAUSES_KEY, '3');
        await AsyncStorage.setItem(LAST_PAUSE_RESET_KEY, today);
      } else {
        if (storedPauses !== null) {
          const pauses = parseInt(storedPauses, 10);
          setEmergencyPausesRemaining(pauses);
          console.log(`✓ Loaded emergency pauses: ${pauses}`);
        }
        setLastPauseResetDate(storedResetDate);
      }
    } catch (error) {
      console.error('Failed to load emergency pauses data:', error);
    }
  };

  const loadWorkoutHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      if (stored !== null) {
        const parsed = WorkoutHistorySchema.safeParse(JSON.parse(stored));
        if (parsed.success) {
          setWorkoutHistory(parsed.data);
          console.log('✓ Loaded workout history:', Object.keys(parsed.data).length, 'days');
        } else {
          console.warn('Invalid workout history in storage, using empty');
          setWorkoutHistory({});
        }
      }
    } catch (error) {
      console.error('Failed to load workout history:', error);
    }
  };

  const loadDeveloperMode = async () => {
    try {
      const stored = await AsyncStorage.getItem(DEVELOPER_MODE_KEY);
      if (stored !== null) {
        setIsDeveloperMode(stored === 'true');
        console.log('✓ Loaded developer mode:', stored);
      }
    } catch (error) {
      console.error('Failed to load developer mode:', error);
    }
  };

  const loadFreemiumData = async () => {
    try {
      const [storedPro, storedOnboarding, storedFreeExercise] = await Promise.all([
        AsyncStorage.getItem(IS_USER_PRO_KEY),
        AsyncStorage.getItem(HAS_COMPLETED_ONBOARDING_KEY),
        AsyncStorage.getItem(USER_FREE_EXERCISE_KEY),
      ]);

      if (storedPro !== null) {
        setIsUserPro(storedPro === 'true');
      }
      if (storedOnboarding !== null) {
        setHasCompletedOnboarding(storedOnboarding === 'true');
      }
      if (storedFreeExercise !== null && VALID_FREE_EXERCISES.includes(storedFreeExercise as any)) {
        setUserFreeExercise(storedFreeExercise as FreeExerciseType);
      }

      console.log('✓ Loaded freemium data:', {
        isUserPro: storedPro,
        hasCompletedOnboarding: storedOnboarding,
        userFreeExercise: storedFreeExercise
      });
    } catch (error) {
      console.error('Failed to load freemium data:', error);
    }
  };

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
    if (minutes <= 0) return;

    setEarnedMinutes(prev => {
      const newTotal = prev + minutes;
      AsyncStorage.setItem(TIME_BANK_KEY, newTotal.toString()).catch(error => {
        console.error('Failed to save time bank:', error);
      });
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
      await AsyncStorage.removeItem(TIME_BANK_KEY);
      console.log('✓ Time bank reset');
    } catch (error) {
      console.error('Failed to reset time bank:', error);
    }
  }, []);

  const updateEarningRatios = useCallback(async (newRatios: Partial<EarningRatios>) => {
    setEarningRatios(prev => {
      const updated = { ...prev, ...newRatios };
      AsyncStorage.setItem(EARNING_RATIOS_KEY, JSON.stringify(updated)).catch(error => {
        console.error('Failed to save earning ratios:', error);
      });
      console.log('✓ Updated earning ratios:', updated);
      return updated;
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

      AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updated)).catch(error => {
        console.error('Failed to save workout history:', error);
      });

      console.log(`✓ Added to history [${today}]:`, exerciseType, amount, '→', updated[today]);

      const newStreak = calculateStreakFromHistory(updated);
      setCurrentStreak(newStreak);
      AsyncStorage.setItem(CURRENT_STREAK_KEY, newStreak.toString()).catch(error => {
        console.error('Failed to save streak:', error);
      });

      return updated;
    });
  }, [calculateStreakFromHistory]);

  const triggerEmergencyPause = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (isDeveloperMode) {
      await addMinutes(5);
      return {
        success: true,
        message: `Emergency access granted! 5 minutes added. (Developer Mode - Unlimited)`
      };
    }

    if (emergencyPausesRemaining <= 0) {
      console.log('[EMERGENCY] No pauses remaining');
      return { success: false, message: 'No emergency pauses remaining for today.' };
    }

    const newPausesRemaining = emergencyPausesRemaining - 1;
    setEmergencyPausesRemaining(newPausesRemaining);

    await addMinutes(5);

    try {
      await AsyncStorage.setItem(EMERGENCY_PAUSES_KEY, newPausesRemaining.toString());
      console.log(`[EMERGENCY] Used emergency pause. Remaining: ${newPausesRemaining}`);
      return {
        success: true,
        message: `Emergency access granted! 5 minutes added. ${newPausesRemaining} pause${newPausesRemaining === 1 ? '' : 's'} remaining.`
      };
    } catch (error) {
      console.error('Failed to save emergency pauses:', error);
      return { success: true, message: '5 minutes added to your time bank!' };
    }
  }, [emergencyPausesRemaining, addMinutes, isDeveloperMode]);

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
    await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(mockHistory));

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
        WORKOUT_HISTORY_KEY,
        CURRENT_STREAK_KEY,
        LAST_WORKOUT_DATE_KEY,
      ]);
      await AsyncStorage.multiSet([
        [WORKOUT_HISTORY_KEY, JSON.stringify({})],
        [CURRENT_STREAK_KEY, '0'],
      ]);
    } catch (error) {
      console.error('Failed to clear workout history:', error);
    }
  }, []);

  const enableDeveloperMode = useCallback(async () => {
    setIsDeveloperMode(true);
    await AsyncStorage.setItem(DEVELOPER_MODE_KEY, 'true');
    console.log('✓ Developer mode enabled');
  }, []);

  const disableDeveloperMode = useCallback(async () => {
    setIsDeveloperMode(false);
    await AsyncStorage.setItem(DEVELOPER_MODE_KEY, 'false');
    console.log('✓ Developer mode disabled');
  }, []);

  const toggleProStatus = useCallback(async () => {
    const newProStatus = !isUserPro;
    setIsUserPro(newProStatus);
    await AsyncStorage.setItem(IS_USER_PRO_KEY, newProStatus.toString());
    console.log(`✓ Pro status toggled to: ${newProStatus}`);
    return newProStatus;
  }, [isUserPro]);

  const completeOnboarding = useCallback(async (selectedExercise: 'squats' | 'pushups' | 'planks') => {
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
      IS_USER_PRO_KEY,
      TIME_BANK_KEY,
      WORKOUT_HISTORY_KEY,
      CURRENT_STREAK_KEY,
      LAST_WORKOUT_DATE_KEY,
      EMERGENCY_PAUSES_KEY,
    ]);

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
      toggleProStatus,
      completeOnboarding,
      resetOnboarding,
    ]
  );
});
