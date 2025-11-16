import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface EmptyStateProps {
  title: string;
  message: string;
  emoji?: string;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  emoji = '📝',
  style,
}) => {
  return (
    <View style={[styles.emptyContainer, style]}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIcon}>{emoji}</Text>
      </View>
      <Text style={styles.emptyText}>{title}</Text>
      <Text style={styles.emptySubtext}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
