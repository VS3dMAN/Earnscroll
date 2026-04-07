# EarnScroll: Complete Fix & Deploy Roadmap

> **What this is:** A full audit of every issue, bug, missing feature, and task in the EarnScroll codebase.  
> **How to use it:** Work through phases in order. Each checkbox is one atomic task. When all phases are complete, the app is near-deployment ready.  
> **Last audited:** 2026-04-04  

---

## Project Summary (Context for Future Sessions)

**EarnScroll: Screen-Time Gym** is a React Native + Expo (SDK 52, RN 0.76.6) mobile app where users earn screen time by doing exercises (squats, pushups, planks) detected via AI camera (TensorFlow MoveNet). Earned minutes go into a "Time Bank." The app has a freemium model (1 free exercise vs all 3 for Pro) and an app-blocking feature (Targets) that's supposed to lock device apps behind exercise requirements.

**Current state:** The app has solid UI, architecture, and documentation — but it **cannot run out of the box**. Dependencies aren't installed, critical packages are missing from `package.json`, native code doesn't exist, the AI camera only works on web, app blocking is UI-only, payments are mocked, and there are multiple logic bugs.

**Tech stack:** React Native 0.76.6 · Expo SDK ~52.0.28 · TypeScript 5.3 (strict) · Expo Router 4.0 · React Context + AsyncStorage · TensorFlow.js (web) / TFLite (native) · Reanimated 3.16 · Lucide icons · Dark industrial theme

**Key files:**
- `contexts/TimeBank.tsx` — Core business logic (time bank, streaks, history, freemium) ~546 lines
- `contexts/Theme.tsx` — Theme system (light/dark/system) ~140 lines
- `components/NativeWorkoutCamera.tsx` — Native camera + TFLite pose detection ~258 lines
- `components/PWAInstallPrompt.tsx` — PWA install prompt ~198 lines
- `app/(tabs)/index.tsx` — Dashboard screen ~1075 lines
- `app/(tabs)/workout.tsx` — Workout screen ~70 lines
- `app/(tabs)/targets.tsx` — App blocking screen ~459 lines
- `app/settings.tsx` — Settings screen ~854 lines
- `app/onboarding.tsx` — First-time flow ~331 lines
- `app/go-pro.tsx` — Premium upgrade screen ~469 lines
- `app/developer-menu.tsx` — Hidden dev tools ~449 lines
- `plugins/withAppBlocker.js` — Expo config plugin for Android blocker ~120 lines
- `plugins/withEarnScrollNative.js` — Expo config plugin for native module ~306 lines
- `native-src/` — **EMPTY** — supposed to contain Kotlin source files
- `assets/models/movenet_lightning.tflite` — AI model (4.7MB)
- `backups/workout_logic_reference.tsx` — Old web-based workout logic (1557 lines, dead code)

**Data persistence:** All local via AsyncStorage. Keys prefixed with `@` (e.g., `@time_bank_minutes`, `@earning_ratios`, `@workout_history`, `@current_streak`, `@is_user_pro`, `@has_completed_onboarding`, etc.)

**No backend. No auth. No cloud sync. No real payments.**

---

## Phase 0: Get It Running

> Goal: Make the app installable, buildable, and launchable on a dev machine.

### 0.1 — Install Dependencies

- [ ] **Run `npm install` or `bun install`** — `node_modules/` does not exist. Nothing works without this.
- [ ] **Resolve dual lock file conflict** — Both `package-lock.json` (473KB) and `bun.lock` (332KB) exist. Pick one package manager and delete the other lock file. README assumes Bun but scripts use npm conventions.

### 0.2 — Fix Missing Packages in `package.json`

These are imported/used in code but **not listed** in `package.json`:

- [x] **Add missing Babel plugins to devDependencies** — `babel.config.js` lines 5-14 use these plugins that aren't in `package.json`:
  - `@babel/plugin-proposal-optional-chaining`
  - `@babel/plugin-proposal-nullish-coalescing-operator`
  - `@babel/plugin-transform-template-literals`
  - `@babel/plugin-transform-arrow-functions`
  - `@babel/plugin-transform-shorthand-properties`
  - `@babel/plugin-transform-block-scoping`
  
  **Note:** Many of these are included in `@babel/core` ^7.20.0 and `babel-preset-expo`, so they may resolve at runtime. Test first — if build succeeds, these can be skipped. If not, add them explicitly.

- [x] **Add ESLint packages to devDependencies** — `eslint.config.js` lines 1-2 import `eslint` and `eslint-config-expo/flat`, neither is in `package.json`. Linting is broken without these:
  ```
  "eslint": "^8.0.0"
  "eslint-config-expo": "latest"
  ```

