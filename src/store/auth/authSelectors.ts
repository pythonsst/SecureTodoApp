// src/store/auth/authSelectors.ts
import { RootState } from '../index';

export const selectIsAuthenticated = (state: RootState): boolean =>
  state.auth.isAuthenticated;

// naming this "IsAuthenticating" but it maps to isLoading,
// so your old selector name still works
export const selectIsAuthenticating = (state: RootState): boolean =>
  state.auth.isLoading;

export const selectAuthError = (state: RootState): string | null =>
  state.auth.error;

export const selectRequiresPin = (state: RootState): boolean =>
  state.auth.requiresPin;
