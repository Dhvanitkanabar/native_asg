import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, Radius } from '@/constants/theme';

interface AppBadgeProps {
  label: string;
  color: string;
  style?: any;
  textStyle?: any;
}

export function AppBadge({ label, color, style, textStyle }: AppBadgeProps) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: color + '15',
          borderColor: color + '30',
        },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.text,
          {
            color: color,
            fontFamily: Typography.fontFamily.bold,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  text: {
    fontSize: Typography.fontSize.xs - 1,
    textTransform: 'uppercase',
  },
});