- [ ] **Verify `@expo/config-plugins` availability** — `plugins/withAppBlocker.js` line 1 and `plugins/withEarnScrollNative.js` line 1 import from `@expo/config-plugins`. This ships with `expo` as a transitive dep, but verify it resolves after install. If not, add explicitly.

### 0.3 — Fix `package.json` Scripts

- [x] **Add missing scripts** — README references `bun run start-web` but no `start-web` script exists. Add:
  ```json
  "start-web": "expo start --web",
  "web": "expo start --web"
  ```

### 0.4 — Fix `app.json` Missing Platform Configs

- [x] **Add iOS configuration block** — `app.json` has no `"ios"` section. Required for iOS builds and App Store submission. Add:
  ```json
  "ios": {
    "bundleIdentifier": "com.earnscroll.app",
    "supportsTablet": true,
    "infoPlist": {
      "NSCameraUsageDescription": "EarnScroll needs camera access to track your exercises in real-time",
      "NSMotionUsageDescription": "EarnScroll uses motion data to enhance exercise tracking"
    }
  }
  ```

- [x] **Add web configuration block** — `app.json` has no `"web"` section. The app has PWA support (`public/manifest.json`, `public/service-worker.js`) but no Expo web config. Add:
  ```json
  "web": {
    "bundler": "metro",
    "output": "static",
    "favicon": "./assets/images/icon.png"
  }
  ```

### 0.5 — Fix Font Reference Mismatch

- [x] **Fix `SpaceGrotesk_600SemiBold` reference** — `app/settings.tsx` line 586 references font weight `SpaceGrotesk_600SemiBold` but `app/_layout.tsx` line 16 only loads `SpaceGrotesk_700Bold`. Either:
  - Change the reference in `settings.tsx` to `SpaceGrotesk_700Bold`, OR
  - Add `SpaceGrotesk_600SemiBold` to the font imports in `_layout.tsx`

### 0.6 — Fix `StatusBar` Hardcode

- [x] **Make StatusBar respect theme** — `app/_layout.tsx` line 62: `<StatusBar style="light">` is hardcoded. Should be:
  ```tsx
  <StatusBar style={isDark ? "light" : "dark"} />
  ```
  This requires reading the current theme from `ThemeProvider`.

### 0.7 — Remove or Disable Non-Functional Plugin

