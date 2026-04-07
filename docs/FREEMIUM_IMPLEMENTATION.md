# Freemium Model Implementation

## 💰 Business Model Overview

EarnScroll operates on a **freemium model** with clear value differentiation between Free and Pro tiers. This document details the implementation, gating strategies, and lessons learned.

## 🎯 Feature Comparison

### Free Tier
- ✅ Choose 1 exercise (onboarding)
- ✅ Unlimited Time Bank
- ✅ Streak tracking
- ✅ Emergency Access (3/day)
- ✅ Basic dashboard
- ❌ Locked 2 exercises
- ❌ Fixed earning ratios (60s per squat/pushup, 3:1 for planks)
- ❌ No workout calendar
- ❌ No all-time stats

### Pro Tier (Dev Toggle / Placeholder Pricing UI)
- ✅ All 3 exercises unlocked
- ✅ Custom earning ratios
- ✅ Full workout calendar + all-time stats (Dashboard)
- ⚠️ No real purchases yet (Pro is toggled via a dev-only flow)

## 🗝️ Global State Keys

```typescript
// contexts/TimeBank.tsx
isUserPro: boolean;                    // Pro status (default: false)
hasCompletedOnboarding: boolean;       // Onboarding complete (default: false)
userFreeExercise: FreeExerciseType;    // Free user's choice (default: null)

// AsyncStorage keys
const IS_USER_PRO_KEY = '@is_user_pro';
const HAS_COMPLETED_ONBOARDING_KEY = '@has_completed_onboarding';
const USER_FREE_EXERCISE_KEY = '@user_free_exercise';
```

## 🚪 Entry Point: Onboarding Flow

### Navigation Logic (app/_layout.tsx)

```typescript
function RootLayoutNav() {
  const { hasCompletedOnboarding, isLoading } = useTimeBank();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;  // Wait for AsyncStorage load

    const inOnboarding = segments[0] === 'onboarding';

    // Redirect to onboarding if needed
    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } 
    // Redirect to tabs if already onboarded
    else if (hasCompletedOnboarding && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [hasCompletedOnboarding, isLoading, segments]);
}
```

**Key Points**:
- Check runs on every navigation
- Prevents unauthorized access to main app
- Handles direct URL navigation (web)

### Onboarding Screen (app/onboarding.tsx)

```typescript
const handleExerciseSelect = (exercise: ExerciseOption) => {
  setSelectedExercise(exercise);  // Local state
};

const handleContinue = async () => {
  if (!selectedExercise) return;
  
  // Save choice to global state + AsyncStorage
  await completeOnboarding(selectedExercise);
  
  // Navigate to main app
  router.replace('/(tabs)');
};
```

**User Experience**:
1. Welcome message
2. 3 exercise cards (squats, pushups, planks)
3. Select one → "Continue" button enabled
4. Tap Continue → Navigate to Dashboard
5. Can never return (unless reset via dev menu)

### Complete Onboarding Implementation

```typescript
// contexts/TimeBank.tsx
const completeOnboarding = useCallback(async (
  selectedExercise: 'squats' | 'pushups' | 'planks'
) => {
  setUserFreeExercise(selectedExercise);
  setHasCompletedOnboarding(true);
  
  await Promise.all([
    AsyncStorage.setItem(USER_FREE_EXERCISE_KEY, selectedExercise),
    AsyncStorage.setItem(HAS_COMPLETED_ONBOARDING_KEY, 'true'),
  ]);
  
  console.log(`✓ Onboarding completed with free exercise: ${selectedExercise}`);
}, []);
```

## 🔒 Feature Gating Implementation

### 1. Workout Screen - Exercise Selection

#### Visual Gating

```typescript
<TouchableOpacity
  style={[
    styles.exerciseButton,
    selectedExercise === 'squats' && styles.exerciseButtonSelected,
    !isUserPro && userFreeExercise !== 'squats' && styles.exerciseButtonLocked
  ]}
  onPress={() => handleExerciseSelect('squats')}
>
  {/* Lock badge for locked exercises */}
  {!isUserPro && userFreeExercise !== 'squats' && (
    <View style={styles.lockBadge}>
      <Lock size={14} color="#FFD700" />
    </View>
  )}
  <Text>Squats</Text>
</TouchableOpacity>
```

