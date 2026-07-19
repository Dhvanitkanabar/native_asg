import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export function AppHeader({
  title,
  showBack = false,
  onBackPress,
  rightAction,
}: AppHeaderProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
      {showBack ? (
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyLeft} />
      )}
      <Text
        style={[
          styles.title,
          {
            color: theme.text,
            fontFamily: Typography.fontFamily.bold,
            fontSize: Typography.fontSize.xl,
          },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {rightAction ? (
        <View style={styles.rightActionContainer}>{rightAction}</View>
      ) : (
        <View style={styles.emptyRight} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  rightActionContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  emptyLeft: {
    width: 40,
  },
  emptyRight: {
    width: 40,
  },
});
