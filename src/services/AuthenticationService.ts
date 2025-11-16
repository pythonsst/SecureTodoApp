// src/services/AuthenticationService.ts
import * as LocalAuthentication from 'expo-local-authentication';
import CryptoJS from 'crypto-js';
import { IAuthenticationService, AuthResult } from '../types';
import { SecureStorage } from '../utils/SecureStorage';
import { STRINGS } from '../constants/strings';

const SESSION_DURATION_MS = 60 * 60 * 1000;

export class AuthenticationService implements IAuthenticationService {
  async authenticate(): Promise<AuthResult> {
    try {
      const available = await this.isAvailable();
      if (available) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: STRINGS.auth.authenticateBtn,
          cancelLabel: STRINGS.todos.cancel,
          disableDeviceFallback: true,
        });

        if (result.success) {
          await this.markSessionAuthenticated();
          return { success: true };
        }

        return { success: false, error: STRINGS.auth.pinRequired };
      }

      return { success: false, error: STRINGS.auth.pinRequired };
    } catch {
      return { success: false, error: STRINGS.auth.pinRequired };
    }
  }

  async authenticateWithPin(pin: string): Promise<AuthResult> {
    if (!pin || pin.length < 4) {
      return { success: false, error: STRINGS.auth.pinErrorLength };
    }

    const stored = await SecureStorage.getItem(SecureStorage.KEYS.PIN_HASH);

    if (!stored) {
      const hash = this.hashPin(pin);
      await SecureStorage.setItem(SecureStorage.KEYS.PIN_HASH, hash);
      await this.markSessionAuthenticated();
      return { success: true };
    }

    const inputHash = this.hashPin(pin);
    if (inputHash === stored) {
      await this.markSessionAuthenticated();
      return { success: true };
    }

    return { success: false, error: STRINGS.auth.pinErrorIncorrect };
  }

  async getSessionRemainingMs(): Promise<number> {
    const ts = await SecureStorage.getItem(SecureStorage.KEYS.SESSION_LAST_AUTH);
    if (!ts) return 0;
    const elapsed = Date.now() - Number(ts);
    return Math.max(SESSION_DURATION_MS - elapsed, 0);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const hardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return hardware && enrolled;
    } catch {
      return false;
    }
  }

  private hashPin(pin: string) {
    return CryptoJS.SHA256(pin).toString();
  }

  private async markSessionAuthenticated() {
    await SecureStorage.setItem(
      SecureStorage.KEYS.SESSION_LAST_AUTH,
      Date.now().toString(),
    );
  }

  async isSessionValid(): Promise<boolean> {
    const ts = await SecureStorage.getItem(SecureStorage.KEYS.SESSION_LAST_AUTH);
    if (!ts) return false;
    return Date.now() - Number(ts) < SESSION_DURATION_MS;
  }

  async logout(): Promise<void> {
    await SecureStorage.removeItem(SecureStorage.KEYS.SESSION_LAST_AUTH);
  }

  async isPinSet(): Promise<boolean> {
    const pin = await SecureStorage.getItem(SecureStorage.KEYS.PIN_HASH);
    return !!pin;
  }
}

export default new AuthenticationService();
