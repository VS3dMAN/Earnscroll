# State Management Architecture

## 🏗️ Overview

EarnScroll uses a **dual-context hybrid state management** approach combining:
1. **TimeBank Context** (`@nkzw/create-context-hook`) for app-wide workout data
2. **Theme Context** (`@nkzw/create-context-hook`) for theme preferences
3. **AsyncStorage** for persistence
4. **React Query** (configured globally; currently used primarily as infrastructure, with most app state stored in contexts)
5. **Local useState** for component-specific UI state

This document details the architecture, patterns, and reasoning behind state decisions.

## 🔧 Core State Management: TimeBank Context

### Why `@nkzw/create-context-hook`?

**Traditional React Context Issues**:
```typescript
// ❌ Verbose boilerplate
const Context = createContext();
const Provider = ({ children }) => { ... };
const useContext = () => { ... };
```

**With `create-context-hook`**:
```typescript
// ✅ One-liner with full type safety
export const [TimeBankProvider, useTimeBank] = createContextHook(() => {
  // All your hooks and state here
  return { /* exposed API */ };
});
```

**Benefits**:
- Zero boilerplate
- Type-safe by default
- Hooks work normally inside
- Clean API export
- No manual TypeScript generics needed

### Complete TimeBank State Schema

```typescript
interface TimeBankState {
  // Core Features
  earnedMinutes: number;                          // Total screen time earned
  earningRatios: EarningRatios;                   // Custom earning rates per exercise
  isLoading: boolean;                             // Initial load state
  
  // Streak System
  lastWorkoutDate: string | null;                 // Last recorded workout date
  currentStreak: number;                          // Consecutive workout days
  
  // Emergency Access
  emergencyPausesRemaining: number;               // Daily emergency uses (3 max, resets daily)
  
  // Workout History
  workoutHistory: WorkoutHistory;                 // { [date]: { squats, pushups, plank } }
  
  // Freemium Model
  isUserPro: boolean;                             // Pro status (default: false)
  hasCompletedOnboarding: boolean;                // First-time setup complete
  userFreeExercise: FreeExerciseType;             // Free user's choice ('squats' | 'pushups' | 'planks' | null)
  
  // Developer Mode
  isDeveloperMode: boolean;                       // Hidden dev menu access
  
  // Methods
  addMinutes: (minutes: number) => Promise<void>;
  resetTimeBank: () => Promise<void>;
  updateEarningRatios: (ratios: Partial<EarningRatios>) => Promise<void>;
  triggerEmergencyPause: () => Promise<{ success: boolean; message: string }>;
  addExerciseToHistory: (type: string, amount: number) => Promise<void>;
  calculateStreakFromHistory: (history: WorkoutHistory) => number;
  generateMockWorkoutHistory: (days: number) => Promise<WorkoutHistory>;
  clearAllWorkoutHistory: () => Promise<void>;
  enableDeveloperMode: () => Promise<void>;
  disableDeveloperMode: () => Promise<void>;
  toggleProStatus: () => Promise<boolean>;
  completeOnboarding: (exercise: string) => Promise<void>;
  resetOnboarding: () => Promise<void>;
}
```

### Type Definitions

```typescript
export type EarningRatios = {
  squats: number;    // Minutes earned per squat
  pushups: number;   // Minutes earned per pushup
  planks: number;    // Ratio (e.g., 3 = 3min earned per 1min planked)
};

export type DailyWorkout = {
  squats: number;    // Count of squats
  pushups: number;   // Count of pushups
  plank: number;     // Seconds of plank held
};

export type WorkoutHistory = {
  [date: string]: DailyWorkout;  // Date format: YYYY-MM-DD
};

export type FreeExerciseType = 'squats' | 'pushups' | 'planks' | null;
```

## 🎨 Theme Context

### Why Separate Theme Context?

Separating theme from workout data:
- Prevents unnecessary re-renders when theme changes
- Different persistence patterns (theme is purely UI preference)
- Can be used independently in any component
- Cleaner separation of concerns

### Theme State Schema

```typescript
interface ThemeState {
  theme: Theme;                              // Active theme object
  themeMode: ThemeMode;                      // 'light' | 'dark' | 'system'
  updateThemeMode: (mode: ThemeMode) => Promise<void>;
  isHydrated: boolean;                       // AsyncStorage loaded
}

export type Theme = {
  background: string;        // Main background color
  card: string;              // Card background
  text: string;              // Primary text
  textSecondary: string;     // Secondary text (cloudy grey in dark mode)
  border: string;            // Border color
  primary: string;           // Primary accent (cyan)
  success: string;           // Success color (green)
  warning: string;           // Warning color (amber)
  danger: string;            // Danger color (red)
  isDark: boolean;           // Dark mode flag
  fonts: FontFamily;         // Typography system
};
```

