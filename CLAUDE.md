# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kenri is a React Native mobile app (Expo SDK 52) that gamifies screen time: users earn minutes of app usage by completing real exercises (squats, pushups, planks). Exercise detection uses on-device TFLite pose estimation via the camera. On Android, an accessibility service blocks distracting apps when the user's time bank is depleted.

## Commands

```bash
npm install            # Install dependencies
npm run start          # Start Expo dev server with tunnel
npm run start-web      # Start web preview
npm run web            # Alias for start-web
npm run android        # Build and run on Android
npm run ios            # Build and run on iOS
npx expo lint          # Run ESLint
```

Package manager is **npm** (lockfile: `package-lock.json`). A `bun.lock` is also present from prior setup.

## Architecture

### Routing (Expo Router, file-based)

- `app/_layout.tsx` — Root layout. Wraps app in `QueryClientProvider > ThemeProvider > TimeBankProvider`. Loads custom fonts (Inter, Space Grotesk, Space Mono).
- `app/(tabs)/` — Main tab navigation: Dashboard (`index.tsx`), Workout (`workout.tsx`), Targets (`targets.tsx`).
- `app/onboarding.tsx` — First-run onboarding where user picks their free exercise.
- `app/go-pro.tsx` — Pro upgrade modal.
- `app/settings.tsx`, `app/developer-menu.tsx` — Settings and dev tools.

### Core State: TimeBank Context (`contexts/TimeBank.tsx`)

Central context managing all app state via `@nkzw/create-context-hook`. Persists to AsyncStorage. Key concepts:
- **Time bank** (`earnedMinutes`) — minutes earned through exercise.
- **Earning ratios** — configurable multiplier per exercise type.
- **Workout history** — daily record keyed by ISO date string (`{ [date]: { squats, pushups, plank } }`). Note: the field is `plank` (singular) in `DailyWorkout`, but the exercise type is `planks` (plural) elsewhere.
- **Streak tracking** — consecutive workout days, calculated from history.
- **Emergency pauses** — 3 per day, each grants 5 free minutes.
- **Freemium model** — `isUserPro`, `userFreeExercise` (one free exercise for non-pro users), `hasCompletedOnboarding`.
- **Developer mode** — unlocks unlimited emergency pauses and dev menu.

All data validated with Zod schemas on load.

### Theme Context (`contexts/Theme.tsx`)

Light/dark/system theme support. Uses `@nkzw/create-context-hook`. Dark theme uses an "industrial" palette (dark navy backgrounds). Persisted to AsyncStorage.

### Exercise Detection (`components/NativeWorkoutCamera.tsx`)

- Uses `react-native-vision-camera` + `react-native-fast-tflite` + `vision-camera-resize-plugin` for real-time pose estimation.
- Frame processor runs on a worklet (via `react-native-worklets-core`).
- Detects exercises by calculating joint angles from keypoints (e.g., knee angle for squats, elbow angle for pushups, hip-shoulder-ankle alignment for planks).
- Platform split in `app/(tabs)/workout.tsx`: native camera on iOS/Android, web placeholder on web.

### Native Android Plugins

One Expo config plugin generates and injects native Kotlin code at prebuild time:

- **`plugins/withKenriNative.js`** — Generates Kotlin source inline. Creates `EarnScrollModule` (React Native bridge for getting installed apps, setting blocked packages, updating minutes), `EarnScrollPackage`, `BlockerService` (accessibility service), and `BlockedActivity` (the full-screen block UI). Registers the service in AndroidManifest and injects `EarnScrollPackage` into `MainApplication.kt`.

**The `com.earnscroll` package path and the `EarnScroll*` class names are frozen and must never be renamed.** Android binds a user's granted accessibility permission to the fully-qualified component name `com.earnscroll/.BlockerService`; renaming it silently invalidates that grant for every existing install. The same applies to the `EarnScrollSecurePrefs` EncryptedSharedPreferences store, which holds the time-bank balance and blocked-package list. These identifiers are invisible to users and load-bearing — the app's display name is Kenri, but its internal namespace stays `earnscroll`.

Note: `native-src/` is empty and `plugins/withAppBlocker.js` no longer exists; `withKenriNative.js` is the only config plugin generating native code.

### Babel/Metro Configuration

- `babel.config.js` — Includes `react-native-worklets-core/plugin` and `react-native-reanimated/plugin` (reanimated **must be last**).
- `metro.config.js` — Adds `.tflite` to asset extensions for bundling ML models.

### Design System

- Colors defined in `constants/colors.ts` — exports `lightTheme`, `darkTheme`, `colors` object, and default Colors for tabs.
- Typography defined in `constants/typography.ts`.
- Icons from `lucide-react-native`.
