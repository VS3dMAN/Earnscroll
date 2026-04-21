# EarnScroll - Project Overview

## 🎯 Project Description

**EarnScroll** (also known as "Screen-Time Gym") is a fitness gamification mobile application that allows users to earn screen time by completing physical exercises. The app features AI-powered computer vision (web-only) to detect and count exercises in real-time through the device's camera.

## 📋 Core Concept

Users perform exercises (squats, pushups, planks) in front of their device's camera. On web platforms, AI tracks their movements in real-time, counting reps and awarding screen time based on configurable earning ratios. The app emphasizes a premium, industrial aesthetic with smooth animations and a polished dark-mode experience.

## 🏗️ Tech Stack

### Frontend
- **Framework**: React Native with Expo SDK 54.0.0+ (managed workflow; runs in Expo Go)
- **Language**: TypeScript (strict mode)
- **Routing**: Expo Router (file-based routing, tab-based navigation)
- **Styling**: React Native StyleSheet API with industrial dark theme
- **State Management**: 
  - `@nkzw/create-context-hook` for global state
  - `@tanstack/react-query` for async state management
- **Storage**: `@react-native-async-storage/async-storage`
- **Fonts**: Inter (main UI), Space Mono (code/monospace)

### AI & Computer Vision (Web Only)
- **TensorFlow.js** v4.22.0+ (CDN loaded)
- **TensorFlow Models - Pose Detection** v2.1.3
- **Model**: MoveNet SinglePose Lightning

### UI Libraries
- `expo-linear-gradient` - Gradient backgrounds
- `lucide-react-native` - Icon system
- `react-native-calendars` - Workout calendar
- `react-native-gesture-handler` - Gesture handling
- `react-native-confetti-cannon` - Celebration effects
- `expo-blur` - Glass morphism effects

### Additional Features
- PWA support with service worker
- Dark/light theme system with "cloudy grey" palette
- Responsive design for web and mobile

## 🎨 App Architecture

### File Structure
```
app/
  _layout.tsx                 # Root layout with navigation + provider setup
  onboarding.tsx              # First-time user exercise selection
  go-pro.tsx                  # Premium upgrade screen with pricing
  developer-menu.tsx          # Hidden developer testing tools
  privacy-policy.tsx          # Legal - Privacy Policy
  terms-of-service.tsx        # Legal - Terms of Service
  modal.tsx                   # Generic modal screen
  +not-found.tsx              # 404 screen
  (tabs)/
    _layout.tsx               # Tab navigation with theme support
    index.tsx                 # Dashboard (home screen)
    workout.tsx               # Workout tracking (AI on web; limited on native)
    targets.tsx               # App targeting / blocking UI (does not enforce OS-level blocks yet)

  settings.tsx                # Settings & customization (opened from Dashboard)

contexts/
  TimeBank.tsx                # Global state management for app data
  Theme.tsx                   # Theme system (light/dark/system)

constants/
  colors.ts                   # Color palette with dark theme focus
  typography.ts               # Font families and typography system

components/
  PWAInstallPrompt.tsx        # Progressive Web App install prompt

public/                       # PWA assets
  manifest.json               # PWA manifest
  service-worker.js           # Service worker for offline support
  index.html                  # Web entry point
```

## 🔑 Key Features

### 1. **AI-Powered Exercise Tracking** (Web Only)
- Real-time pose detection using the browser webcam (`getUserMedia`)
- Uses TensorFlow.js + MoveNet SinglePose Lightning
- Supports 3 exercise types:
  - **Squats**: Tracks knee/hip angles and phase transitions
  - **Pushups**: Tracks elbow angles and body alignment
  - **Planks**: Tracks body alignment with a hold timer
- Includes extensive debug logging and optional debug overlays
- **Important**: On iOS/Android (Expo Go), the current implementation is effectively web-only; native camera-based pose detection is not implemented yet

### 2. **Time Bank System**
- Earn screen time by exercising
- Configurable earning ratios per exercise
- Free users: Fixed rates (1min per squat/pushup, 3:1 for planks)
- Pro users: Custom earning ratios (30s to 120s per rep)
- Persistent storage across sessions
- Formatted time display (hours/minutes)

### 3. **Streak Tracking**
- Tracks consecutive workout days
- Automatic streak calculation from workout history
- Streak breaks if no workout for >1 day
- Visual flame icon indicator on dashboard
- Streak count prominently displayed

### 4. **Emergency Access**
- 3 daily "emergency" uses (resets at midnight)
- Each use grants 5 minutes instantly
- Unlimited in development mode
- Bottom sheet modal for confirmation

