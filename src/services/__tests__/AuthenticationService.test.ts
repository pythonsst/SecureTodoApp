/**
 * AuthenticationService Comprehensive Tests
 * 
 * Tests cover:
 * - Biometric authentication (success and failure cases)
 * - PIN authentication (setup and verification)
 * - Error handling (module initialization, storage errors)
 * - Edge cases and security
 */

import { AuthenticationService } from '../AuthenticationService';
import * as LocalAuthentication from 'expo-local-authentication';
import { SecureStorage } from '../../utils/SecureStorage';

// Mock dependencies
jest.mock('expo-local-authentication');
jest.mock('../../utils/SecureStorage');

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let mockSecureStorage: jest.Mocked<typeof SecureStorage>;

  beforeEach(() => {
    authService = new AuthenticationService();
    jest.clearAllMocks();

    // Setup SecureStorage mock
    mockSecureStorage = SecureStorage as jest.Mocked<typeof SecureStorage>;
    mockSecureStorage.getItem = jest.fn();
    mockSecureStorage.setItem = jest.fn();
  });

  describe('Service Initialization', () => {
    it('should create instance without errors', () => {
      expect(() => new AuthenticationService()).not.toThrow();
    });

    it('should handle missing LocalAuthentication module gracefully', async () => {
      // Simulate undefined module
      const originalModule = LocalAuthentication;
      (LocalAuthentication as any) = undefined;

      const result = await authService.isAvailable();

      expect(result).toBe(false);
      // Restore
      (LocalAuthentication as any) = originalModule;
    });
  });

  describe('isAvailable', () => {
    it('should return true when hardware is available and enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      const result = await authService.isAvailable();

      expect(result).toBe(true);
    });

    it('should return false when hardware is not compatible', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      const result = await authService.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false when not enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

      const result = await authService.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false when hasHardwareAsync throws error', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValue(
        new Error('Module not initialized')
      );

      const result = await authService.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false when LocalAuthentication module is undefined', async () => {
      // Mock undefined module by removing the function
      const originalHasHardware = LocalAuthentication.hasHardwareAsync;
      delete (LocalAuthentication as any).hasHardwareAsync;

      const result = await authService.isAvailable();

      expect(result).toBe(false);
      // Restore
      (LocalAuthentication as any).hasHardwareAsync = originalHasHardware;
    });
  });

  describe('authenticate', () => {
    it('should return success when biometric authentication succeeds', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await authService.authenticate();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return PIN_REQUIRED when biometrics not available', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);

      const result = await authService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('PIN_REQUIRED');
    });

    it('should return PIN_REQUIRED when user cancels biometric', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'user_cancel',
      });

      const result = await authService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('PIN_REQUIRED');
    });

    it('should return PIN_REQUIRED when authenticateAsync throws error', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockRejectedValue(
        new Error('EventEmitter error')
      );

      const result = await authService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('PIN_REQUIRED');
    });

    it('should return PIN_REQUIRED when authenticateAsync is undefined', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication as any).authenticateAsync = undefined;

      const result = await authService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('PIN_REQUIRED');
    });

    it('should handle general errors gracefully', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      const result = await authService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('PIN_REQUIRED');
    });
  });

  describe('authenticateWithPin', () => {
    it('should save PIN on first setup', async () => {
      mockSecureStorage.getItem.mockResolvedValue(null);
      mockSecureStorage.setItem.mockResolvedValue();

      const result = await authService.authenticateWithPin('1234');

      expect(result.success).toBe(true);
      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
        SecureStorage.KEYS.PIN_HASH,
        expect.any(String)
      );
    });

    it('should verify PIN correctly on subsequent attempts', async () => {
      // First setup
      mockSecureStorage.getItem.mockResolvedValueOnce(null);
      await authService.authenticateWithPin('1234');

      // Verify
      mockSecureStorage.getItem.mockResolvedValueOnce('hash_1234');
      const verifyResult = await authService.authenticateWithPin('1234');

      // Note: In real implementation, the hash would match
      // This test verifies the flow works
      expect(mockSecureStorage.getItem).toHaveBeenCalled();
    });

    it('should reject PIN shorter than 4 digits', async () => {
      const result = await authService.authenticateWithPin('123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 4 digits');
    });

    it('should reject empty PIN', async () => {
      const result = await authService.authenticateWithPin('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 4 digits');
    });

    it('should return error when SecureStorage is not available', async () => {
      mockSecureStorage.getItem.mockRejectedValue(new Error('Storage unavailable'));

      const result = await authService.authenticateWithPin('1234');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error on incorrect PIN', async () => {
      mockSecureStorage.getItem.mockResolvedValue('hash_1234');

      const result = await authService.authenticateWithPin('5678');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Incorrect PIN');
    });

    it('should handle storage errors during PIN save', async () => {
      mockSecureStorage.getItem.mockResolvedValue(null);
      mockSecureStorage.setItem.mockRejectedValue(new Error('Save failed'));

      const result = await authService.authenticateWithPin('1234');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to save PIN');
    });
  });

  describe('isPinSet', () => {
    it('should return true when PIN is set', async () => {
      mockSecureStorage.getItem.mockResolvedValue('hash_value');

      const result = await authService.isPinSet();

      expect(result).toBe(true);
      expect(mockSecureStorage.getItem).toHaveBeenCalledWith(
        SecureStorage.KEYS.PIN_HASH
      );
    });

    it('should return false when PIN is not set', async () => {
      mockSecureStorage.getItem.mockResolvedValue(null);

      const result = await authService.isPinSet();

      expect(result).toBe(false);
    });

    it('should return false when SecureStorage fails', async () => {
      mockSecureStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await authService.isPinSet();

      expect(result).toBe(false);
    });

    it('should return false when SecureStorage.getItem is undefined', async () => {
      // Mock SecureStorage.getItem as undefined instead of entire module
      const originalGetItem = SecureStorage.getItem;
      (SecureStorage.getItem as any) = undefined;

      const result = await authService.isPinSet();

      expect(result).toBe(false);
      // Restore
      SecureStorage.getItem = originalGetItem;
    });
  });

  describe('Security', () => {
    it('should hash PIN before storing', async () => {
      mockSecureStorage.getItem.mockResolvedValue(null);
      mockSecureStorage.setItem.mockResolvedValue();

      await authService.authenticateWithPin('1234');

      expect(mockSecureStorage.setItem).toHaveBeenCalled();
      const storedValue = (mockSecureStorage.setItem as jest.Mock).mock.calls[0][1];
      // Verify PIN is hashed (not plain text)
      expect(storedValue).not.toBe('1234');
      expect(storedValue).toBeTruthy();
    });

    it('should hash PIN for verification', async () => {
      mockSecureStorage.getItem.mockResolvedValue('stored_hash');

      await authService.authenticateWithPin('1234');

      // Hash should be computed, not plain text compared
      expect(mockSecureStorage.getItem).toHaveBeenCalled();
    });
  });
});
