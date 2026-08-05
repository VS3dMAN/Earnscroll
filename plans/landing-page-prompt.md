Build a modern, high-converting marketing landing page and legal document website for **EarnScroll: Screen-Time Gym** — a mobile app that makes users earn their screen time through physical exercise.

### Site Overview

This is a single website with:
1. **Landing page** (`/`) — Marketing page that explains the app, shows screenshots, and drives Play Store downloads.
2. **Privacy Policy** (`/privacy-policy`) — Standalone page hosting the app's privacy policy.
3. **Terms of Service** (`/terms-of-service`) — Standalone page hosting the app's terms of service.
4. **Support / Contact** (`/support`) — Simple contact page with support email and FAQ.

### Tech Requirements
- Static site — no backend needed
- Use **Next.js** (App Router) or **Vite + React** or even plain **HTML/CSS/JS** — whatever produces a fast, deployable static site
- Host-ready for Vercel, Netlify, or GitHub Pages
- Must be mobile-responsive (the audience is mobile-first)
- Must score 90+ on Lighthouse for Performance, Accessibility, and SEO

---

## BRAND & DESIGN SYSTEM

### Brand Identity
- **App name**: EarnScroll: Screen-Time Gym
- **Tagline**: "Earn Your Screen Time"
- **Hero copy**: "Turn Exercise into Currency. Work out → Earn minutes → Guilt-free scrolling."
- **CTA text**: "Download on Google Play" (primary), "Learn More" (secondary scroll)
- **Tone**: Empowering, tech-forward, playful but not childish, direct with no fluff

### Color Palette
Use the app's actual industrial dark design system:

```
Primary Cyan:       #22D3EE
Cyan Bright:        #49CBEB / #00D9FF
Background Dark:    #090F1B (industrial navy)
Card Dark:          #141B2B
Text Primary:       #F5F7FB
Text Secondary:     #E0E5EE (70% opacity — "cloudy grey")
Border Dark:        #1F2535
Gold (Pro/accent):  #FFD700
Success Green:      #22C55E
Danger Red:         #EF4444
Warning Amber:      #F59E0B
```

The site should default to **dark mode** to match the app's premium industrial aesthetic. Optionally support a light mode toggle, but dark is the primary experience.

### Typography
- **Headings**: Inter (Bold, 700) — or fallback to system sans-serif
- **Body**: Inter (Regular/Medium, 400/500)
- **Monospace/Numbers**: Space Mono or JetBrains Mono — for the time bank display, stats, numbers
- Import from Google Fonts