### 5. **Workout History & Calendar**
- Track daily exercise performance
- Visual calendar with workout day markers
- Modal details for each workout day showing reps/time
- Calendar integration with react-native-calendars
- All-time statistics (Pro feature)

### 6. **Theme System**
- Light, Dark, and System modes
- Industrial dark theme with "cloudy grey" secondary text
- Persisted user preference
- Smooth color transitions
- Consistent color palette across all screens

### 7. **Freemium Model**
- **Free Users**:
  - Choose 1 exercise during onboarding
  - Fixed earning rates (non-customizable)
  - Basic features (Time Bank, Streak, Emergency Access)
  - Calendar and all-time stats locked with upgrade prompts
  
- **Pro Users**:
  - All 3 exercises unlocked
  - Custom earning ratios with visual selector
  - Full workout calendar with day details
  - All-time statistics grid
  - Pricing: ₹99/month (intro), ₹1,299/year (best value), ₹3,499 lifetime

### 8. **Developer Tools**
- Hidden developer menu (tap version 7 times in Settings)
- Generate mock workout data (30 days)
- Clear workout history
- Toggle Pro status
- Reset onboarding
- Debug logging throughout app

### 9. **Progressive Web App (PWA)**
- Installable on desktop and mobile browsers
- Service worker for offline support
- Web manifest with app metadata
- Custom install prompt component

## 🎭 User Flows

### First-Time User Flow
1. App Launch → Check `hasCompletedOnboarding` from AsyncStorage
2. If `false` → Navigate to `/onboarding`
3. User selects 1 free exercise (massive cinematic card design)
4. `completeOnboarding()` called → Set `userFreeExercise` & `hasCompletedOnboarding`
5. Navigate to Dashboard `/(tabs)`

### Workout Flow
1. Navigate to Workout tab
2. Select exercise (free users see 2 locked exercises with upgrade prompt)
3. Press "Start Workout"
4. Camera initializes (web), AI model detects poses
5. Perform exercises → Real-time counting with visual feedback
6. Press "Stop" or "Finish" → Time added to bank
7. Workout saved to history + streak updated

### Free-to-Pro Upgrade Flow
1. Free user clicks locked feature:
   - Locked exercise in workout screen
   - Custom ratio in settings
   - Calendar or stats on dashboard
2. Navigate to `/go-pro` screen
3. User sees:
   - Premium hero section with crown icon
   - Feature comparison table (Free vs Pro)
   - 3 pricing tiers with "Best Value" badge on annual
4. User clicks plan → Pro status enabled (demo mode, no payment)
5. Navigate back → All features unlocked

## 🔐 Data Persistence

All data stored in AsyncStorage with the following keys:
- `@time_bank_minutes` - Total earned screen time
- `@earning_ratios` - Custom earning rates (Pro users)
- `@workout_history` - Daily exercise logs (JSON)
- `@current_streak` - Current streak count
- `@last_workout_date` - Last recorded workout date
- `@emergency_pauses_remaining` - Daily emergency uses left
- `@last_pause_reset_date` - Last emergency reset date
- `@is_user_pro` - Pro status (boolean)
- `@has_completed_onboarding` - Onboarding completion (boolean)
- `@user_free_exercise` - Free user's selected exercise
- `@developer_mode` - Developer mode status
- `@theme_mode` - Theme preference (light/dark/system)

## 🚨 Known Limitations

### Platform Support
- **AI Exercise Tracking**: Web ONLY
  - Uses browser's `getUserMedia()` for camera
  - TensorFlow.js loaded via CDN (not bundled)
  - Native support would require custom dev client with tfjs-react-native
  
- **Web Compatibility**: 
  - Camera access requires HTTPS in production
  - Some Expo APIs have limited web support
  - Haptic feedback disabled on web via Platform checks

### Performance
- Real-time AI detection is CPU/GPU intensive
- MoveNet Lightning model chosen for speed over accuracy
- WebGL backend preferred, falls back to CPU if unavailable
- Plank detection uses smoothed angles (EMA) to reduce jitter

## 🎯 Design Philosophy

### Mobile-First Premium Design
- Tab navigation with themed colors
- Large touch targets optimized for thumb zones
- "Soft Industrial Dark" aesthetic (not high-contrast)
- Gradient backgrounds for depth and atmosphere
- Cloudy grey (`#E0E5EE`) for secondary text (reduced eye strain)

### Gamification & Motivation
- Visual feedback (counters, timers, streaks)
- Achievement feeling (earning time, maintaining streaks)
- Confetti celebrations for milestones
- Progressive disclosure (free → pro upgrade path)
- Emergency access as safety net

### Industrial Command Center
- Exercise selection feels like "mission select" from AAA games
- Heavy, substantial card designs
- Giant watermark icons with low opacity for texture
- Glowing cyan accents for active states
- No generic purple gradients or web 2.0 badges

