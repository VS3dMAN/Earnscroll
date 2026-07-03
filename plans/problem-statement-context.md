# EarnScroll — Problem Statement & Product Context

> For use in market validation, research, and advisory conversations.
> Last updated: June 30, 2026.

---

## What EarnScroll Is

EarnScroll is a mobile app (Android-first, iOS planned) that makes users **earn their screen time through physical exercise**. Users do squats, pushups, or planks in front of their phone camera; an on-device AI model counts reps in real time and credits earned minutes to a "Time Bank." Those minutes are spent when the user opens apps they've designated as distracting — when the bank hits zero, those apps are blocked until the user exercises again.

**Tagline**: *Earn Your Screen Time.*

---

## The Problem

1. **Screen-time guilt is widespread but unsolved.** Existing tools (iOS Screen Time, Digital Wellbeing, Opal) take a punitive approach — they restrict, nag, or shame. Users override them or uninstall them because willpower-based limits don't create lasting behavior change.

2. **Exercise motivation is hard to sustain.** Fitness apps rely on intrinsic motivation, habit streaks, or social pressure. For the vast majority of people (especially non-gym-goers), there is no immediate, tangible reward for working out.

3. **The two problems reinforce each other.** The time people want to reclaim from mindless scrolling is exactly the time they wish they were spending on exercise. But nothing connects the two — screen time and fitness exist in separate product categories.

---

## Our Thesis

> If you reframe exercise as **currency** that directly buys the thing people already want (screen time), you get a behavior loop that is self-reinforcing: the more you scroll, the more you need to exercise; the more you exercise, the more you can scroll guilt-free.

This is positive reinforcement, not restriction. The user never feels punished — they feel like they're earning something.

---

## How It Works (User-Facing)

| Step | What happens |
|---|---|
| **1. Onboarding** | User picks one free exercise (squats, pushups, or planks). Pro users get all three. |
| **2. Workout** | User opens the Workout tab, starts the camera. On-device AI (MoveNet via TFLite) detects the exercise and counts reps/hold-time automatically. |
| **3. Earn** | Reps are converted to minutes via configurable earning ratios (e.g., 1 squat = 1 minute). Minutes are added to the Time Bank. |
| **4. Block** | User selects which installed apps to put behind the blocker (the "Targets" list). When the Time Bank is empty and a targeted app is opened, EarnScroll's accessibility service shows a block overlay. |
| **5. Spend** | When the Time Bank has minutes, blocked apps open normally. Time is deducted as the user uses them. |
| **6. Streak** | Consecutive workout days are tracked. Streaks create social-pressure-like motivation without needing other users. |
| **7. Emergency Access** | 3 daily "get out of jail free" presses grant 5 free minutes each, so the user is never truly locked out. |

---

## Current Build State

| Area | Status |
|---|---|
| Core Time Bank (earn, spend, persist) | ✅ Fully functional |
| On-device AI exercise detection (Android) | ✅ Working — TFLite MoveNet via react-native-vision-camera |
| App blocker (Android accessibility service) | ✅ Implemented — detects foreground app, shows block overlay |
| Streak tracking & workout history | ✅ Fully functional |
| Emergency access system | ✅ Fully functional |
| Freemium gating (free vs Pro) | ✅ Fully functional in UI and logic |
| Onboarding flow | ✅ Fully functional |
| Theme system (light/dark/system) | ✅ Fully functional |
| Real payments (Google Play Billing) | ❌ Stub only — Pro status is toggled via dev menu |
| Backend / user accounts / cloud sync | ❌ Not built — all data is device-local (Supabase scaffolded but unused) |
| iOS support | ⚠️ Builds and runs, but blocker is Android-only (no iOS Screen Time API integration) |
| Analytics | ⚠️ Sentry for crashes; no product analytics yet |

