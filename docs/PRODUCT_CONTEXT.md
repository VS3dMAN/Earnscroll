# EarnScroll - Complete Product Context

> **📋 Purpose**: This document provides comprehensive context about EarnScroll for AI assistants, product discussions, and brainstorming sessions. It contains everything needed to understand the app's vision, current state, and future direction.

## 🎯 Executive Summary

**EarnScroll (Screen-Time Gym)** is a fitness gamification mobile app that flips the script on screen time: instead of limiting it, users *earn* it by exercising. Using AI-powered computer vision (web) or manual tracking, users perform squats, pushups, and planks to accumulate minutes that they can "spend" on their devices.

### The Core Loop
1. **Earn**: Do exercises → AI counts reps → Minutes added to Time Bank
2. **Track**: Calendar shows workout history, streak tracking motivates consistency
3. **Upgrade**: Free users get 1 exercise → Pro unlocks all 3 + customization + analytics

### Current Status
- **Platform**: React Native + Expo (web-compatible, mobile-ready)
- **AI**: TensorFlow.js + MoveNet (currently web-only; native AI not yet implemented)
- **Monetization**: Freemium (demo mode, no real payments yet)
- **Design**: Industrial dark aesthetic, premium "command center" feel
- **Stage**: Prototype/MVP-in-progress — core Time Bank + workout history works; targets/blocking is UI-only; camera AI is web-only

---

## 🌟 Product Vision

### The Problem
- People feel guilty about screen time but can't stop
- Traditional fitness apps rely on willpower alone
- Exercise tracking is manual, tedious, and easy to fake
- Fitness goals lack immediate, tangible rewards

### Our Solution
- **Gamification**: Turn exercise into currency
- **AI Verification**: Automatic, honest rep counting (no cheating)
- **Immediate Gratification**: Every rep = time earned instantly
- **Habit Formation**: Streak system builds consistency
- **Premium Feel**: Industrial design makes fitness feel powerful

### Target Audience
**Primary**: Young adults (18-35) who:
- Struggle with screen time guilt
- Want to exercise but lack motivation
- Enjoy gamification and achievement systems
- Are comfortable with technology

**Secondary**: Parents who want to:
- Incentivize their kids to exercise before screen time
- Set healthy boundaries around device usage
- Track family fitness activity

---

## 🏗️ Technical Architecture

### Technology Stack
```
Frontend: React Native 0.81 + Expo SDK 54
Language: TypeScript (strict mode)
Routing: Expo Router (file-based, tab navigation)
State: @nkzw/create-context-hook + AsyncStorage
Styling: React Native StyleSheet (industrial dark theme)
AI: TensorFlow.js + MoveNet (CDN-loaded, web-only)
Fonts: Inter (UI), Space Mono (code)
Icons: lucide-react-native
```

### Architecture Highlights
- **Dual Context Pattern**: TimeBank (app data) + Theme (UI preferences)
- **AsyncStorage Persistence**: All data saved locally, instant loads
- **Platform-Specific AI**: Web uses TensorFlow.js, native uses manual tracking (future)
- **Progressive Web App**: Service worker, installable, offline-capable
- **Theme System**: Light/Dark/System with "cloudy grey" secondary text

### Key Design Decisions
1. **Web-first AI**: TensorFlow.js for fast MVP without native builds
2. **No backend required**: All data client-side (privacy-first)
3. **Tab navigation**: Dashboard, Workout, Targets (Settings is a separate screen opened from Dashboard)
4. **Industrial aesthetic**: Dark backgrounds, cyan accents, heavy cards
5. **Freemium model**: 1 free exercise, upsell to Pro for full access

---

## 🎨 User Experience

### Design Philosophy
- **Premium, Not Generic**: Avoid purple gradients and web 2.0 clichés
- **Industrial Command Center**: Workout selection feels like arming weapons in a AAA game
- **Soft Dark Mode**: "Cloudy grey" secondary text reduces eye strain vs pure white
- **Substantial UI**: Heavy cards, glowing borders, watermark icons for texture
- **Mobile-Native**: Even on web, feels like a mobile app (not responsive website)

### User Flows

#### First-Time User (Onboarding)
```
Launch App
↓
Onboarding Screen (massive cinematic exercise cards)
↓
Select 1 Free Exercise (Squats/Pushups/Planks)
↓
Navigate to Dashboard
↓
See Time Bank (0 minutes), Streak (0 days), Emergency Access (3/3)
```

#### Workout Session (Web with AI)
```
Navigate to Workout Tab
↓
Select Exercise (2 are locked for free users)
↓
Start Workout → Camera activates
↓
Perform Exercise → AI counts reps in real-time
↓
Skeleton overlay shows body tracking
↓
Finish Workout → Minutes added to Time Bank
↓
Workout saved to history, streak updated
↓
Confetti animation (if milestone)
```