#### Click Handler

```typescript
const handleExerciseSelect = (exercise: ExerciseType) => {
  // Check if user has access
  if (!isUserPro && userFreeExercise !== exercise) {
    router.push('/go-pro');  // Redirect to upsell
    return;
  }
  
  // Allow selection
  setSelectedExercise(exercise);
  setShowExerciseSelector(false);
};
```

**UX Flow**:
- Free user sees 1 unlocked + 2 locked exercises
- Clicking unlocked → Start workout
- Clicking locked → Navigate to "Go Pro" screen

### 2. Settings Screen - Custom Ratios

#### Visual Gating

```typescript
<View style={[
  styles.settingCard,
  !isUserPro && styles.settingCardDisabled  // Dimmed appearance
]}>
  <View style={styles.settingHeader}>
    <Text style={[
      styles.settingLabel,
      !isUserPro && styles.settingLabelDisabled
    ]}>
      Squats
    </Text>
    <View style={styles.currentValue}>
      <Text style={[
        styles.currentValueText,
        !isUserPro && styles.currentValueTextDisabled
      ]}>
        {isUserPro ? getCurrentSquatLabel() : '60 seconds'}
      </Text>
      {!isUserPro && <Lock size={14} color="rgba(255, 215, 0, 0.6)" />}
    </View>
  </View>

  {/* Option buttons */}
  {EARNING_OPTIONS.map((option) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.optionButton,
        !isUserPro && styles.optionButtonDisabled
      ]}
      onPress={() => handleSquatRatioChange(option.value)}
      disabled={!isUserPro}  // Actually disabled
    >
      <Text>{option.label}</Text>
    </TouchableOpacity>
  ))}
</View>
```

#### Click Handler

```typescript
const handleSquatRatioChange = (value: number) => {
  if (!isUserPro) {
    router.push('/go-pro');  // Redirect to upsell
    return;
  }
  updateEarningRatios({ squats: value });  // Update if Pro
};
```

**UX Flow**:
- Free users see grayed-out options with lock icon
- Current value shows fixed rate (60s)
- Clicking any option → Navigate to "Go Pro"

### 3. Dashboard - Pro Features

#### Workout Calendar (Pro Only)

```typescript
{isUserPro ? (
  // ✅ Pro: Show actual calendar
  <View style={styles.calendarCard}>
    <View style={styles.calendarHeader}>
      <Activity size={24} color="#00D9FF" />
      <Text>Workout Calendar</Text>
    </View>
    <Calendar
      markedDates={markedDates}
      onDayPress={handleDayPress}
      // ... calendar config
    />
  </View>
) : (
  // ❌ Free: Show locked upsell card
  <TouchableOpacity
    style={styles.calendarCardLocked}
    onPress={() => router.push('/go-pro')}
  >
    <View style={styles.lockedOverlay}>
      <View style={styles.lockedIconContainer}>
        <Lock size={40} color="#FFD700" />
      </View>
      <Text style={styles.lockedTitle}>Workout Calendar</Text>
      <Text style={styles.lockedSubtitle}>
        Track your complete workout history with Pro
      </Text>
      <View style={styles.upgradeProBadge}>
        <Crown size={16} color="#000" />
        <Text>Upgrade to Pro</Text>
      </View>
    </View>
  </TouchableOpacity>
)}
```

**Design Decisions**:
- Show feature preview (not just "Locked")
- Clear call-to-action ("Upgrade to Pro")
- Golden colors for premium feel
- Crown icon reinforces Pro branding

#### All-Time Stats (Pro Only)

