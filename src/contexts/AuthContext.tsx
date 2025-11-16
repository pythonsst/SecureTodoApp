/**
 * Authentication Context
 *
 * Provides authentication state, session timing, and methods throughout the app.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { IAuthenticationService, AuthResult } from '../types';
import authenticationService from '../services/AuthenticationService';

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authenticate: () => Promise<AuthResult>;
  authenticateWithPin: (pin: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  isPinSet: () => Promise<boolean>;
  /** milliseconds remaining in current session, null if no active session */
  sessionRemainingMs: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  authService?: IAuthenticationService; // optional override for tests
}

const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  authService,
}) => {
  // choose which service instance to use
  const service: IAuthenticationService =
    authService ?? (authenticationService as IAuthenticationService);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [sessionRemainingMs, setSessionRemainingMs] = useState<number | null>(
    null
  );

  /**
   * Helper: refresh session remaining time and update auth state
   */
  const refreshSession = useCallback(async () => {
    if (!service.getSessionRemainingMs || !service.isSessionValid) {
      // If service is not yet extended with session helpers, skip
      return;
    }

    const isValid = await service.isSessionValid();
    if (!isValid) {
      setIsAuthenticated(false);
      setSessionRemainingMs(null);
      return;
    }

    const remaining = await service.getSessionRemainingMs();
    setIsAuthenticated(true);
    setSessionRemainingMs(remaining);
  }, [service]);

  /**
   * On mount: check if a previous session is still valid
   */
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  /**
   * Tick every second to update countdown and auto-logout when expired
   */
  useEffect(() => {
    if (!service.getSessionRemainingMs || !service.isSessionValid) {
      return;
    }

    const interval = setInterval(async () => {
      const remaining = await service.getSessionRemainingMs();
      if (remaining === null) {
        setSessionRemainingMs(null);
        setIsAuthenticated(false);
        return;
      }

      if (remaining <= 0) {
        // session expired → logout
        await service.logout?.();
        setIsAuthenticated(false);
        setSessionRemainingMs(null);
      } else {
        setSessionRemainingMs(remaining);
        setIsAuthenticated(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [service]);

  /**
   * Biometric authentication
   */
  const authenticate = useCallback(async (): Promise<AuthResult> => {
    setIsAuthenticating(true);
    try {
      const result = await service.authenticate();
      if (result.success) {
        setIsAuthenticated(true);
        // after successful auth refresh session timer
        await refreshSession();
      }
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  }, [service, refreshSession]);

  /**
   * PIN authentication
   */
  const authenticateWithPin = useCallback(
    async (pin: string): Promise<AuthResult> => {
      setIsAuthenticating(true);
      try {
        const result = await service.authenticateWithPin(pin);
        if (result.success) {
          setIsAuthenticated(true);
          await refreshSession();
        }
        return result;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [service, refreshSession]
  );

  /**
   * Check if PIN is already configured
   */
  const isPinSet = useCallback(async (): Promise<boolean> => {
    return service.isPinSet();
  }, [service]);

  /**
   * Logout: clear state and session on the service side
   */
  const logout = useCallback(async () => {
    setIsAuthenticated(false);
    setSessionRemainingMs(null);
    if (service.logout) {
      await service.logout();
    }
  }, [service]);

  const value: AuthContextType = {
    isAuthenticated,
    isAuthenticating,
    authenticate,
    authenticateWithPin,
    logout,
    isPinSet,
    sessionRemainingMs,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
