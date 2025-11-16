// src/store/auth/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  authenticateBiometricThunk,
  authenticatePinThunk,
  checkSessionThunk,
  logoutThunk,
} from './authThunks';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;          // generic loading state
  error: string | null;
  requiresPin: boolean;        // whether to show PIN screen
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  requiresPin: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    forcePin(state) {
      state.requiresPin = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // check session
    builder
      .addCase(checkSessionThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkSessionThunk.fulfilled, (state, action: PayloadAction<boolean>) => {
        state.isLoading = false;
        state.isAuthenticated = action.payload;
        if (!action.payload) {
          state.requiresPin = false;
        }
      })
      .addCase(checkSessionThunk.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });

    // biometric auth
    builder
      .addCase(authenticateBiometricThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(authenticateBiometricThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.isAuthenticated = true;
          state.requiresPin = false;
        } else if (action.payload.error === 'PIN_REQUIRED') {
          state.isAuthenticated = false;
          state.requiresPin = true;
        }
      })
      .addCase(authenticateBiometricThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload ?? 'Biometric authentication failed';
      });

    // PIN auth
    builder
      .addCase(authenticatePinThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(authenticatePinThunk.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.requiresPin = false;
      })
      .addCase(authenticatePinThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.requiresPin = true;
        state.error = action.payload ?? 'PIN authentication failed';
      });

    // logout
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.requiresPin = false;
      state.error = null;
      state.isLoading = false;
    });
  },
});

export const { clearAuthError, forcePin } = authSlice.actions;
export default authSlice.reducer;