### Theme Implementation

```typescript
const lightTheme: Theme = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  // ... other colors
  isDark: false,
  fonts: typography.fontFamily,
};

const darkTheme: Theme = {
  background: industrialBackground,   // #090E1B
  card: industrialCard,                // #12182C
  text: '#F5F7FB',
  textSecondary: cloudyGrey,           // #E0E5EE with opacity
  // ... other colors
  isDark: true,
  fonts: typography.fontFamily,
};
```

### System Theme Detection

```typescript
// Listen to OS theme changes
const subscription = Appearance.addChangeListener(({ colorScheme }) => {
  setSystemColorScheme(colorScheme || 'light');
});

// Apply theme based on mode
const activeTheme = useMemo((): Theme => {
  let effectiveColorScheme: 'light' | 'dark' = 'light';
  
  if (themeMode === 'system') {
    effectiveColorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light');
  } else {
    effectiveColorScheme = themeMode as 'light' | 'dark';
  }
  
  return effectiveColorScheme === 'dark' ? darkTheme : lightTheme;
}, [themeMode, systemColorScheme]);
```

## 💾 Data Persistence Strategy

### AsyncStorage Keys

```typescript
// TimeBank Context Keys
const TIME_BANK_KEY = '@time_bank_minutes';
const EARNING_RATIOS_KEY = '@earning_ratios';
const WORKOUT_HISTORY_KEY = '@workout_history';
const CURRENT_STREAK_KEY = '@current_streak';
const LAST_WORKOUT_DATE_KEY = '@last_workout_date';
const EMERGENCY_PAUSES_KEY = '@emergency_pauses_remaining';
const LAST_PAUSE_RESET_KEY = '@last_pause_reset_date';
const IS_USER_PRO_KEY = '@is_user_pro';
const HAS_COMPLETED_ONBOARDING_KEY = '@has_completed_onboarding';
const USER_FREE_EXERCISE_KEY = '@user_free_exercise';
const DEVELOPER_MODE_KEY = '@developer_mode';

// Theme Context Keys
const THEME_KEY = '@theme_mode';
```

### Load Strategy (On App Launch)

```typescript
// TimeBank Context - Parallel loading
useEffect(() => {
  loadTimeBank();           // Total earned minutes
  loadEarningRatios();      // Custom ratios
  loadStreakData();         // Streak and last workout date
  loadEmergencyPausesData(); // Emergency uses + daily reset
  loadWorkoutHistory();     // Complete exercise log
  loadDeveloperMode();      // Dev menu access
  loadFreemiumData();       // Pro status, onboarding, free exercise
}, []);

// Theme Context - Separate loading
useEffect(() => {
  loadThemeMode();          // User's theme preference
  // Subscribe to system theme changes
  const subscription = Appearance.addChangeListener(...);
  return () => subscription.remove();
}, []);
```

**Why parallel loading?**
- Faster app startup
- Independent data domains
- AsyncStorage handles concurrent reads efficiently
- Each load function has its own error handling

### Save Strategy (Immediate)

```typescript
// ✅ Fire-and-forget saves (don't block UI)
const addMinutes = useCallback(async (minutes: number) => {
  setEarnedMinutes(prev => {
    const newTotal = prev + minutes;
    
    // Save to AsyncStorage asynchronously
    AsyncStorage.setItem(TIME_BANK_KEY, newTotal.toString())
      .catch(error => console.error('Failed to save:', error));
    
    return newTotal;
  });
}, []);

// ✅ Await critical operations (onboarding, reset)
const completeOnboarding = useCallback(async (selectedExercise) => {
  setUserFreeExercise(selectedExercise);
  setHasCompletedOnboarding(true);
  
  await Promise.all([
    AsyncStorage.setItem(USER_FREE_EXERCISE_KEY, selectedExercise),
    AsyncStorage.setItem(HAS_COMPLETED_ONBOARDING_KEY, 'true'),
  ]);
}, []);
```

**Why immediate saves?**
- Prevents data loss if app crashes
- No need for manual "Save" button
- AsyncStorage is fast enough for instant operations
- User expects persistence immediately

## 🎯 State Update Patterns

### Pattern 1: Simple State Update + Persist

```typescript
const updateEarningRatios = useCallback(async (newRatios: Partial<EarningRatios>) => {
  setEarningRatios(prev => {
    const updated = { ...prev, ...newRatios };
    
    // Fire-and-forget persist
    AsyncStorage.setItem(EARNING_RATIOS_KEY, JSON.stringify(updated))
      .catch(error => console.error('Failed to save ratios:', error));
    
    return updated;
  });
}, []);
```

