# EarnScroll — Comprehensive App Report for Legal Documentation

**Prepared for**: Privacy Policy, Terms of Service, and Regulatory Compliance Pages  
**App Name**: EarnScroll: Screen-Time Gym  
**Package ID**: `com.earnscroll.app`  
**Version**: 1.0.0  
**Developer**: Viraj Soni (virajsonib901@gmail.com)  
**Contact Emails**: privacy@earnscroll.com, support@earnscroll.com  
**Report Date**: April 21, 2026  

---

## 1. What EarnScroll Is

EarnScroll is a mobile productivity and wellness application for Android and iOS. Its core concept is **gamified digital self-control**: users must physically exercise to earn minutes of screen time. The app uses the device camera and on-device machine-learning pose detection to count exercise repetitions and time, then converts those completions into a "time bank" of usable minutes. On Android, a system-level accessibility service monitors the device and blocks user-selected apps once the time bank is depleted. On iOS, blocking is not technically possible and users rely on self-discipline.

The app targets anyone who wants to reduce mindless scrolling and replace sedentary habits with physical activity. It is not a medical or fitness device and does not give medical advice.

---

## 2. Platforms and Minimum Requirements

| Platform | Minimum OS | Notes |
|----------|-----------|-------|
| Android | Android 8.0 (API 26) | Full feature set including app blocking |
| iOS | iOS 15+ | Camera workout detection only; no app blocking |
| Web | Browser preview | Camera/ML disabled; placeholder UI only |

---

## 3. Core Features

### 3.1 Exercise Detection and Time Earning

The app uses the device's front or rear camera in real time to detect three exercises:

- **Squats** — Detected by measuring the angle at the knee joint (hip–knee–ankle). A rep is counted when the knee bends below 100° and then extends past 155°. Posture is validated by also checking the hip angle.
- **Pushups** — Detected by measuring the elbow angle (shoulder–elbow–wrist). A rep is counted when the elbow bends below 90° and then extends past 160°. Body plank alignment (shoulder–hip–ankle angle > 110°) is also verified.
- **Planks** — Detected by measuring body alignment (shoulder–hip–ankle angle between 155° and 195°, roughly parallel to the ground). Time is counted in seconds while the position is held.

Each rep or second of exercise is converted to screen-time minutes using configurable **earning ratios**. Default ratios are 1 minute per rep (squats and pushups) and a configurable ratio for planks. Pro users can set custom ratios (0–10 minutes per rep or per second held).

A **500 ms debounce** prevents double-counting reps. All detection and counting runs entirely on the device — no camera images, video, or pose data are transmitted anywhere.

### 3.2 Time Bank

- Users accumulate minutes through exercise (up to a maximum of 1,440 minutes — 24 hours — per day).
- The time bank is stored locally on the device.
- On Android, the time bank is read by the native BlockerService to track and deduct time spent in blocked apps.

### 3.3 App Blocking (Android Only)

Users select apps they want to limit (up to 200 apps). When the time bank reaches zero and the user opens a blocked app, the accessibility service intercepts the launch and displays a full-screen "App Blocked" screen. The user can either open EarnScroll to earn more time or go to the home screen. The back button is disabled to prevent returning to the blocked app.

This feature requires the user to manually grant the **Accessibility Service** permission in Android system settings. The service monitors which app is in the foreground at all times but only uses this information to enforce the user's own blocking rules — it does not log, store, or transmit browsing or app-usage data to any server.

### 3.4 Streak Tracking

The app tracks consecutive workout days in a streak counter. Workout history is stored locally (up to 365 days) as a record of daily squats, pushups, and plank seconds. This is displayed in the Targets / Calendar tab.

### 3.5 Emergency Access

Free users receive 3 emergency access uses per day. Each use grants 5 minutes of free screen time without exercising. The counter resets daily. The duration of each emergency pause is configurable in developer mode (1–60 minutes).

### 3.6 Guest Mode

Users may use the app without creating an account by choosing "Continue as Guest." In guest mode, all data (time bank, workout history, streaks, blocked apps) is stored only on the device and is not synced to any server. Guest users cannot upgrade to Pro and cannot restore data if the app is deleted.

---

