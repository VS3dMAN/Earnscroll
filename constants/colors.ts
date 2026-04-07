export const cloudyGrey = '#E0E5EE';
export const cloudyGreyMuted = '#B8C0CE';
export const industrialBackground = '#090F1B';
export const industrialCard = '#141B2B';

export const lightTheme = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  primary: '#3B82F6',
  cyan: '#22D3EE',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  gold: '#FFD700',
  voltageGreen: '#84CC16',
};

export const darkTheme = {
  background: industrialBackground,
  card: industrialCard,
  text: '#F5F7FB',
  textSecondary: cloudyGrey,
  border: '#1F2535',
  primary: '#3B82F6',
  cyan: '#22D3EE',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  gold: '#FFD700',
  voltageGreen: '#84CC16',
};

export const colors = {
  primary: '#3B82F6',
  secondary: '#22D3EE',
  accent: '#FF6B9D',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F5F7FA',
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      disabled: '#94A3B8',
      inverse: '#FFFFFF',
    },
    border: {
      light: '#E2E8F0',
      medium: '#CBD5E0',
      dark: '#94A3B8',
    },
  },
  
  dark: {
    background: industrialBackground,
    surface: industrialCard,
    surfaceAlt: '#1C2435',
    text: {
      primary: '#F5F7FB',
      secondary: cloudyGrey,
      disabled: cloudyGreyMuted,
      inverse: '#0F172A',
    },
    border: {
      light: '#1F2535',
      medium: '#2B3243',
      dark: '#3A4255',
    },
  },
  
  shadow: {
    sm: 'rgba(0, 0, 0, 0.05)',
    md: 'rgba(0, 0, 0, 0.1)',
    lg: 'rgba(0, 0, 0, 0.15)',
  },
};

const tintColorLight = colors.primary;
const tintColorDark = colors.secondary;

export default {
  light: {
    text: colors.light.text.primary,
    background: colors.light.background,
    tint: tintColorLight,
    tabIconDefault: colors.light.text.disabled,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: colors.dark.text.primary,
    background: colors.dark.background,
    tint: tintColorDark,
    tabIconDefault: colors.dark.text.disabled,
    tabIconSelected: tintColorDark,
  },
};