### Pattern 2: Complex Logic + Multiple States

```typescript
const addExerciseToHistory = useCallback(async (
  exerciseType: 'squats' | 'pushups' | 'planks', 
  amount: number
) => {
  const today = new Date().toISOString().split('T')[0];
  
  setWorkoutHistory(prev => {
    const updated = { ...prev };
    
    // Initialize today if needed
    if (!updated[today]) {
      updated[today] = { squats: 0, pushups: 0, plank: 0 };
    }
    
    // Add to history
    if (exerciseType === 'planks') {
      updated[today].plank += amount;
    } else {
      updated[today][exerciseType] += amount;
    }
    
    // Persist history
    AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updated))
      .catch(error => console.error('Save failed:', error));
    
    // Recalculate streak (side effect)
    const newStreak = calculateStreakFromHistory(updated);
    setCurrentStreak(newStreak);
    AsyncStorage.setItem(CURRENT_STREAK_KEY, newStreak.toString())
      .catch(error => console.error('Save streak failed:', error));
    
    return updated;
  });
}, [calculateStreakFromHistory]);
```

### Pattern 3: Ref for Performance-Critical State

```typescript
// ✅ Use ref for high-frequency updates or non-render state
const hasRecordedTodayRef = useRef<boolean>(false);

const addMinutes = useCallback(async (minutes: number) => {
  // ... add minutes logic ...
  
  // Update streak ONCE per day (not every minute earned)
  if (!hasRecordedTodayRef.current) {
    hasRecordedTodayRef.current = true;
    updateStreak();
  }
}, [updateStreak]);
```

**Why refs here?**
- `hasRecordedToday` doesn't need to trigger re-renders
- Prevents unnecessary `updateStreak()` calls
- Performance optimization for frequent operations

## 📊 Derived State (useMemo)

### All-Time Stats Calculation

```typescript
// Expensive calculation - memoized
const allTimeStats = useMemo(() => {
  let totalSquats = 0;
  let totalPushups = 0;
  let totalPlankSeconds = 0;
  let totalWorkoutDays = 0;

  Object.values(workoutHistory).forEach((day: DailyWorkout) => {
    totalSquats += day.squats;
    totalPushups += day.pushups;
    totalPlankSeconds += day.plank;
    totalWorkoutDays++;
  });

  return {
    totalSquats,
    totalPushups,
    totalPlankSeconds,
    totalWorkoutDays,
  };
}, [workoutHistory]);
```

**Why `useMemo`?**
- Prevents recalculation on every render
- Only recalculates when `workoutHistory` changes
- Essential for dashboard performance with large history

### Calendar Marked Dates

```typescript
const markedDates = useMemo(() => {
  const marked: { [date: string]: MarkerConfig } = {};
  
  Object.keys(workoutHistory).forEach(date => {
    marked[date] = {
      marked: true,
      dotColor: '#00D9FF',
    };
  });

  return marked;
}, [workoutHistory]);
```

## 🔄 Complex State Flows

### Streak Calculation Logic

```typescript
const calculateStreakFromHistory = useCallback((history: WorkoutHistory): number => {
  // 1. Sort dates descending (most recent first)
  const dates = Object.keys(history)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const mostRecentDate = new Date(dates[0]);
  mostRecentDate.setHours(0, 0, 0, 0);
  
  // 2. Check if streak is broken (>1 day gap)
  const daysSinceLastWorkout = 
    Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastWorkout > 1) {
    return 0;  // Streak broken
  }
  
  // 3. Count consecutive days backward
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
      break;  // Gap found, stop counting
    }
  }
  
  return streak;
}, []);
```

**Key Insights**:
- Always normalize dates (set hours to 0)
- Sort descending for efficiency
- Allow 0 or 1 day gap (today or yesterday is OK)
- Break loop early on first gap

### Emergency Access with Daily Reset

```typescript
const loadEmergencyPausesData = async () => {
  const [storedPauses, storedResetDate] = await Promise.all([
    AsyncStorage.getItem(EMERGENCY_PAUSES_KEY),
    AsyncStorage.getItem(LAST_PAUSE_RESET_KEY),
  ]);
  
  const today = new Date().toDateString();
  
  // Check if new day - reset to 3 uses
  if (storedResetDate === null || storedResetDate !== today) {
    console.log('[EMERGENCY] New day detected, resetting pauses to 3');
    setEmergencyPausesRemaining(3);
    setLastPauseResetDate(today);
    await AsyncStorage.setItem(EMERGENCY_PAUSES_KEY, '3');
    await AsyncStorage.setItem(LAST_PAUSE_RESET_KEY, today);
  } else {
    // Same day, use stored value
    setEmergencyPausesRemaining(parseInt(storedPauses, 10));
  }
};
```

