import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { STRINGS } from '../constants/strings';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  error?: string | null;
  isSettingUp?: boolean;
  onCancel?: () => void;
}

export const PinInput: React.FC<PinInputProps> = ({
  length = 4,
  onComplete,
  error,
  isSettingUp = false,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (error) {
      setPin('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [error]);

  const handlePinChange = (text: string) => {
    const digitsOnly = text.replace(/[^0-9]/g, '');
    if (digitsOnly.length <= length) {
      setPin(digitsOnly);
      if (digitsOnly.length === length) {
        Keyboard.dismiss();
        setTimeout(() => onComplete(digitsOnly), 100);
      }
    }
  };

  const renderPinDots = () => (
    <View style={styles.dotsContainer}>
      {Array.from({ length }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index < pin.length && styles.dotFilled,
            error && styles.dotError,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isSettingUp ? STRINGS.pin.createTitle : STRINGS.pin.enterTitle}
      </Text>
      <Text style={styles.subtitle}>
        {isSettingUp ? STRINGS.pin.createSubtitle : STRINGS.pin.enterSubtitle}
      </Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.dotsWrapper}>{renderPinDots()}</View>

      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={pin}
        onChangeText={handlePinChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
        secureTextEntry={false}
        selectTextOnFocus
      />

      {onCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>{STRINGS.pin.cancel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#718096',
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 21,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 32,
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
    flex: 1,
    fontWeight: '500',
  },
  dotsWrapper: {
    marginBottom: 40,
    paddingVertical: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  dotFilled: {
    backgroundColor: '#667EEA',
    borderColor: '#667EEA',
    transform: [{ scale: 1.1 }],
  },
  dotError: {
    borderColor: '#FC8181',
    backgroundColor: '#FFF5F5',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#667EEA',
    fontSize: 16,
    fontWeight: '600',
  },
});
