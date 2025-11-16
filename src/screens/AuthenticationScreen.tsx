/**
 * Authentication Screen
 * 
 * Screen that handles user authentication using biometric authentication with PIN fallback.
 * Functional component following React best practices.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { PinInput } from '../components/PinInput';

/**
 * AuthenticationScreen component
 * Displays authentication UI and handles authentication flow
 * Supports both biometric and PIN authentication
 */
export const AuthenticationScreen: React.FC = () => {
  const { authenticate, authenticateWithPin, isAuthenticating, isPinSet } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPinInput, setShowPinInput] = useState<boolean>(false);
  const [isSettingUpPin, setIsSettingUpPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);

  /**
   * Check if PIN is set on mount and handle initial state
   */
  useEffect(() => {
    const checkPinStatus = async () => {
      try {
        const pinExists = await isPinSet();
        console.log('PIN exists:', pinExists);
        // If no PIN exists, we'll need to set it up when user tries to authenticate
        if (!pinExists) {
          setIsSettingUpPin(true);
        } else {
          // PIN exists, so we'll ask for it when needed
          setIsSettingUpPin(false);
        }
      } catch (error) {
        console.error('Error checking PIN status:', error);
        // If check fails, assume PIN is not set
        setIsSettingUpPin(true);
      }
    };
    checkPinStatus();
  }, [isPinSet]);

  /**
   * Handles authentication button press
   */
  const handleAuthenticate = async () => {
    setError(null);
    setPinError(null);
    const result = await authenticate();

    if (result.success) {
      setShowPinInput(false);
      return;
    }

    // If PIN is required, show PIN input
    if (result.error === 'PIN_REQUIRED') {
      setShowPinInput(true);
      // Check if PIN needs to be set up
      const pinExists = await isPinSet();
      setIsSettingUpPin(!pinExists);
    } else if (result.error) {
      setError(result.error);
      Alert.alert('Authentication Failed', result.error, [{ text: 'OK' }]);
    }
  };

  /**
   * Handles PIN completion
   */
  const handlePinComplete = async (pin: string) => {
    setPinError(null);
    console.log('PIN entered, setting up:', isSettingUpPin);
    
    try {
      const result = await authenticateWithPin(pin);

      if (result.success) {
        console.log('PIN authentication successful');
        setShowPinInput(false);
        setError(null);
        // After successful PIN setup, mark it as no longer in setup mode
        if (isSettingUpPin) {
          setIsSettingUpPin(false);
          // Verify PIN was saved
          const pinExists = await isPinSet();
          console.log('PIN saved, exists:', pinExists);
        }
      } else {
        console.error('PIN authentication failed:', result.error);
        setPinError(result.error || 'PIN authentication failed');
      }
    } catch (error) {
      console.error('Error in handlePinComplete:', error);
      setPinError('An error occurred. Please try again.');
    }
  };

  /**
   * Handles canceling PIN input
   */
  const handleCancelPin = () => {
    setShowPinInput(false);
    setPinError(null);
    setIsSettingUpPin(false);
  };

  // Show PIN input if required
  if (showPinInput) {
    return (
      <View style={styles.container}>
        <View style={styles.gradientTop} />
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF5E6', borderColor: '#FFE5B4' }]}>
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

  // Show biometric authentication
  return (
    <View style={styles.container}>
      <View style={styles.gradientTop} />
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🔒</Text>
          </View>
        </View>
        
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Secure your todos with authentication
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          title={isAuthenticating ? "Authenticating..." : "Authenticate"}
          onPress={handleAuthenticate}
          loading={isAuthenticating}
          style={styles.button}
        />

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Use Face ID, Touch ID, or PIN to unlock
          </Text>
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
  iconWrapper: {
    marginBottom: 32,
  },
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
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 40,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
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
    textAlign: 'center',
    flex: 1,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    marginBottom: 24,
    shadowColor: '#667EEA',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
});