**Why this pattern?**
- Automatic daily reset without cron jobs or timers
- Checked on app launch (and any manual reload)
- Handles edge cases (null, missing keys, corrupted data)

## 🎮 Component-Level State

### When to Use Local State

```typescript
// ✅ UI-only state (doesn't need to persist)
const [selectedDate, setSelectedDate] = useState<string | null>(null);
const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
const [tapCount, setTapCount] = useState<number>(0);  // Easter egg counter

// ✅ Form inputs (temporary until submission)
const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('squats');

// ✅ Loading states for async operations
const [isUsingEmergency, setIsUsingEmergency] = useState<boolean>(false);

// ❌ Don't use local state for:
// - Data that needs to persist across sessions
// - Data shared across multiple screens
// - Data that updates from external sources
```

### Workout Screen State (Complex Example)

```typescript
// Local UI state
const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('squats');
const [showExerciseSelector, setShowExerciseSelector] = useState<boolean>(true);
const [exerciseCount, setExerciseCount] = useState<number>(0);
const [isRecording, setIsRecording] = useState<boolean>(false);
const [feedback, setFeedback] = useState<string>('');

// AI detection state (web-only)
const [currentPhase, setCurrentPhase] = useState<Phase>('standing');
const [debugAngles, setDebugAngles] = useState<Angles | null>(null);
const [plankTimer, setPlankTimer] = useState<number>(0);

// Model state
const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
const [modelError, setModelError] = useState<string>('');

// Refs (not in render cycle)
const videoRef = useRef<HTMLVideoElement | null>(null);
const detectorRef = useRef<any>(null);
const animationFrameRef = useRef<number | null>(null);
const lastExerciseTimeRef = useRef<number>(0);
const plankAccumulatedTimeRef = useRef<number>(0);
```

**Why so much local state?**
- Workout screen is self-contained
- State doesn't need to persist (resets each workout)
- High-frequency updates (every frame for AI)
- No need for global access
- Performance optimization (avoid context updates)

## 🧩 State Composition Pattern

### Provider Wrapping Order

```typescript
// app/_layout.tsx
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>  {/* 1. Server state */}
      <ThemeProvider>                            {/* 2. Theme (UI preference) */}
        <TimeBankProvider>                       {/* 3. App data */}
          <GestureHandlerRootView>               {/* 4. Gesture system */}
            <RootLayoutNav />                    {/* 5. Navigation */}
            <PWAInstallPrompt />                 {/* 6. PWA component */}
          </GestureHandlerRootView>
        </TimeBankProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

**Why this order?**
1. React Query first (if we add server data, it's available everywhere)
2. Theme next (visual preference applied globally)
3. TimeBank (app-wide workout data)
4. Gesture handler (UI functionality layer)
5. Navigation last (consumes all state)
6. PWA prompt outside navigation (shows on all screens)

## 🔒 Type Safety

### Strict TypeScript Patterns

```typescript
// ✅ Explicit types for useState
const [earnedMinutes, setEarnedMinutes] = useState<number>(0);
const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory>({});

// ✅ Type guards for AsyncStorage data
const storedPro = await AsyncStorage.getItem(IS_USER_PRO_KEY);
setIsUserPro(storedPro === 'true');  // Convert string to boolean

// ✅ Discriminated unions for exercise types
type ExerciseType = 'squats' | 'pushups' | 'planks';
type FreeExerciseType = ExerciseType | null;

// ✅ Strict callback typing
const addMinutes = useCallback(async (minutes: number): Promise<void> => {
  // Implementation
}, [dependencies]);

// ✅ Return type annotations for complex functions
const calculateStreakFromHistory = useCallback((
  history: WorkoutHistory
): number => {
  // Implementation
}, []);
```

## ⚡ Performance Optimizations

### 1. Memoized Context Value

```typescript
return useMemo(
  () => ({
    earnedMinutes,
    earningRatios,
    // ... all state and methods
  }),
  [
    earnedMinutes,
    earningRatios,
    // ... all dependencies
  ]
);
```

**Why?**
- Prevents unnecessary re-renders of consumers
- Only creates new object when dependencies change
- Critical for avoiding cascading re-renders

### 2. Batched AsyncStorage Operations

```typescript
// ✅ Use multiSet for related data
await AsyncStorage.multiSet([
  [TIME_BANK_KEY, '0'],
  [WORKOUT_HISTORY_KEY, JSON.stringify({})],
  [CURRENT_STREAK_KEY, '0'],
]);

