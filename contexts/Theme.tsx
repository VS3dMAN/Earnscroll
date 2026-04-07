import { useState, useEffect, useCallback, useMemo } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { typography } from '@/constants/typography';
import { cloudyGrey, industrialBackground, industrialCard } from '@/constants/colors';

const THEME_KEY = '@theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

export type Theme = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  success: string;
  warning: string;
  danger: string;
  isDark: boolean;
  fonts: typeof typography.fontFamily;
};

const lightTheme: Theme = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  isDark: false,
  fonts: typography.fontFamily,
};

const darkTheme: Theme = {
  background: industrialBackground,
  card: industrialCard,
  text: '#F5F7FB',
  textSecondary: cloudyGrey,
  border: '#1F2535',
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  isDark: true,
  fonts: typography.fontFamily,
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() || 'light'
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadThemeMode = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored !== null && isMounted) {
          if (stored === 'light' || stored === 'dark' || stored === 'system') {
            setThemeMode(stored);
          } else {
            console.warn('Invalid theme mode in storage:', stored);
          }
        }
      } catch (error) {
        console.error('Failed to load theme mode:', error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    loadThemeMode();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (isMounted) {
        console.log('✓ System color scheme changed:', colorScheme);
        setSystemColorScheme(colorScheme || 'light');
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);



  const updateThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
      console.log('✓ Theme mode updated:', mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  }, []);

  const activeTheme = useMemo((): Theme => {
    let effectiveColorScheme: 'light' | 'dark' = 'light';

    if (themeMode === 'system') {
      effectiveColorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light');
    } else {
      effectiveColorScheme = themeMode as 'light' | 'dark';
    }

    return effectiveColorScheme === 'dark' ? darkTheme : lightTheme;
  }, [themeMode, systemColorScheme]);

  return useMemo(
    () => ({
      theme: activeTheme,
      themeMode,
      updateThemeMode,
      isHydrated,
    }),
    [activeTheme, themeMode, updateThemeMode, isHydrated]
  );
});

export const useThemeColor = (
  lightColor: string,
  darkColor: string
): string => {
  const context = useTheme();
  if (!context || !context.theme) {
    return lightColor;
  }
  return context.theme.isDark ? darkColor : lightColor;
};
