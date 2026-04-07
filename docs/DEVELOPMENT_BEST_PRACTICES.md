# Development Best Practices (Project-Specific)

## 🎯 Core Principles

This document outlines the coding standards, patterns, and practices used throughout the EarnScroll project. Following these guidelines ensures consistency, maintainability, and quality.

## 📝 TypeScript Standards

### Strict Typing

```typescript
// ✅ Always use explicit types
const [count, setCount] = useState<number>(0);
const [data, setData] = useState<DataType[]>([]);

// ❌ Avoid implicit any
const [data, setData] = useState([]);  // Type: any[]
```

### Interface Definitions

```typescript
// ✅ Define interfaces for complex types
interface WorkoutSession {
  id: string;
  exerciseType: 'squats' | 'pushups' | 'planks';
  count: number;
  timestamp: Date;
  earnedMinutes: number;
}

// ✅ Use type for unions and primitives
type ExerciseType = 'squats' | 'pushups' | 'planks';
type FreeExerciseType = ExerciseType | null;
```

### Const Assertions

```typescript
// ✅ Use 'as const' for literal types in styles
const fontWeight = 'bold' as const;
const position = 'absolute' as const;

// ❌ Don't do this (type widened to string)
const fontWeight = 'bold';  // Type: string
```

### Null Safety

```typescript
// ✅ Use optional chaining and nullish coalescing
const userName = user?.name ?? 'Guest';
const config = settings?.earningRatios?.squats ?? 1;

// ✅ Type guards for checking
if (data && typeof data === 'object' && 'squats' in data) {
  // Safe to use data.squats
}
```

## 🎨 React Native Patterns

### Component Structure

```typescript
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconName } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// 1. Types/Interfaces
interface MyComponentProps {
  title: string;
  onPress?: () => void;
}

// 2. Component
export default function MyComponent({ title, onPress }: MyComponentProps) {
  // 3. Hooks (order: context, state, refs, effects, callbacks, memos)
  const router = useRouter();
  const [count, setCount] = useState<number>(0);
  
  useEffect(() => {
    // Effect logic
  }, []);
  
  const handlePress = useCallback(() => {
    setCount(prev => prev + 1);
    onPress?.();
  }, [onPress]);
  
  const displayText = useMemo(() => {
    return `${title}: ${count}`;
  }, [title, count]);
  
  // 4. Render
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{displayText}</Text>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text>Tap Me</Text>
      </TouchableOpacity>
    </View>
  );
}

// 5. Styles (at bottom)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  button: {
    backgroundColor: '#00D9FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
});
```

### State Management

```typescript
// ✅ Functional updates for derived values
setCount(prev => prev + 1);
setItems(prev => [...prev, newItem]);

// ✅ Multiple states for independent concerns
const [isLoading, setIsLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<Data | null>(null);

// ❌ Avoid single object for unrelated state
const [state, setState] = useState({
  isLoading: false,
  error: null,
  data: null,
  userPreference: 'dark',  // Unrelated
});
```

### Performance Optimization

```typescript
// ✅ Memoize expensive calculations
const stats = useMemo(() => {
  return calculateComplexStats(workoutHistory);
}, [workoutHistory]);

// ✅ Memoize callbacks passed to children
const handleItemPress = useCallback((id: string) => {
  navigateToDetail(id);
}, []);

// ✅ Memoize component renders
const MemoizedItem = React.memo(WorkoutItem);

// ❌ Don't memoize everything (overhead)
const simpleValue = useMemo(() => count * 2, [count]);  // Unnecessary
```

## 🎯 Naming Conventions

### Variables & Functions

```typescript
// ✅ Descriptive, action-based names
const handleExerciseSelect = () => {};
const calculateTotalMinutes = () => {};
const isUserProMember = true;
const hasCompletedOnboarding = false;

// ❌ Vague or abbreviated names
const handle = () => {};
const calc = () => {};
const usr = true;
```

### Boolean Variables

```typescript
// ✅ Use is, has, should, can prefixes
const isLoading = true;
const hasPermission = false;
const shouldShowModal = true;
const canEditProfile = false;

// ❌ Ambiguous names
const loading = true;
const permission = false;
```

### Event Handlers

```typescript
// ✅ Prefix with 'handle' for internal handlers
const handleButtonPress = () => {};
const handleTextChange = () => {};

// ✅ Prefix with 'on' for prop callbacks
interface Props {
  onPress?: () => void;
  onComplete?: (data: Data) => void;
}
```

### Constants

```typescript
// ✅ UPPERCASE_WITH_UNDERSCORES
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
const EXERCISE_TYPES = ['squats', 'pushups', 'planks'] as const;
```

## 📦 File Organization

### Import Order