## 4. User Accounts and Authentication

EarnScroll uses **Supabase** (supabase.co) as its authentication backend. The following authentication methods are supported:

| Method | Data Collected |
|--------|---------------|
| Email + Password | Email address, bcrypt-hashed password (Supabase manages hashing) |
| Google OAuth | Google account email, OAuth tokens |
| Apple Sign-In | Apple-provided email or relay email, identity token |
| Phone OTP (SMS) | Phone number, one-time passcode via SMS |

**Session management**: Auth session tokens (access token and refresh token) are stored in the device's AsyncStorage because they exceed the 2,048-byte limit of encrypted secure storage. Sessions auto-refresh and persist across app restarts. Users are signed out when they manually sign out or when sessions expire.

**Password reset**: Users can request a password reset link to their registered email. The link redirects via the scheme `myapp://auth/callback`.

**Account deletion**: A data deletion mechanism is not yet implemented in the current version. This is a compliance gap (see Section 11).

---

## 5. Freemium Model and Subscriptions

EarnScroll operates on a freemium model:

### Free Tier
- 1 exercise unlocked (chosen permanently at onboarding from squats, pushups, or planks)
- Fixed earning ratios
- 3 emergency accesses per day (5 minutes each)
- Basic streak and history tracking
- App blocking (Android, limited features)

### Pro Tier
- All 3 exercises unlocked
- Custom earning ratios per exercise (0–10 minutes per rep/second)
- Full workout calendar and all-time stats
- App blocking with full features

**Pricing (as displayed in app)**: ₹99 first month (then ₹199/month), ₹1,299/year, or ₹3,499 lifetime.

> **Important legal note**: As of the current version, no real payment processing is implemented. The pricing shown is a placeholder for demonstration. Clicking any plan toggles Pro status client-side only. No money is charged, no payment provider (such as Google Play Billing, Apple In-App Purchase, Stripe, or Razorpay) is integrated. Before publishing to app stores, actual billing must be implemented and the relevant app store billing policies must be followed, including refund rights.

---

## 6. Data Collection — Complete Inventory

### 6.1 Data Stored Locally on Device

All of the following is stored only on the user's device and is never transmitted to any server:

| Data Item | Storage Method | Encrypted? | Notes |
|-----------|---------------|-----------|-------|
| Time bank balance (minutes) | AsyncStorage (HMAC-signed) | No (integrity-verified) | Clamped 0–1440 |
| Earning ratios per exercise | AsyncStorage (HMAC-signed) | No | Clamped 0–10 |
| Workout history (daily squats, pushups, plank seconds) | AsyncStorage (HMAC-signed) | No | Up to 365 days |
| Current streak | AsyncStorage | No | Integer |
| Last workout date | AsyncStorage | No | YYYY-MM-DD |
| Emergency pause count and reset date | AsyncStorage | No | Resets daily |
| Emergency pause duration | AsyncStorage | No | 1–60 minutes |
| Onboarding completion flag | AsyncStorage | No | Boolean |
| Chosen free exercise | AsyncStorage | No | squats/pushups/planks |
| Guest mode flag | AsyncStorage | No | Boolean |
| Pro subscription status | SecureStore (encrypted) | Yes | Hardware-backed on supported devices |
| Developer mode flag | SecureStore (encrypted) | Yes | Dev builds only |
| HMAC signing key | SecureStore (encrypted) | Yes | Device-unique UUID, never transmitted |
| Blocked apps list | Android EncryptedSharedPreferences (AES-256-GCM) | Yes | Up to 200 package names |
| App-in-use session timer | Android EncryptedSharedPreferences (AES-256-GCM) | Yes | Timestamp |

### 6.2 Data Transmitted to Supabase (Cloud)

Only authentication-related data is transmitted:

| Data Item | When Transmitted | Retained by Supabase? |
|-----------|-----------------|----------------------|
| Email address | On signup / sign-in | Yes (in Supabase Auth database) |
| Password (hashed) | On signup | Yes (Supabase manages hashing) |
| Phone number | On phone OTP signup | Yes |
| Google OAuth tokens | On Google sign-in | Yes (session tokens) |
| Apple identity token | On Apple sign-in | Yes (session tokens) |
| Auth session tokens | On every auth operation | Yes (Supabase session store) |

