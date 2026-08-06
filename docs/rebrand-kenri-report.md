# Kenri rebrand - occurrence report

Generated from a case-insensitive scan of `earn[ _-]?scroll` across the main app
repo, excluding `node_modules`, `.git`, `.expo`, Android build output, and
`package-lock.json`. The `website/` tree is a separate repository
(`earnscroll-website`) and is reported separately.

## 1. NEEDS HUMAN DECISION (12) - all left untouched

| File | Line | Context | Why it needs a decision |
|---|---|---|---|
| `ROADMAP.md` | 296 | `- [ ] **Make email addresses clickable** — `privacy-policy.tsx` lines 71-72 and `terms-of-service.tsx` lines 8...` | Domain not owned/decided |
| `plans/google-signin-and-password-reset-setup.md` | 217 | `2. Enter your domain, e.g. `earnscroll.app`` | Domain not owned/decided |
| `plans/google-signin-and-password-reset-setup.md` | 235 | `\| Sender email \| `noreply@earnscroll.app` \|` | Domain not owned/decided |
| `plans/landing-page-prompt.md` | 198 | `- **Right**: Contact email — support@earnscroll.com` | Domain not owned/decided |
| `plans/landing-page-prompt.md` | 215 | `Kenri ("we", "our", "us") publishes the Kenri: Screen-Time Gym mobile application ("the App"). For any privacy...` | Domain not owned/decided |
| `plans/landing-page-prompt.md` | 271 | `Email privacy@earnscroll.com for any privacy questions, data-subject requests, or to exercise the rights descr...` | Domain not owned/decided |
| `plans/landing-page-prompt.md` | 272 | `Support: support@earnscroll.com` | Domain not owned/decided |
| `plans/landing-page-prompt.md` | 291 | `You are responsible for keeping your account credentials secure and for activity that occurs under your accoun...` | Domain not owned/decided |
| `plans/landing-page-prompt.md` | 319 | `For any questions about these Terms, email legal@earnscroll.com.` | Domain not owned/decided |
| `plans/landing-page-prompt.md` | 320 | `Support: support@earnscroll.com` | Domain not owned/decided |
| `plans/landing-page-prompt.md` | 329 | `- **Email**: support@earnscroll.com (clickable mailto link)` | Domain not owned/decided |
| `plans/landing-page-prompt.md` | 333 | `- **Account deletion**: "To delete your account, go to Settings → Delete Account in the app, or email support@...` | Domain not owned/decided |

## 2. Changed (158 lines)