```typescript
// 1. React & React Native
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

// 3. Icons
import { Home, Settings } from 'lucide-react-native';

// 4. Local imports (contexts, hooks, utils)
import { useTimeBank } from '@/contexts/TimeBank';
import { formatTime } from '@/utils/time';

// 5. Types
import type { Exercise, Workout } from '@/types';
```

### File Naming

```
✅ Correct:
- components/WorkoutCard.tsx (PascalCase for components)
- contexts/TimeBank.tsx (PascalCase for providers)
- utils/formatTime.ts (camelCase for utilities)
- constants/colors.ts (camelCase for constants)
- types/workout.ts (camelCase for type files)

❌ Incorrect:
- components/workout-card.tsx (kebab-case)
- contexts/timeBankContext.tsx (redundant "Context")
- utils/format_time.ts (snake_case)
```

## 🎨 Styling Guidelines

### StyleSheet Usage

```typescript
// ✅ Use StyleSheet.create
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  text: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});

// ❌ Inline styles (performance hit)
<View style={{ flex: 1, backgroundColor: '#000' }}>
```

### Style Composition

```typescript
// ✅ Conditional styles
<View style={[
  styles.button,
  isActive && styles.buttonActive,
  disabled && styles.buttonDisabled,
]}>

// ✅ Dynamic values outside of StyleSheet
<View style={[
  styles.box,
  { 
    width: dynamicWidth,
    backgroundColor: userColor,
  }
]}>
```

### Responsive Design

```typescript
// ✅ Use percentages and flex
container: {
  flex: 1,
  width: '100%',
  paddingHorizontal: '5%',
}

// ✅ Get dimensions when needed
import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

// ❌ Hard-coded pixel values
container: {
  width: 375,  // iPhone size only
  height: 667,
}
```

## 🔄 Async Operations

### Async/Await Pattern

```typescript
// ✅ Always use try-catch
const loadData = async () => {
  try {
    setIsLoading(true);
    setError(null);
    const data = await fetchData();
    setData(data);
  } catch (error) {
    console.error('Failed to load data:', error);
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};

// ❌ Unhandled promise rejection
const loadData = async () => {
  const data = await fetchData();  // Can throw!
  setData(data);
};
```

### AsyncStorage Operations

```typescript
// ✅ Fire-and-forget saves
const saveData = (data: Data) => {
  setData(data);
  
  AsyncStorage.setItem(KEY, JSON.stringify(data))
    .catch(error => console.error('Save failed:', error));
};

// ✅ Await critical operations
const loadData = async () => {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    if (stored) {
      setData(JSON.parse(stored));
    }
  } catch (error) {
    console.error('Load failed:', error);
  }
};
```

## 📝 Console Logging

### Structured Logging

```typescript
// ✅ Prefix logs with context
console.log('[WORKOUT] Starting session');
console.log('[WORKOUT] ✓ Exercise counted:', count);
console.log('[WORKOUT] ✗ Detection failed:', error);
console.log('[WORKOUT] → Navigating to dashboard');

// ✅ Use emoji for visual scanning
console.log('✓ Success');
console.log('✗ Error');
console.log('⚠️ Warning');
console.log('→ Action');
console.log('🎯 Goal reached');
console.log('🔄 Retry');
```

### Development-Only Logs

```typescript
// ✅ Conditional logging
if (__DEV__) {
  console.log('[DEBUG] User state:', user);
}

// ✅ Verbose logging for AI detection
console.log(`[SQUAT] knee=${angle.toFixed(1)}° | phase=${phase}`);
```

## 🧪 Testing Utilities

### TestIDs

```typescript
// ✅ Add testIDs to interactive elements
<View testID="workout-screen">
  <TouchableOpacity testID="start-button" onPress={handleStart}>
    <Text>Start</Text>
  </TouchableOpacity>
  <Text testID="counter-value">{count}</Text>
</View>
```

### Developer Tools

```typescript
// ✅ Build-in dev menu for testing
if (__DEV__ || isDeveloperMode) {
  return (
    <TouchableOpacity onPress={toggleProStatus}>
      <Text>Toggle Pro Status (Dev)</Text>
    </TouchableOpacity>
  );
}
```

## 🚨 Error Handling

### User-Facing Errors

```typescript
// ✅ Friendly error messages
catch (error) {
  if (error.name === 'NotAllowedError') {
    setFeedback('Camera permission denied. Please allow camera access.');
  } else if (error.name === 'NotFoundError') {
    setFeedback('No camera found. Please connect a camera.');
  } else {
    setFeedback('Something went wrong. Please try again.');
  }
}

// ❌ Technical jargon to users
catch (error) {
  setFeedback(error.stack);  // Don't show stack traces to users!
}
```

### Graceful Degradation

