import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerStyle?: any;
}

export function AppInput({
  label,
  error,
  icon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: AppInputProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: theme.text,
              fontFamily: Typography.fontFamily.semiBold,
              fontSize: Typography.fontSize.sm,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surface,
            borderColor: error
              ? theme.danger
              : isFocused
              ? theme.primary
              : theme.border,
            borderWidth: 1.5,
          },
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              fontFamily: Typography.fontFamily.medium,
              fontSize: Typography.fontSize.md,
            },
            style,
          ]}
          placeholderTextColor={theme.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label || props.placeholder}
          accessibilityHint={error || undefined}
          {...props}
        />
      </View>
      {error && (
        <Text
          style={[
            styles.error,
            {
              color: theme.danger,
              fontFamily: Typography.fontFamily.medium,
              fontSize: Typography.fontSize.xs,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
  },
  error: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