| File | Line (pre) | Context snippet | Classification | Action taken |
|---|---|---|---|---|
| `CLAUDE.md` | 7 | `EarnScroll is a React Native mobile app (Expo SDK 52) that gamifies screen time: users earn minutes of app usage by completing real exercises (squats,...` | CHANGED | EarnScroll -> Kenri |
| `CLAUDE.md` | 62 | `- **`plugins/withEarnScrollNative.js`** — Generates Kotlin source inline (doesn't read from `native-src/`). Creates `EarnScrollModule` (React Native b...` | CHANGED | EarnScroll -> Kenri |
| `CLAUDE.md` | 64 | `Note: Both plugins register accessibility services — `withAppBlocker` registers `AppBlockerService` and `withEarnScrollNative` registers `BlockerServi...` | CHANGED | EarnScroll -> Kenri |
| `ROADMAP.md` | 1 | `# EarnScroll: Complete Fix & Deploy Roadmap` | CHANGED | EarnScroll -> Kenri |
| `ROADMAP.md` | 3 | `> **What this is:** A full audit of every issue, bug, missing feature, and task in the EarnScroll codebase.` | CHANGED | EarnScroll -> Kenri |
| `ROADMAP.md` | 11 | `**EarnScroll: Screen-Time Gym** is a React Native + Expo (SDK 52, RN 0.76.6) mobile app where users earn screen time by doing exercises (squats, pushu...` | CHANGED | EarnScroll -> Kenri |
| `ROADMAP.md` | 30 | `- `plugins/withEarnScrollNative.js` — Expo config plugin for native module ~306 lines` | CHANGED | EarnScroll -> Kenri |
| `ROADMAP.md` | 70 | `- [ ] **Verify `@expo/config-plugins` availability** — `plugins/withAppBlocker.js` line 1 and `plugins/withEarnScrollNative.js` line 1 import from `@e...` | CHANGED | EarnScroll -> Kenri |
| `ROADMAP.md` | 88 | `"NSCameraUsageDescription": "EarnScroll needs camera access to track your exercises in real-time",` | CHANGED | EarnScroll -> Kenri |
| `ROADMAP.md` | 89 | `"NSMotionUsageDescription": "EarnScroll uses motion data to enhance exercise tracking"` | CHANGED | EarnScroll -> Kenri |
| `ROADMAP.md` | 254 | `- [x] **Fix security issue in `withEarnScrollNative.js`** — Line 221: `android:exported='true'` on the accessibility service exposes it to other apps....` | CHANGED | EarnScroll -> Kenri |
| `ROADMAP.md` | 431 | `- [x] **Fix exported accessibility service** — `plugins/withEarnScrollNative.js` line 221: `android:exported='true'` exposes the blocking service to o...` | CHANGED | EarnScroll -> Kenri |
| `android/app/src/main/java/com/earnscroll/BlockedActivity.kt` | 75 | `// "Open EarnScroll" button` | CHANGED | EarnScroll -> Kenri |
| `android/app/src/main/java/com/earnscroll/BlockedActivity.kt` | 77 | `text = "Open EarnScroll"` | CHANGED | EarnScroll -> Kenri |
| `android/app/src/main/res/values/strings.xml` | 2 | `<string name="app_name">EarnScroll: Screen-Time Gym</string>` | CHANGED | EarnScroll -> Kenri |
| `android/app/src/main/res/values/strings.xml` | 6 | `<string name="accessibility_service_description" translatable="false">EarnScroll observes which app is in the foreground to block distracting apps tha...` | CHANGED | EarnScroll -> Kenri |
| `android/settings.gradle` | 34 | `rootProject.name = 'EarnScroll Screen-Time Gym'` | CHANGED | EarnScroll -> Kenri |
| `app.json` | 3 | `"name": "EarnScroll: Screen-Time Gym",` | CHANGED | EarnScroll -> Kenri |
| `app.json` | 21 | `"NSMotionUsageDescription": "EarnScroll uses motion data to enhance exercise tracking accuracy"` | CHANGED | EarnScroll -> Kenri |
| `app.json` | 74 | `"./plugins/withEarnScrollNative",` | CHANGED | EarnScroll -> Kenri |
| `app/(auth)/login.tsx` | 127 | `<Text style={[styles.logo, { color: accentColor }]}>EarnScroll</Text>` | CHANGED | EarnScroll -> Kenri |
| `app/(tabs)/targets.tsx` | 145 | `'EarnScroll needs accessibility access to block distracting apps when your time runs out. Please enable "EarnScroll" in the next screen.',` | CHANGED | EarnScroll -> Kenri |
| `app/accessibility-disclosure.tsx` | 85 | `body="EarnScroll uses Android's Accessibility API to block distracting apps you select when your earned-time bank is empty. Open a blocked app, see a ...` | CHANGED | EarnScroll -> Kenri |
| `app/accessibility-disclosure.tsx` | 108 | `You can revoke this permission at any time in Android Settings → Accessibility → EarnScroll.` | CHANGED | EarnScroll -> Kenri |
| `app/go-pro.tsx` | 103 | `Create an account or sign in to unlock EarnScroll Pro and access all premium features.` | CHANGED | EarnScroll -> Kenri |
| `app/go-pro.tsx` | 140 | `<Text style={styles.title}>Unlock EarnScroll Pro</Text>` | CHANGED | EarnScroll -> Kenri |
| `app/onboarding.tsx` | 104 | `<Text style={styles.title}>Welcome to EarnScroll!</Text>` | CHANGED | EarnScroll -> Kenri |
| `app/privacy-policy.tsx` | 48 | `EarnScroll ("we", "our", "us") publishes the EarnScroll: Screen-Time Gym mobile application ("the App"). For any privacy questions you can reach us at...` | CHANGED | EarnScroll -> Kenri |
| `app/privacy-policy.tsx` | 123 | `EarnScroll is intended for users 13 and older. We do not knowingly collect data from anyone under 13, and we do not show targeted advertising to minor...` | CHANGED | EarnScroll -> Kenri |
| `app/terms-of-service.tsx` | 44 | `By creating an account or using EarnScroll, you agree to these Terms. You must be at least 13 years old to use the App. If you are under the age of ma...` | CHANGED | EarnScroll -> Kenri |
| `app/terms-of-service.tsx` | 75 | `EarnScroll is a fitness and screen-time tool. It is NOT medical advice and does NOT diagnose, treat, or prevent any condition. Consult a physician bef...` | CHANGED | EarnScroll -> Kenri |
| `app/terms-of-service.tsx` | 80 | `To the maximum extent permitted by law, EarnScroll and its operators are not liable for any indirect, incidental, consequential, or punitive damages, ...` | CHANGED | EarnScroll -> Kenri |
| `components/ConsentPrompt.tsx` | 62 | `Help Improve EarnScroll` | CHANGED | EarnScroll -> Kenri |
| `components/NativeWorkoutCamera.tsx` | 522 | `EarnScroll uses your camera to count your reps in real time. Frames are processed on-device only — nothing is uploaded, saved, or shared.` | CHANGED | EarnScroll -> Kenri |
| `components/PWAInstallPrompt.tsx` | 104 | `<Text style={styles.title}>Install EarnScroll</Text>` | CHANGED | EarnScroll -> Kenri |
| `components/PWAInstallPrompt.tsx` | 108 | `: 'Install EarnScroll on your device for quick access and offline functionality.'` | CHANGED | EarnScroll -> Kenri |
| `contexts/TimeBank.tsx` | 234 | `// When EarnScroll returns to foreground, read back natively-drained minutes` | CHANGED | EarnScroll -> Kenri |
| `docs/AI_MODEL_DOCUMENTATION.md` | 5 | `EarnScroll uses **TensorFlow.js** and **MoveNet** for real-time pose estimation to detect and count exercises (currently implemented for web via brows...` | CHANGED | EarnScroll -> Kenri |
| `docs/COMMON_ISSUES_AND_SOLUTIONS.md` | 405 | `"cameraPermission": "Allow EarnScroll to use your camera for exercise tracking."` | CHANGED | EarnScroll -> Kenri |
| `docs/DEVELOPMENT_BEST_PRACTICES.md` | 5 | `This document outlines the coding standards, patterns, and practices used throughout the EarnScroll project. Following these guidelines ensures consis...` | CHANGED | EarnScroll -> Kenri |
| `docs/FREEMIUM_IMPLEMENTATION.md` | 5 | `EarnScroll operates on a **freemium model** with clear value differentiation between Free and Pro tiers. This document details the implementation, gat...` | CHANGED | EarnScroll -> Kenri |
| `docs/PRODUCT_CONTEXT.md` | 1 | `# EarnScroll - Complete Product Context` | CHANGED | EarnScroll -> Kenri |
| `docs/PRODUCT_CONTEXT.md` | 3 | `> **📋 Purpose**: This document provides comprehensive context about EarnScroll for AI assistants, product discussions, and brainstorming sessions. It ...` | CHANGED | EarnScroll -> Kenri |
| `docs/PRODUCT_CONTEXT.md` | 7 | `**EarnScroll (Screen-Time Gym)** is a fitness gamification mobile app that flips the script on screen time: instead of limiting it, users *earn* it by...` | CHANGED | EarnScroll -> Kenri |
| `docs/PRODUCT_CONTEXT.md` | 487 | `Use this document to understand EarnScroll's complete context when:` | CHANGED | EarnScroll -> Kenri |
| `docs/PROJECT_OVERVIEW.md` | 1 | `# EarnScroll - Project Overview` | CHANGED | EarnScroll -> Kenri |
| `docs/PROJECT_OVERVIEW.md` | 5 | `**EarnScroll** (also known as "Screen-Time Gym") is a fitness gamification mobile application that allows users to earn screen time by completing phys...` | CHANGED | EarnScroll -> Kenri |
| `docs/STATE_MANAGEMENT.md` | 5 | `EarnScroll uses a **dual-context hybrid state management** approach combining:` | CHANGED | EarnScroll -> Kenri |
| `docs/auth-fix-report.md` | 4 | `Supabase project: `zurahjqghjratswjjpsg` (EarnScroll, ap-northeast-1)` | CHANGED | EarnScroll -> Kenri |
| `legal/data-safety-form-guide.html` | 6 | `<title>EarnScroll — Data Safety Form Guide</title>` | CHANGED | EarnScroll -> Kenri |
| `legal/play-permission-declarations.md` | 14 | `EarnScroll's core feature lets users pick which installed apps to block when` | CHANGED | EarnScroll -> Kenri |
| `legal/play-permission-declarations.md` | 59 | `- Android Settings → Accessibility → EarnScroll being enabled.` | CHANGED | EarnScroll -> Kenri |
| `legal/play-permission-declarations.md` | 60 | `- Returning to the app; opening a blocked app; the EarnScroll block screen` | CHANGED | EarnScroll -> Kenri |
| `legal/play-permission-declarations.md` | 70 | `EarnScroll uses `SYSTEM_ALERT_WINDOW` to display the "App Blocked" overlay` | CHANGED | EarnScroll -> Kenri |
| `legal/play-permission-declarations.md` | 72 | `remaining. The overlay shows two actions: open EarnScroll, or go home.` | CHANGED | EarnScroll -> Kenri |
| `legal/play-permission-declarations.md` | 83 | `- The user tapping "Open EarnScroll" → leaving the blocked app.` | CHANGED | EarnScroll -> Kenri |
| `legal/play-permission-declarations.md` | 91 | `EarnScroll uses `UsageStatsManager` only to display the user's own daily` | CHANGED | EarnScroll -> Kenri |
| `legal/privacy-policy.html` | 6 | `<title>EarnScroll — Privacy Policy</title>` | CHANGED | EarnScroll -> Kenri |
| `legal/privacy-policy.html` | 39 | `<p>EarnScroll ("we", "our", "us") publishes the EarnScroll: Screen-Time Gym mobile application ("the App"). For any privacy questions, email <a href="...` | CHANGED | EarnScroll -> Kenri |
| `legal/privacy-policy.html` | 95 | `<p>EarnScroll is intended for users 13 and older. We do not knowingly collect data from anyone under 13, and we do not show targeted advertising to mi...` | CHANGED | EarnScroll -> Kenri |
| `legal/terms-of-service.html` | 6 | `<title>EarnScroll — Terms of Service</title>` | CHANGED | EarnScroll -> Kenri |
| `legal/terms-of-service.html` | 35 | `<p>By creating an account or using EarnScroll, you agree to these Terms. You must be at least 13 years old to use the App. If you are under the age of...` | CHANGED | EarnScroll -> Kenri |
| `legal/terms-of-service.html` | 56 | `<p>EarnScroll is a fitness and screen-time tool. It is NOT medical advice and does NOT diagnose, treat, or prevent any condition. Consult a physician ...` | CHANGED | EarnScroll -> Kenri |
| `legal/terms-of-service.html` | 59 | `<p>To the maximum extent permitted by law, EarnScroll and its operators are not liable for any indirect, incidental, consequential, or punitive damage...` | CHANGED | EarnScroll -> Kenri |
| `plans/SETUP_GUIDE.txt` | 2 | `EARNSCROLL — COMPLETE ANDROID SETUP GUIDE` | CHANGED | EarnScroll -> Kenri |
| `plans/SETUP_GUIDE.txt` | 7 | `This document is a complete, step-by-step guide for setting up the EarnScroll` | CHANGED | EarnScroll -> Kenri |
| `plans/SETUP_GUIDE.txt` | 13 | `EarnScroll is a React Native app built with Expo SDK 54 and expo-dev-client.` | CHANGED | EarnScroll -> Kenri |
| `plans/SETUP_GUIDE.txt` | 38 | `EarnScroll requires JDK 17 exactly. Android tooling does not work with JDK 21+.` | CHANGED | EarnScroll -> Kenri |
| `plans/SETUP_GUIDE.txt` | 144 | `Extract the EarnScroll zip to a short path to avoid Windows path length issues.` | CHANGED | EarnScroll -> Kenri |
| `plans/SETUP_GUIDE.txt` | 145 | `Recommended: C:\Dev\EarnScroll   or   E:\Builds\EarnScroll` | CHANGED | EarnScroll -> Kenri |
| `plans/SETUP_GUIDE.txt` | 147 | `IMPORTANT: Avoid paths with spaces (e.g., "My Documents\EarnScroll" will` | CHANGED | EarnScroll -> Kenri |
| `plans/SETUP_GUIDE.txt` | 153 | `cd C:\Dev\EarnScroll        (or wherever you extracted it)` | CHANGED | EarnScroll -> Kenri |
| `plans/SETUP_GUIDE.txt` | 209 | `- Find "EarnScroll" in the list and enable it` | CHANGED | EarnScroll -> Kenri |
| `plans/SETUP_GUIDE.txt` | 341 | `EarnScroll/` | CHANGED | EarnScroll -> Kenri |
| `plans/SETUP_GUIDE.txt` | 362 | `│   └── withEarnScrollNative.js  # Expo config plugin: generates EarnScrollModule,` | CHANGED | EarnScroll -> Kenri |
| `plans/SETUP_GUIDE.txt` | 462 | `generated inline by withEarnScrollNative.js and already exist in the` | CHANGED | EarnScroll -> Kenri |
| `plans/google-signin-and-password-reset-setup.md` | 57 | `2. Create a project (or pick an existing one). Name it e.g. `EarnScroll`.` | CHANGED | EarnScroll -> Kenri |
| `plans/google-signin-and-password-reset-setup.md` | 60 | `- App name: `EarnScroll`` | CHANGED | EarnScroll -> Kenri |
| `plans/google-signin-and-password-reset-setup.md` | 72 | `- Name: `EarnScroll Supabase`` | CHANGED | EarnScroll -> Kenri |
| `plans/google-signin-and-password-reset-setup.md` | 236 | `\| Sender name \| `EarnScroll` \|` | CHANGED | EarnScroll -> Kenri |
| `plans/google-signin-and-password-reset-setup.md` | 256 | `<h2>Reset your EarnScroll password</h2>` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 1 | `Build a modern, high-converting marketing landing page and legal document website for **EarnScroll: Screen-Time Gym** — a mobile app that makes users ...` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 23 | `- **App name**: EarnScroll: Screen-Time Gym` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 70 | `- Logo/app name on the left ("EarnScroll" with a small lightning bolt ⚡ icon)` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 78 | `- **Subheadline**: "Do exercises. Earn minutes. Scroll guilt-free. EarnScroll turns physical workouts into screen time currency — tracked by AI, verif...` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 90 | `- Transition line: "EarnScroll closes the loop."` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 93 | `- **Section title**: "How EarnScroll Works"` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 165 | `A: EarnScroll uses Google's MoveNet model running entirely on your device. It tracks joint angles to count reps and detect form. It's accurate enough ...` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 167 | `**Q: Does EarnScroll upload my camera feed?**` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 174 | `A: Any app installed on your device. You choose exactly which apps go behind the exercise wall. System apps and EarnScroll itself are excluded.` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 177 | `A: The app blocker is currently Android-only. iOS doesn't allow third-party apps to block other apps. On iOS, EarnScroll works as a workout tracker an...` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 186 | `A: Pro subscriptions are managed through Google Play. Go to Play Store → Subscriptions → EarnScroll to cancel anytime.` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 192 | `- **CTA**: Large "Download EarnScroll" button → Play Store` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 196 | `- **Left**: EarnScroll logo + "© 2026 EarnScroll. All rights reserved."` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 199 | `- Small text: "EarnScroll is a fitness and screen-time tool. It is not medical advice. Consult a physician before starting any exercise program."` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 215 | `EarnScroll ("we", "our", "us") publishes the EarnScroll: Screen-Time Gym mobile application ("the App"). For any privacy questions, email privacy@earn...` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 259 | `EarnScroll is intended for users 13 and older. We do not knowingly collect data from anyone under 13, and we do not show targeted advertising to minor...` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 285 | `By creating an account or using EarnScroll, you agree to these Terms. You must be at least 13 years old to use the App. If you are under the age of ma...` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 304 | `EarnScroll is a fitness and screen-time tool. It is NOT medical advice and does NOT diagnose, treat, or prevent any condition. Consult a physician bef...` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 307 | `To the maximum extent permitted by law, EarnScroll and its operators are not liable for any indirect, incidental, consequential, or punitive damages, ...` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 341 | `<title>EarnScroll — Earn Your Screen Time Through Exercise</title>` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 342 | `<meta name="description" content="EarnScroll turns physical exercise into screen time. Do squats, pushups, or planks — AI counts your reps — and earn ...` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 344 | `<meta property="og:title" content="EarnScroll — Earn Your Screen Time">` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 353 | `<title>Privacy Policy — EarnScroll</title>` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 354 | `<meta name="description" content="EarnScroll privacy policy. Learn how we handle your data, camera access, and on-device processing.">` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 359 | `<title>Terms of Service — EarnScroll</title>` | CHANGED | EarnScroll -> Kenri |
| `plans/landing-page-prompt.md` | 360 | `<meta name="description" content="EarnScroll terms of service. Usage terms, acceptable use, health disclaimer, and governing law.">` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 1 | `EARNSCROLL MANUAL SETUP CHECKLIST` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 15 | `The EarnScroll Supabase project is currently PAUSED (INACTIVE).` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 19 | `b) Select the "EarnScroll" project (region: ap-northeast-1)` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 29 | `a) Open terminal in e:\Builds\EarnScroll` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 50 | `Your token is already in e:\Builds\EarnScroll\.env — copy it from there.` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 61 | `Go to Supabase dashboard → EarnScroll project → SQL Editor` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 131 | `Go to Supabase dashboard → EarnScroll project → Authentication → Providers` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 165 | `- plugins/withEarnScrollNative.js  → REGISTERED in app.json (injects BlockerService)` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 170 | `Option A (recommended): Keep only withEarnScrollNative (already registered).` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 174 | `→ Add "./plugins/withAppBlocker" to app.json plugins array, remove withEarnScrollNative,` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 225 | `[ ] Check https://vs3dman.sentry.io/issues/ for the EarnScroll project` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 231 | `[ ] App prompts to enable accessibility service → open Settings → enable EarnScroll` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 233 | `[ ] Open a blocked app → EarnScroll should intercept it` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 247 | `"EarnScroll requires QUERY_ALL_PACKAGES to enumerate all installed apps` | CHANGED | EarnScroll -> Kenri |
| `plans/manual-setup-checklist.txt` | 263 | `NEEDED    \|  6   \| Decide withAppBlocker vs withEarnScrollNative (one or both?)` | CHANGED | EarnScroll -> Kenri |
| `plans/problem-statement-context.md` | 1 | `# EarnScroll — Problem Statement & Product Context` | CHANGED | EarnScroll -> Kenri |
| `plans/problem-statement-context.md` | 8 | `## What EarnScroll Is` | CHANGED | EarnScroll -> Kenri |
| `plans/problem-statement-context.md` | 10 | `EarnScroll is a mobile app (Android-first, iOS planned) that makes users **earn their screen time through physical exercise**. Users do squats, pushup...` | CHANGED | EarnScroll -> Kenri |
| `plans/problem-statement-context.md` | 41 | `\| **4. Block** \| User selects which installed apps to put behind the blocker (the "Targets" list). When the Time Bank is empty and a targeted app is...` | CHANGED | EarnScroll -> Kenri |
| `plans/problem-statement-context.md` | 105 | `\| Category \| Examples \| How they differ from EarnScroll \|` | CHANGED | EarnScroll -> Kenri |
| `plans/problem-statement-context.md` | 112 | `**EarnScroll's differentiation**: It is the only product that uses *the thing people already feel guilty about* (screen time) as the direct reward for...` | CHANGED | EarnScroll -> Kenri |
| `plans/sentry-eas-explainer.md` | 1 | `# EarnScroll — Sentry + EAS Setup: Full Explainer` | CHANGED | EarnScroll -> Kenri |
| `plans/supabase-sentry-guide.md` | 1 | `# EarnScroll — Supabase & Sentry, from 0 to 100` | CHANGED | EarnScroll -> Kenri |
| `plans/supabase-sentry-guide.md` | 10 | `Dashboard: https://supabase.com/dashboard → project **EarnScroll**.` | CHANGED | EarnScroll -> Kenri |
| `plans/supabase-sentry-guide.md` | 20 | `Think of EarnScroll as **local-first**. Almost everything happens on the phone; the cloud is a` | CHANGED | EarnScroll -> Kenri |
| `plans/waitlist-apps-script.gs` | 2 | `* EarnScroll Waitlist — Google Apps Script web app` | CHANGED | EarnScroll -> Kenri |
| `plans/waitlist-apps-script.gs` | 3 | `* Bound to the "EarnScroll Waitlist" Google Sheet.` | CHANGED | EarnScroll -> Kenri |
| `plans/waitlist-apps-script.gs` | 12 | `*        - Description: EarnScroll waitlist` | CHANGED | EarnScroll -> Kenri |
| `plans/waitlist-apps-script.gs` | 47 | `.createTextOutput('EarnScroll waitlist endpoint is running.')` | CHANGED | EarnScroll -> Kenri |
| `plugins/withKenriNative.js` | 12 | `const ACCESSIBILITY_DESCRIPTION = "EarnScroll observes which app is in the foreground to block distracting apps that you select when your earned-time ...` | CHANGED | EarnScroll -> Kenri |
| `plugins/withKenriNative.js` | 14 | `const withEarnScrollNative = (config) => {` | CHANGED | EarnScroll -> Kenri |
| `plugins/withKenriNative.js` | 613 | `// "Open EarnScroll" button` | CHANGED | EarnScroll -> Kenri |
| `plugins/withKenriNative.js` | 615 | `text = "Open EarnScroll"` | CHANGED | EarnScroll -> Kenri |
| `plugins/withKenriNative.js` | 878 | `module.exports = withEarnScrollNative;` | CHANGED | EarnScroll -> Kenri |
| `public/index.html` | 7 | `<title>EarnScroll: Screen-Time Gym</title>` | CHANGED | EarnScroll -> Kenri |
| `public/index.html` | 19 | `<meta name="apple-mobile-web-app-title" content="EarnScroll">` | CHANGED | EarnScroll -> Kenri |
| `public/index.html` | 48 | `<meta property="og:title" content="EarnScroll: Screen-Time Gym">` | CHANGED | EarnScroll -> Kenri |
| `public/index.html` | 54 | `<meta name="twitter:title" content="EarnScroll: Screen-Time Gym">` | CHANGED | EarnScroll -> Kenri |
| `public/index.html` | 152 | `<p style="font-size: 16px; color: #6B7280;">EarnScroll requires JavaScript to be enabled. Please enable JavaScript in your browser settings and reload...` | CHANGED | EarnScroll -> Kenri |
| `public/index.html` | 159 | `<img src="/assets/images/icon.png" alt="EarnScroll Logo" class="app-loading-logo">` | CHANGED | EarnScroll -> Kenri |
| `public/index.html` | 160 | `<p class="app-loading-text">Loading EarnScroll...</p>` | CHANGED | EarnScroll -> Kenri |
| `public/manifest.json` | 2 | `"name": "EarnScroll: Screen-Time Gym",` | CHANGED | EarnScroll -> Kenri |
| `public/manifest.json` | 3 | `"short_name": "EarnScroll",` | CHANGED | EarnScroll -> Kenri |
| `public/service-worker.js` | 1 | `const CACHE_NAME = 'earnscroll-v1.0.0';` | CHANGED | EarnScroll -> Kenri |
| `tasks/security-audit.md` | 1 | `# EarnScroll Security Audit Report` | CHANGED | EarnScroll -> Kenri |
| `tasks/security-audit.md` | 13 | `EarnScroll is a fitness gamification app that uses camera-based ML for exercise detection and an Android accessibility service for app blocking. The a...` | CHANGED | EarnScroll -> Kenri |
| `tasks/security-audit.md` | 23 | `- `plugins/withEarnScrollNative.js` (lines 94-141)` | CHANGED | EarnScroll -> Kenri |
| `tasks/security-audit.md` | 137 | `- `plugins/withEarnScrollNative.js` (lines 94-101, 250-251, 307-318)` | CHANGED | EarnScroll -> Kenri |
| `tasks/security-audit.md` | 157 | `**File:** `plugins/withEarnScrollNative.js` (line 478)` | CHANGED | EarnScroll -> Kenri |
| `tasks/security-audit.md` | 286 | `**File:** `plugins/withEarnScrollNative.js` (lines 266-277)` | CHANGED | EarnScroll -> Kenri |
| `tasks/security-audit.md` | 380 | `- `plugins/withEarnScrollNative.js` - Native module generation` | CHANGED | EarnScroll -> Kenri |

