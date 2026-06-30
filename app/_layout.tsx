import { useEffect } from 'react';
import { Stack, useSegments, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Fonts
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';

// Contexts
import { TimeBankProvider, useTimeBank } from '@/contexts/TimeBank';
import { ThemeProvider, useTheme } from '@/contexts/Theme';
import { AuthProvider, useAuth } from '@/contexts/Auth';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AnalyticsProvider } from '@/contexts/Analytics';
import { ConsentPrompt } from '@/components/ConsentPrompt';

SplashScreen.preventAutoHideAsync();

function AppContent({ fontsLoaded }: { fontsLoaded: boolean }) {
  const themeContext = useTheme();
  const isDark = themeContext?.theme?.isDark ?? true;
  const { isLoading: isTimeBankLoading, hasCompletedOnboarding } = useTimeBank();
  const { isLoading: isAuthLoading, isAuthenticated, isGuest } = useAuth();
  const isHydrated = themeContext?.isHydrated ?? false;

  const segments = useSegments();
  const router = useRouter();

  const isReady = fontsLoaded && !isTimeBankLoading && !isAuthLoading && isHydrated;

  // Hide splash only when everything is ready
  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  // Auth guard redirect
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !isGuest && !inAuthGroup) {
      // Not logged in and not a guest — go to login
      router.replace('/(auth)/login');
    } else if ((isAuthenticated || isGuest) && inAuthGroup) {
      // Authenticated or guest on auth screen — go to app
      if (!hasCompletedOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isReady, isAuthenticated, isGuest, segments, hasCompletedOnboarding]);

  useEffect(() => {
    if (!isReady) return;
    if (Platform.OS !== 'android') return;
    if (!isAuthenticated && !isGuest) return;
    if (!hasCompletedOnboarding) return;

    const checkAccessibility = async () => {
      try {
        const { EarnScrollModule } = NativeModules;
        if (!EarnScrollModule) return;

        const enabled = await EarnScrollModule.isAccessibilityServiceEnabled();
        if (enabled) return;

        // Only prompt the disclosure screen once per install — the user can
        // re-trigger it from Settings if they decline now.
        const alreadyPrompted = await AsyncStorage.getItem('accessibility_disclosure_shown_v1');
        if (alreadyPrompted) return;
        await AsyncStorage.setItem('accessibility_disclosure_shown_v1', new Date().toISOString());

        router.push('/accessibility-disclosure');
      } catch {
        // Native module not available (e.g. Expo Go), skip silently
      }
    };

    checkAccessibility();
  }, [isReady, isAuthenticated, isGuest, hasCompletedOnboarding]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="go-pro" options={{ presentation: 'modal' }} />
        <Stack.Screen name="accessibility-disclosure" options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="delete-account" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <OfflineBanner />
      <ConsentPrompt />
      <StatusBar style={isDark ? "light" : "dark"} />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <AnalyticsProvider>
          <TimeBankProvider>
            <AppContent fontsLoaded={loaded} />
          </TimeBankProvider>
        </AnalyticsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
