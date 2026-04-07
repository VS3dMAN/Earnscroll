export const typography = {
  fontFamily: {
    ui: 'Inter_400Regular' as const,
    uiMedium: 'Inter_500Medium' as const,
    uiSemiBold: 'Inter_600SemiBold' as const,
    uiBold: 'Inter_700Bold' as const,
    mono: 'SpaceMono_400Regular' as const,
    monoBold: 'SpaceMono_700Bold' as const,
  },
};

export type TypographyFontFamily = keyof typeof typography.fontFamily;
