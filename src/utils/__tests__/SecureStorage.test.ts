// src/utils/__tests__/SecureStorage.test.ts
import { SecureStorage } from '../SecureStorage';

// Mock expo-secure-store so Jest never touches native code
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

describe('SecureStorage', () => {
  const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('setItem delegates to SecureStore.setItemAsync', async () => {
    mockSecureStore.setItemAsync.mockResolvedValue(undefined as any);

    await SecureStorage.setItem(SecureStorage.KEYS.TODOS, 'test-value');

    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
      SecureStorage.KEYS.TODOS,
      'test-value',
    );
  });

  it('getItem delegates to SecureStore.getItemAsync and returns value', async () => {
    mockSecureStore.getItemAsync.mockResolvedValue('stored-value');

    const result = await SecureStorage.getItem(SecureStorage.KEYS.PIN_HASH);

    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(
      SecureStorage.KEYS.PIN_HASH,
    );
    expect(result).toBe('stored-value');
  });

  it('removeItem delegates to SecureStore.deleteItemAsync', async () => {
    mockSecureStore.deleteItemAsync.mockResolvedValue(undefined as any);

    await SecureStorage.removeItem(SecureStorage.KEYS.SESSION_LAST_AUTH);

    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
      SecureStorage.KEYS.SESSION_LAST_AUTH,
    );
  });

  it('clear removes PIN_HASH, SESSION_LAST_AUTH and TODOS', async () => {
    mockSecureStore.deleteItemAsync.mockResolvedValue(undefined as any);

    await SecureStorage.clear();

    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
      SecureStorage.KEYS.PIN_HASH,
    );
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
      SecureStorage.KEYS.SESSION_LAST_AUTH,
    );
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
      SecureStorage.KEYS.TODOS,
    );
  });
});
