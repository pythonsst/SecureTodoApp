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
    await SecureStore.deleteItemAsync(SecureStore.KEYS.PIN_HASH);
    await SecureStore.deleteItemAsync(SecureStore.KEYS.SESSION_LAST_AUTH);
    await SecureStore.deleteItemAsync(SecureStore.KEYS.TODOS);
  },
};
