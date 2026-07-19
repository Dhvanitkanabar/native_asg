import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#6366F1',      // Indigo-500
    primaryDark: '#4F46E5',  // Indigo-600
    primaryLight: '#818CF8', // Indigo-400
    accent: '#06B6D4',       // Cyan-500
    accentDark: '#0891B2',   // Cyan-600
    accentLight: '#22D3EE',  // Cyan-400
    
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceElevated: '#FFFFFF',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    critical: '#DC2626',
    
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#6366F1',
    tint: '#6366F1',
    
    glassBackground: 'rgba(255, 255, 255, 0.75)',
    glassBorder: 'rgba(226, 232, 240, 0.6)',
  },
  dark: {
    primary: '#818CF8',      // Indigo-400
    primaryDark: '#6366F1',  // Indigo-500
    primaryLight: '#A5B4FC', // Indigo-300
    accent: '#22D3EE',       // Cyan-400
    accentDark: '#06B6D4',   // Cyan-500
    accentLight: '#67E8F9',  // Cyan-300
    
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    border: '#334155',
    borderLight: '#1E293B',
    
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    critical: '#EF4444',
    
    tabIconDefault: '#64748B',
    tabIconSelected: '#818CF8',
    tint: '#818CF8',
    
    glassBackground: 'rgba(30, 41, 59, 0.75)',
    glassBorder: 'rgba(51, 65, 85, 0.6)',
  },
};

export const Typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    black: 'Inter_900Black',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    h1: 32,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    h1: 42,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 26,
  full: 9999,
};

export const Shadows = Platform.select({
  ios: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 },
    colored: (color: string) => ({ shadowColor: color, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 }),
  },
  default: {
    sm: { elevation: 1 },
    md: { elevation: 4 },
    lg: { elevation: 8 },
    colored: () => ({ elevation: 6 }),
  },
});

export const Animations = {
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 0.8,
  },
  scaleOnPress: 0.96,
};

export const GlobalStyles = {
  flexRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  center: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  glassCard: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
  },
};