**What is NOT transmitted**: Workout history, time bank balance, streaks, blocked app lists, camera frames, pose keypoints, or any exercise data. These remain exclusively on the device.

### 6.3 Camera Data

- The camera is active only when the user opens the Workout tab and starts a session.
- Camera frames are processed in real time on the device by the MoveNet Lightning TFLite model.
- **No frames, images, video, or screenshots are stored** anywhere (device or server).
- Only the 17 body keypoint coordinates output by the model are used to calculate joint angles. These values are ephemeral — discarded after each frame is processed.
- The camera feed is never recorded, logged, or transmitted.

---

## 7. Permissions Requested

### Android Permissions

| Permission | Purpose | Required? |
|-----------|---------|-----------|
| `CAMERA` | Exercise detection via camera | Required for core feature |
| `INTERNET` | Supabase authentication API | Required for accounts |
| `PACKAGE_USAGE_STATS` | View time spent in blocked apps today | Required for app blocking |
| `QUERY_ALL_PACKAGES` | Enumerate installed apps for user to select which to block | Required for app blocking |
| `BIND_ACCESSIBILITY_SERVICE` | Run BlockerService to monitor foreground app | Required for app blocking |
| `SYSTEM_ALERT_WINDOW` | Display overlay when app is blocked | Required for app blocking |
| `VIBRATE` | Haptic feedback on rep completion | Optional/enhancing |
| `READ_EXTERNAL_STORAGE` | Read storage (legacy Android) | System-requested |
| `WRITE_EXTERNAL_STORAGE` | Write storage (legacy Android) | System-requested |

### iOS Permissions

| Permission | Purpose | Required? |
|-----------|---------|-----------|
| `NSCameraUsageDescription` | Exercise detection via camera | Required for core feature |
| `NSMotionUsageDescription` | Enhance exercise tracking accuracy | Optional/enhancing |

---

## 8. Third-Party Services and SDKs

### 8.1 Supabase (Authentication Backend)

- **Provider**: Supabase Inc. (supabase.co)
- **Purpose**: User authentication (email, OAuth, phone OTP), session management
- **Data shared**: Email, phone, OAuth tokens, session tokens
- **Data location**: Supabase cloud infrastructure (AWS)
- **Privacy policy**: https://supabase.com/privacy
- **Notes**: The Supabase anonymous (public) API key is embedded in the app bundle. This is standard practice — the key is not a secret. Row-level security on the Supabase backend controls data access.

### 8.2 Google Fonts (Typography)

- **Provider**: Google LLC
- **Purpose**: Loading Inter, Space Grotesk, Space Mono fonts at build time via `@expo-google-fonts`
- **Data shared**: None at runtime — fonts are bundled into the app at build time, not fetched from Google servers at runtime.

### 8.3 TensorFlow Lite / MoveNet Lightning (On-Device ML)

- **Provider**: Google LLC (open-source model)
- **Purpose**: Real-time pose estimation for exercise detection
- **Data shared**: None — model runs entirely on device, no network calls
- **Model file**: `movenet_lightning.tflite` (4.6 MB, bundled with app)
- **Model input**: 192×192 RGB camera frame
- **Model output**: 17 body keypoints (x, y, confidence score per keypoint)

### 8.4 Expo / React Native (Framework)

- **Provider**: Expo (expo.dev) / Meta (React Native)
- **Purpose**: App framework, build tooling, cross-platform APIs
- **Data shared**: Expo may collect anonymized build/update telemetry per their privacy policy. No user workout or personal data is shared.

### 8.5 NetInfo (`@react-native-community/netinfo`)

- **Purpose**: Detecting whether the device is online or offline
- **Data shared**: None — reads local network status only

### 8.6 No Analytics, No Advertising, No Crash Reporting

EarnScroll does **not** integrate:
- Google Analytics / Firebase Analytics
- Meta (Facebook) SDK
- Mixpanel, Amplitude, or any other analytics service
- AdMob or any advertising network
- Sentry, Crashlytics, or any crash/error reporting service

All console logs are stripped in production builds.

---