#### Free → Pro Conversion
```
Free user clicks locked feature:
  - Locked exercise in workout screen
  - Custom ratio in settings
  - Calendar or stats on dashboard
↓
Navigate to Go Pro screen
↓
See feature comparison (Free vs Pro table)
↓
See 3 pricing tiers:
  - Monthly intro: ₹99 (then ₹199/month)
  - Annual: ₹1,299/year (BEST VALUE badge)
  - Lifetime: ₹3,499 (anchor pricing)
↓
Tap plan → Pro activated (demo mode)
↓
Navigate back → All features unlocked
```

---

## 💎 Feature Breakdown

### Core Features (Free + Pro)

#### 1. Time Bank
- **What**: Accumulator of earned screen time
- **How**: Every rep/second adds minutes based on earning ratio
- **Display**: Formatted as "Xh Ym" (e.g., "2h 34m")
- **Persistence**: Saved to AsyncStorage, never resets

#### 2. Streak Tracking
- **What**: Consecutive days with at least one workout
- **Calculation**: Automatic from workout history
- **Rules**: Breaks if >1 day gap (today or yesterday is OK)
- **Display**: Flame icon + number (e.g., "🔥 7 days")

#### 3. Emergency Access
- **What**: "Get out of jail free" card for urgent screen time
- **Limit**: 3 uses per day, resets at midnight
- **Reward**: 5 minutes per use
- **Dev Mode**: Unlimited uses

#### 4. Exercise Tracking (AI on Web)
- **Squats**: Knee angle tracking (70° threshold)
- **Pushups**: Elbow angle tracking (90° down, 150° up)
- **Planks**: Back angle + body alignment (120-200° range, timer accumulates)
- **Feedback**: Skeleton overlay, debug angles, phase indicators

### Pro-Only Features

#### 5. Custom Earning Ratios
- **Default (Free)**: 60s per rep (squats/pushups), 3:1 for planks
- **Pro Options**: 30s, 60s, 90s, 120s per rep
- **Plank Ratio**: 1:1, 2:1, 3:1, 4:1 (minutes earned : minutes held)
- **UI**: Four-option selector with cyan accent

#### 6. Workout Calendar
- **Display**: react-native-calendars with cyan dots on workout days
- **Interaction**: Tap day → modal shows that day's exercises (squats/pushups/plank)
- **Free Users**: See locked overlay with "Upgrade to Pro" prompt

#### 7. All-Time Stats
- **Metrics**: Total squats, total pushups, total plank time, total workout days
- **Display**: 2x2 grid of stat tiles
- **Free Users**: See locked overlay with "Upgrade to Pro" prompt

#### 8. All Exercises Unlocked
- **Free**: Choose 1 during onboarding, other 2 locked
- **Pro**: All 3 exercises available anytime

---

## 🔐 Freemium Strategy

