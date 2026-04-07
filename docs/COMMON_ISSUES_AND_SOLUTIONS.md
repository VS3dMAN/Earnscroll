# Common Issues & Solutions (Living Doc)

## 🐛 Development Challenges & Fixes

This document captures the problems we encountered during development and how we solved them. Use this as a reference when troubleshooting similar issues.

## 🔴 Critical Issues

### 1. Clear Workout History Not Working

**Problem**: Button click on "Clear All Workout History" did nothing. No console logs, no errors.

**Root Cause**: 
- Button handler wasn't being called
- Missing onPress binding
- Incorrect event propagation

**Solution**:
```typescript
// Before (broken)
<TouchableOpacity
  style={styles.button}
  onPress={clearAllWorkoutHistory}  // Direct reference
>

// After (working)
<TouchableOpacity
  style={styles.button}
  onPress={async () => {
    console.log('[SETTINGS] Clear history clicked');  // Debug log
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure?');
      if (!confirmed) return;
    }
    await clearAllWorkoutHistory();
    console.log('[SETTINGS] Clear complete');
  }}
>
```

**Lessons Learned**:
- Always wrap async calls in arrow functions
- Add console logs to verify handler execution
- Handle web vs native confirmations differently
- Never assume a button "just works" - verify with logs

---

### 2. Plank Timer Going Backward / Resetting

**Problem**: Plank timer would jump backward, reset unexpectedly, or show negative values.

**Root Cause**: Race condition between:
1. Timer interval updating display
2. Form break pausing timer
3. Accumulated time being saved
4. Multiple sources of truth for "current time"

**Solution**: Clamping + Single Source of Truth
```typescript
// Track last known good value
const lastTimerUpdateRef = useRef<number>(0);

// When updating timer, never go backward
const updateTimer = () => {
  const currentTime = calculateTotalTime();
  const clampedTime = Math.max(currentTime, lastTimerUpdateRef.current);
  lastTimerUpdateRef.current = clampedTime;
  setPlankTimer(clampedTime);
};

// When pausing, save to accumulator
const pausePlank = () => {
  if (plankStartTime !== null) {
    const sessionTime = (Date.now() - plankStartTime) / 1000;
    const totalTime = plankAccumulatedTime + sessionTime;
    const safeTotalTime = Math.max(totalTime, lastTimerUpdateRef.current);
    plankAccumulatedTime = safeTotalTime;
    lastTimerUpdateRef.current = safeTotalTime;
    plankStartTime = null;
  }
};
```

**Lessons Learned**:
- Never trust raw calculations - always clamp to last known value
- Use refs for synchronization between intervals and state
- Extensive logging helped identify the race condition
- Separate "accumulated time" from "current session time"

---

### 3. Onboarding Screen Not Scrollable on Web

**Problem**: User couldn't scroll down to see "Continue" button on smaller screens/mobile web.

**Root Cause**: 
- Parent View had `flex: 1` 
- ScrollView inside had fixed height
- Content overflowed without scroll capability

**Solution**:
```typescript
// Before (broken)
<View style={{ flex: 1 }}>
  <ScrollView contentContainerStyle={styles.content}>
    {/* Content here */}
  </ScrollView>
</View>

// After (working)
<ScrollView
  style={styles.scrollView}  // flex: 1
  contentContainerStyle={styles.content}  // flexGrow: 1, not flex: 1
  showsVerticalScrollIndicator={false}
>
  {/* Content here */}
</ScrollView>

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,  // Expands to fit content, not fixed height
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
});
```

**Lessons Learned**:
- `flex: 1` on ScrollView content can break scrolling
- Use `flexGrow: 1` instead for flexible content height
- Test on different screen sizes (mobile, tablet, desktop)
- Always add padding to bottom of ScrollView content

---

### 4. TensorFlow.js Scripts Not Loading

**Problem**: "tf is not defined" or "poseDetection is not defined" errors.

**Root Cause**: 
- Async script loading race condition
- Scripts loaded but global objects not available immediately
- Wrong script URLs (404 errors)