## 9. Native Android Modules (Technical Detail for Legal Transparency)

### 9.1 EarnScrollModule

A native React Native bridge module that:
- Returns the list of user-installed, launchable apps (label + package name) for the user to select which to block
- Saves and reads the user's blocked packages list to/from encrypted storage
- Reads and writes the time bank balance to/from encrypted storage
- Reports whether the accessibility service is enabled
- Opens the system Accessibility Settings screen
- Reports app usage time for blocked apps today (using PACKAGE_USAGE_STATS)

### 9.2 BlockerService

A native Android AccessibilityService that:
- Listens for `TYPE_WINDOW_STATE_CHANGED` system events (app switches)
- On every app switch, checks if the newly-opened app is in the user's blocked list
- If blocked and time > 0: records the start timestamp
- On leaving the blocked app: calculates time spent and deducts it from the balance
- If time reaches 0 while in a blocked app: launches BlockedActivity immediately
- Stores state in Android EncryptedSharedPreferences (AES-256-GCM)
- Does NOT log app switch events, does NOT transmit any app-usage data

### 9.3 BlockedActivity

A full-screen native Android Activity that:
- Displays "App Blocked" with instructions to open EarnScroll to earn more time
- Provides a "Go Home" button
- Disables the back button
- Is excluded from the Android Recents/Overview screen
- Is dismissed when the user opens EarnScroll and earns more time

---

## 10. Data Security Practices

| Mechanism | What It Protects |
|-----------|----------------|
| HMAC-SHA256 signing (device-unique key) | Time bank balance, earning ratios, workout history — prevents tampering |
| Device-unique UUID key (stored in SecureStore) | HMAC signing key; hardware-backed on supported devices; never transmitted |
| expo-secure-store (iOS Keychain / Android Keystore) | Pro status, developer mode flag, HMAC key |
| Android EncryptedSharedPreferences (AES-256-GCM) | Blocked apps list, BlockerService state |
| Console log stripping in production | Prevents data leakage via Android logcat |
| Supabase Row-Level Security | Controls access to cloud auth data |
| HTTPS for all Supabase API calls | All auth data in transit encrypted with TLS |