```typescript
{isUserPro ? (
  // ✅ Pro: Show actual stats
  <View style={styles.allTimeStatsCard}>
    <Text>All-Time Stats</Text>
    <View style={styles.allTimeStatsGrid}>
      <View><Text>{allTimeStats.totalSquats}</Text></View>
      <View><Text>{allTimeStats.totalPushups}</Text></View>
      <View><Text>{allTimeStats.totalPlankSeconds}</Text></View>
      <View><Text>{allTimeStats.totalWorkoutDays}</Text></View>
    </View>
  </View>
) : (
  // ❌ Free: Show locked upsell card
  <TouchableOpacity
    style={styles.allTimeStatsCardLocked}
    onPress={() => router.push('/go-pro')}
  >
    <View style={styles.lockedStatsOverlay}>
      <View style={styles.lockedIconContainer}>
        <TrendingUp size={36} color="#FFD700" />
      </View>
      <Text style={styles.lockedTitle}>All-Time Stats</Text>
      <Text style={styles.lockedSubtitle}>
        View comprehensive performance analytics with Pro
      </Text>
      <View style={styles.upgradeProBadge}>
        <Crown size={16} color="#000" />
        <Text>Upgrade to Pro</Text>
      </View>
    </View>
  </TouchableOpacity>
)}
```

### 4. Logic Gating - Earning Ratios

#### Free Users Get Fixed Rates

```typescript
// app/(tabs)/workout.tsx - processSquatPhase()
const earnedMinutes = isUserPro 
  ? earningRatios.squats   // Custom ratio (0.5-2 minutes)
  : 1;                     // Fixed: 60 seconds

addMinutes(earnedMinutes);
addExerciseToHistory('squats', 1);
```

#### Plank Special Case (3:1 Ratio)

```typescript
// finishWorkout() for planks
const totalPlankTimeMinutes = totalPlankTimeSeconds / 60;

const plankRatio = isUserPro 
  ? earningRatios.planks  // Custom ratio
  : 3;                    // Fixed: 3 minutes earned per 1 minute planked

const earnedTime = Math.floor(totalPlankTimeMinutes * plankRatio);
addMinutes(earnedTime);
```

**Why 3:1 for planks?**
- Planks are harder to maintain than rep-based exercises
- Encourages free users to try planks
- Still incentivizes Pro upgrade for custom ratios

## 💳 Go Pro Screen (app/go-pro.tsx)

### Screen Structure

```typescript
1. Header with close button
2. Hero section (crown icon, title, subtitle)
3. Feature cards (what Pro unlocks)
4. Free vs Pro comparison table
5. Pricing cards (3 options)
6. Disclaimer (demo mode notice)
```

### Pricing Tiers

```typescript
const plans = [
  {
    name: 'Monthly Plan',
    price: '₹99 for your first month',
    subtext: 'Then ₹199/month. Cancel anytime.',
    type: 'intro'
  },
  {
    name: 'Annual Plan',
    price: '₹1,299 / year',
    subtext: 'Just ₹108.25/month',
    type: 'best-value',  // Highlighted
    badge: 'BEST VALUE'
  },
  {
    name: 'Lifetime Access',
    price: '₹3,499 one-time',
    subtext: 'Pay once, get Pro forever.',
    type: 'lifetime',
    icon: 'crown'
  }
];
```

**Pricing Strategy**:
- Monthly intro offer (₹99) → Low barrier to entry
- Annual highlighted as "Best Value" → 37% savings
- Lifetime high anchor (₹3,499) → Makes annual look cheaper

### Purchase Handler (Demo Mode)

```typescript
const handlePlanPurchase = async (planName: string) => {
  console.log(`[GO PRO] User selected plan: ${planName}`);
  
  // In demo mode: Just toggle Pro status
  await toggleProStatus();
  
  console.log('[GO PRO] Pro status enabled (dev mode)');
  router.push('/');  // Back to Dashboard
};
```

**Why demo mode?**
- No actual payment integration needed for MVP
- Allows full testing of Pro features
- Future: Replace with RevenueCat or similar

### Visual Design

```typescript
// Comparison table styling
<View style={styles.comparisonRow}>
  <Text style={styles.comparisonLabel}>Exercises</Text>
  <View style={styles.comparisonValues}>
    <Text style={styles.comparisonFree}>1</Text>     {/* Gray */}
    <Text style={styles.comparisonPro}>All 3</Text>  {/* Gold */}
  </View>
</View>
```

