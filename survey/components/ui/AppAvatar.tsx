import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Typography, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AppAvatarProps {
  photoUri?: string | null;
  name?: string;
  size?: number;
  showIndicator?: boolean;
  indicatorColor?: string;
}

export function AppAvatar({
  photoUri,
  name = 'User',
  size = 48,
  showIndicator = false,
  indicatorColor = '#10B981',
}: AppAvatarProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const radius = size / 2;
  const initials = name ? name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={{ width: size, height: size, borderRadius: radius }}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: theme.primary + '18',
            },
          ]}
        >
          <Text
            style={{
              color: theme.primary,
              fontFamily: Typography.fontFamily.bold,
              fontSize: size * 0.42,
            }}
          >
            {initials}
          </Text>
        </View>
      )}
      {showIndicator && (
        <View
          style={[
            styles.indicator,
            {
              backgroundColor: indicatorColor,
              borderColor: theme.background,
              width: Math.max(size * 0.25, 10),
              height: Math.max(size * 0.25, 10),
              borderRadius: Radius.full,
              borderWidth: size * 0.05,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