### Free Tier (Acquisition)
**Goal**: Get users hooked on the core loop
**Limitations**:
- 1 exercise only (set during onboarding, can't change without reset)
- Fixed earning ratios (non-customizable)
- No calendar or analytics
**Value Delivered**:
- Full Time Bank system (unlimited earning)
- Streak tracking (full functionality)
- Emergency access (3/day)
- AI exercise detection (web)

### Pro Tier (Monetization)
**Goal**: Convert engaged users to paying customers
**Value Proposition**:
- "Unlock your full fitness potential"
- "Customize your earning strategy"
- "Track your progress over time"
**Pricing** (India market):
- **Monthly Intro**: ₹99 for first month (then ₹199)
  - Low barrier to entry, "try it out" offer
- **Annual**: ₹1,299/year (₹108/month)
  - "BEST VALUE" badge, 37% savings vs monthly
- **Lifetime**: ₹3,499 one-time
  - Anchor pricing to make annual look great

### Conversion Tactics
1. **Persistent Reminders**: Locked features visible, not hidden
2. **One-Tap Upsell**: Every locked feature → instant navigation to Go Pro screen
3. **Social Proof**: "Best Value" badge on annual plan
4. **Feature Comparison**: Side-by-side Free vs Pro table
5. **Premium Branding**: Gold colors, crown icons, gradient borders

---

## 🧠 AI Implementation (Web-Only MVP)

### Technology
- **Library**: TensorFlow.js v4.22 + Pose Detection v2.1.3
- **Model**: MoveNet SinglePose Lightning (speed over accuracy)
- **Backend**: WebGL (falls back to CPU)
- **Loading**: Dynamic script injection (not bundled)

### Detection Logic

#### Squats
```
Standing (knee < 25°)
↓
Descending (knee increasing)
↓
Bottom (knee > 70°)
↓
Ascending (knee decreasing)
↓
Standing (knee < 25°) → COUNT REP
```
- **Debounce**: 200ms minimum between reps
- **Angles**: Hip-knee-ankle flexion

#### Pushups
```
Up Position (elbow > 150°)
↓
Descending
↓
Down Position (elbow < 90°)
↓
Ascending
↓
Up Position (elbow > 150°) → COUNT REP
```
- **Debounce**: 300ms minimum
- **Angles**: Shoulder-elbow-wrist

#### Planks
```
Good Form Detected (back 120-200°, alignment < 8.0)
↓
Start Timer (2 valid frames)
↓
Hold (timer updates every 100ms)
↓
Form Breaks (900 invalid frames = ~3 seconds)
↓
Pause Timer (accumulated time saved)
↓
Resume if form corrects
```
- **Smoothing**: Exponential Moving Average (α = 0.15)
- **Tolerance**: "Near-valid" grace period prevents false breaks
- **Accumulator**: Timer persists across form breaks

### Performance Considerations
- ~30-60 FPS on modern devices
- Model size: ~12MB
- Camera resolution: 640x480 (sufficient for pose detection)
- Extensive logging for debugging and threshold tuning

### Known Limitations
- **Web-only**: Native requires custom dev client with tfjs-react-native
- **Single person**: MoveNet designed for solo workouts
- **Lighting-dependent**: Poor lighting affects keypoint confidence
- **Camera angle**: Side view works better for most exercises

---

## 📊 Current State & Metrics

### What's Built (MVP Complete)
✅ Tab navigation (Dashboard, Workout, Settings)
✅ AI exercise detection (web, 3 exercises)
✅ Time Bank with earning ratios
✅ Streak tracking with calendar integration
✅ Emergency access system
✅ Freemium model with feature gating
✅ Theme system (light/dark/system)
✅ Onboarding flow
✅ Developer tools (hidden menu)
✅ PWA support (installable, offline)
✅ Industrial dark design aesthetic

### What's Missing (Future Roadmap)
❌ Native AI implementation (mobile TensorFlow Lite)
❌ Backend + cloud sync (currently all local)
❌ Real payment integration (RevenueCat/IAP)
❌ Social features (friends, leaderboards)
❌ More exercises (lunges, burpees, etc.)
❌ Manual rep entry (for non-web or offline)
❌ Goal setting and reminders
❌ Apple Health / Google Fit integration

### Tech Debt
- AI model loaded via CDN (not bundled, could fail if CDN down)
- No error boundary (app crashes on uncaught errors)
- AsyncStorage can corrupt (no migration strategy)
- No analytics (can't track conversion funnel)
- Pro status client-side only (can be spoofed)

---

## 🚀 Future Opportunities

### Short-Term (Next 3 Months)
1. **User Testing**: Get 50-100 beta users, collect feedback
2. **Payment Integration**: RevenueCat + real subscriptions
3. **Analytics**: Mixpanel/Amplitude for conversion tracking
4. **Manual Entry**: Allow users to log reps manually (fallback for native)
5. **Onboarding Polish**: Better exercise preview videos/animations

### Medium-Term (3-6 Months)
1. **Native AI**: Custom dev client with TensorFlow Lite
2. **Backend**: User accounts, cloud sync, leaderboards
3. **More Exercises**: Lunges, sit-ups, burpees, jumping jacks
4. **Social Features**: Friend challenges, shared streaks
5. **Reminders**: Push notifications for streak maintenance

### Long-Term (6-12 Months)
1. **Health Integration**: Apple Health, Google Fit, Strava
2. **Gamification++**: Levels, achievements, badges, unlockables
3. **Parental Controls**: Parents manage kids' accounts, set limits
4. **Corporate Wellness**: B2B partnerships for employee fitness
5. **AI Improvements**: Form feedback, rep quality scoring

### Moonshot Ideas
1. **AR Workouts**: Overlay trainer in AR, follow along
2. **Multiplayer**: Real-time workout races with friends
3. **Smart TV App**: Use TV as display, phone as controller
4. **Wearable Integration**: Apple Watch rep counting
5. **Cryptocurrency**: Tokenize earned time, trade/gift it

---

## 💡 Key Insights & Learnings

### What Works Well
1. **Instant Gratification**: Seeing minutes added immediately is addictive
2. **Streak System**: Users don't want to break their streak (powerful motivator)
3. **AI Verification**: "It knows I cheated" prevents half-reps, builds trust
4. **Emergency Access**: Safety valve reduces pressure, improves retention
5. **Industrial Design**: Premium feel differentiates from generic fitness apps

### What Needs Improvement
1. **Onboarding Friction**: Users don't understand the concept immediately
2. **Exercise Diversity**: 3 exercises not enough for long-term engagement
3. **Social Proof**: No way to share achievements, limited virality
4. **Web Limitation**: Mobile users expect native camera, web feels hacky
5. **Value Perception**: "Earning screen time" sounds juvenile to some adults

### User Feedback (Anticipated)
- "Can I change my free exercise?" → No, Pro-only (common pain point)
- "What if I don't have a camera?" → Manual entry needed
- "Can I gift my time to someone?" → Future feature idea
- "Do I lose my time bank if I don't use it?" → No, it accumulates forever
- "Why is this only on web?" → Native coming soon (once payment integrated)

---

## 🎯 Product Positioning

### Market Fit
**Category**: Fitness Gamification (like Zombies, Run! or Sweat Coin)
**Unique Angle**: Screen time as currency (first of its kind)
**Competition**:
- Generic fitness apps (Strava, Nike Run Club): Track workouts, no incentive
- Gamified fitness (Zombies, Run!): Storytelling, not reward-based
- Screen time apps (Screen Time, Opal): Restriction-focused, negative framing

**Our Advantage**:
- Positive reinforcement (earn, don't restrict)
- AI verification (trust-building)
- Immediate reward (no delayed gratification)

### Brand Voice
- **Empowering**: "You earned this"
- **Tech-Forward**: Industrial design, AI-powered
- **Playful**: Gamification without being childish
- **Direct**: No fluff, clear value prop

### Messaging Examples
- **Tagline**: "Earn Your Screen Time"
- **Hero Copy**: "Turn Exercise into Currency. Work out → Earn minutes → Guilt-free scrolling."
- **CTA**: "Start Your Streak" (not "Sign Up" or "Get Started")
- **Pro Upsell**: "Unlock Your Full Fitness Potential"

---

## 📝 Open Questions for Brainstorming

### Product Strategy
1. Should we expand beyond screen time? (e.g., earn gift cards, real money?)
2. Is freemium the right model, or should we charge upfront?
3. How do we handle cheaters on native (no AI)?
4. Should parents control kids' accounts, or should kids be independent?

### Feature Priorities
1. Backend + social vs native AI vs more exercises?
2. Manual rep entry vs forcing web-only until native ready?
3. Health app integration vs standalone ecosystem?
4. Simple design vs more visual flair (animations, confetti, etc.)?

### Monetization
1. Current pricing too low/high for India market?
2. Should we have usage-based pricing (pay per exercise)?
3. Ads in free tier, or keep ad-free?
4. Corporate wellness partnerships worth pursuing?

### Technical
1. Should we bundle TensorFlow.js or keep CDN loading?
2. How to handle AsyncStorage corruption gracefully?
3. Backend: Firebase vs custom (Supabase/Railway)?
4. Analytics: Mixpanel vs Amplitude vs PostHog?

---

## 🔗 Quick Reference

### Key Files
- `contexts/TimeBank.tsx`: App state (workouts, time bank, streaks)
- `contexts/Theme.tsx`: Theme system (light/dark/system)
- `app/(tabs)/index.tsx`: Dashboard screen
- `app/(tabs)/workout.tsx`: AI detection + workout screen
- `app/(tabs)/settings.tsx`: Settings + earning ratios
- `app/onboarding.tsx`: First-time exercise selection
- `app/go-pro.tsx`: Upgrade screen with pricing

### Documentation
- `PROJECT_OVERVIEW.md`: High-level project summary
- `AI_MODEL_DOCUMENTATION.md`: Deep dive into TensorFlow.js implementation
- `STATE_MANAGEMENT.md`: Context architecture and patterns
- `FREEMIUM_IMPLEMENTATION.md`: Monetization and feature gating
- `DEVELOPMENT_BEST_PRACTICES.md`: Coding standards
- `COMMON_ISSUES_AND_SOLUTIONS.md`: Troubleshooting guide

### External Resources
- [Expo Docs](https://docs.expo.dev)
- [TensorFlow.js Pose Detection](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection)
- [MoveNet Guide](https://www.tensorflow.org/hub/tutorials/movenet)
- [Lucide Icons](https://lucide.dev)

---

## 🤝 How to Use This Document

### For AI Assistants
Use this document to understand EarnScroll's complete context when:
- Brainstorming new features or improvements
- Discussing product strategy or positioning
- Debugging issues or proposing solutions
- Writing code (understand the "why" behind decisions)

### For Product Discussions
Reference this document when:
- Pitching to investors or partners
- Onboarding new team members
- Planning roadmap priorities
- Making architecture decisions

### For User Research
Use this to:
- Create interview scripts (test assumptions)
- Design surveys (validate positioning)
- Analyze feedback (compare to vision)
- Prioritize feature requests

---

**Last Updated**: 2025-01-10
**Version**: 1.0 (MVP Complete)
**Contact**: See README for contributor info
