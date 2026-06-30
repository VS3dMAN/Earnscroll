# EarnScroll — Sentry + EAS Setup: Full Explainer
*Written 2026-06-29. Assumes zero prior knowledge.*

---

## PART 1 — What You Did and Why (Simple → Complex)

---

### Chapter 1: The Problem You Were Solving

Your app is live (or going live) on Android. Users will use it, and **things will break**.
A button won't respond. The app will crash. A feature will silently fail.

The old way: users email you "it crashed" and you have NO idea what happened.

The new way: **Sentry** — every time your app crashes or hits an error, it automatically
sends a detailed report to a dashboard you can read. Like a black box recorder on a plane.

---

### Chapter 2: What Sentry Actually Is

Sentry is a service (website + SDK) that does 3 things:

```
Your App  ──crashes──►  Sentry SDK (code inside your app)
                              │
                              ▼
                        Sentry Servers  (sentry.io)
                              │
                              ▼
                        Your Dashboard  (you log in and read reports)
```

The SDK is already in your project (`@sentry/react-native`). You installed it
as part of the earlier setup steps. It sits quietly in your app doing nothing
until something goes wrong — then it fires off a report.

---

### Chapter 3: What a "Crash Report" Looks Like

When your app crashes, Sentry captures:

- **What broke** — the exact error message ("Cannot read property 'x' of undefined")
- **Where it broke** — the file name and line number
- **Stack trace** — the chain of function calls that led to the crash
- **Device info** — Android version, phone model, screen size
- **User info** — which user was affected (if you've set that up)
- **Breadcrumbs** — the last 10–20 actions the user took before the crash

This is enormously useful. Instead of guessing, you see exactly what broke and on what device.

---

### Chapter 4: The Source Map Problem (Why the Token Matters)

Here's a subtle but critical issue:

When you build your app for production, JavaScript gets **minified** — all your
readable code gets compressed into one ugly line:

```
// What your code looks like when you write it:
function calculateSquatAngle(hipPoint, kneePoint, anklePoint) {
  const angle = Math.atan2(...)
  return angle
}

// What it looks like after minification (what runs on the user's phone):
function a(b,c,d){const e=Math.atan2(...);return e}
```

So when Sentry captures a crash from the minified code, the stack trace looks like:
```
Error at a() in bundle.js:1:4829
```

That's useless. You have no idea what `a()` is.

**Source maps** solve this. They're a separate file that acts as a translation table:
```
"a() at position 4829" → "calculateSquatAngle() in workout.tsx line 142"
```

Sentry needs to upload your source maps during the build process so it can
translate minified crashes back into readable ones.

**The SENTRY_AUTH_TOKEN is the password that lets the build process upload
source maps to your Sentry account.** Without it, builds succeed but crash
reports are unreadable gibberish.

---

### Chapter 5: What EAS Is

EAS = **Expo Application Services** — Expo's cloud build system.

Instead of building your APK on your own laptop (which requires Android Studio,
Java, the right SDK versions, etc.), you push your code to Expo's servers and
they build it for you in the cloud.

```
Your laptop  ──git push / eas build──►  Expo's Build Servers
                                               │
                                               ▼
                                        Builds your APK/AAB
                                        (with all the right tools)
                                               │
                                               ▼
                                        Downloads back to you
                                        (or submits to Play Store)
```

Benefits:
- No Android Studio setup required
- Consistent builds (same environment every time)
- Can build iOS on Windows (Expo's servers have Macs)
- CI/CD ready — can trigger builds automatically

---

### Chapter 6: What the Files You Created Do

**`eas.json`** — tells EAS how to build your app. Like a recipe card:
```
development profile  →  builds a debug APK for testing on your phone
preview profile      →  builds a release APK to share with testers
production profile   →  builds an AAB (app bundle) for the Play Store
```

**`app.json` (updated)** — now has `extra.eas.projectId` and `owner`.
This links your local project to your EAS account, so when you run `eas build`,
EAS knows which project on their servers to use.

---

### Chapter 7: What the EAS Secret Does

EAS builds run on remote servers. Those servers don't have access to your
`.env` file (it lives only on your laptop and is `.gitignore`'d for security).

An EAS secret/environment variable is a way to securely store a value on
Expo's servers so it gets injected into the build environment when needed:

```
Your .env (local only, never committed)
    SENTRY_AUTH_TOKEN=sntrys_...

         ≠

EAS Secrets (stored encrypted on Expo's servers)
    SENTRY_AUTH_TOKEN=sntrys_...  ← same value, but available in cloud builds
```

During `eas build`, Sentry's Gradle plugin automatically reads
`SENTRY_AUTH_TOKEN` from the environment and uploads your source maps.
Now your production crash reports will show real file names and line numbers.

---

### Chapter 8: The Full Picture End-to-End

```
You write code
      │
      ▼
eas build --profile production
      │
      ├──► Expo servers clone your repo
      ├──► Inject EAS secrets (SENTRY_AUTH_TOKEN) into environment
      ├──► Run Gradle / compile Kotlin + JS
      ├──► Sentry plugin uploads source maps to sentry.io  ◄── token used here
      └──► Output: signed .aab file
                │
                ▼
        Play Store → User's phone
                │
                │  (user triggers a crash)
                ▼
        Sentry SDK captures error
                │
                ▼
        Sends report to sentry.io
                │
                ▼
        Sentry looks up source map
                │
                ▼
        You see: "NativeWorkoutCamera.tsx line 87: TypeError: ..."
```

---

## PART 2 — How Logs Work (Layman's Guide)

---

### What Is a Log?

A log is just your app writing a note to itself as it runs.

```
App starts up
  → LOG: "App initialized"
  → LOG: "User signed in: vs3dman"
  → LOG: "Opening workout screen"
  → LOG: "Camera permission granted"
  → LOG: "Pose model loaded"
  → ERROR LOG: "Cannot read keypoints — frame was null"   ← something went wrong here
  → App crashes
```

Without logs, a crash is a mystery. With logs, you can trace exactly what
happened in the moments before it broke.

---

### 3 Layers of Logging in Your App

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: Sentry  (production — cloud dashboard)        │
│  Automatic crash reports + manual Sentry.captureException│
│  Readable at: sentry.io                                 │
├─────────────────────────────────────────────────────────┤
│  LAYER 2: console.log / console.error  (development)    │
│  Shows in Metro terminal while you're coding            │
│  Disappears in production builds                        │
├─────────────────────────────────────────────────────────┤
│  LAYER 1: Android logcat  (device-level logs)           │
│  Raw system logs from the OS and native Kotlin code     │
│  Read with: adb logcat                                  │
└─────────────────────────────────────────────────────────┘
```

---

### Layer 1: console.log (Dev Only)

```typescript
// You write this in your code:
console.log("Squat count:", squatCount)
console.error("Camera frame was null!")

// You see this in your Metro terminal:
LOG  Squat count: 5
ERROR  Camera frame was null!
```

**When to use:** During development only. These don't reach Sentry.

---

### Layer 2: Android Logcat

Your Android device keeps a running log of everything — system events,
app events, native code output. You read it by connecting your phone via
USB and running:

```bash
adb logcat | grep earnscroll
```

This is useful for debugging crashes in the Kotlin accessibility service
(AppBlocker) because that code doesn't go through React Native's console.

---

### Layer 3: Sentry (Production)

This is the one that matters when your app is in the hands of real users.

**How a log entry is created:**

```typescript
// AUTOMATIC — Sentry catches unhandled errors on its own:
// (you don't write anything, it just works)

// MANUAL — you can log specific things:
import * as Sentry from '@sentry/react-native'

// Log a message (breadcrumb):
Sentry.addBreadcrumb({
  message: 'User started a plank',
  level: 'info',
})

// Log a handled error (something went wrong but didn't crash):
try {
  await syncToSupabase()
} catch (err) {
  Sentry.captureException(err)
}

// Log extra context:
Sentry.setUser({ id: userId })
Sentry.setTag('exercise_type', 'squats')
```

**How you read it:**

1. Go to sentry.io → your `earnscroll` project
2. Click **Issues** — every crash grouped by type
3. Click an issue → see the full stack trace, breadcrumbs, device info
4. Filter by: date, user, device, error type

---

### What a Sentry Issue Looks Like

```
Issue: TypeError: Cannot read properties of undefined (reading 'keypoints')
  Occurred: 14 times across 3 users
  Last seen: 2 hours ago

Stack Trace:
  NativeWorkoutCamera.tsx:87  processFrame()
  NativeWorkoutCamera.tsx:134 frameProcessor()
  (native code)

Breadcrumbs (what happened before the crash):
  14:23:01  User opened workout tab
  14:23:04  Camera permission granted
  14:23:07  Pose model loaded (latency: 340ms)
  14:23:09  CRASH ← here

Device: Samsung Galaxy A52, Android 13
User: [anonymous]
```

---

## PART 3 — Two YouTube Videos Worth Watching

These two together cover everything you've set up and more.

### Video 1 — Sentry + Expo (exactly your stack)
[Debugging with Sentry and Expo](https://www.youtube.com/watch?v=Ux7H5cAnP_w)

Covers: installing Sentry in an Expo project, source maps, reading crash reports.
This is precisely your setup — Expo + Sentry — explained from scratch.

### Video 2 — EAS Builds end-to-end
[Expo EAS Build Tutorial — Managed Workflow Guide (APK, AAB, IPA)](https://www.youtube.com/watch?v=s4NpvF4ysLM)

Covers: what eas.json profiles mean, how to trigger builds, production vs preview,
submitting to the Play Store. Exactly what you now have configured.

Watch Video 2 first (EAS context), then Video 1 (Sentry). After both you'll
have a complete mental model of the entire pipeline you've set up.

---

## Quick Reference

| What you want to do | Command |
|---|---|
| Trigger a production build | `eas build --platform android --profile production` |
| Trigger a preview APK | `eas build --platform android --profile preview` |
| View your EAS secrets | `eas env:list --environment production` |
| Read device logs live | `adb logcat \| grep earnscroll` |
| Open Sentry dashboard | sentry.io → project: earnscroll |
| Check EAS build status | `eas build:list` |
