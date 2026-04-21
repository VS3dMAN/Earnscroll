import { useEffect } from 'react';
import { Stack, useSegments, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, Alert, NativeModules } from 'react-native';
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
    if (Platform.OS !== 'android') return;

    const checkAccessibility = async () => {
      try {
        const { EarnScrollModule } = NativeModules;
        if (!EarnScrollModule) return;

        const enabled = await EarnScrollModule.isAccessibilityServiceEnabled();
        if (!enabled) {
          Alert.alert(
            'Enable App Blocker',
            'EarnScroll needs accessibility access to block distracting apps when your time runs out. Please enable "EarnScroll" in the next screen.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => EarnScrollModule.openAccessibilitySettings(),
              },
            ]
          );
        }
      } catch (e) {
        // Native module not available (e.g. Expo Go), skip silently
      }
    };

    checkAccessibility();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="go-pro" options={{ presentation: 'modal' }} />
      </Stack>
      <OfflineBanner />
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
        <TimeBankProvider>
          <AppContent fontsLoaded={loaded} />
        </TimeBankProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
