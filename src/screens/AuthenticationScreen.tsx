import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

import { Button } from '../components/Button';
import { PinInput } from '../components/PinInput';
import { useAppDispatch, useAppSelector } from '../store/hooks';

import {
  authenticateBiometricThunk,
  authenticatePinThunk,
} from '../store/auth/authThunks';

import {
  selectAuthError,
  selectIsAuthenticating,
  selectRequiresPin,
} from '../store/auth/authSelectors';

import authenticationService from '../services/AuthenticationService';
import { STRINGS } from '../constants/strings';

export const AuthenticationScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticating = useAppSelector(selectIsAuthenticating);
  const authError = useAppSelector(selectAuthError);
  const requiresPin = useAppSelector(selectRequiresPin);

  const [showPinInput, setShowPinInput] = useState(false);
  const [isSettingUpPin, setIsSettingUpPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    const checkPin = async () => {
      const exists = await authenticationService.isPinSet();
      setIsSettingUpPin(!exists);
    };
    checkPin();
  }, []);

  useEffect(() => {
    setShowPinInput(requiresPin);
  }, [requiresPin]);

  useEffect(() => {
    if (authError) {
      Alert.alert(STRINGS.auth.alertFailedTitle, authError);
    }
  }, [authError]);

  const handleAuthenticate = async () => {
    setPinError(null);
    try {
      await dispatch(authenticateBiometricThunk()).unwrap();
    } catch {}
  };

  const handlePinComplete = async (pin: string) => {
    setPinError(null);
    try {
      await dispatch(authenticatePinThunk(pin)).unwrap();
      setShowPinInput(false);

      if (isSettingUpPin) {
        const exists = await authenticationService.isPinSet();
        setIsSettingUpPin(!exists);
      }
    } catch (e) {
      const message =
        typeof e === 'string'
          ? e
          : e instanceof Error
          ? e.message
          : STRINGS.errors.generic;
      setPinError(message);
    }
  };

  const handleCancelPin = () => {
    setShowPinInput(false);
    setPinError(null);
  };

  if (showPinInput) {
    return (
      <View style={styles.container}>
        <View style={styles.gradientTop} />
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: '#FFF5E6', borderColor: '#FFE5B4' },
              ]}
            >
              <Text style={styles.icon}>🔐</Text>
            </View>
          </View>

          <PinInput
            onComplete={handlePinComplete}
            error={pinError}
            isSettingUp={isSettingUpPin}
            onCancel={handleCancelPin}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gradientTop} />
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🔒</Text>
          </View>
        </View>

        <Text style={styles.title}>{STRINGS.auth.title}</Text>
        <Text style={styles.subtitle}>{STRINGS.auth.subtitle}</Text>

        <Button
          title={isAuthenticating ? STRINGS.auth.authenticating : STRINGS.auth.authenticate}
          onPress={handleAuthenticate}
          loading={isAuthenticating}
          style={styles.button}
        />

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>{STRINGS.auth.info}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: '#667EEA',
    opacity: 0.08,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    zIndex: 1,
  },
  iconWrapper: { marginBottom: 32 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E0E8FF',
  },
  icon: { fontSize: 48 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 40,
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    marginBottom: 24,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  infoCard: {
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  infoIcon: { fontSize: 20, marginRight: 12 },
  infoText: {
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
    fontWeight: '500',
  },
});