### Developer-Friendly
- Extensive console logging for debugging (prefixed by feature)
- Developer menu for testing all features
- Mock data generation for calendar testing
- Toggle Pro status without payment integration
- TestIDs on interactive elements

## 📊 Business Model

**Freemium with IAP (In-App Purchases)**
- Free tier: Limited to 1 exercise, fixed rates
- Pro tier: Full access with multiple pricing options
- Target market: India (₹ pricing)
- Demo mode: All "purchases" toggle Pro status (no actual payment)
- Future: Google Play Billing integration for real subscriptions

**Pricing Strategy**:
- Monthly intro: ₹99 (then ₹199/month) - Low entry barrier
- Annual: ₹1,299/year - "Best Value" badge, 37% savings
- Lifetime: ₹3,499 - Anchor price makes annual look better

## 🚀 Future Roadmap Ideas

1. **Native Android/iOS Support**
   - Build custom dev client with tfjs-react-native
   - Native camera integration
   - Improved AI performance
   
2. **More Exercises**
   - Lunges, burpees, jumping jacks, sit-ups
   - User-created custom exercises
   
3. **Social Features**
   - Friend challenges and competitions
   - Global/friend leaderboards
   - Share workout achievements
   
4. **Health Integration**
   - Apple Health / Google Fit sync
   - Import activities from other apps
   - Export workout data
   
5. **Actual Payment Integration**
   - Google Play Billing (react-native-iap) for subscription management
   - Play Store billing
   - Receipt validation
   
6. **Advanced Analytics**
   - Workout trends over time
   - Exercise performance insights
   - Goal setting and tracking
   
7. **Gamification Enhancements**
   - Achievements and badges
   - Level system
   - Unlockable themes and icons

## 📝 Version History

- **v1.0.0** (Current)
  - Initial MVP release
  - Web-based AI tracking with MoveNet
  - Freemium model with 3 pricing tiers
  - 3 exercises (squats, pushups, planks)
  - Tab navigation: Dashboard, Workout, Settings
  - Theme system (light/dark/system)
  - Onboarding flow with exercise selection
  - Developer tools and testing utilities
  - PWA support with service worker
  - Industrial dark design aesthetic

## 🎨 Design System Highlights

### Color Palette
- **Primary**: Cyan (#22D3EE, #00D9FF)
- **Background (Dark)**: Industrial Background (#090E1B, #0F1520)
- **Card (Dark)**: Industrial Card (#12182C)
- **Text Secondary**: Cloudy Grey (#E0E5EE at 70% opacity)
- **Success**: Green (#22C55E)
- **Warning**: Amber (#F59E0B)
- **Danger**: Red (#EF4444)
- **Pro**: Gold (#FFD700)

### Typography
- **Primary Font**: Inter (400, 500, 600, 700)
- **Monospace**: Space Mono (400, 700)
- **Headings**: Bold weights with clear hierarchy
- **Body**: Medium weight for readability

### UI Patterns
- Glass morphism with expo-blur
- Gradient borders (cyan to blue) for premium features
- Soft shadows and glows (not harsh outlines)
- Bottom sheets for modals
- Lock icons with crown for Pro features
- Large, cinematic cards for important actions

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ or Bun
- Expo CLI
- Modern web browser with camera access

### Running the App
```bash
# Start development server
bun start

# Start web-only
bun run start-web

# Lint code
bun run lint
```

### Testing AI Features
- Web browser required (Chrome/Edge recommended)
- Allow camera permissions when prompted
- WebGL recommended for better performance
- Use debug angle display to fine-tune detection

## 📚 Related Documentation

- **AI_MODEL_DOCUMENTATION.md** - Detailed AI implementation and thresholds
- **STATE_MANAGEMENT.md** - Context architecture and patterns
- **FREEMIUM_IMPLEMENTATION.md** - Monetization and feature gating
- **DEVELOPMENT_BEST_PRACTICES.md** - Coding standards
- **COMMON_ISSUES_AND_SOLUTIONS.md** - Troubleshooting guide

## 🎓 Key Takeaways

1. **Fitness + Gamification**: Earn screen time through exercise
2. **Web-First AI**: TensorFlow.js for pose detection (web-only MVP)
3. **Freemium Model**: 1 free exercise → upsell to Pro
4. **Industrial Design**: Premium dark aesthetic, not generic
5. **Developer Tools**: Essential for testing without real payments
6. **Type Safety**: Strict TypeScript throughout
7. **Mobile-Native Feel**: Despite web compatibility
8. **Progressive Enhancement**: Works without AI (manual entry future consideration)