**Design Decisions**:
- Gold (#FFD700) for Pro features
- Gray/faded for Free limitations
- Crown icon for premium branding
- Gradient backgrounds for depth

## 🛠️ Developer Testing Tools

### Toggle Pro Status

```typescript
// app/developer-menu.tsx
<TouchableOpacity
  style={[
    styles.primaryButton,
    isUserPro && styles.primaryButtonActive  // Visual feedback
  ]}
  onPress={async () => {
    const newStatus = await toggleProStatus();
    Alert.alert(
      'Pro Status Toggled',
      `You are now ${newStatus ? 'Pro' : 'Free'} user`,
      [{ text: 'OK' }]
    );
  }}
>
  <Crown size={24} color={isUserPro ? "#000" : "#fff"} />
  <Text>
    {isUserPro ? 'Switch to Free User' : 'Switch to Pro User'}
  </Text>
</TouchableOpacity>
```

### Reset Onboarding

```typescript
// app/developer-menu.tsx
<TouchableOpacity
  style={styles.warningButton}
  onPress={async () => {
    Alert.alert(
      'Reset Onboarding & Clear All Data',
      'This will reset onboarding and clear ALL data. You will be returned to Welcome screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();  // Clears all freemium data
            router.replace('/onboarding');
          },
        },
      ]
    );
  }}
>
  <RefreshCcw size={24} color="#fff" />
  <Text>Reset Onboarding (Clear All Data)</Text>
</TouchableOpacity>
```

### Implementation

```typescript
// contexts/TimeBank.tsx
const resetOnboarding = useCallback(async () => {
  // Reset all state
  setHasCompletedOnboarding(false);
  setUserFreeExercise(null);
  setIsUserPro(false);
  setEarnedMinutes(0);
  setWorkoutHistory({});
  setCurrentStreak(0);
  setLastWorkoutDate(null);
  setEmergencyPausesRemaining(3);
  
  // Clear AsyncStorage
  await AsyncStorage.multiRemove([
    HAS_COMPLETED_ONBOARDING_KEY,
    USER_FREE_EXERCISE_KEY,
    IS_USER_PRO_KEY,
    TIME_BANK_KEY,
    WORKOUT_HISTORY_KEY,
    CURRENT_STREAK_KEY,
    LAST_WORKOUT_DATE_KEY,
    EMERGENCY_PAUSES_KEY,
  ]);
  
  hasRecordedTodayRef.current = false;
  console.log('✓ Onboarding and all data reset');
}, []);
```

**Why this is essential**:
- Test onboarding flow repeatedly
- Test free user experience
- Test free-to-pro conversion
- Test pro-to-free downgrade

## 🧪 Testing Checklist

### Onboarding Flow
- [ ] Fresh install → Shows onboarding
- [ ] Select exercise → Continue enabled
- [ ] Complete onboarding → Navigate to tabs
- [ ] Re-launch app → Skips onboarding

### Free User Experience
- [ ] 1 exercise unlocked, 2 locked
- [ ] Locked exercise shows lock icon
- [ ] Clicking locked exercise → Go Pro screen
- [ ] Custom ratios grayed out
- [ ] Clicking custom ratio → Go Pro screen
- [ ] Fixed earning rates applied
- [ ] Calendar shows locked placeholder
- [ ] All-time stats show locked placeholder
- [ ] Time Bank & Streak work normally
- [ ] Emergency Access works normally

### Pro User Experience
- [ ] All 3 exercises unlocked
- [ ] No lock icons visible
- [ ] Custom ratios enabled
- [ ] Custom ratios save and persist
- [ ] Custom ratios applied to earnings
- [ ] Calendar shows real data
- [ ] All-time stats show real data
- [ ] Can click any workout day for details

### Upgrade Flow
- [ ] Click locked feature → Navigate to Go Pro
- [ ] Go Pro screen shows all features
- [ ] Comparison table accurate
- [ ] Click plan → Pro activated
- [ ] Navigate back → Features unlocked
- [ ] Pro status persists across restarts

### Developer Tools
- [ ] Toggle Pro → State changes
- [ ] Toggle Pro → UI updates
- [ ] Toggle Pro → Persists
- [ ] Reset onboarding → Clears all data
- [ ] Reset onboarding → Returns to onboarding
- [ ] Reset onboarding → Can select new exercise

## 📊 Conversion Funnel Metrics

### Potential Analytics (Future)

```typescript
// Track free user friction points
logEvent('locked_exercise_clicked', { exercise: 'pushups' });
logEvent('go_pro_screen_viewed', { source: 'workout_screen' });
logEvent('pricing_plan_clicked', { plan: 'annual' });
logEvent('purchase_completed', { plan: 'annual', price: 1299 });

// Track Pro feature usage
logEvent('custom_ratio_changed', { exercise: 'squats', ratio: 1.5 });
logEvent('calendar_day_clicked', { date: '2024-01-15' });
logEvent('stats_viewed');
```

## 🎯 Conversion Optimization Insights

### What Works
1. **Clear Value Communication**
   - Feature comparison table
   - Visual locked states (not just disabled)
   - "Upgrade to Pro" CTAs everywhere

2. **Anchoring Effect**
   - Lifetime plan (₹3,499) makes annual (₹1,299) look cheap
   - Monthly intro (₹99) lowers entry barrier

3. **Social Proof Potential**
   - "Best Value" badge on annual plan
   - Could add "Most Popular" if we had data

### What Could Improve
1. **Trial Period** - Let free users try Pro for 7 days
2. **Progressive Disclosure** - Unlock features gradually, not all at once
3. **Scarcity** - Limited-time intro offer countdown
4. **Testimonials** - User success stories
5. **Refund Policy** - Clearly stated confidence

## 🔐 Security Considerations

### Current State (Client-Side Only)
```typescript
// ⚠️ Pro status stored in AsyncStorage
// User can manually edit and "unlock" Pro features
await AsyncStorage.setItem(IS_USER_PRO_KEY, 'true');
```

**Why this is okay for MVP**:
- No real payments yet
- No sensitive data exposed
- User harms only themselves
- Web-based (hard to tamper)

### Future: Server-Side Verification

```typescript
// ✅ Verify subscription status on server
const { data: user } = useQuery({
  queryKey: ['user-profile'],
  queryFn: async () => {
    const response = await fetch('/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
});

const isUserPro = user?.subscriptionStatus === 'active';
```

**Required for production**:
- RevenueCat / App Store / Play Store integration
- Server validates receipt
- Client receives verified status
- Prevent tampering

## 💡 Lessons Learned

### Technical
1. **Gating everywhere** - Visual + logic + navigation checks
2. **Persistent upsell** - Every interaction should guide to Pro
3. **Developer tools essential** - Toggle Pro for testing
4. **Clear state boundaries** - isUserPro drives all decisions

### UX
1. **Show, don't hide** - Locked features visible, not removed
2. **One-click upsell** - Always "tap to upgrade"
3. **Consistent messaging** - Pro branding (gold, crown) everywhere
4. **No surprises** - Free users know what they're missing

### Business
1. **Pricing localized** - ₹ for India
2. **Multiple tiers** - Monthly, annual, lifetime
3. **Clear value prop** - Feature comparison crucial
4. **Intro offer** - Lowers psychological barrier

## 📈 Future Enhancements

### Short-Term
1. **Usage analytics** - Track conversion funnel
2. **A/B testing** - Different pricing, messaging
3. **In-app messaging** - Promote Pro at key moments

### Long-Term
1. **Team plans** - Family sharing
2. **Gifting** - Buy Pro for a friend
3. **Seasonal pricing** - New Year discounts
4. **Referral program** - Get 1 month free per referral
5. **Tiered Pro** - Pro vs Pro+ with more features

## 🎓 Key Takeaways

1. **Start with onboarding** - Capture free user choice upfront
2. **Gate consistently** - Visual, logic, and navigation
3. **Show locked value** - Don't just disable, inspire upgrade
4. **Test thoroughly** - Developer tools for rapid iteration
5. **Plan for payments** - Demo now, real billing later
6. **Track everything** - Analytics inform optimization
7. **Respect free users** - They're potential Pro customers
8. **Make Pro irresistible** - Clear value, fair pricing
