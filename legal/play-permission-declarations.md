# Play Console — Permission Declaration Form Text

Paste each block verbatim into the matching declaration form in Play Console
(Policy → App content → Sensitive app permissions / Accessibility services).

Last reviewed: May 21, 2026.

---

## 1. QUERY_ALL_PACKAGES

**Why does your app need this permission?**

EarnScroll's core feature lets users pick which installed apps to block when
their earned-time bank is empty. To present a complete picker UI, we query the
device's installed apps using `PackageManager.queryIntentActivities` for
`Intent.ACTION_MAIN` + `CATEGORY_LAUNCHER`. The full list never leaves the
device; only the user's chosen subset is persisted, encrypted, on-device.

**Use case category**: Apps with core functionality that requires showing the
list of installed apps to the user.

**Demo video must show**:
- Opening the App Blocker screen.
- The picker rendering the device's app list.
- The user selecting a few apps to block.
- Settings page showing the saved selection.

---

## 2. BIND_ACCESSIBILITY_SERVICE

**Service name**: `com.earnscroll.BlockerService`

**Functionality summary**: Detects when a user-selected "distracting" app
enters the foreground and shows a block overlay if the user's earned-time
balance is zero. The service only reads `TYPE_WINDOW_STATE_CHANGED` events
to learn the foreground package name. It does NOT read window content
(`canRetrieveWindowContent="false"`), screen text, input, passwords, or any
other app's data.

**Why no less-intrusive API works**: Android exposes the currently-foreground
package name only to apps holding `BIND_ACCESSIBILITY_SERVICE`. Alternative
APIs (UsageStatsManager) only return historical usage windows with multi-
second latency, which is insufficient to block an app before the user has
already interacted with it.

**Required in-app disclosure**: a prominent, full-screen disclosure is shown
before the user is sent to system Accessibility settings. See
`app/accessibility-disclosure.tsx`. The user must check an "I understand
what data this service accesses" checkbox before the "Open Settings" button
becomes enabled. The disclosure timestamp is persisted on-device in
`accessibility_consent_v1`.

**Demo video must show**:
- The in-app disclosure screen (full screen, scrollable, listing what is
  and is not accessed).
- The checkbox being toggled on, then "Open Settings" tapped.
- Android Settings → Accessibility → EarnScroll being enabled.
- Returning to the app; opening a blocked app; the EarnScroll block screen
  appearing.
- Earning time via a workout; the block screen no longer appearing.

---

## 3. SYSTEM_ALERT_WINDOW (only if retained after final review)

**Why does your app need this permission?**

EarnScroll uses `SYSTEM_ALERT_WINDOW` to display the "App Blocked" overlay
on top of the blocked app's surface when the user has zero earned minutes
remaining. The overlay shows two actions: open EarnScroll, or go home.

If we determine `BlockedActivity` (full-screen activity launched via
`Intent.FLAG_ACTIVITY_NEW_TASK`) is sufficient, this permission can be
removed entirely. The current implementation already prefers
`BlockedActivity` and only uses an overlay as a Tier-2 fallback on devices
where the activity launch is delayed.

**Demo video must show**:
- A blocked app being opened with zero earned minutes.
- The block overlay appearing on top of the blocked app.
- The user tapping "Open EarnScroll" → leaving the blocked app.

---

## 4. PACKAGE_USAGE_STATS

**Why does your app need this permission?**

EarnScroll uses `UsageStatsManager` only to display the user's own daily
usage breakdown for the apps they have already chosen to block. The total
time spent in blocked apps is shown on the Dashboard so the user can see
how their earned time is being spent. We do NOT use usage stats to derive
analytics, advertise, or share with third parties.

**Demo video must show**:
- The Dashboard with a "Blocked app usage today" panel.
- The list reflecting only apps that are in the user's blocker list.
- No data being shown for apps not in the blocker list.

---

## Companion artifacts

- `legal/data-safety-form-guide.html` — Data Safety form answer key.
- `legal/privacy-policy.html` — hosted privacy policy URL is required for
  every declaration form.
- `app/accessibility-disclosure.tsx` — the in-app disclosure shown before
  the system Accessibility prompt; record this screen in the demo video.
