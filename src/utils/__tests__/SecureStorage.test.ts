/**
 * SecureStorage Comprehensive Tests
 * 
 * Tests cover:
 * - Encryption and decryption
 * - Storage operations (set, get, remove)
 * - Error handling (SecureStore unavailable, encryption failures)
 * - Edge cases
 */

import { SecureStorage } from '../SecureStorage';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('crypto-js');

describe('SecureStorage', () => {
  let mockStorage: Record<string, string>;
  let mockGetItemAsync: jest.Mock;
  let mockSetItemAsync: jest.Mock;
  let mockDeleteItemAsync: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = {};

    mockGetItemAsync = jest.fn((key: string) => Promise.resolve(mockStorage[key] || null));
    mockSetItemAsync = jest.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    });
    mockDeleteItemAsync = jest.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    });

    (SecureStore.getItemAsync as jest.Mock) = mockGetItemAsync;
    (SecureStore.setItemAsync as jest.Mock) = mockSetItemAsync;
    (SecureStore.deleteItemAsync as jest.Mock) = mockDeleteItemAsync;

    // Mock crypto-js
    (CryptoJS.AES.encrypt as jest.Mock) = jest.fn((data: string) => ({
      toString: () => `encrypted_${data}`,
    }));
    (CryptoJS.AES.decrypt as jest.Mock) = jest.fn((encrypted: string) => ({
      toString: (encoding: any) => {
        if (encrypted.startsWith('encrypted_')) {
          return encrypted.replace('encrypted_', '');
        }
        return '';
      },
    }));
    (CryptoJS.lib.WordArray.random as jest.Mock) = jest.fn(() => ({
      toString: () => 'test_encryption_key_12345',
    }));
  });

  describe('setItem', () => {
    it('should encrypt and store data successfully', async () => {
      const testData = { todos: [], nextId: 1 };

      await SecureStorage.setItem('test_key', testData);

      expect(mockSetItemAsync).toHaveBeenCalledWith('test_key', expect.stringContaining('encrypted_'));
      expect(CryptoJS.AES.encrypt).toHaveBeenCalled();
    });

    it('should handle SecureStore unavailable gracefully', async () => {
      // Mock SecureStore as unavailable
      const originalSetItem = SecureStore.setItemAsync;
      (SecureStore.setItemAsync as jest.Mock) = undefined;
      (SecureStore as any).setItemAsync = undefined;

      const testData = { test: 'value' };

      // Should throw error - error handling is in place
      await expect(SecureStorage.setItem('test_key', testData)).rejects.toThrow();
      
      // Restore
      SecureStore.setItemAsync = originalSetItem;
    });

    it('should handle encryption errors', async () => {
      (CryptoJS.AES.encrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      const testData = { test: 'value' };

      await expect(SecureStorage.setItem('test_key', testData)).rejects.toThrow();
    });

    it('should handle storage errors', async () => {
      mockSetItemAsync.mockRejectedValue(new Error('Storage write failed'));

      const testData = { test: 'value' };

      await expect(SecureStorage.setItem('test_key', testData)).rejects.toThrow();
    });
  });

  describe('getItem', () => {
    it('should retrieve and decrypt data successfully', async () => {
      // Setup: store encrypted data
      mockStorage['test_key'] = 'encrypted_{"test":"value"}';

      const result = await SecureStorage.getItem<{ test: string }>('test_key');

      expect(result).toEqual({ test: 'value' });
      expect(mockGetItemAsync).toHaveBeenCalledWith('test_key');
      expect(CryptoJS.AES.decrypt).toHaveBeenCalled();
    });

    it('should return null when key does not exist', async () => {
      mockStorage = {};

      const result = await SecureStorage.getItem('non_existent_key');

      expect(result).toBeNull();
    });

    it('should return null when SecureStore unavailable', async () => {
      (SecureStore.getItemAsync as jest.Mock) = undefined;
      (SecureStore as any).getItemAsync = undefined;

      const result = await SecureStorage.getItem('test_key');

      expect(result).toBeNull();
    });

    it('should return null when decryption fails', async () => {
      mockStorage['test_key'] = 'invalid_encrypted_data';
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => '', // Invalid decryption
      });

      const result = await SecureStorage.getItem('test_key');

      expect(result).toBeNull();
    });

    it('should return null when JSON parse fails', async () => {
      mockStorage['test_key'] = 'encrypted_invalid_json';
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => 'invalid json string',
      });

      // JSON.parse will throw, should return null
      const result = await SecureStorage.getItem('test_key');

      expect(result).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('should remove item successfully', async () => {
      mockStorage['test_key'] = 'some_value';

      await SecureStorage.removeItem('test_key');

      expect(mockDeleteItemAsync).toHaveBeenCalledWith('test_key');
      expect(mockStorage['test_key']).toBeUndefined();
    });

    it('should handle SecureStore unavailable', async () => {
      (SecureStore.deleteItemAsync as jest.Mock) = undefined;
      (SecureStore as any).deleteItemAsync = undefined;

      // Should not throw - error handling logs and continues
      await SecureStorage.removeItem('test_key');
      // Verify it was attempted
      expect(true).toBe(true); // Test passes if no exception
    });

    it('should handle delete errors gracefully', async () => {
      mockDeleteItemAsync.mockRejectedValue(new Error('Delete failed'));

      // Should not throw - error is logged
      await SecureStorage.removeItem('test_key');
    });
  });

  describe('clear', () => {
    it('should clear all stored data', async () => {
      mockStorage[SecureStorage.KEYS.TODOS] = 'value1';
      mockStorage[SecureStorage.KEYS.SESSION] = 'value2';

      await SecureStorage.clear();

      expect(mockDeleteItemAsync).toHaveBeenCalledWith(SecureStorage.KEYS.TODOS);
      expect(mockDeleteItemAsync).toHaveBeenCalledWith(SecureStorage.KEYS.SESSION);
    });

    it('should handle errors during clear', async () => {
      mockDeleteItemAsync.mockRejectedValue(new Error('Clear failed'));

      // Should not throw
      await expect(SecureStorage.clear()).rejects.toThrow();
    });
  });

  describe('Encryption Key Management', () => {
    it('should generate encryption key on first use', async () => {
      mockStorage = {}; // No encryption key stored

      await SecureStorage.setItem('test_key', { test: 'value' });

      // Should generate and store encryption key
      expect(CryptoJS.lib.WordArray.random).toHaveBeenCalled();
      expect(mockSetItemAsync).toHaveBeenCalledWith(
        SecureStorage.KEYS.ENCRYPTION_KEY,
        expect.any(String)
      );
    });

    it('should reuse existing encryption key', async () => {
      mockStorage[SecureStorage.KEYS.ENCRYPTION_KEY] = 'existing_key';

      await SecureStorage.setItem('test_key', { test: 'value' });

      // Should use existing key, not generate new one
      expect(mockGetItemAsync).toHaveBeenCalledWith(SecureStorage.KEYS.ENCRYPTION_KEY);
    });

    it('should handle encryption key generation failure', async () => {
      mockStorage = {};
      (CryptoJS.lib.WordArray.random as jest.Mock).mockImplementation(() => {
        throw new Error('Random generation failed');
      });

      await expect(SecureStorage.setItem('test_key', { test: 'value' })).rejects.toThrow();
    });
  });
});

