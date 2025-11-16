// src/utils/SecureStorage.ts
import * as SecureStore from 'expo-secure-store';

export const SecureStorage = {
  KEYS: {
    PIN_HASH: 'PIN_HASH',
    SESSION_LAST_AUTH: 'SESSION_LAST_AUTH',
    TODOS: 'TODOS',
  },

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(SecureStorage.KEYS.PIN_HASH),
      SecureStore.deleteItemAsync(SecureStorage.KEYS.SESSION_LAST_AUTH),
      SecureStore.deleteItemAsync(SecureStorage.KEYS.TODOS),
    ]);
  },
};
