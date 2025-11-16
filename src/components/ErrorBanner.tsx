import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ErrorBannerProps {
  message: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  style,
  textStyle,
}) => {
  if (!message) return null;

  return (
    <View style={[styles.errorContainer, style]}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={[styles.errorText, textStyle]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#FFF5F5',
    padding: 14,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  errorText: {
    color: '#C53030',
    fontSize: 14,
    textAlign: 'left',
    flex: 1,
    fontWeight: '500',
  },
});