- [x] **Handle `withAppBlocker` plugin** — `app.json` line 56 includes `"./plugins/withAppBlocker"` but `native-src/` is completely empty. The plugin (`plugins/withAppBlocker.js` lines 33-38) tries to copy Kotlin files that don't exist and logs warnings but doesn't crash. For now either:
  - Comment it out of `app.json` plugins array (safest), OR
  - Leave it (it warns but doesn't break builds)

### 0.8 — Initialize Git

- [x] **Run `git init`** — The project has no git repository. Initialize one, create `.gitignore` is already present, make initial commit.

### 0.9 — Verify It Launches

- [ ] **Run `npx expo start`** and verify the app opens on at least one platform (web is easiest for first test)
- [ ] **Fix any startup crashes** that surface from the above changes

---

## Phase 1: Fix Bugs

> Goal: Fix all logic errors, race conditions, type safety issues, and incorrect behavior in existing code.

### 1.1 — TimeBank Context Bugs (`contexts/TimeBank.tsx`)

- [ ] **Fix fire-and-forget AsyncStorage writes** — Lines 277-279, 302-304, 326-328, 334-336: `AsyncStorage.setItem()` is called without `await`. State updates succeed but storage writes are fire-and-forget with `.catch()` only logging. If storage write fails, state and storage diverge permanently. Fix: `await` all `setItem` calls, or implement a write queue with retry.

- [x] **Fix race condition in `updateStreak()`** — Lines 231-268: Reads `lastWorkoutDate` and `currentStreak` from closure which can be stale if two workouts are logged quickly. Both async operations may complete out of order. Fix: Use a reducer pattern or add a mutex/lock.

- [ ] **Fix `hasRecordedTodayRef` never resetting on day change** — Line 431: `hasRecordedTodayRef` is set to `false` in `clearAllWorkoutHistory()` but never resets when the calendar day changes at midnight. If user logs a workout, then the day rolls over, the ref still says "recorded today." Fix: Add a day-change check (compare stored date vs current date on each relevant call).

- [x] **Fix plank earnings calculation** — Lines 71-72: `plankRatio = isUserPro ? earningRatios.planks : 3`. For Pro users, `earningRatios.planks` could be `undefined` if `updateEarningRatios()` was never called, resulting in `undefined` minutes earned (NaN). Fix: `earningRatios.planks ?? 3`.

- [x] **Fix `clearAllWorkoutHistory()` throwing unhandled** — Line 428: Function throws an error that propagates unhandled to callers. Fix: Ensure all callers (developer-menu.tsx) wrap in try/catch, or return error state instead of throwing.

- [x] **Fix `__DEV__` check for emergency pauses** — Line 343: `if (__DEV__)` grants unlimited emergency pauses. In production builds `__DEV__` is `false`, so this is safe — BUT if someone runs a production bundle in development mode, it bypasses the limit. Consider using an explicit developer mode flag from context instead: `if (isDeveloperMode)`.

- [x] **Add JSON.parse validation** — Lines 82-83, 146, 182, 305, 394: Multiple `JSON.parse(stored)` calls with no validation that the parsed data matches the expected type. If AsyncStorage is corrupted, the entire app state could break. Fix: Wrap with `zod` schema validation (zod is already a dependency) or at minimum try/catch with fallback to defaults.

- [x] **Fix `addMinutes` not validating negative values** — `addMinutes()` at ~line 275 doesn't check if `minutes` is negative. A bug elsewhere could drain the time bank. Fix: `if (minutes <= 0) return;`

### 1.2 — NativeWorkoutCamera Bugs (`components/NativeWorkoutCamera.tsx`)

- [x] **Fix unsafe `getAngle()` function** — Line 91: `getAngle = (a: any, b: any, c: any)` uses `any` types. If any keypoint is null/undefined (user partially out of frame), it returns `0` — which is treated as a valid angle and can trigger false rep counts. Fix: Type as `{x: number, y: number}`, return `null` if any point has confidence below threshold, check for null before using in angle comparisons.

- [x] **Fix initial phase detection flaw** — Lines 120-129: Squat counts rep when phase changes from `'down'` to `'up'`, but `currentPhase` starts as `'up'`. So the first squat down → up transition works, BUT if user starts in a squatted position, the initial `'up'` assumption is wrong. Fix: Initialize `currentPhase.value` to `null` and handle the initial state explicitly.

- [x] **Fix unsafe TensorFlow output casting** — Line 107: `const data = outputs[0] as unknown as { [key: number]: number }` — double type assertion bypasses TypeScript safety. The TFLite model output format is not validated. Fix: Add runtime shape check before accessing data.

- [x] **Fix keypoint index access without bounds check** — Line 109: `getKP = (i: number) => ({x: data[i*3], y: data[i*3+1], conf: data[i*3+2]})` — no check that `i*3+2 < data.length`. Fix: Add bounds validation.

- [x] **Fix inconsistent debounce timers** — Lines 124, 144, 161: Squats and pushups use 500ms debounce, planks use 1000ms. The inconsistency seems intentional but is undocumented. Add constants with clear names:
  ```ts
  const SQUAT_DEBOUNCE_MS = 500;
  const PUSHUP_DEBOUNCE_MS = 500;
  const PLANK_DEBOUNCE_MS = 1000;
  ```

- [x] **Fix hardcoded angle thresholds** — Lines 119-120 (squat: 80°/160°), 139 (pushup: 90°/160°), 159-160 (plank: 160°/200°). These magic numbers are scattered in the frame processor worklet. Extract to named constants at the top of the file for easy tuning.

- [x] **Fix no error handling on `plugin.model.runSync()`** — Line 106: `runSync()` can throw if the model is not loaded or input is malformed. The entire frame processor will crash silently. Fix: Wrap in try/catch within the worklet.

- [ ] **Fix plank count semantics** — Lines 75-77: `addExerciseToHistory` is called with raw `count` for planks, but `count` represents accumulated seconds held. The history stores this as "planks done = 65" when it means "65 seconds held." Fix: Either rename the field or convert appropriately before saving.

### 1.3 — Theme Context Bugs (`contexts/Theme.tsx`)

- [x] **Fix unvalidated theme mode from storage** — Line 68: `stored as ThemeMode` casts whatever string is in AsyncStorage to `ThemeMode` without checking it's actually `'light' | 'dark' | 'system'`. If storage is corrupted with an invalid value, theme behavior is undefined. Fix: Validate against allowed values, fallback to `'system'`.

- [ ] **Fix potential null colorScheme** — Lines 57-58: `Appearance.getColorScheme()` can return `null`. The code falls back to `'light'` which is fine, but on first load the app might briefly show light theme when system is dark. Fix: Ensure the fallback is applied before first render completes.

### 1.4 — PWAInstallPrompt Bugs (`components/PWAInstallPrompt.tsx`)

- [x] **Fix duplicate iOS detection logic** — Lines 18 and 82: Identical `navigator.userAgent` regex runs twice. Extract to a single `const` or memoize.

- [x] **Fix inconsistent platform detection** — Lines 15, 78, 82: Mixes `Platform.OS` checks with manual `navigator.userAgent` regex. Use one consistent approach.

- [ ] **Fix silent failure on install click** — Lines 55-67: If `deferredPrompt` is null when user clicks "Install Now" (e.g., they dismissed the browser prompt), nothing happens — no feedback. Fix: Show a message like "Open your browser menu to install."

- [x] **Fix `as any` type assertions in styles** — Lines 131, 150, 162, 185, 195: StyleSheet values use `as any` to bypass type checking. Fix: Use proper types like `'absolute' as const`.

### 1.5 — Screen-Level Bugs

- [x] **Fix `app/modal.tsx` — unused template** — This is a default Expo Router template. It's `visible={true}` always (line 19), has hardcoded "Modal" title, and is never navigated to from anywhere in the app. Either delete it or implement it properly.

- [x] **Fix `app/+not-found.tsx` route** — Line 12: `href="/"` should be `href="/(tabs)"` to match the actual tab layout route structure.

- [ ] **Fix tab bar hardcoded colors** — `app/(tabs)/_layout.tsx` lines 13-15: Hardcoded hex colors `'#64748B'`, `'#999'`, `'#0F172A'`, `'#fff'`, etc. for tab bar instead of using theme constants from `constants/colors.ts`.

- [ ] **Fix dashboard calendar hardcoded theme** — `app/(tabs)/index.tsx` lines 259-278: Calendar component theme colors are all hardcoded hex values instead of using the theme system.

- [ ] **Remove debug console.log** — `app/_layout.tsx` line 27: `console.log("✅ APP STARTED")` — debug artifact. Remove or gate behind `__DEV__`.

---

## Phase 2: Complete Core Features

> Goal: Implement the major features that are currently stubbed, mocked, or missing.

### 2.1 — Native Camera AI (Currently Web-Only)

**Current state:** `app/(tabs)/workout.tsx` line 22 checks `Platform.OS === 'web'` and shows a `WebAIPlaceholder` (lines 12-15) — a simple text message saying AI isn't available. On native, it renders `NativeWorkoutCamera` which has TFLite integration code but the pipeline isn't fully battle-tested.

- [ ] **Test `NativeWorkoutCamera` on a physical Android device** — The component at `components/NativeWorkoutCamera.tsx` has the full pipeline: camera → frame processor → TFLite model → keypoint extraction → angle calculation → rep counting. But it may have runtime issues not visible in code review. Test with each exercise type.

- [ ] **Add camera permission handling UI** — Lines 45-47: `requestPermission()` is called but there's no UI for the denied state. If user denies camera permission, they see "No Camera" text with no way to re-request. Add a "Grant Permission" button that opens device settings.

- [ ] **Add model loading state UI** — Line 40: `useTensorflowModel(require(...))` — no loading indicator while the 4.7MB model loads. User sees nothing until model is ready. Add a loading spinner/progress indicator.

- [ ] **Add workout session auto-save** — Currently reps are only saved when the user explicitly ends the workout. If the app crashes mid-workout, all progress is lost. Add periodic checkpoint saves (e.g., every 10 reps or every 30 seconds).

- [ ] **Remove or implement web AI** — The `WebAIPlaceholder` is a dead end. Either:
  - Implement web-based TensorFlow.js pose detection (the old code is in `backups/workout_logic_reference.tsx` — 1557 lines of working web AI code), OR
  - Show a clear message that workouts require the native app

### 2.2 — App Blocking / Targets (Currently UI-Only)

**Current state:** `app/(tabs)/targets.tsx` has a full UI for browsing installed apps, searching, and toggling block status. But:
- Line 47: `EarnScrollModule.getInstalledApps()` calls a native module that **doesn't exist**
- Line 63: `EarnScrollModule.setBlockedPackages()` calls a native module that **doesn't exist**
- `native-src/` directory is completely empty
- `plugins/withAppBlocker.js` tries to copy Kotlin files that aren't there

- [ ] **Create `native-src/android/EarnScrollModule.kt`** — Native module exposing:
  - `getInstalledApps()`: Returns JSON array of `{name, packageName, icon}` for all installed apps
  - `setBlockedPackages(json: String)`: Receives list of packages to block
  - `isAccessibilityServiceEnabled()`: Checks if the service has permission
  
- [ ] **Create `native-src/android/EarnScrollPackage.kt`** — React Native package registration for the module

- [ ] **Create `native-src/android/AppBlockerService.kt`** — Android AccessibilityService that:
  - Monitors foreground app changes
  - Checks if foreground app is in the blocked list
  - If blocked and time bank is 0, overlays a "Do exercises to unlock" screen
  - If blocked and time bank > 0, deducts minutes while app is in use
  
- [ ] **Create `native-src/android/res/xml/accessibility_service_config.xml`** — Service configuration declaring accessibility event types to monitor

- [ ] **Add accessibility service permission flow** — Users must manually enable the accessibility service in Android settings. Add an onboarding step or settings option that deep-links to the accessibility settings page with instructions.

- [x] **Fix security issue in `withEarnScrollNative.js`** — Line 221: `android:exported='true'` on the accessibility service exposes it to other apps. Change to `android:exported='false'`.

- [ ] **Add iOS equivalent or "Android only" messaging** — App blocking via accessibility services is Android-specific. On iOS, add clear messaging that this feature requires Android, or research iOS Screen Time API alternatives.

### 2.3 — Payment Integration (Currently Mocked)

**Current state:** `app/go-pro.tsx` line 24-29: `handlePlanPurchase()` just calls `toggleProStatus()` — a dev toggle. No real payment processing exists.

- [ ] **Integrate `expo-in-app-purchases` or `react-native-iap`** — Add actual IAP for the 3 pricing tiers:
  - Monthly: ₹99/month (intro, then ₹199/month)
  - Annual: ₹1,299/year
  - Lifetime: ₹3,499 one-time
  
- [ ] **Add purchase validation** — Server-side receipt validation (requires a backend — see Phase 2.5)

- [ ] **Add subscription management** — `isUserPro` in `contexts/TimeBank.tsx` is a simple boolean with no expiration timestamp. Add:
  - `proExpiresAt: Date | null`
  - `proTier: 'monthly' | 'annual' | 'lifetime' | null`
  - Expiration check on app launch
  - Grace period handling

- [ ] **Add restore purchases** — Required by both App Store and Play Store guidelines. Button in settings to restore previous purchases on new device.

- [ ] **Update `go-pro.tsx` disclaimer** — Line 220: Currently says this is a demo. Replace with actual terms.

### 2.4 — Legal Pages (Currently Lorem Ipsum)

- [ ] **Write real Privacy Policy** — `app/privacy-policy.tsx` lines 28-66: Entire content is Lorem Ipsum placeholder. Must cover:
  - Camera data usage (frames processed on-device, not uploaded)
  - AsyncStorage data stored locally
  - No cloud data collection (currently)
  - Accessibility service data access (if app blocking implemented)
  - Exercise/health data handling

- [ ] **Write real Terms of Service** — `app/terms-of-service.tsx` lines 28-76: Entire content is Lorem Ipsum placeholder. Must cover:
  - Subscription terms and refund policy
  - Health/fitness disclaimer (app is not medical advice)
  - Acceptable use
  - Liability limitations

- [ ] **Update hardcoded dates** — Both files have `"January 2025"` at line 26. Update to actual effective date.

- [ ] **Make email addresses clickable** — `privacy-policy.tsx` lines 71-72 and `terms-of-service.tsx` lines 81-82: Email addresses (`privacy@earnscroll.com`, `support@earnscroll.com`, `legal@earnscroll.com`) are plain text, not `mailto:` links. Wrap in `<Text onPress={() => Linking.openURL('mailto:...')}>`.

### 2.5 — Backend (Currently None)

**Current state:** Everything is device-local. No user accounts, no cloud sync, no server-side validation.

- [ ] **Design backend requirements** — At minimum for deployment:
  - IAP receipt validation endpoint
  - User account system (for cross-device sync, optional)
  - Analytics endpoint (optional but recommended)
  
- [ ] **Decide on backend technology** — Options:
  - Firebase (quick, serverless, good for MVP)
  - Supabase (open-source Firebase alternative)
  - Custom API (more control, more work)
  
- [ ] **Add user authentication** — Currently no sign-up/login. At minimum for payment:
  - Anonymous auth (Firebase Auth anonymous) for receipt validation
  - Optional email/social login for cross-device sync

- [ ] **Add data export** — Users currently have no way to back up their workout history. Add export to JSON/CSV in settings.

---

## Phase 3: Polish

> Goal: Fix all the rough edges — accessibility, theming consistency, dead code, hardcoded values, error UX.

### 3.1 — Accessibility (Pervasive Gaps)

Every screen is missing accessibility labels and semantic markup. This blocks App Store approval (Apple requires VoiceOver support).

- [ ] **`app/(tabs)/index.tsx`**: Add accessibility labels to:
  - Emergency access button (line 174)
  - Emergency indicator dot (line 188)
  - Calendar empty state icon (line 282)
  - Stats grid items (lines 328-351)
  - Emergency confirmation modal (lines 442-508)
  
- [ ] **`app/(tabs)/workout.tsx`**: Add accessibility labels to:
  - Camera view and overlay elements
  - Exercise selector cards
  - Rep counter display

- [ ] **`app/(tabs)/targets.tsx`**: Add accessibility labels to:
  - App toggle switches (line 174-175 has `accessibilityRole` but no `accessibilityLabel`)
  - Search input (line 264-276)
  - App list items with block status

- [ ] **`app/settings.tsx`**: Add accessibility labels to:
  - Back button (line 136)
  - Theme selector buttons (lines 153-209)
  - Earning option buttons
  - Lock icons on Pro features
  - Pro badge (line 280)

- [ ] **`app/onboarding.tsx`**: Add accessibility labels to:
  - Exercise selection cards (lines 75-108)
  - Selected badge indicator (line 104)
  - Continue button disabled/enabled states

- [ ] **`app/go-pro.tsx`**: Add accessibility labels to:
  - Crown icon (line 79) — mark as decorative with `accessibilityElementsHidden`
  - Feature comparison table — needs proper table semantics
  - Plan cards with prices (lines 154-216)
  - "BEST VALUE" badge (line 192)

- [ ] **`app/privacy-policy.tsx` & `app/terms-of-service.tsx`**: Add semantic heading hierarchy and make contact emails accessible links.

### 3.2 — Theme Consistency (Hardcoded Colors Everywhere)

The app has a proper color system in `constants/colors.ts` but most screens bypass it with hardcoded hex values.

- [ ] **Audit and replace hardcoded colors in `app/(tabs)/index.tsx`** — Lines 10-13, 31-35, 90, 98, 259-278, 477, 664, 684, 701: At least 15+ hardcoded color values. Replace with theme constants.

- [ ] **Audit and replace hardcoded colors in `app/(tabs)/_layout.tsx`** — Lines 13-15, 23-28: Tab bar colors hardcoded. Replace with theme constants.

- [ ] **Audit and replace hardcoded colors in `app/(tabs)/targets.tsx`** — Lines 34-42, 158, 190, 216-219, 223, 269, 371: Multiple hardcoded values. Replace with theme constants.

- [ ] **Audit and replace hardcoded colors in `app/settings.tsx`** — Lines 43-50 and throughout: Defines local color constants that duplicate theme. Use theme system instead.

- [ ] **Audit and replace hardcoded colors in `app/onboarding.tsx`** — Lines 34-49, 61, 80-82: Gradient colors and layout constants. Move to theme.

- [ ] **Audit and replace hardcoded colors in `app/go-pro.tsx`** — Lines 10-15, 31-55, 166-220: Extensive hardcoded color scheme. Move to theme.

- [ ] **Audit and replace hardcoded colors in `app/developer-menu.tsx`** — Lines 81-89, 168-171: Debug screen colors. Move to theme.

- [ ] **Audit and replace hardcoded colors in `components/NativeWorkoutCamera.tsx`** — Lines 222-223, 239-257: Button colors and all style values. Move to theme.

- [ ] **Audit and replace hardcoded colors in `app/modal.tsx`** — Lines 72, 82. Move to theme.

- [ ] **Audit and replace hardcoded colors in `app/+not-found.tsx`** — Line 37. Move to theme.

### 3.3 — Error Handling & User Feedback

- [ ] **Add error boundary component** — No React error boundary exists. If any screen crashes, the entire app crashes. Create a generic `<ErrorBoundary>` component and wrap it around the root layout.

- [ ] **Add user-facing error messages in `targets.tsx`** — Lines 53-55: `getInstalledApps()` failure only logs to console. Show a retry-able error state in the UI.

- [ ] **Add user-facing error messages in `index.tsx`** — Lines 77-78: Emergency pause error shows a generic `Alert.alert('Error', 'Failed...')`. Include the actual error detail.

- [ ] **Add font loading error fallback** — `app/_layout.tsx` lines 39, 49: If fonts fail to load, the app shows a blank screen forever. Add a fallback UI or proceed with system fonts.

- [ ] **Add workout camera error states** — `components/NativeWorkoutCamera.tsx`: No error UI if model fails to load, camera fails to initialize, or frame processing throws. Add error states with retry options.

### 3.4 — Dead Code & Cleanup

- [ ] **Delete `backups/workout_logic_reference.tsx`** — 1557 lines of old web-based workout code. It's a backup of previous architecture (web TensorFlow.js). If needed for reference during web AI implementation (Phase 2.1), move to `docs/` first. Otherwise delete.

- [ ] **Delete `backups/withAndroidFixjs.backup`** — 28 lines. Old Gradle fix backup that's no longer relevant.

- [ ] **Delete or implement `app/modal.tsx`** — Unused Expo Router template. Not referenced anywhere.

- [ ] **Evaluate `zustand` dependency** — `package.json` includes `zustand: ^4.5.2` but the app uses `@nkzw/create-context-hook` for state. If zustand is truly unused, remove it.

- [ ] **Evaluate `@tanstack/react-query` dependency** — Installed and configured in `_layout.tsx` (`QueryClientProvider`) but the docs say it's "currently used primarily as infrastructure." If no actual queries exist, consider removing to reduce bundle size.

- [ ] **Remove or gate debug console.logs** — Multiple files have `console.log` statements for debugging:
  - `app/_layout.tsx` line 27
  - `app/(tabs)/targets.tsx` line 67
  - Various files throughout
  Gate behind `__DEV__` or remove entirely.

### 3.5 — PWA / Web Polish

- [ ] **Update `public/service-worker.js` cache versioning** — `CACHE_NAME` is static with no version detection. Returning users may get stale cached assets. Add a version string that changes with each deploy.

- [ ] **Add cache size limits to service worker** — No cleanup of cached entries. Cache can grow indefinitely. Add max-age or max-entries policy.

- [ ] **Fix service worker error handling** — Lines 19-21: `cache.addAll()` error is silently swallowed. Lines 71-73: Unhandled promise in `.then()` chain.

- [ ] **Update `public/manifest.json`** — Verify icons, theme colors, and display settings match the current app branding.

### 3.6 — Security Fixes

- [x] **Fix exported accessibility service** — `plugins/withEarnScrollNative.js` line 221: `android:exported='true'` exposes the blocking service to other apps. Must be `android:exported='false'`.

- [ ] **Encrypt sensitive AsyncStorage data** — Time bank, streak, and Pro status are stored in plain text. A user with device access can edit AsyncStorage directly to give themselves unlimited time or Pro status. Consider `expo-secure-store` for sensitive values like `@is_user_pro`.

- [x] **Remove `__DEV__` bypass for production logic** — `contexts/TimeBank.tsx` line 343: `__DEV__` grants unlimited emergency pauses. While `__DEV__` is `false` in production, this is a code smell. Use the explicit `isDeveloperMode` flag from context instead.

---

## Phase 4: Deploy-Ready

> Goal: Testing, CI/CD, store configurations, and everything needed for actual deployment.

### 4.1 — Testing

- [ ] **Set up testing framework** — No test files or testing config exists. Add:
  - `jest` and `@testing-library/react-native` for unit/component tests
  - Configure in `package.json` or `jest.config.js`

- [ ] **Write unit tests for `contexts/TimeBank.tsx`** — Critical business logic:
  - `addMinutes()` — correct addition, negative value rejection
  - `updateStreak()` — streak increment, reset after gap, same-day no-op
  - `triggerEmergencyPause()` — limit enforcement, daily reset
  - `addExerciseToHistory()` — correct history structure, deduplication
  - `generateMockWorkoutHistory()` — valid output structure
  - `clearAllWorkoutHistory()` — complete reset

- [ ] **Write unit tests for `contexts/Theme.tsx`** — Theme switching, persistence, system theme detection

- [ ] **Write component tests for key screens** — At minimum:
  - Onboarding flow (exercise selection → completion)
  - Dashboard (time display, streak, calendar)
  - Settings (theme toggle, earning ratio changes)

- [ ] **Write integration test for workout flow** — Mock camera/model → detect reps → update time bank → verify history

### 4.2 — CI/CD

- [ ] **Create `eas.json`** — Required for Expo Application Services (cloud builds). Does not exist. Create with development, preview, and production profiles:
  ```json
  {
    "cli": { "version": ">= 3.0.0" },
    "build": {
      "development": { "developmentClient": true, "distribution": "internal" },
      "preview": { "distribution": "internal" },
      "production": {}
    },
    "submit": {
      "production": {}
    }
  }
  ```

- [ ] **Create GitHub Actions workflow** — No CI/CD exists. Add `.github/workflows/ci.yml`:
  - Lint check (`npm run lint`)
  - TypeScript check (`npx tsc --noEmit`)
  - Unit tests (`npm test`)
  - EAS build (on push to main)

- [ ] **Set up EAS Update** — For OTA updates post-deployment. Configure update channels in `eas.json`.

### 4.3 — Store Submission Prep

- [ ] **Create app store screenshots** — Required for both App Store and Play Store. Generate for:
  - iPhone 6.5" (1284×2778)
  - iPhone 5.5" (1242×2208)
  - Android phone (1080×1920)
  - Android tablet (optional)

- [ ] **Write app store description** — For both stores. Include:
  - Short description (80 chars)
  - Full description
  - Keywords
  - Category (Health & Fitness)

- [ ] **Configure app signing** — 
  - Android: Generate upload key, configure in `eas.json`
  - iOS: Configure provisioning profiles and certificates

- [ ] **Set up splash screen for dark mode** — `app.json` lines 11-14: Only light splash configured. Add dark variant:
  ```json
  "splash": {
    "image": "./assets/images/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#ffffff",
    "dark": {
      "image": "./assets/images/splash-icon.png",
      "backgroundColor": "#090E1B"
    }
  }
  ```

- [ ] **Verify all required permissions have descriptions** — Android permissions in `app.json` lines 23-28 are declared but need user-facing descriptions for Play Store review:
  - `CAMERA` — "Track exercises in real-time"
  - `QUERY_ALL_PACKAGES` — "Show installed apps for blocking"
  - `PACKAGE_USAGE_STATS` — "Monitor screen time usage"

- [ ] **Add age rating questionnaire answers** — App involves fitness tracking and screen time monitoring. Prepare content rating answers for both stores.

### 4.4 — README & Documentation Update

- [ ] **Fix README Expo version** — Line 14 states "Expo SDK 54.0.0+" but actual is `~52.0.28`.

- [ ] **Standardize package manager instructions** — README assumes Bun throughout but project has npm lock file. Document both or pick one.

- [ ] **Add setup instructions for new developers** — Current README is product-focused. Add a "Development Setup" section:
  1. Clone repo
  2. Install dependencies
  3. Set up environment
  4. Run on each platform
  5. Run tests

- [ ] **Update `docs/STATE_OF_DEVELOPMENT.md`** — Keep this doc current as features are implemented.

### 4.5 — Configuration Hardening

- [ ] **Add `.env.example` file** — Even though no env vars are used currently, payments/backend (Phase 2.3, 2.5) will need them. Create the file as a placeholder with comments.

- [ ] **Update `.gitignore`** — Add missing entries:
  ```
  .vscode/
  .idea/
  *.swp
  Thumbs.db
  .tsbuildinfo
  *.js.map
  ```

- [ ] **Pin or range-lock critical dependencies** — `package.json` line 38: `react-native: "0.76.6"` is exactly pinned (good). But `expo: "~52.0.28"` allows patch updates. Review all deps for appropriate version ranges.

- [ ] **Consider enabling New Architecture** — `app.json` line 10: `"newArchEnabled": false`. React Native's new architecture (Fabric + TurboModules) improves performance. Evaluate compatibility with current dependencies before enabling.

---

## Priority Order (If Time-Limited)

If you can't do everything, this is the order of impact:

1. **Phase 0** (all of it) — App literally doesn't run without this
2. **Phase 1.1** (TimeBank bugs) — Core logic is broken
3. **Phase 1.2** (Camera bugs) — Main feature is unreliable
4. **Phase 2.1** (Native camera testing) — Core value prop
5. **Phase 2.4** (Legal pages) — Store rejection without real policies
6. **Phase 3.1** (Accessibility) — App Store rejection without VoiceOver support
7. **Phase 4.1** (Testing) — Confidence in the above fixes
8. **Phase 2.2** (App blocking) — The "killer feature"
9. **Phase 2.3** (Payments) — Revenue
10. Everything else

---

## Files NOT Needing Changes (Verified OK)

- `metro.config.js` — Minimal and correct
- `tsconfig.json` — Properly configured (minor: `skipLibCheck: true` is fine for MVP)
- `assets/models/movenet_lightning.tflite` — Valid TFLite model (4.7MB)
- `assets/images/` — Icons and splash present
- `constants/colors.ts` — Well-structured color system (104 lines)
- `constants/typography.ts` — Simple font exports (13 lines)
- `docs/` — 8 comprehensive documentation files, all accurate to current state