**Tech stack**: React Native 0.76 · Expo SDK 52 · TypeScript · Expo Router · TFLite (MoveNet Lightning) · Android Accessibility Service · AsyncStorage · Supabase (scaffolded)

---

## Business Model

**Freemium with in-app subscriptions.**

### Free Tier
- 1 exercise (chosen at onboarding)
- Fixed earning ratios (non-customizable)
- Time Bank, streaks, emergency access all work fully
- No workout calendar or all-time stats

### Pro Tier
- All 3 exercises
- Customizable earning ratios
- Full workout calendar + analytics
- Planned pricing (INR, India-first market):
  - Monthly intro: ₹99 first month, then ₹199/month
  - Annual: ₹1,299/year (≈ ₹108/month — "Best Value")
  - Lifetime: ₹3,499 one-time

Payments are not yet live. The billing service is a typed stub (`services/billing.ts`) ready for `react-native-iap` integration.

---

## Target Audience

**Primary**: Young adults (18–30) in India who:
- Spend 4+ hours/day on their phone and feel guilty about it
- Want to exercise but lack immediate motivation
- Are comfortable with app permissions and gamification mechanics

**Secondary**: Parents of teenagers who want a carrot-based (not stick-based) approach to managing their child's screen time.

---

## Competitive Landscape

| Category | Examples | How they differ from EarnScroll |
|---|---|---|
| Screen-time limiters | iOS Screen Time, Opal, one sec, Digital Wellbeing | Restriction-focused. Negative framing. Users override or uninstall. |
| Gamified fitness | Zombies Run!, Ring Fit Adventure | Story/game-driven. No real-world reward tied to daily device usage. |
| Move-to-earn | Sweatcoin, StepN | Walking/step-based. Crypto/points economy, not screen time. |
| Generic fitness | Strava, Nike Run Club, Hevy | Pure tracking. No external incentive system. |

**EarnScroll's differentiation**: It is the only product that uses *the thing people already feel guilty about* (screen time) as the direct reward for *the thing they know they should do more of* (exercise). The behavior loop is closed within a single app.

---

## Key Assumptions to Validate

1. **Users will grant the required Android permissions** (camera, accessibility service, query-all-packages, usage stats). These are sensitive and may cause drop-off.
2. **Positive reinforcement outperforms restriction** for sustained behavior change around screen time.
3. **AI-verified exercise counts** matter to users (vs. self-reported reps). This is a trust and fairness lever.
4. **₹99–₹199/month** is a viable price point for this audience in India.
5. **The core loop is sticky enough** to retain users past the first week (the "novelty wearing off" risk).
6. **Parents** represent a meaningful secondary segment, not just a nice-to-have.

---

## Key Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Google Play rejects the accessibility service usage | High | Detailed permission declarations prepared; in-app disclosure flow built; demo videos planned |
| Users find the permission setup too invasive | High | Emergency access ensures users are never locked out; permissions are requested progressively, not up front |
| AI detection is inaccurate or gameable | Medium | On-device MoveNet is proven; angle thresholds are tunable; form-quality scoring is on the roadmap |
| No iOS app blocker equivalent | Medium | iOS launch focuses on the earn side only; blocker is an Android-exclusive feature for now |
| Pro conversion is too low at current pricing | Medium | Intro pricing, anchor pricing, and A/B testing planned |
| All data is device-local — device loss = data loss | Medium | Supabase backend scaffolded; cloud sync is the next major backend milestone |

---

## What We Need From Market Validation

1. **Demand signal**: Do people in the target demographic actually want this enough to install it and grant permissions?
2. **Willingness to pay**: Is the freemium gate (1 exercise vs 3) compelling enough to convert? Is the price right?
3. **Retention drivers**: Does the streak system + time bank create a daily habit, or does usage drop off after the first week?
4. **Permission tolerance**: What % of users complete the accessibility-service setup flow?
5. **Positioning feedback**: Does "earn your screen time" resonate, or does a different frame (health, productivity, parenting) perform better?