```typescript
// ✅ Provide fallbacks
const loadUserData = async () => {
  try {
    const data = await fetchFromServer();
    setUserData(data);
  } catch (error) {
    console.error('Server unavailable, using cached data');
    const cached = await loadFromCache();
    setUserData(cached);
  }
};
```

## 🔐 Security Practices

### Sensitive Data

```typescript
// ✅ Never log sensitive data
console.log('User email:', user.email);  // OK
console.log('Auth token:', token);  // ❌ NEVER!

// ✅ Validate all user input
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

### AsyncStorage Security

```typescript
// ⚠️ AsyncStorage is NOT encrypted
// ❌ Don't store passwords, tokens, or sensitive data
await AsyncStorage.setItem('password', userPassword);  // NEVER!

// ✅ Use expo-secure-store for sensitive data (if needed)
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('token', authToken);
```

## 📱 Platform-Specific Code

### Platform Checks

```typescript
import { Platform } from 'react-native';

// ✅ Conditional code execution
if (Platform.OS === 'web') {
  // Web-specific code
} else if (Platform.OS === 'ios') {
  // iOS-specific code
} else if (Platform.OS === 'android') {
  // Android-specific code
}

// ✅ Platform-specific values
const fontSize = Platform.select({
  web: 16,
  ios: 17,
  android: 16,
  default: 16,
});
```

### Web-Specific APIs

```typescript
// ✅ Check before using browser APIs
if (typeof window !== 'undefined') {
  window.localStorage.setItem('key', 'value');
}

// ✅ Type assertions for browser-only code
const videoElement = videoRef.current as HTMLVideoElement;
```

## 🎯 Code Comments

### When to Comment

```typescript
// ✅ Explain WHY, not WHAT
// Use 70° threshold - tested across multiple body types
const SQUAT_THRESHOLD = 70;

// ✅ Document complex algorithms
// Exponential Moving Average smooths angle jitter
// α = 0.15 provides good balance between responsiveness and stability
backAngleEMA = backAngleEMA + 0.15 * (backAngle - backAngleEMA);

// ❌ Obvious comments
const count = 0;  // Initialize count to 0
```

### TODOs

```typescript
// ✅ Use TODO for future improvements
// TODO: Add form validation feedback (UX-456)
// TODO: Optimize image loading (PERF-123)
// FIXME: Race condition in timer reset (BUG-789)

// ❌ Vague TODOs
// TODO: Fix this
// TODO: Make better
```

## 📦 Dependencies

### Installing Packages

```bash
# ✅ Use expo install (handles compatibility)
npx expo install react-native-calendars

# ❌ Don't use npm/yarn directly
npm install react-native-calendars  # May install incompatible version
```

### Import Usage

```typescript
// ✅ Import only what you need
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

// ❌ Import everything
import * as React from 'react';
import * as RN from 'react-native';
```

## 🔄 Git Practices

### Commit Messages

```
✅ Good:
feat: Add workout calendar with day details
fix: Prevent timer from going backward
refactor: Extract plank logic to separate function
docs: Update AI detection thresholds
chore: Update dependencies

❌ Bad:
updated stuff
fix
wip
testing
```

### Branching

```
main - production-ready code
develop - integration branch
feature/workout-calendar - new features
fix/timer-reset-bug - bug fixes
```

## 🧹 Code Cleanliness

### Remove Dead Code

```typescript
// ❌ Commented out code (delete it!)
// const oldFunction = () => {
//   // This is old logic
// };

// ❌ Unused imports
import { something } from 'somewhere';  // Not used anywhere

// ❌ Console logs in production
console.log('Debug:', data);  // Remove or wrap in __DEV__
```

### Formatting

```typescript
// ✅ Use Prettier (automatic)
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2
}
```

## 🎓 Learning Resources

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **React Native Best Practices**: https://reactnative.dev/docs/performance
- **Expo Guidelines**: https://docs.expo.dev/guides/
- **ESLint React Native**: https://github.com/facebook/react-native/tree/main/packages/eslint-plugin-react-native

## 🎯 Checklist Before Committing

- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] No ESLint warnings
- [ ] Removed console.logs (or wrapped in `__DEV__`)
- [ ] Added types for all new code
- [ ] Tested on web (minimum)
- [ ] No hardcoded values (use constants)
- [ ] Proper error handling
- [ ] Meaningful variable names
- [ ] Added testIDs to new UI elements
- [ ] Documented complex logic

## 💡 Final Thoughts

**Code is read more than it's written.** Prioritize clarity and maintainability over cleverness.

**When in doubt, be explicit.** TypeScript types, variable names, function names - clarity wins.

**Document the "why", not the "what".** Code shows what it does, comments explain why it does it that way.

**Test edge cases.** Empty states, errors, slow networks, missing permissions.

**Build for humans first, machines second.** User experience > developer convenience > performance (in that order).
