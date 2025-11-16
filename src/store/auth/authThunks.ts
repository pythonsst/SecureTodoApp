// src/store/auth/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import authenticationService from '../../services/AuthenticationService';
import { AuthResult } from '../../types';

// check existing session
export const checkSessionThunk = createAsyncThunk<boolean>(
  'auth/checkSession',
  async () => {
    return authenticationService.isSessionValid();
  },
);

// biometric auth (Face ID / Touch ID)
export const authenticateBiometricThunk = createAsyncThunk<
  AuthResult,
  void,
  { rejectValue: string }
>('auth/authenticateBiometric', async (_, { rejectWithValue }) => {
  const result = await authenticationService.authenticate();
  if (!result.success) {
    if (result.error === 'PIN_REQUIRED') {
      return { success: false, error: 'PIN_REQUIRED' };
    }
    return rejectWithValue(result.error ?? 'Biometric authentication failed');
  }
  return result;
});

// PIN auth
export const authenticatePinThunk = createAsyncThunk<
  AuthResult,
  string,
  { rejectValue: string }
>('auth/authenticatePin', async (pin, { rejectWithValue }) => {
  const result = await authenticationService.authenticateWithPin(pin);
  if (!result.success) {
    return rejectWithValue(result.error ?? 'PIN authentication failed');
  }
  return result;
});

// logout
export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await authenticationService.logout();
  return true;
});
