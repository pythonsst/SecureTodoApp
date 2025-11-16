import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightLabel?: string;
  onRightPress?: () => void;
  style?: ViewStyle;
}

const COLORS = {
  white: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  primary: '#6366F1',
  primarySoft: '#EEF2FF',
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  rightLabel,
  onRightPress,
  style,
}) => {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {rightLabel && onRightPress && (
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onRightPress}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutText}>{rightLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
  },
  logoutText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
