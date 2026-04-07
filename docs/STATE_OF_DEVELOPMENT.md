# State of Development (2025-12-30)

This document is a **snapshot** of the current codebase status for technical review.

## 1) What is fully implemented (coded + runs)

### Navigation / routing
- Expo Router with a root stack and a tabs navigator
- Onboarding gating: users are redirected to `/onboarding` until onboarding is completed

### Screens (present in codebase)
- `app/onboarding.tsx`: choose the free exercise and complete onboarding
- `app/(tabs)/index.tsx`: Dashboard (time bank, streaks, calendar, stats, emergency access, entry points)
- `app/(tabs)/workout.tsx`: Workout screen (web AI implementation; native is not fully supported yet)
- `app/(tabs)/targets.tsx`: Targets list UI (search + lock toggle UI, dark/light styling)
- `app/settings.tsx`: Settings (earning ratios, theme mode, dev mode entry, etc.)
- `app/go-pro.tsx`: Upgrade screen (pricing UI; dev toggle enables Pro)
- `app/developer-menu.tsx`: dev tools (mock history, clear history, toggle pro, reset onboarding)
- `app/privacy-policy.tsx` + `app/terms-of-service.tsx`: placeholder legal screens
- `app/modal.tsx`: generic modal template
- `app/+not-found.tsx`: not found route

### Core app logic
- Time Bank context with AsyncStorage persistence:
  - earned minutes
  - earning ratios
  - workout history
  - streak computation
  - emergency pauses (daily reset)
  - freemium flags (pro / onboarding / free exercise choice)
  - developer mode flag
- Theme context:
  - light/dark/system
  - persists selection
  - reacts to OS appearance changes when in system mode

### Web-specific capabilities
- PWA registration on web (`public/service-worker.js` + install prompt)

## 2) What is not implemented / incomplete

### "App blocking" (Targets)
- Targets is currently **UI-only** (list of hardcoded apps + local lock state)
- There is **no OS-level blocking** integration (Android accessibility service / iOS Screen Time APIs are not present)

### Camera AI on native
- The AI workout counting is currently built around **web browser APIs** (e.g., `HTMLVideoElement`, `getUserMedia`, TFJS web backends)
- Native camera + on-device pose detection is **not implemented**

### Typical fitness-app MVP gaps
- No authentication or user accounts
- No cloud sync / backend storage
- No workout plan library (routines, sets, timers), just exercise counting/hold tracking
- No nutrition, reminders/notifications, goals, social
- Payments are not real (no IAP/subscription provider)

## 3) Tech stack confirmation
- This is an **Expo managed** app and is compatible with **Expo Go**.
- There is no evidence of an ejected / prebuild / custom development build setup (no ios/ or android/ project folders; typical managed workflow dependencies).

## 4) Biggest known risk / first thing a human dev should fix
- The largest functional gap is **native workout tracking**:
  - the current `workout.tsx` implementation is web-oriented and will not deliver the core promise (camera AI counting) on iOS/Android.
  - a human developer should decide: (a) implement a native camera + pose stack (likely requiring a dev build), or (b) ship a manual input/timer-based workout flow for native as the MVP.