**Solution**:
```typescript
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      console.log('✓ Script already loaded:', src);
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = false;  // Load in order
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      console.log('✓ Script loaded:', src);
      resolve();
    };
    script.onerror = () => {
      console.error('✗ Script failed:', src);
      reject(new Error(`Failed to load: ${src}`));
    };
    document.head.appendChild(script);
  });
};

const initializeModel = async () => {
  console.log('Loading TensorFlow.js...');
  await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js');
  await new Promise(resolve => setTimeout(resolve, 100));  // Wait for global to be available
  
  console.log('Loading Pose Detection...');
  await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.min.js');
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const tf = (window as any).tf;
  const poseDetection = (window as any).poseDetection;
  
  if (!tf || !poseDetection) {
    throw new Error('TF.js or Pose Detection not loaded');
  }
  
  // ... continue initialization
};
```

**Lessons Learned**:
- Check for existing script tags before adding new ones
- Add small delays (100ms) after script load for globals to attach
- Verify globals exist before using them
- Use `async: false` to ensure load order
- Log every step for debugging

---

### 5. Exercise Not Counting (False Negatives)

**Problem**: User performs squats/pushups but counter doesn't increment.

**Root Causes**:
1. **Too strict thresholds** - 60° knee angle too deep for some users
2. **Confidence too high** - Keypoints not detected reliably
3. **Debounce too long** - MIN_TIME_BETWEEN_REPS too strict
4. **Missing state reset** - `wasInSquatPosition` stuck as `true`

**Solutions**:

```typescript
// 1. Relaxed thresholds
const SQUAT_THRESHOLD = 70°;  // Was 60°
const PUSHUP_DOWN_THRESHOLD = 90°;  // Was 80°

// 2. Lower confidence for difficult poses
const PLANK_CONFIDENCE = 0.005;  // Was 0.2

// 3. Shorter debounce
const MIN_TIME_BETWEEN_SQUATS = 200ms;  // Was 500ms

// 4. Proper state reset
if (isStanding && wasInSquatPosition && timeSinceLastSquat > MIN_TIME) {
  wasInSquatPositionRef.current = false;  // Reset here!
  lastExerciseTimeRef.current = now;
  setExerciseCount(prev => prev + 1);
}
```

**Debugging Process**:
1. Log every angle reading
2. Log state transitions (up/down/standing)
3. Log why a rep wasn't counted
4. Adjust thresholds based on logs
5. Test with multiple body types

**Lessons Learned**:
- Start with loose thresholds, tighten if needed
- False negatives worse than false positives (frustrating UX)
- Extensive logging is essential for tuning
- Test with real people, not just yourself

---

### 6. AsyncStorage Data Corruption

**Problem**: App crashes on launch with "Cannot read property of undefined" in state loading.

**Root Cause**: 
- Stored JSON became corrupted
- Type mismatch (stored string, expected number)
- AsyncStorage key renamed but old data remained

**Solution**:
```typescript
const loadWorkoutHistory = async () => {
  try {
    const stored = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
    if (stored !== null) {
      const history = JSON.parse(stored);
      
      // Validate structure
      if (typeof history !== 'object' || Array.isArray(history)) {
        console.warn('Invalid history format, resetting');
        setWorkoutHistory({});
        await AsyncStorage.removeItem(WORKOUT_HISTORY_KEY);
        return;
      }
      
      setWorkoutHistory(history);
      console.log('✓ Loaded workout history:', Object.keys(history).length, 'days');
    }
  } catch (error) {
    console.error('Failed to load workout history:', error);
    // Fail gracefully, don't crash
    setWorkoutHistory({});
  }
};
```

**Lessons Learned**:
- Always validate AsyncStorage data before using
- Wrap all AsyncStorage loads in try-catch
- Fail gracefully with default values
- Add schema versioning for future migrations
- Test with corrupt data (manually edit AsyncStorage)

---

## ⚠️ Common Warnings & How to Fix

### Warning: Unable to Resolve Manifest Assets

```
Warning: Unable to resolve manifest assets. 
Icons and fonts might not work. 
Cannot read properties of null (reading '0')
```

**Cause**: Expo trying to load non-existent manifest on web.

