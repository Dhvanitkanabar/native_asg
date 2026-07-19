import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Animations } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: any;
  textStyle?: any;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: AppButtonProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scale, {
      toValue: Animations.scaleOnPress,
      useNativeDriver: true,
      ...Animations.spring,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      ...Animations.spring,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={[
          styles.base,
          isOutline && { borderColor: theme.border, borderWidth: 1.5, backgroundColor: 'transparent' },
          isSecondary && { backgroundColor: theme.surface },
          isDanger && { backgroundColor: theme.danger },
          isGhost && { backgroundColor: 'transparent' },
          (disabled || loading) && { opacity: 0.5 },
        ]}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        
        {loading ? (
          <ActivityIndicator color={isOutline || isGhost || isSecondary ? theme.primary : '#fff'} />
        ) : (
          <React.Fragment>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text
              style={[
                styles.text,
                {
                  color: isOutline || isGhost
                    ? theme.primary
                    : isSecondary
                    ? theme.text
                    : '#fff',
                  fontFamily: Typography.fontFamily.semiBold,
                  fontSize: Typography.fontSize.md,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </React.Fragment>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
    paddingHorizontal: Spacing.xl,
  },
  text: {
    textAlign: 'center',
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
});
