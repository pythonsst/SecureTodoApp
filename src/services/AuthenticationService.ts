// src/services/AuthenticationService.ts
import * as LocalAuthentication from 'expo-local-authentication';
import CryptoJS from 'crypto-js';
import { IAuthenticationService, AuthResult } from '../types';
import { SecureStorage } from '../utils/SecureStorage';

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

export class AuthenticationService implements IAuthenticationService {
  /**
   * Try biometric auth first (Face ID / Touch ID).
   * If unavailable or cancelled, caller should fall back to PIN flow.
   */
  async authenticate(): Promise<AuthResult> {
    try {
      const isBiometricAvailable = await this.isAvailable();

      if (isBiometricAvailable) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to access your todos',
          cancelLabel: 'Cancel',
          // Only biometrics here – do not show system passcode UI
          disableDeviceFallback: true,
        });

        if (result.success) {
          await this.markSessionAuthenticated();
          return { success: true };
        }

        // User cancelled / app moved to background / system cancelled:
        // we treat all of these as "go to PIN screen".
        if (
          result.error === 'user_cancel' ||
          result.error === 'system_cancel' ||
          result.error === 'app_cancel' ||
          result.error === 'user_fallback'
        ) {
          return { success: false, error: 'PIN_REQUIRED' };
        }

        // Any other biometric error → require PIN as well
        console.warn('Biometric auth error:', result.error);
        return { success: false, error: 'PIN_REQUIRED' };
      }

      // No biometrics enrolled or no hardware → require PIN
      return { success: false, error: 'PIN_REQUIRED' };
    } catch (e) {
      console.warn('Biometric auth failed:', e);
      return { success: false, error: 'PIN_REQUIRED' };
    }
  }

  /**
   * Remaining session time in ms (0 if expired / not authenticated).
   */
  async getSessionRemainingMs(): Promise<number> {
    const ts = await SecureStorage.getItem(SecureStorage.KEYS.SESSION_LAST_AUTH);
    if (!ts) return 0;

    const lastAuth = Number(ts);
    if (Number.isNaN(lastAuth)) return 0;

    const now = Date.now();
    const remaining = SESSION_DURATION_MS - (now - lastAuth);
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Authenticate using app PIN.
   * - First time: saves PIN hash.
   * - Next times: verifies against stored hash.
   */
  async authenticateWithPin(pin: string): Promise<AuthResult> {
    try {
      // 1) Validate length
      if (!pin || pin.length < 4) {
        return { success: false, error: 'PIN must be at least 4 digits' };
      }

      // 2) Read stored hash
      const storedPinHash = await SecureStorage.getItem(SecureStorage.KEYS.PIN_HASH);

      if (!storedPinHash) {
        // First time → save PIN
        const pinHash = this.hashPin(pin);
        await SecureStorage.setItem(SecureStorage.KEYS.PIN_HASH, pinHash);
        await this.markSessionAuthenticated();
        return { success: true };
      }

      // 3) Compare hash of input with stored hash
      const inputHash = this.hashPin(pin);
      if (inputHash === storedPinHash) {
        await this.markSessionAuthenticated();
        return { success: true };
      }

      // 4) Mismatch
      return { success: false, error: 'Incorrect PIN. Please try again.' };
    } catch (err) {
      console.error('PIN authentication error:', err);
      return {
        success: false,
        error:
          err instanceof Error ? err.message : 'PIN authentication failed. Please try again.',
      };
    }
  }

  /**
   * Check if any biometric auth is available (Face ID / Touch ID).
   */
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

  // ===== Session helpers =====

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
