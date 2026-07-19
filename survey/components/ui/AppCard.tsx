import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AppCardProps {
  children: React.ReactNode;
  style?: any;
  variant?: 'default' | 'elevated' | 'glass';
}

export function AppCard({ children, style, variant = 'default' }: AppCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const isElevated = variant === 'elevated';
  const isGlass = variant === 'glass';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isGlass ? theme.glassBackground : theme.surfaceElevated,
          borderColor: isGlass ? theme.glassBorder : theme.border,
          borderWidth: isGlass ? 1.5 : 1,
        },
        isElevated && Shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
});