**Session token storage note**: Supabase auth session tokens (access token + refresh token) are stored in AsyncStorage (unencrypted at the OS level) because they exceed the 2,048-byte limit of encrypted SecureStore. This is a known limitation of the Expo/Supabase architecture. The tokens are protected by OS-level app sandboxing (other apps cannot read this app's AsyncStorage) but are not encrypted at rest.

---

## 11. Compliance Gaps and Known Issues

The following are known compliance issues that must be resolved before public release or before the applicable legal pages are finalized:

| Issue | Regulation Affected | Severity |
|-------|-------------------|---------|
| No real payment processing implemented | App Store / Play Store billing policies, Consumer protection law | Critical before monetization |
| No account/data deletion mechanism | GDPR Art. 17 (Right to Erasure), CCPA | High |
| No data export mechanism | GDPR Art. 20 (Data Portability) | High |
| No age verification or age gate | COPPA (US), GDPR-K (EU), DPDP Act (India) | High if app is accessible to minors |
| Privacy policy and Terms of Service pages are Lorem Ipsum placeholders | All jurisdictions | Critical before launch |
| Session tokens stored in unencrypted AsyncStorage | Best practices; may be relevant under DPDP Act (India) | Medium |
| No explicit consent mechanism for camera use beyond OS-level prompt | GDPR Art. 6/7 (Lawful basis / Consent) | Medium |
| No cookie/tracking consent banner | Not applicable (no cookies or tracking used) | N/A |

---

## 12. What Data EarnScroll Does NOT Collect

For absolute clarity in legal documentation:

- EarnScroll does **not** collect location data.
- EarnScroll does **not** collect biometric data. Pose keypoints are mathematical coordinates, not stored biometric identifiers.
- EarnScroll does **not** record or store any camera images or video.
- EarnScroll does **not** transmit workout history, exercise counts, streaks, or time bank data to any server.
- EarnScroll does **not** serve advertisements.
- EarnScroll does **not** sell user data to third parties.
- EarnScroll does **not** track users across other apps or websites.
- EarnScroll does **not** use cookies.
- EarnScroll does **not** access contacts, microphone, calendar, or any other sensors beyond the camera and motion sensor.

---

## 13. Children's Privacy

EarnScroll does not have an age gate and is not knowingly designed exclusively for children. If the app is to be made available on app stores in jurisdictions with children's privacy laws (COPPA in the US, GDPR-K in the EU, DPDP Act in India), either:

1. An age gate must be implemented (users under 13/16 cannot create accounts), OR
2. The app must be restricted to 17+ in app store settings and the privacy policy must state it is not intended for children under 13/16.

---

## 14. Developer Mode and Internal Testing Features

The app contains a developer mode, accessible only in debug/development builds by tapping the app version number 7 times. This mode provides:

- Toggle Pro status (no purchase)
- Reset all app data
- Populate 30 days of mock workout data
- Clear workout history
- Adjust emergency pause duration (1–60 minutes)

Developer mode is gated behind `__DEV__` checks and **is not available in production/release builds** distributed to users.

---

## 15. Onboarding and Permanent Choices

During first launch, the app guides users through a one-time onboarding flow:

1. User creates an account (or continues as guest).
2. User selects one free exercise (squats, pushups, or planks).
3. This choice is presented as **permanent and cannot be changed**.
4. The choice is stored locally in AsyncStorage.

**Legal note**: The "permanent" nature of this choice should be clearly disclosed in the Terms of Service, as it affects the user's access to the core free feature. Users should be informed before making this selection.

---

## 16. Offline Functionality

EarnScroll works fully offline for all core features (exercise detection, time bank, app blocking). An offline status banner is shown when there is no network connection. The only feature requiring internet is account creation, sign-in, and session refresh. Guest mode users are entirely offline.

---

## 17. App Store Presence

- **Google Play Store**: Android version with full feature set (camera detection + app blocking)
- **Apple App Store**: iOS version with camera detection only (no app blocking)
- **Apple Sign-In**: Enabled and required if other OAuth providers are offered on iOS (per Apple guidelines)

---

## 18. Summary of Key Legal Contact Points

| Purpose | Contact |
|---------|---------|
| General support | support@earnscroll.com |
| Privacy inquiries / data requests | privacy@earnscroll.com |
| Data deletion requests | privacy@earnscroll.com (manual process until in-app deletion is implemented) |

---

## Appendix A: Dependency List (Legally Relevant Third-Party Libraries)

| Library | Version | License | Purpose |
|---------|---------|---------|---------|
| @supabase/supabase-js | 2.103.2 | MIT | Authentication |
| react-native-vision-camera | 4.7.3 | MIT | Camera access |
| react-native-fast-tflite | 1.6.1 | MIT | TFLite ML inference |
| vision-camera-resize-plugin | 3.2.0 | MIT | Frame preprocessing |
| react-native-worklets-core | 1.5.4 | MIT | Camera worklet threading |
| @react-native-async-storage/async-storage | 2.2.0 | MIT | Local data storage |
| expo-secure-store | 15.0.8 | MIT | Encrypted secure storage |
| expo-crypto | 15.0.8 | MIT | HMAC-SHA256 signing |
| @react-native-community/netinfo | 11.4.1 | MIT | Network status |
| expo-auth-session | 7.0.10 | MIT | OAuth session handling |
| expo-apple-authentication | 8.0.8 | MIT | Native Apple Sign-In |
| expo-web-browser | 15.0.10 | MIT | OAuth redirect browser |
| react-native-reanimated | 4.1.1 | MIT | UI animations |
| react-native-gesture-handler | 2.28.0 | MIT | Touch/gesture handling |
| zod | 3.22.4 | MIT | Input validation |
| lucide-react-native | 0.370.0 | ISC | Icons |
| react-native-calendars | 1.1304.0 | MIT | Calendar UI |
| react-native-confetti-cannon | 1.5.2 | MIT | Celebration animations |
| @tanstack/react-query | 5.79.0 | MIT | Data fetching/caching |

---

*This report reflects the state of the EarnScroll codebase as of April 21, 2026. It should be updated whenever significant features are added, permissions change, or third-party integrations are modified.*