## 3. Remaining occurrences (270) - each explained

| File | Line | Context snippet | Classification | Action taken |
|---|---|---|---|---|
| `CLAUDE.md` | 61 | `- **`plugins/withKenriNative.js`** — Generates Kotlin source inline. Creates `EarnScrollModule` (React Native bridge for getting installed apps, setti...` | FROZEN - native package | Untouched |
| `CLAUDE.md` | 63 | `**The `com.earnscroll` package path and the `EarnScroll*` class names are frozen and must never be renamed.** Android binds a user's granted accessibi...` | FROZEN - storage key | Untouched |
| `ROADMAP.md` | 85 | `"bundleIdentifier": "com.earnscroll_earnyourscreentime.app",` | FROZEN - store identity | Untouched |
| `ROADMAP.md` | 232 | `- Line 47: `EarnScrollModule.getInstalledApps()` calls a native module that **doesn't exist**` | FROZEN - native package | Untouched |
| `ROADMAP.md` | 233 | `- Line 63: `EarnScrollModule.setBlockedPackages()` calls a native module that **doesn't exist**` | FROZEN - native package | Untouched |
| `ROADMAP.md` | 237 | `- [ ] **Create `native-src/android/EarnScrollModule.kt`** — Native module exposing:` | FROZEN - native package | Untouched |
| `ROADMAP.md` | 242 | `- [ ] **Create `native-src/android/EarnScrollPackage.kt`** — React Native package registration for the module` | FROZEN - native package | Untouched |
| `ROADMAP.md` | 296 | `- [ ] **Make email addresses clickable** — `privacy-policy.tsx` lines 71-72 and `terms-of-service.tsx` lines 81-82: Email addresses (`privacy@earnscro...` | NEEDS HUMAN DECISION | Untouched (domain) |
| `android/app/build.gradle` | 92 | `namespace 'com.earnscroll_earnyourscreentime.app'` | FROZEN - store identity | Untouched |
| `android/app/build.gradle` | 94 | `applicationId 'com.earnscroll_earnyourscreentime.app'` | FROZEN - store identity | Untouched |
| `android/app/src/main/AndroidManifest.xml` | 21 | `<service android:name="com.earnscroll.BlockerService" android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE" android:exported="false">` | FROZEN - native package | Untouched |
| `android/app/src/main/AndroidManifest.xml` | 36 | `<data android:scheme="earnscroll"/>` | FROZEN - deep link scheme | Untouched |
| `android/app/src/main/AndroidManifest.xml` | 37 | `<data android:scheme="exp+earnscroll-screen-time-gym"/>` | FROZEN - deep link scheme | Untouched |
| `android/app/src/main/AndroidManifest.xml` | 40 | `<activity android:name="com.earnscroll.BlockedActivity" android:theme="@android:style/Theme.NoTitleBar.Fullscreen" android:exported="false" android:ex...` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/BlockedActivity.kt` | 1 | `package com.earnscroll` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/BlockerService.kt` | 1 | `package com.earnscroll` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/BlockerService.kt` | 32 | `"EarnScrollSecurePrefs",` | FROZEN - storage key | Untouched |
| `android/app/src/main/java/com/earnscroll/BlockerService.kt` | 77 | `Log.e("EarnScrollService", "Failed to register screen receiver", e)` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/BlockerService.kt` | 110 | `Log.e("EarnScrollService", "Error in accessibility event handler", e)` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/BlockerService.kt` | 123 | `Log.d("EarnScrollService", "Blocked app session started")` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/BlockerService.kt` | 143 | `Log.d("EarnScrollService", "Deducted ${elapsedMinutes}m of blocked app usage. Balance: ${currentBalance}m -> ${newBalance}m")` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/BlockerService.kt` | 199 | `Log.e("EarnScrollService", "Error parsing blocked packages", e)` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/EarnScrollModule.kt` | 1 | `package com.earnscroll` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/EarnScrollModule.kt` | 25 | `class EarnScrollModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/EarnScrollModule.kt` | 38 | `"EarnScrollSecurePrefs",` | FROZEN - storage key | Untouched |
| `android/app/src/main/java/com/earnscroll/EarnScrollModule.kt` | 46 | `return "EarnScrollModule"` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/EarnScrollModule.kt` | 88 | `Log.w("EarnScrollModule", "Blocked packages list exceeds maximum size")` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/EarnScrollModule.kt` | 94 | `Log.e("EarnScrollModule", "Invalid blocked packages JSON", e)` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/EarnScrollModule.kt` | 161 | `val serviceName = reactApplicationContext.packageName + "/com.earnscroll.BlockerService"` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/EarnScrollPackage.kt` | 1 | `package com.earnscroll` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/EarnScrollPackage.kt` | 9 | `class EarnScrollPackage : ReactPackage {` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll/EarnScrollPackage.kt` | 11 | `return listOf(EarnScrollModule(reactContext))` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll_earnyourscreentime/app/MainActivity.kt` | 1 | `package com.earnscroll_earnyourscreentime.app` | FROZEN - store identity | Untouched |
| `android/app/src/main/java/com/earnscroll_earnyourscreentime/app/MainApplication.kt` | 1 | `package com.earnscroll_earnyourscreentime.app` | FROZEN - store identity | Untouched |
| `android/app/src/main/java/com/earnscroll_earnyourscreentime/app/MainApplication.kt` | 3 | `import com.earnscroll.EarnScrollPackage` | FROZEN - native package | Untouched |
| `android/app/src/main/java/com/earnscroll_earnyourscreentime/app/MainApplication.kt` | 30 | `add(EarnScrollPackage())` | FROZEN - native package | Untouched |
| `android/app/src/main/res/xml/secure_store_backup_rules.xml` | 3 | `<exclude domain="sharedpref" path="EarnScrollSecurePrefs.xml" />` | FROZEN - storage key | Untouched |
| `android/app/src/main/res/xml/secure_store_data_extraction_rules.xml` | 4 | `<exclude domain="sharedpref" path="EarnScrollSecurePrefs.xml" />` | FROZEN - storage key | Untouched |
| `android/app/src/main/res/xml/secure_store_data_extraction_rules.xml` | 7 | `<exclude domain="sharedpref" path="EarnScrollSecurePrefs.xml" />` | FROZEN - storage key | Untouched |
| `app.json` | 4 | `"slug": "earnscroll-screen-time-gym",` | FROZEN - store identity | Untouched (EAS slug) |
| `app.json` | 8 | `"scheme": "earnscroll",` | FROZEN - deep link scheme | Untouched |
| `app.json` | 16 | `"bundleIdentifier": "com.earnscroll.app",` | FROZEN - store identity | Untouched (iOS bundle id) |
| `app.json` | 34 | `"package": "com.earnscroll_earnyourscreentime.app",` | FROZEN - store identity | Untouched |
| `app.json` | 83 | `"project": "earnscroll"` | FROZEN - external service slug | Untouched (Sentry slug) |
| `app/(tabs)/index.tsx` | 12 | `const EarnScrollModule = Platform.OS !== 'web' ? NativeModules.EarnScrollModule : null;` | FROZEN - native package | Untouched |
| `app/(tabs)/index.tsx` | 78 | `if (!EarnScrollModule?.getAppUsageToday) return;` | FROZEN - native package | Untouched |
| `app/(tabs)/index.tsx` | 80 | `const usage: AppUsageEntry[] = await EarnScrollModule.getAppUsageToday();` | FROZEN - native package | Untouched |
| `app/(tabs)/targets.tsx` | 10 | `const EarnScrollModule = Platform.OS !== 'web' ? NativeModules.EarnScrollModule : null;` | FROZEN - native package | Untouched |
| `app/(tabs)/targets.tsx` | 59 | `if (EarnScrollModule?.getInstalledApps) {` | FROZEN - native package | Untouched |
| `app/(tabs)/targets.tsx` | 61 | `const apps: InstalledApp[] = await EarnScrollModule.getInstalledApps();` | FROZEN - native package | Untouched |
| `app/(tabs)/targets.tsx` | 82 | `if (EarnScrollModule?.getBlockedPackages) {` | FROZEN - native package | Untouched |
| `app/(tabs)/targets.tsx` | 84 | `const native: string[] = await EarnScrollModule.getBlockedPackages();` | FROZEN - native package | Untouched |
| `app/(tabs)/targets.tsx` | 119 | `if (EarnScrollModule?.setBlockedPackages) {` | FROZEN - native package | Untouched |
| `app/(tabs)/targets.tsx` | 120 | `EarnScrollModule.setBlockedPackages(jsonPayload);` | FROZEN - native package | Untouched |
| `app/(tabs)/targets.tsx` | 139 | `if (!isCurrentlyLocked && Platform.OS === 'android' && EarnScrollModule?.isAccessibilityServiceEnabled) {` | FROZEN - native package | Untouched |
| `app/(tabs)/targets.tsx` | 141 | `const enabled = await EarnScrollModule.isAccessibilityServiceEnabled();` | FROZEN - native package | Untouched |
| `app/(tabs)/targets.tsx` | 150 | `onPress: () => EarnScrollModule.openAccessibilitySettings(),` | FROZEN - native package | Untouched |
| `app/_layout.tsx` | 92 | `const { EarnScrollModule } = NativeModules;` | FROZEN - native package | Untouched |
| `app/_layout.tsx` | 93 | `if (!EarnScrollModule) return;` | FROZEN - native package | Untouched |
| `app/_layout.tsx` | 95 | `const enabled = await EarnScrollModule.isAccessibilityServiceEnabled();` | FROZEN - native package | Untouched |
| `app/accessibility-disclosure.tsx` | 42 | `const { EarnScrollModule } = NativeModules;` | FROZEN - native package | Untouched |
| `app/accessibility-disclosure.tsx` | 44 | `EarnScrollModule?.openAccessibilitySettings?.();` | FROZEN - native package | Untouched |
| `app/delete-account.tsx` | 62 | `const { EarnScrollModule } = NativeModules;` | FROZEN - native package | Untouched |
| `app/delete-account.tsx` | 63 | `await EarnScrollModule?.clearSecurePrefs?.();` | FROZEN - native package | Untouched |
| `app/privacy-policy.tsx` | 38 | `Effective [DATE]: this application was formerly published as EarnScroll. The name has changed; the operating entity, data practices, and these terms a...` | KEPT - "formerly" reference (intentional) | Kept deliberately |
| `app/privacy-policy.tsx` | 51 | `Kenri (formerly EarnScroll) ("we", "our", "us") publishes the Kenri: Screen-Time Gym mobile application ("the App"). For any privacy questions you can...` | KEPT - "formerly" reference (intentional) | Kept deliberately |
| `app/terms-of-service.tsx` | 34 | `Effective [DATE]: this application was formerly published as EarnScroll. The name has changed; the operating entity, data practices, and these terms a...` | KEPT - "formerly" reference (intentional) | Kept deliberately |
| `app/terms-of-service.tsx` | 47 | `By creating an account or using Kenri (formerly EarnScroll), you agree to these Terms. You must be at least 13 years old to use the App. If you are un...` | KEPT - "formerly" reference (intentional) | Kept deliberately |
| `constants/legal.ts` | 20 | `privacy: 'https://earnscroll-website.vercel.app/privacy',` | FROZEN - external service slug | Untouched (live Vercel host) |
| `constants/legal.ts` | 21 | `terms: 'https://earnscroll-website.vercel.app/terms',` | FROZEN - external service slug | Untouched (live Vercel host) |
| `constants/legal.ts` | 22 | `deleteAccount: 'https://earnscroll-website.vercel.app/delete-account',` | FROZEN - external service slug | Untouched (live Vercel host) |
| `contexts/TimeBank.tsx` | 19 | `const EarnScrollModule = Platform.OS !== 'web' ? NativeModules.EarnScrollModule : null;` | FROZEN - native package | Untouched |
| `contexts/TimeBank.tsx` | 227 | `if (EarnScrollModule?.setMinutesFloat) {` | FROZEN - native package | Untouched |
| `contexts/TimeBank.tsx` | 228 | `EarnScrollModule.setMinutesFloat(earnedMinutes);` | FROZEN - native package | Untouched |
| `contexts/TimeBank.tsx` | 229 | `} else if (EarnScrollModule?.setMinutes) {` | FROZEN - native package | Untouched |
| `contexts/TimeBank.tsx` | 230 | `EarnScrollModule.setMinutes(Math.floor(earnedMinutes));` | FROZEN - native package | Untouched |
| `contexts/TimeBank.tsx` | 238 | `if (nextState === 'active' && EarnScrollModule?.getMinutes) {` | FROZEN - native package | Untouched |
| `contexts/TimeBank.tsx` | 240 | `const nativeMinutes: number = await EarnScrollModule.getMinutes();` | FROZEN - native package | Untouched |
| `docs/auth-fix-report.md` | 114 | `**URL scheme: `myapp` → `earnscroll`** (`app.json` + `AndroidManifest.xml`).` | FROZEN - deep link scheme | Untouched |
| `docs/auth-fix-report.md` | 156 | ``earnscroll://auth/callback`. Without this Supabase refuses the redirect and` | FROZEN - deep link scheme | Untouched |
| `legal/data-safety-form-guide.html` | 150 | `<p>Live public URL: <code>https://earnscroll-website.vercel.app/privacy</code>. (Interim host; migrate to <code>https://earnscroll.com/privacy</code> ...` | FROZEN - external service slug | Untouched (live Vercel host) |
| `legal/data-safety-form-guide.html` | 155 | `<li>Privacy Policy URL: <code>https://earnscroll-website.vercel.app/privacy</code></li>` | FROZEN - external service slug | Untouched (live Vercel host) |
| `legal/play-permission-declarations.md` | 8 | `The app is published as **Kenri** (formerly EarnScroll). The Play package name` | KEPT - "formerly" reference (intentional) | Kept deliberately |
| `legal/play-permission-declarations.md` | 9 | ``com.earnscroll_earnyourscreentime.app` and the accessibility service component` | FROZEN - store identity | Untouched |
| `legal/play-permission-declarations.md` | 10 | ``com.earnscroll.BlockerService` intentionally retain the original identifiers so` | FROZEN - native package | Untouched |
| `legal/play-permission-declarations.md` | 38 | `**Service name**: `com.earnscroll.BlockerService`` | FROZEN - native package | Untouched |
| `legal/privacy-policy.html` | 37 | `<p class="last-updated"><em>Effective [DATE]: this application was formerly published as EarnScroll. The name has changed; the operating entity, data ...` | KEPT - "formerly" reference (intentional) | Kept deliberately |
| `legal/privacy-policy.html` | 40 | `<p>Kenri (formerly EarnScroll) ("we", "our", "us") publishes the Kenri: Screen-Time Gym mobile application ("the App"). For any privacy questions, ema...` | KEPT - "formerly" reference (intentional) | Kept deliberately |
| `legal/terms-of-service.html` | 33 | `<p class="last-updated"><em>Effective [DATE]: this application was formerly published as EarnScroll. The name has changed; the operating entity, data ...` | KEPT - "formerly" reference (intentional) | Kept deliberately |
| `legal/terms-of-service.html` | 36 | `<p>By creating an account or using Kenri (formerly EarnScroll), you agree to these Terms. You must be at least 13 years old to use the App. If you are...` | KEPT - "formerly" reference (intentional) | Kept deliberately |
| `plans/SETUP_GUIDE.txt` | 278 | `Error: "EarnScrollPackage not found" or "ClassNotFoundException"` | FROZEN - native package | Untouched |
| `plans/SETUP_GUIDE.txt` | 331 | `The Kotlin files in android/app/src/main/java/com/earnscroll/ are` | FROZEN - native package | Untouched |
| `plans/SETUP_GUIDE.txt` | 362 | `│   └── withKenriNative.js  # Expo config plugin: generates EarnScrollModule,` | FROZEN - native package | Untouched |
| `plans/SETUP_GUIDE.txt` | 363 | `│                                #   EarnScrollPackage, BlockerService inline` | FROZEN - native package | Untouched |
| `plans/SETUP_GUIDE.txt` | 374 | `│   └── app/src/main/java/com/earnscroll/` | FROZEN - native package | Untouched |
| `plans/SETUP_GUIDE.txt` | 375 | `│       ├── EarnScrollModule.kt    # RN bridge: getInstalledApps, setBlockedPackages` | FROZEN - native package | Untouched |
| `plans/SETUP_GUIDE.txt` | 376 | `│       ├── EarnScrollPackage.kt   # Registers EarnScrollModule` | FROZEN - native package | Untouched |
| `plans/SETUP_GUIDE.txt` | 461 | `(EarnScrollModule.kt, EarnScrollPackage.kt, BlockerService.kt) are` | FROZEN - native package | Untouched |
| `plans/SETUP_GUIDE.txt` | 463 | `android/app/src/main/java/com/earnscroll/ directory.` | FROZEN - native package | Untouched |
| `plans/build_log.txt` | 1 | `> Historical document. Written when the app was named EarnScroll (now Kenri).` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 101 | `[VisionCamera] node_modules found at E:\Builds\EarnScroll\node_modules` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 974 | `C/C++: ninja: Entering directory `E:\Builds\EarnScroll\node_modules\react-native-fast-tflite\android\.cxx\RelWithDebInfo\1z182t1g\arm64-v8a'` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 975 | `C/C++: E:/Builds/EarnScroll/node_modules/react-native-fast-tflite/cpp/TensorflowPlugin.cpp:73:11: warning: ignoring return value of function declared ...` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 1005 | `C/C++: E:/Builds/EarnScroll/node_modules/react-native-fast-tflite/cpp/TensorflowPlugin.cpp:317:17: warning: ignoring return value of function declared...` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 1269 | `C/C++: ninja: Entering directory `E:\Builds\EarnScroll\node_modules\react-native-fast-tflite\android\.cxx\RelWithDebInfo\1z182t1g\armeabi-v7a'` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 1270 | `C/C++: E:/Builds/EarnScroll/node_modules/react-native-fast-tflite/cpp/TensorflowPlugin.cpp:73:11: warning: ignoring return value of function declared ...` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 1300 | `C/C++: E:/Builds/EarnScroll/node_modules/react-native-fast-tflite/cpp/TensorflowPlugin.cpp:317:17: warning: ignoring return value of function declared...` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 1367 | `C/C++: ninja: Entering directory `E:\Builds\EarnScroll\node_modules\react-native-fast-tflite\android\.cxx\RelWithDebInfo\1z182t1g\x86'` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 1368 | `C/C++: E:/Builds/EarnScroll/node_modules/react-native-fast-tflite/cpp/TensorflowPlugin.cpp:73:11: warning: ignoring return value of function declared ...` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 1398 | `C/C++: E:/Builds/EarnScroll/node_modules/react-native-fast-tflite/cpp/TensorflowPlugin.cpp:317:17: warning: ignoring return value of function declared...` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 1436 | `C/C++: ninja: Entering directory `E:\Builds\EarnScroll\node_modules\react-native-fast-tflite\android\.cxx\RelWithDebInfo\1z182t1g\x86_64'` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 1437 | `C/C++: E:/Builds/EarnScroll/node_modules/react-native-fast-tflite/cpp/TensorflowPlugin.cpp:73:11: warning: ignoring return value of function declared ...` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 1467 | `C/C++: E:/Builds/EarnScroll/node_modules/react-native-fast-tflite/cpp/TensorflowPlugin.cpp:317:17: warning: ignoring return value of function declared...` | KEPT - historical document | Header note added; body left as written |
| `plans/build_log.txt` | 1580 | `[Incubating] Problems report is available at: file:///E:/Builds/EarnScroll/android/build/reports/problems/problems-report.html` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 1 | `> Historical document. Written when the app was named EarnScroll (now Kenri).` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 3 | `# EarnScroll — Comprehensive App Report for Legal Documentation` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 6 | `**App Name**: EarnScroll: Screen-Time Gym` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 7 | `**Package ID**: `com.earnscroll_earnyourscreentime.app`` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 10 | `**Contact Emails**: privacy@earnscroll.com, support@earnscroll.com` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 15 | `## 1. What EarnScroll Is` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 17 | `EarnScroll is a mobile productivity and wellness application for Android and iOS. Its core concept is **gamified digital self-control**: users must ph...` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 55 | `Users select apps they want to limit (up to 200 apps). When the time bank reaches zero and the user opens a blocked app, the accessibility service int...` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 75 | `EarnScroll uses **Supabase** (supabase.co) as its authentication backend. The following authentication methods are supported:` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 85 | `**Password reset**: Users can request a password reset link to their registered email. The link redirects via the scheme `earnscroll://auth/callback`.` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 93 | `EarnScroll operates on a freemium model:` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 226 | `EarnScroll does **not** integrate:` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 239 | `### 9.1 EarnScrollModule` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 263 | `- Displays "App Blocked" with instructions to open EarnScroll to earn more time` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 267 | `- Is dismissed when the user opens EarnScroll and earns more time` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 304 | `## 12. What Data EarnScroll Does NOT Collect` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 308 | `- EarnScroll does **not** collect location data.` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 309 | `- EarnScroll does **not** collect biometric data. Pose keypoints are mathematical coordinates, not stored biometric identifiers.` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 310 | `- EarnScroll does **not** record or store any camera images or video.` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 311 | `- EarnScroll does **not** transmit workout history, exercise counts, streaks, or time bank data to any server.` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 312 | `- EarnScroll does **not** serve advertisements.` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 313 | `- EarnScroll does **not** sell user data to third parties.` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 314 | `- EarnScroll does **not** track users across other apps or websites.` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 315 | `- EarnScroll does **not** use cookies.` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 316 | `- EarnScroll does **not** access contacts, microphone, calendar, or any other sensors beyond the camera and motion sensor.` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 322 | `EarnScroll does not have an age gate and is not knowingly designed exclusively for children. If the app is to be made available on app stores in juris...` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 358 | `EarnScroll works fully offline for all core features (exercise detection, time bank, app blocking). An offline status banner is shown when there is no...` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 374 | `\| General support \| support@earnscroll.com \|` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 375 | `\| Privacy inquiries / data requests \| privacy@earnscroll.com \|` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 376 | `\| Data deletion requests \| privacy@earnscroll.com (manual process until in-app deletion is implemented) \|` | KEPT - historical document | Header note added; body left as written |
| `plans/earnscroll-legal-app-report.md` | 406 | `*This report reflects the state of the EarnScroll codebase as of April 21, 2026. It should be updated whenever significant features are added, permiss...` | KEPT - historical document | Header note added; body left as written |
| `plans/google-signin-and-password-reset-setup.md` | 9 | `**App scheme:** `earnscroll` (was `myapp` — changed, see step G4)` | FROZEN - deep link scheme | Untouched |
| `plans/google-signin-and-password-reset-setup.md` | 43 | `Supabase ──4─▶ redirects to  earnscroll://auth/callback?code=...` | FROZEN - deep link scheme | Untouched |
| `plans/google-signin-and-password-reset-setup.md` | 104 | `earnscroll://auth/callback` | FROZEN - deep link scheme | Untouched |
| `plans/google-signin-and-password-reset-setup.md` | 110 | `exp+earnscroll-screen-time-gym://auth/callback` | FROZEN - deep link scheme | Untouched |
| `plans/google-signin-and-password-reset-setup.md` | 117 | `The URL scheme changed from `myapp` to `earnscroll`. That lives in the Android` | FROZEN - deep link scheme | Untouched |
| `plans/google-signin-and-password-reset-setup.md` | 217 | `2. Enter your domain, e.g. `earnscroll.app`` | NEEDS HUMAN DECISION | Untouched (domain) |
| `plans/google-signin-and-password-reset-setup.md` | 235 | `\| Sender email \| `noreply@earnscroll.app` \|` | NEEDS HUMAN DECISION | Untouched (domain) |
| `plans/google-signin-and-password-reset-setup.md` | 264 | ``earnscroll://auth/callback`. That is why step G3 matters here too.` | FROZEN - deep link scheme | Untouched |
| `plans/google-signin-and-password-reset-setup.md` | 269 | ``earnscroll://auth/callback` covers OAuth, email confirmation and password` | FROZEN - deep link scheme | Untouched |
| `plans/google-signin-and-password-reset-setup.md` | 328 | `- [ ] G3 `earnscroll://auth/callback` in Redirect URLs` | FROZEN - deep link scheme | Untouched |
| `plans/landing-page-prompt.md` | 198 | `- **Right**: Contact email — support@earnscroll.com` | NEEDS HUMAN DECISION | Untouched (domain) |
| `plans/landing-page-prompt.md` | 215 | `Kenri ("we", "our", "us") publishes the Kenri: Screen-Time Gym mobile application ("the App"). For any privacy questions, email privacy@earnscroll.com...` | NEEDS HUMAN DECISION | Untouched (domain) |
| `plans/landing-page-prompt.md` | 271 | `Email privacy@earnscroll.com for any privacy questions, data-subject requests, or to exercise the rights described in section 8.` | NEEDS HUMAN DECISION | Untouched (domain) |
| `plans/landing-page-prompt.md` | 272 | `Support: support@earnscroll.com` | NEEDS HUMAN DECISION | Untouched (domain) |
| `plans/landing-page-prompt.md` | 291 | `You are responsible for keeping your account credentials secure and for activity that occurs under your account. Notify us at support@earnscroll.com i...` | NEEDS HUMAN DECISION | Untouched (domain) |
| `plans/landing-page-prompt.md` | 319 | `For any questions about these Terms, email legal@earnscroll.com.` | NEEDS HUMAN DECISION | Untouched (domain) |
| `plans/landing-page-prompt.md` | 320 | `Support: support@earnscroll.com` | NEEDS HUMAN DECISION | Untouched (domain) |
| `plans/landing-page-prompt.md` | 329 | `- **Email**: support@earnscroll.com (clickable mailto link)` | NEEDS HUMAN DECISION | Untouched (domain) |
| `plans/landing-page-prompt.md` | 333 | `- **Account deletion**: "To delete your account, go to Settings → Delete Account in the app, or email support@earnscroll.com."` | NEEDS HUMAN DECISION | Untouched (domain) |
| `plans/landing-page-prompt.md` | 380 | `- The Play Store link is not yet live. Use `https://play.google.com/store/apps/details?id=com.earnscroll_earnyourscreentime.app` as a placeholder.` | FROZEN - store identity | Untouched |
| `plans/manual-setup-checklist.txt` | 154 | `- Add to "Redirect URLs": earnscroll://auth/callback` | FROZEN - deep link scheme | Untouched |
| `plans/manual-setup-checklist.txt` | 155 | `- This must match the scheme in app.json ("scheme": "earnscroll")` | FROZEN - deep link scheme | Untouched |
| `plans/play-store-fixes-manual-user-work.txt` | 1 | `> Historical document. Written when the app was named EarnScroll (now Kenri).` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-manual-user-work.txt` | 4 | `EARNSCROLL — PLAY STORE FIXES: MANUAL USER WORK REPORT` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-manual-user-work.txt` | 24 | `manifest-merger overrides in plugins/withEarnScrollNative.js.` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-manual-user-work.txt` | 97 | `B.1  Register earnscroll.com (or whatever final domain you pick).` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-manual-user-work.txt` | 112 | `- "To delete your EarnScroll account, sign in to the app and go to` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-manual-user-work.txt` | 114 | `email privacy@earnscroll.com from the address used to sign up.` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-manual-user-work.txt` | 166 | `D.2  Create the EarnScroll listing` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-manual-user-work.txt` | 167 | `- Use package name: com.earnscroll_earnyourscreentime.app` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-manual-user-work.txt` | 169 | `opening play.google.com/store/apps/details?id=com.earnscroll_earnyourscreentime.app` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 1 | `> Historical document. Written when the app was named EarnScroll (now Kenri).` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 4 | `EARNSCROLL — PLAY STORE COMPLIANCE FIX PLAN (v1.0 submission prep)` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 43 | `0.3  Confirm package name `com.earnscroll_earnyourscreentime.app` is still available on Play` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 44 | `Store by opening play.google.com/store/apps/details?id=com.earnscroll_earnyourscreentime.app` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 65 | `earnscroll.com/privacy before production release." — remove banner` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 123 | `- plugins/withEarnScrollNative.js         (description string fix)` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 151 | `withEarnScrollNative.js fixes:` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 153 | `"EarnScroll observes which app is in the foreground to block distracting` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 164 | `- plugins/withEarnScrollNative.js   (manifest manipulation)` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 278 | `"EarnScroll uses your camera to count your reps in real time. Frames` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 317 | `1. Who we are + contact (privacy@earnscroll.com)` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 351 | `11. Contact (legal@earnscroll.com)` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 360 | `- For each category, the exact answer EarnScroll should give: Collected` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 417 | `X.1  Buy/configure earnscroll.com domain; host /legal HTML at /privacy,` | KEPT - historical document | Header note added; body left as written |
| `plans/play-store-fixes-plan.txt` | 437 | `X.9  Verify com.earnscroll_earnyourscreentime.app package name is still unclaimed; lock it` | KEPT - historical document | Header note added; body left as written |
| `plans/security-review-v1.md` | 1 | `> Historical document. Written when the app was named EarnScroll (now Kenri).` | KEPT - historical document | Header note added; body left as written |
| `plans/security-review-v1.md` | 3 | `# EarnScroll — Security Review for v1 Play Store Launch` | KEPT - historical document | Header note added; body left as written |
| `plans/security-review-v1.md` | 45 | ``EncryptedSharedPreferences` store (`EarnScrollSecurePrefs` — holds the time-bank state and` | KEPT - historical document | Header note added; body left as written |
| `plans/security-review-v1.md` | 46 | `blocked-app list; see `EarnScrollModule.kt:38`, `BlockerService.kt:32`) out of Google cloud` | KEPT - historical document | Header note added; body left as written |
| `plans/security-review-v1.md` | 49 | `**The fix (`plugins/withEarnScrollNative.js`):** the change is made in the plugin, not by` | KEPT - historical document | Header note added; body left as written |
| `plans/security-review-v1.md` | 53 | `excluding `EarnScrollSecurePrefs.xml`.` | KEPT - historical document | Header note added; body left as written |
| `plans/security-review-v1.md` | 115 | `AES256-GCM values (`EarnScrollModule.kt`, `BlockerService.kt`).` | KEPT - historical document | Header note added; body left as written |
| `plans/sentry-eas-explainer.md` | 263 | `adb logcat \| grep earnscroll` | FROZEN - native package | Untouched (matches frozen log tags/package) |
| `plans/sentry-eas-explainer.md` | 304 | `1. Go to sentry.io → your `earnscroll` project` | FROZEN - external service slug | Untouched (Sentry slug) |
| `plans/sentry-eas-explainer.md` | 363 | `\| Read device logs live \| `adb logcat \\| grep earnscroll` \|` | FROZEN - native package | Untouched (matches frozen log tags/package) |
| `plans/sentry-eas-explainer.md` | 364 | `\| Open Sentry dashboard \| sentry.io → project: earnscroll \|` | FROZEN - external service slug | Untouched (Sentry slug) |
| `plans/supabase-sentry-guide.md` | 28 | `blocker needs are stored in **EncryptedSharedPreferences** (`EarnScrollSecurePrefs`) — an` | FROZEN - storage key | Untouched |
| `plans/supabase-sentry-guide.md` | 138 | ``earnscroll://auth/callback` (matches the app's scheme). Details are in `manual-setup-checklist.txt`` | FROZEN - deep link scheme | Untouched |
| `plans/waitlist-apps-script.gs` | 3 | `* Bound to the "EarnScroll Waitlist" Google Sheet (sheet name unchanged — renaming` | FROZEN - external service slug | Untouched (bound Google Sheet) |
| `plugins/withKenriNative.js` | 26 | `// UNIFIED PACKAGE PATH: com.earnscroll` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 27 | `const packagePath = path.join(androidRoot, 'app/src/main/java/com/earnscroll');` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 34 | `// A. EarnScrollModule.kt - WritableArray Logic + Unified Package + EncryptedSharedPreferences` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 35 | `const moduleContent = `package com.earnscroll` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 59 | `class EarnScrollModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 72 | `"EarnScrollSecurePrefs",` | FROZEN - storage key | Untouched |
| `plugins/withKenriNative.js` | 80 | `return "EarnScrollModule"` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 122 | `Log.w("EarnScrollModule", "Blocked packages list exceeds maximum size")` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 128 | `Log.e("EarnScrollModule", "Invalid blocked packages JSON", e)` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 195 | `val serviceName = reactApplicationContext.packageName + "/com.earnscroll.BlockerService"` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 292 | `fs.writeFileSync(path.join(packagePath, 'EarnScrollModule.kt'), moduleContent);` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 294 | `// B. EarnScrollPackage.kt - Unified Package` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 295 | `const packageContent = `package com.earnscroll` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 303 | `class EarnScrollPackage : ReactPackage {` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 305 | `return listOf(EarnScrollModule(reactContext))` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 313 | `fs.writeFileSync(path.join(packagePath, 'EarnScrollPackage.kt'), packageContent);` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 316 | `const serviceContent = `package com.earnscroll` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 347 | `"EarnScrollSecurePrefs",` | FROZEN - storage key | Untouched |
| `plugins/withKenriNative.js` | 392 | `Log.e("EarnScrollService", "Failed to register screen receiver", e)` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 425 | `Log.e("EarnScrollService", "Error in accessibility event handler", e)` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 438 | `Log.d("EarnScrollService", "Blocked app session started")` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 458 | `Log.d("EarnScrollService", "Deducted \${elapsedMinutes}m of blocked app usage. Balance: \${currentBalance}m -> \${newBalance}m")` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 514 | `Log.e("EarnScrollService", "Error parsing blocked packages", e)` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 539 | `const blockedActivityContent = `package com.earnscroll` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 694 | `//    store ("EarnScrollSecurePrefs") out of Google cloud backups and D2D` | FROZEN - storage key | Untouched |
| `plugins/withKenriNative.js` | 699 | `<exclude domain="sharedpref" path="EarnScrollSecurePrefs.xml" />` | FROZEN - storage key | Untouched |
| `plugins/withKenriNative.js` | 706 | `<exclude domain="sharedpref" path="EarnScrollSecurePrefs.xml" />` | FROZEN - storage key | Untouched |
| `plugins/withKenriNative.js` | 709 | `<exclude domain="sharedpref" path="EarnScrollSecurePrefs.xml" />` | FROZEN - storage key | Untouched |
| `plugins/withKenriNative.js` | 779 | `'android:name': 'com.earnscroll.BlockerService', // UPDATED PACKAGE` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 794 | `s => s.$['android:name'] !== '.BlockerService' && s.$['android:name'] !== 'com.earnscroll.BlockerService'` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 801 | `a => a.$['android:name'] !== 'com.earnscroll.BlockedActivity'` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 805 | `'android:name': 'com.earnscroll.BlockedActivity',` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 824 | `if (!rawContent.includes('import com.earnscroll.EarnScrollPackage')) {` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 828 | `'$1\n\nimport com.earnscroll.EarnScrollPackage'` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 842 | `if (rawContent.includes('EarnScrollPackage()')) {` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 846 | `rawContent = rawContent.replace(packageListApplyRegex, '$1$2    add(EarnScrollPackage())\n$3');` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 849 | `rawContent = rawContent.replace(packageListSimpleRegex, '$1.apply {\n      add(EarnScrollPackage())\n    }');` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 854 | `rawContent = rawContent.replace(/return\s+packages/, 'packages.add(EarnScrollPackage())\n    return packages');` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 856 | `console.warn("WARNING: Could not automagically inject EarnScrollPackage into MainApplication.kt. You may need to add 'packages.add(EarnScrollPackage()...` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 858 | `throw new Error("Failed to inject EarnScrollPackage into MainApplication.kt. Pattern 'PackageList(this).packages' not found.");` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 863 | `if (!rawContent.includes('new EarnScrollPackage()')) {` | FROZEN - native package | Untouched |
| `plugins/withKenriNative.js` | 866 | `rawContent = rawContent.replace(listStart, `${listStart}\n      packages.add(new EarnScrollPackage());`);` | FROZEN - native package | Untouched |
| `services/sentry.ts` | 12 | `const name = cfg?.slug ?? cfg?.name ?? 'earnscroll';` | FROZEN - external service slug | Untouched (Sentry release tag mirrors slug) |
| `tasks/security-audit.md` | 37 | `2. Reads/writes `EarnScrollPrefs.xml` in SharedPreferences` | FROZEN - storage key | Untouched |
| `tasks/security-audit.md` | 108 | `- Generate a production keystore: `keytool -genkeypair -v -storetype PKCS12 -keystore earnscroll-release.keystore -alias earnscroll -keyalg RSA -keysi...` | FROZEN - external service slug | Untouched (signing key alias) |
| `temp1.txt` | 1 | `> Historical document. Written when the app was named EarnScroll (now Kenri).` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 5 | `EarnScroll — Google Play Store Submission Risk Audit` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 12 | `Only ONE accessibility service is wired up. plugins/withAppBlocker.js exists but is NOT registered in app.json's plugins array. Only withEarnScrollNat...` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 14 | `Package: com.earnscroll_earnyourscreentime.app (matches both Android package and iOS bundleIdentifier). App name: "EarnScroll: Screen-Time Gym". Slug:...` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 24 | `Compounding issue: the Privacy Policy is only a screen inside the app. Play Console does not accept an in-app screen — it requires a hosted URL on a d...` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 31 | `Locally encrypted data (EncryptedSharedPreferences EarnScrollSecurePrefs — minutes balance, blocked-package list)` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 46 | `android/app/src/main/java/com/earnscroll/BlockerService.kt listens for TYPE_WINDOW_STATE_CHANGED, checks the foreground package against a stored block...` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 49 | `Compounding issue: your accessibility_service_config.xml declares android:description="@string/app_name" — i.e. the description shown on Android's acc...` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 50 | `Compounding issue 2: the in-app prompt asking the user to enable accessibility (app/_layout.tsx lines 70–95) is a simple Alert.alert("Enable App Block...` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 94 | `accessibility_service_config.xml has android:description="@string/app_name". The string accessibility_service_description defined in plugins/withAppBl...` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 95 | `This is what Android shows users on the system-level Accessibility Settings page when they're considering enabling your service. Reviewers explicitly ...` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 106 | `Your iOS NSCameraUsageDescription ("EarnScroll needs camera access to track your exercises in real-time") is fine for Apple but Google reviewers want ...` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 145 | `22. Package name com.earnscroll_earnyourscreentime.app is permanent` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 146 | `First upload locks the package name to your developer account permanently. Verify that com.earnscroll_earnyourscreentime.app is not in use on Play Sto...` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 161 | `@sentry/react-native/expo plugin is registered with org vs3dman, project earnscroll. Sentry's source-map upload requires a SENTRY_AUTH_TOKEN at build ...` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 173 | `Path A — Ship v1.0 without app blocking and without Pro. Strip the AccessibilityService entirely from the v1.0 build (keep FREE_LAUNCH_MODE = true, co...` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 191 | `Contact emails (privacy@, support@, legal@earnscroll.com) set up to receive mail` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 193 | `Web URL for account deletion (e.g. earnscroll.com/delete-account) for users who can't access the app` | KEPT - historical document | Header note added; body left as written |
| `temp1.txt` | 222 | `Package name com.earnscroll_earnyourscreentime.app verified available` | KEPT - historical document | Header note added; body left as written |
| `utils/authRedirect.ts` | 11 | `* yields `earnscroll://auth/callback` in dev-client and release builds.` | FROZEN - deep link scheme | Untouched |