// ✅ Use multiRemove for cleanup
await AsyncStorage.multiRemove([
  HAS_COMPLETED_ONBOARDING_KEY,
  USER_FREE_EXERCISE_KEY,
  IS_USER_PRO_KEY,
]);
```

**Why?**
- Single native call vs multiple sequential calls
- Atomic operations reduce corruption risk
- Significant performance improvement on mobile

### 3. Selective Hook Dependencies

```typescript
// ✅ Only depend on what actually affects the callback
const updateStreak = useCallback(async () => {
  // Uses lastWorkoutDate and currentStreak
}, [lastWorkoutDate, currentStreak]);

// ❌ Don't do this (over-dependency causes unnecessary recreations)
const updateStreak = useCallback(async () => {
  // Implementation
}, [lastWorkoutDate, currentStreak, workoutHistory, earnedMinutes]);
```

## 🐛 Common Pitfalls & Solutions

### Pitfall 1: Stale Closure in Callbacks

```typescript
// ❌ Problem: earnedMinutes will be stale
const addMinutes = useCallback((amount: number) => {
  const newTotal = earnedMinutes + amount;  // Stale value!
  setEarnedMinutes(newTotal);
}, []);  // Missing earnedMinutes in deps

// ✅ Solution: Use functional update
const addMinutes = useCallback((amount: number) => {
  setEarnedMinutes(prev => prev + amount);  // Always fresh
}, []);  // No dependency needed
```

### Pitfall 2: Race Conditions with AsyncStorage

```typescript
// ❌ Problem: Read → Modify → Write (not atomic)
const stored = await AsyncStorage.getItem(KEY);
const value = JSON.parse(stored);
value.count++;
await AsyncStorage.setItem(KEY, JSON.stringify(value));

// ✅ Solution: Use state as source of truth
setWorkoutHistory(prev => {
  const updated = { ...prev };
  updated[today] = { ...updated[today], squats: updated[today].squats + 1 };
  
  // Fire-and-forget persist
  AsyncStorage.setItem(KEY, JSON.stringify(updated))
    .catch(error => console.error('Save failed:', error));
  
  return updated;
});
```

### Pitfall 3: Forgetting to Await Critical Async Operations

```typescript
// ❌ Problem: Onboarding might not complete before navigation
const handleContinue = () => {
  completeOnboarding(selectedExercise);  // No await!
  router.replace('/(tabs)');             // Navigates too early
};

// ✅ Solution: Always await state changes before navigation
const handleContinue = async () => {
  await completeOnboarding(selectedExercise);
  router.replace('/(tabs)');
};
```

## 📈 Scaling Considerations

### When to Split Context

Current: **Two contexts** (TimeBank + Theme) - works perfectly for MVP

Future: **Consider splitting if**:
- TimeBank context value >20 properties
- Unrelated features trigger same re-renders
- Performance issues in consumer components

Potential split:
```typescript
<WorkoutProvider>         // Workout history, streak, exercise data
  <SettingsProvider>      // Earning ratios, preferences, pro status
    <ThemeProvider>       // Theme (already separate)
      <App />
    </ThemeProvider>
  </SettingsProvider>
</WorkoutProvider>
```

### When to Use React Query

Current: **Minimal use** (all client state, no server)

Future: **Use for**:
- Backend API calls (sync workouts to cloud)
- User authentication/profile
- Leaderboards or social features
- Subscription status validation

Example:
```typescript
const { data: workoutHistory } = useQuery({
  queryKey: ['workout-history'],
  queryFn: fetchWorkoutHistoryFromServer,
  staleTime: 1000 * 60 * 5,  // 5 minutes
});

const { mutate: saveWorkout } = useMutation({
  mutationFn: saveWorkoutToServer,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['workout-history'] });
  },
});
```

## 🎓 Key Learnings

1. **Two contexts work great**: Theme + TimeBank separation is clean
2. **Persist immediately**: Fire-and-forget for non-critical, await for navigation
3. **Functional updates**: Always use `prev =>` for derived values
4. **Refs for non-render state**: Performance win for flags and accumulators
5. **Type everything**: Catch AsyncStorage corruption at compile time
6. **Memoize expensive derivations**: Use `useMemo` for history calculations
7. **Log state changes**: Console logs essential for debugging persistence
8. **AsyncStorage is fast**: Don't over-optimize with batching (only when logical)
9. **Hydration pattern**: `isHydrated` flag prevents flash of default state
10. **Test edge cases**: App crash, storage full, corrupted data, date rollovers