**Fix**: Ignore it - doesn't affect functionality. Web-only warning.

---

### Warning: setState on Unmounted Component

```
Warning: Can't perform a React state update on an unmounted component.
```

**Cause**: Async operation completes after component unmounted.

**Fix**: 
```typescript
useEffect(() => {
  let isMounted = true;
  
  const fetchData = async () => {
    const data = await loadData();
    if (isMounted) {  // Check before setState
      setData(data);
    }
  };
  
  fetchData();
  
  return () => {
    isMounted = false;  // Cleanup
  };
}, []);
```

---

### Warning: VirtualizedList Key Extractor

```
Warning: Each child in a list should have a unique "key" prop.
```

**Fix**:
```typescript
{workouts.map((workout, index) => (
  <View key={`workout-${workout.id || index}`}>  // Use unique key
    {/* Content */}
  </View>
))}
```

---

## 🔧 Platform-Specific Issues

### Web-Only Issues

#### Camera Permission Denied
```typescript
// Handle permission errors gracefully
try {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
} catch (error) {
  if (error.name === 'NotAllowedError') {
    setFeedback('Camera permission denied. Please allow camera access.');
  } else if (error.name === 'NotFoundError') {
    setFeedback('No camera found. Please connect a camera.');
  }
}
```

#### WebGL Not Available
```typescript
try {
  await tf.setBackend('webgl');
  await tf.ready();
} catch {
  console.warn('WebGL failed, using CPU');
  await tf.setBackend('cpu');
  await tf.ready();
}
```

---

### Mobile-Specific Issues (When Native Build)

#### Camera Not Accessible
- **Problem**: Camera works on web but not native
- **Cause**: Missing camera permissions in app.json
- **Fix**: Add to app.json:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow EarnScroll to use your camera for exercise tracking."
        }
      ]
    ]
  }
}
```

---

## 🎨 UI/UX Issues

### ScrollView Not Scrolling

**Problem**: Content overflows but doesn't scroll.

**Common Causes**:
1. Parent View has fixed height
2. ScrollView contentContainerStyle has `flex: 1`
3. Nested ScrollViews (not supported)

**Fix**:
```typescript
// ✅ Correct pattern
<ScrollView 
  style={{ flex: 1 }}  // Takes full space
  contentContainerStyle={{ flexGrow: 1 }}  // Content flexible
>
  {/* Content */}
</ScrollView>
```

---

### Button Not Responding

**Problem**: TouchableOpacity doesn't trigger onPress.

**Debugging Steps**:
1. Add `console.log` in handler
2. Check if button is actually rendered (not display: none)
3. Check if parent has `pointerEvents: 'none'`
4. Check if button is behind another view (z-index)
5. Add testID and verify in React DevTools

**Common Fixes**:
```typescript
// Fix 1: Ensure parent allows pointer events
<View style={{ pointerEvents: 'auto' }}>
  <TouchableOpacity onPress={handler} />
</View>

// Fix 2: Add activeOpacity to verify touch area
<TouchableOpacity activeOpacity={0.5} onPress={handler}>
  {/* Opacity change confirms touch registration */}
</TouchableOpacity>

// Fix 3: Add testID for debugging
<TouchableOpacity testID="my-button" onPress={handler}>
```

---

## 📱 Cross-Platform Compatibility

### Haptics Not Working on Web

**Problem**: `Haptics.impactAsync()` throws error on web.

**Fix**:
```typescript
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const triggerHaptic = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};
```

---

### Alert vs window.confirm

**Problem**: Alert.alert() doesn't work on web.

**Fix**:
```typescript
import { Platform, Alert } from 'react-native';

const showConfirmation = () => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm('Are you sure?');
    if (confirmed) handleConfirm();
  } else {
    Alert.alert('Confirm', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: handleConfirm },
    ]);
  }
};
```

---

## 🚀 Performance Issues

### Slow Pose Detection

**Problem**: Low FPS, laggy detection.

**Causes**:
1. MoveNet Thunder (too slow) instead of Lightning
2. No WebGL (using CPU)
3. High-resolution video input
4. Too many console logs

**Fixes**:
```typescript
// 1. Use Lightning model
modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING

// 2. Prefer WebGL
await tf.setBackend('webgl');

// 3. Limit video resolution
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 }
  }
});

// 4. Reduce logging in production
if (__DEV__) {
  console.log('[SQUAT] angle:', angle);
}
```

---

### React Re-Render Thrashing

**Problem**: UI lags, especially during plank timer.

**Cause**: Timer updating state every 100ms → re-renders.

**Fix**: Optimize with `useMemo` and `useCallback`
```typescript
// Memoize expensive calculations
const allTimeStats = useMemo(() => {
  return calculateStats(workoutHistory);
}, [workoutHistory]);

// Memoize callbacks
const handleDayPress = useCallback((day: DateData) => {
  setSelectedDate(day.dateString);
}, []);
```

---

## 🧪 Testing Challenges

### Mock Data Generation

**Problem**: Need 30+ days of data to test calendar/stats.

**Solution**: Developer menu with mock data generator.
```typescript
const generateMockWorkoutHistory = async (daysBack: number = 30) => {
  const mockHistory: WorkoutHistory = {};
  const today = new Date();
  
  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // 70% chance of workout (realistic)
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
};
```

---

### Resetting App State

**Problem**: Need to test onboarding flow repeatedly.

**Solution**: Developer menu reset function.
```typescript
const resetOnboarding = async () => {
  await AsyncStorage.multiRemove([
    HAS_COMPLETED_ONBOARDING_KEY,
    USER_FREE_EXERCISE_KEY,
    IS_USER_PRO_KEY,
    TIME_BANK_KEY,
    WORKOUT_HISTORY_KEY,
    CURRENT_STREAK_KEY,
  ]);
  
  // Reset all state
  setHasCompletedOnboarding(false);
  setUserFreeExercise(null);
  setIsUserPro(false);
  setEarnedMinutes(0);
  setWorkoutHistory({});
  setCurrentStreak(0);
  
  router.replace('/onboarding');
};
```

---

## 🎓 Key Debugging Strategies

### 1. Log Everything
```typescript
console.log('[CONTEXT] Stage:', stage);
console.log('[CONTEXT] ✓ Success');
console.log('[CONTEXT] ✗ Error:', error);
console.log('[CONTEXT] → Action:', action);
```

**Emoji Legend**:
- ✓ Success
- ✗ Error
- → Action taken
- ⚠️ Warning

### 2. Add TestIDs
```typescript
<View testID="workout-screen">
  <TouchableOpacity testID="start-button" />
  <Text testID="counter-value">{count}</Text>
</View>
```

### 3. Verify State in DevTools
- React DevTools → Components → Search for component
- Inspect props and state
- Manually trigger callbacks

### 4. Isolate Problems
- Comment out code blocks
- Create minimal reproduction
- Test in isolation (new component)

### 5. Check Async Timing
```typescript
console.log('[1] Before async');
await someAsync();
console.log('[2] After async');
// If [2] never logs → async failed silently
```

---

## 📚 Resources for Common Issues

- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **TensorFlow.js**: https://www.tensorflow.org/js
- **AsyncStorage**: https://react-native-async-storage.github.io/async-storage/

---

## 🆘 When Stuck

1. **Read the error message** (seriously, read it fully)
2. **Check console logs** (both terminal and browser)
3. **Google the exact error** (include library names)
4. **Check GitHub issues** (library repo)
5. **Ask in Discord/Slack** (Expo, React Native communities)
6. **Rubber duck debug** (explain problem out loud)
7. **Take a break** (fresh eyes catch bugs)

---

## 💡 Pro Tips

1. **Clear cache often**: `npx expo start -c`
2. **Restart Metro bundler**: Ctrl+C, restart
3. **Check Expo SDK version**: Ensure compatibility
4. **Test on real device**: Simulators hide issues
5. **Use TypeScript**: Catch errors at compile time
6. **Write tests** (when time allows): Prevent regressions
7. **Document weird fixes**: Future you will thank you

---

Remember: Every bug is a learning opportunity. Document it so others (and future you) don't waste time on the same issue!