### Design Guidelines
- Dark, industrial, premium feel — NOT generic SaaS/startup template
- Subtle glassmorphism on cards (blurred backgrounds, semi-transparent borders)
- Cyan (#22D3EE) glow accents on active elements
- Smooth scroll animations (fade-in on scroll, parallax on hero)
- Large touch targets and generous whitespace
- Rounded corners (16px–24px on cards)
- No stock photos — use the provided app screenshots and generated illustrations
- Gold accents for Pro/premium features
- Subtle grid or dot pattern overlay on the dark background for texture

---

## LANDING PAGE SECTIONS (in order)

### 1. Navigation Bar
- Logo/app name on the left ("EarnScroll" with a small lightning bolt ⚡ icon)
- Nav links: Features, How It Works, Pricing, FAQ
- "Download" CTA button (cyan, links to Play Store or `#download`)
- Sticky on scroll, with backdrop blur
- Legal links (Privacy, Terms) in a subtle "More" dropdown or footer only

### 2. Hero Section
- **Headline**: "Earn Your Screen Time"
- **Subheadline**: "Do exercises. Earn minutes. Scroll guilt-free. EarnScroll turns physical workouts into screen time currency — tracked by AI, verified by your camera."
- **Primary CTA**: "Get it on Google Play" button (with Play Store badge icon)
- **Secondary CTA**: "See How It Works" (scrolls to How It Works section)
- **Visual**: Show the dashboard screenshot inside a phone mockup frame, slightly angled, with a subtle cyan glow behind it. If you can animate the phone floating gently, do it.
- Add small trust badges below: "🔒 On-device AI — your camera never leaves your phone" and "⚡ 100% Free to start"

### 3. Problem Statement (emotional hook)
- **Section title**: "The Screen Time Problem"
- Three columns or cards:
  1. **📱 Guilt Loop**: "You scroll for hours, feel guilty, promise to stop… then do it again tomorrow. Sound familiar?"
  2. **🏋️ Motivation Gap**: "You know you should exercise, but there's no immediate reward. The gym can wait… again."
  3. **🔄 The Missing Link**: "What if the thing you feel guilty about could become the reward for the thing you keep putting off?"
- Transition line: "EarnScroll closes the loop."

### 4. How It Works
- **Section title**: "How EarnScroll Works"
- Four steps, each with an icon/illustration and a screenshot:

**Step 1: Choose Your Exercise**
- Icon: Dumbbell
- Text: "Pick from squats, pushups, or planks. Free users choose one; Pro unlocks all three."
- Show the workout/exercise selection screenshot

**Step 2: Work Out with AI**
- Icon: Camera/Eye
- Text: "Start your camera. Our on-device AI (MoveNet) counts every rep in real time — no cheating, no manual entry."
- Show the AI detection screenshot

**Step 3: Earn Your Minutes**
- Icon: Lightning bolt / Clock
- Text: "Every rep earns screen time. Watch your Time Bank fill up. 1 squat = 1 minute. It's that simple."
- Show the dashboard screenshot (Time Bank card)

**Step 4: Block the Distractions**
- Icon: Shield / Lock
- Text: "Choose which apps to put behind the wall. When your Time Bank is empty, they're locked until you exercise."
- Show the app blocker screenshot

### 5. Key Features Grid
- **Section title**: "Everything You Need to Stay Moving"
- 6 feature cards in a 2×3 or 3×2 grid:

1. **AI Rep Counting** — "On-device pose detection tracks your form and counts reps automatically. No internet needed."
2. **Time Bank** — "Earned minutes accumulate forever. Use them when you want, save them for later."
3. **App Blocker** — "Select apps to lock behind your exercise wall. Instagram, YouTube, TikTok — you choose."
4. **Streak System** — "Build consecutive workout days. Don't break the chain. 🔥"
5. **Emergency Access** — "Need your phone urgently? 3 daily emergency passes grant 5 free minutes each. You're never truly locked out."
6. **Privacy First** — "Camera frames are processed on-device and never uploaded. Your workout data stays on your phone."

### 6. App Screenshots Carousel/Gallery
- Title: "See It In Action"
- Show all 4 screenshots in a horizontal scrollable gallery or carousel
- Each screenshot inside a phone mockup frame
- Subtle captions: "Dashboard", "Exercise Selection", "AI Detection", "App Blocker"

### 7. Pricing Section
- **Section title**: "Simple Pricing"
- **Subtitle**: "Start free. Upgrade when you're ready."

Two-column layout:

**Free** (outlined card):
- 1 exercise
- Unlimited Time Bank
- Streak tracking
- Emergency access (3/day)
- Basic dashboard
- CTA: "Download Free" → Play Store

**Pro** (highlighted card with gold/cyan gradient border):
- All 3 exercises
- Custom earning ratios
- Full workout calendar
- All-time performance stats
- Priority support
- Pricing tiers (show all three):
  - Monthly: ₹99 first month, then ₹199/mo
  - Annual: ₹1,299/year (₹108/mo) — "Best Value" badge
  - Lifetime: ₹3,499 one-time
- CTA: "Go Pro" → Play Store
- Small text: "Manage subscriptions through Google Play"

### 8. FAQ Section
- **Section title**: "Questions? We've got answers."
- Accordion-style FAQ:

**Q: Is the AI exercise tracking accurate?**
A: EarnScroll uses Google's MoveNet model running entirely on your device. It tracks joint angles to count reps and detect form. It's accurate enough to count honest reps and ignore half-reps — but it's not a personal trainer. We're continuously improving detection thresholds.

**Q: Does EarnScroll upload my camera feed?**
A: No. Camera frames are processed by the on-device AI model and immediately discarded. Nothing is saved, uploaded, or shared. Ever.

**Q: What happens if I need my phone urgently?**
A: You get 3 Emergency Access passes per day. Each grants 5 free minutes instantly. You're never truly locked out of your phone.

**Q: Which apps can I block?**
A: Any app installed on your device. You choose exactly which apps go behind the exercise wall. System apps and EarnScroll itself are excluded.

**Q: Does the app blocker work on iOS?**
A: The app blocker is currently Android-only. iOS doesn't allow third-party apps to block other apps. On iOS, EarnScroll works as a workout tracker and time bank — the earn side works, but the block side requires Android.

**Q: Can I change my free exercise later?**
A: Free users choose one exercise during setup. To switch or unlock all three, upgrade to Pro.

**Q: Is my data backed up?**
A: Currently, all data is stored locally on your device. Cloud sync is coming soon. For now, your data stays on your phone.

**Q: How do I cancel Pro?**
A: Pro subscriptions are managed through Google Play. Go to Play Store → Subscriptions → EarnScroll to cancel anytime.

### 9. Final CTA Section
- Large, full-width section with dark background and subtle cyan gradient
- **Headline**: "Your Screen Time Should Cost You Something"
- **Subheadline**: "And that something should make you healthier."
- **CTA**: Large "Download EarnScroll" button → Play Store
- Below: "Free to start. No credit card needed."

### 10. Footer
- **Left**: EarnScroll logo + "© 2026 EarnScroll. All rights reserved."
- **Middle**: Links — Privacy Policy, Terms of Service, Support
- **Right**: Contact email — support@earnscroll.com
- Small text: "EarnScroll is a fitness and screen-time tool. It is not medical advice. Consult a physician before starting any exercise program."

---

## LEGAL PAGES

### Privacy Policy (`/privacy-policy`)
Host the following privacy policy as a clean, readable standalone page. Match the site's dark theme. Use the same nav bar and footer as the landing page.

**Content** (render as formatted HTML — the actual legal text is below):

```
Privacy Policy
Last Updated: May 21, 2026

1. Who We Are
EarnScroll ("we", "our", "us") publishes the EarnScroll: Screen-Time Gym mobile application ("the App"). For any privacy questions, email privacy@earnscroll.com.

2. Data We Collect
We collect only what we need to make the App work and to keep it reliable.

Account information: Email address, phone number (only if you sign in with phone), and OAuth subject identifiers from Google or Apple. We never see your Google or Apple password.

App activity: Workout completions (exercise type, rep count, duration), screen views, button taps, and the time you spent in the App. Collected only with your analytics consent.

Performance & crash data: Anonymized crash stack traces, error events, and basic device info (model, OS version). Collected only with your diagnostics consent. Email and other personally identifying fields are stripped before transmission.

Camera-derived data (on-device only): When you start a workout, your camera frames are processed by an on-device machine-learning model (MoveNet, via TensorFlow Lite) to count reps. Frames are never uploaded, saved to disk, or shared.

Accessibility-derived data (on-device only, Android): When you enable the App Blocker, Android tells the App which app is currently in the foreground so we can show the block screen if your earned time is empty. This data is used in-memory only and never transmitted off your device.

Device identifiers: A randomly generated session identifier and the app version string. We do not collect IMEI, advertising ID, or persistent hardware identifiers.

3. How We Use Your Information
To deliver the App's core features (track workouts, award earned minutes, block selected apps when your bank is empty); to keep the App secure and reliable (crash reports, error monitoring); to communicate operational changes; and to comply with applicable law.

4. Legal Basis
We process your data on the basis of (a) contract performance — to provide the App you signed up for; (b) consent — for optional analytics and diagnostics, withdrawable at any time in Settings; and (c) legitimate interest — to maintain security and integrity of the service. We follow the principles in India's Digital Personal Data Protection Act, 2023 (DPDP Act), and apply GDPR-equivalent safeguards globally.

5. Third-Party Processors
- Supabase Inc. — authentication, database, edge functions.
- Sentry (Functional Software, Inc.) — crash and error monitoring, consent-gated only.
- Google LLC — Sign in with Google.
- Apple Inc. — Sign in with Apple (iOS only).

6. On-Device Processing
Two of the most sensitive data flows — camera frames during workouts, and foreground-app observation when the App Blocker is active — happen entirely on your device. These never leave the device, are never written to disk, and are never accessible to us or to any third party.

7. Data Retention
- Live data: deleted immediately when you delete your account.
- Deletion audit row: non-PII record (user id + deletion timestamp) retained for 30 days for compliance.

8. Your Rights
- Access — request a copy of your data by email.
- Correction — change account fields in the App or by email.
- Deletion — use Settings → Delete Account. Deletion is immediate and permanent.
- Portability — request an export by email.
- Withdraw consent — toggle analytics or diagnostics off in Settings at any time.

9. Children
EarnScroll is intended for users 13 and older. We do not knowingly collect data from anyone under 13, and we do not show targeted advertising to minors.

10. Security
All data is encrypted in transit using TLS. Database data at rest is encrypted by Supabase (AES-256). On-device secure preferences (Android) are stored in EncryptedSharedPreferences (AES-256 GCM).

11. International Transfers
Supabase hosts our database in the region we configured when creating the project. If you are outside that region, your data is transferred internationally under standard contractual safeguards.

12. Changes to This Policy
We may update this Privacy Policy from time to time. The "Last Updated" date above always reflects the current version. For material changes we will surface an in-app notice on next launch.

13. Contact
Email privacy@earnscroll.com for any privacy questions, data-subject requests, or to exercise the rights described in section 8.
Support: support@earnscroll.com
```

### Terms of Service (`/terms-of-service`)
Host the following terms of service as a clean, readable standalone page. Same styling approach.

**Content**:

```
Terms of Service
Last Updated: May 21, 2026

1. Acceptance & Eligibility
By creating an account or using EarnScroll, you agree to these Terms. You must be at least 13 years old to use the App. If you are under the age of majority in your jurisdiction, you confirm you have a parent or guardian's consent.

2. License
We grant you a personal, non-exclusive, non-transferable, revocable license to use the App on devices you own or control. You may not sublicense, resell, or distribute the App.

3. Account Responsibilities
You are responsible for keeping your account credentials secure and for activity that occurs under your account. Notify us at support@earnscroll.com if you suspect unauthorized access.

4. Acceptable Use
You agree NOT to:
- Reverse engineer, decompile, or attempt to extract source code or model weights from the App, including the on-device pose-estimation model.
- Use the App Blocker to circumvent parental controls, workplace device-management policies, or any other security control.
- Use automation, scripts, or any non-physical input to fake exercise reps and earn time without performing the workout.
- Use the App for any unlawful purpose or to harass, harm, or impersonate any person.

5. Free Tier & Future Pro Tier
Version 1.0 of the App is offered free of charge with no in-app purchases. Future versions may introduce an optional "Pro" tier processed exclusively through Google Play Billing; pricing and terms specific to that tier will be presented in-app before any purchase.

6. Health & Fitness Disclaimer
EarnScroll is a fitness and screen-time tool. It is NOT medical advice and does NOT diagnose, treat, or prevent any condition. Consult a physician before starting any new exercise program, especially if you have a medical condition. You exercise at your own risk.

7. Limitation of Liability
To the maximum extent permitted by law, EarnScroll and its operators are not liable for any indirect, incidental, consequential, or punitive damages, or for any loss of data, profits, or goodwill, arising out of or in connection with your use of the App. Our aggregate liability for any direct damages will not exceed INR 1,000.

8. Termination
You may terminate your account at any time via Settings → Delete Account. We may suspend or terminate your access if you violate these Terms or applicable law. On termination, your data is deleted as described in our Privacy Policy.

9. Governing Law
These Terms are governed by the laws of India, including the Indian Contract Act, 1872, and the Information Technology Act, 2000. Disputes will be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.

10. Changes to These Terms
We may update these Terms from time to time. The "Last Updated" date above always reflects the current version. For material changes we will surface an in-app notice on next launch. Continued use of the App after a change constitutes acceptance.

11. Contact
For any questions about these Terms, email legal@earnscroll.com.
Support: support@earnscroll.com
```

---

## SUPPORT PAGE (`/support`)

Simple page with:
- **Heading**: "Need Help?"
- **Email**: support@earnscroll.com (clickable mailto link)
- **Quick FAQ**: Link back to FAQ section on landing page
- **Response time**: "We aim to respond within 24 hours."
- **Bug reports**: "For bug reports, include your device model, Android version, and a description of the issue."
- **Account deletion**: "To delete your account, go to Settings → Delete Account in the app, or email support@earnscroll.com."

---

## SEO & META

### Homepage
```html
<title>EarnScroll — Earn Your Screen Time Through Exercise</title>
<meta name="description" content="EarnScroll turns physical exercise into screen time. Do squats, pushups, or planks — AI counts your reps — and earn minutes to use your favorite apps. Free on Android.">
<meta name="keywords" content="screen time, exercise app, fitness gamification, app blocker, earn screen time, AI workout, squats, pushups, planks, digital wellbeing">
<meta property="og:title" content="EarnScroll — Earn Your Screen Time">
<meta property="og:description" content="Turn exercise into screen time currency. AI-powered rep counting. App blocking when your bank is empty.">
<meta property="og:type" content="website">
<meta property="og:image" content="/og-image.png">
<meta name="twitter:card" content="summary_large_image">
```

### Privacy Policy
```html
<title>Privacy Policy — EarnScroll</title>
<meta name="description" content="EarnScroll privacy policy. Learn how we handle your data, camera access, and on-device processing.">
```

### Terms of Service
```html
<title>Terms of Service — EarnScroll</title>
<meta name="description" content="EarnScroll terms of service. Usage terms, acceptable use, health disclaimer, and governing law.">
```

---

## SCREENSHOTS TO USE

Four app screenshots are provided. Place them in the project's public/images directory:

1. **dashboard.png** — Dashboard screen showing Time Bank (2h 34m), Today's Activity (minutes earned vs used), and Streak (7 days). Dark industrial theme.
2. **workout.png** — Exercise selection screen with three large cards (Squats selected, Pushups and Planks locked with gold lock badges). Start Workout button.
3. **ai-detection.png** — Live AI camera view showing a person doing squats with pose skeleton overlay, rep counter (12), and angle readout.
4. **blocker.png** — App Blocker screen showing a list of installed apps (Instagram, YouTube, etc.) with toggle switches to block/unblock.

Use these inside phone mockup frames in the hero section and feature sections.

---

## IMPORTANT NOTES

- The Play Store link is not yet live. Use `https://play.google.com/store/apps/details?id=com.earnscroll_earnyourscreentime.app` as a placeholder.
- The app is Android-first. iOS is secondary (no blocker on iOS). Don't show an App Store badge — only Google Play.
- All emails (privacy@, support@, legal@) should be `mailto:` links.
- The website must work as the URL submitted to Google Play Console for the privacy policy and terms of service. Those pages must be directly accessible at `/privacy-policy` and `/terms-of-service` without JavaScript (SSG/pre-rendered or plain HTML).
- Keep the site fast. No heavy frameworks, no unnecessary animations that hurt Lighthouse scores.
- Generate an OG image (1200×630) that shows the app name, tagline, and a phone mockup with the dashboard screenshot.
