// src/services/AuthenticationService.ts
import * as LocalAuthentication from 'expo-local-authentication';
import CryptoJS from 'crypto-js';
import { IAuthenticationService, AuthResult } from '../types';
import { SecureStorage } from '../utils/SecureStorage';

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

export class AuthenticationService implements IAuthenticationService {
  async authenticate(): Promise<AuthResult> {
    try {
      const isBiometricAvailable = await this.isAvailable();

      if (isBiometricAvailable) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to access your todos',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
          fallbackLabel: 'Use PIN',
        });

        if (result.success) {
          await this.markSessionAuthenticated();
          return { success: true };
        }

        if (result.error === 'user_cancel' || result.error === 'user_fallback') {
          return { success: false, error: 'PIN_REQUIRED' };
        }

        return { success: false, error: 'PIN_REQUIRED' };
      }

      return { success: false, error: 'PIN_REQUIRED' };
    } catch (e) {
      console.warn('Biometric auth failed:', e);
      return { success: false, error: 'PIN_REQUIRED' };
    }
  }

  async getSessionRemainingMs(): Promise<number> {
  const ts = await SecureStorage.getItem(SecureStorage.KEYS.SESSION_LAST_AUTH);
  if (!ts) return 0;

  const lastAuth = Number(ts);
  if (Number.isNaN(lastAuth)) return 0;

  const now = Date.now();
  const remaining = SESSION_DURATION_MS - (now - lastAuth);
  return remaining > 0 ? remaining : 0;
}


  async authenticateWithPin(pin: string): Promise<AuthResult> {
    try {
      if (!pin || pin.length < 4) {
        return { success: false, error: 'PIN must be at least 4 digits' };
      }

      const storedPinHash = await SecureStorage.getItem(SecureStorage.KEYS.PIN_HASH);

      if (!storedPinHash) {
        const pinHash = this.hashPin(pin);
        try {
          await SecureStorage.setItem(SecureStorage.KEYS.PIN_HASH, pinHash);
          await this.markSessionAuthenticated();
          return { success: true };
        } catch (err) {
          console.error('Failed to save PIN:', err);
          return { success: false, error: 'Failed to save PIN. Please try again.' };
        }
      }

      const inputHash = this.hashPin(pin);
      if (inputHash === storedPinHash) {
        await this.markSessionAuthenticated();
        return { success: true };
      }

      return { success: false, error: 'Incorrect PIN. Please try again.' };
    } catch (err) {
      console.error('PIN error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'PIN authentication failed',
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (err) {
      console.warn('Biometric availability check failed:', err);
      return false;
    }
  }

  private hashPin(pin: string): string {
    return CryptoJS.SHA256(pin).toString();
  }

  private async markSessionAuthenticated(): Promise<void> {
    const now = Date.now().toString();
    await SecureStorage.setItem(SecureStorage.KEYS.SESSION_LAST_AUTH, now);
  }

  async isSessionValid(): Promise<boolean> {
    const ts = await SecureStorage.getItem(SecureStorage.KEYS.SESSION_LAST_AUTH);
    if (!ts) return false;

    const lastAuth = Number(ts);
    if (Number.isNaN(lastAuth)) return false;

    return Date.now() - lastAuth < SESSION_DURATION_MS;
  }

  async logout(): Promise<void> {
    await SecureStorage.removeItem(SecureStorage.KEYS.SESSION_LAST_AUTH);
  }

  async isPinSet(): Promise<boolean> {
    const pinHash = await SecureStorage.getItem(SecureStorage.KEYS.PIN_HASH);
    return !!pinHash;
  }
}

const authenticationService = new AuthenticationService();
export default authenticationService;

