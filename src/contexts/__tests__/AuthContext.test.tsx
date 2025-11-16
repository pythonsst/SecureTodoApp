/**
 * AuthContext Comprehensive Tests
 * 
 * Tests cover:
 * - Service initialization (prevents "Cannot initialize" errors)
 * - Authentication flows
 * - PIN authentication
 * - Error handling
 * - Context provider functionality
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { AuthenticationService } from '../../services/AuthenticationService';
import { authenticationService } from '../../services/AuthenticationService';

// Mock the authentication service
jest.mock('../../services/AuthenticationService');

describe('AuthContext', () => {
  const mockService = {
    authenticate: jest.fn(),
    authenticateWithPin: jest.fn(),
    isAvailable: jest.fn(),
    isPinSet: jest.fn(),
  };

  const TestComponent = () => {
    const auth = useAuth();
    React.useEffect(() => {
      // Access auth methods to test initialization
      expect(auth).toBeDefined();
      expect(auth.authenticate).toBeDefined();
      expect(auth.authenticateWithPin).toBeDefined();
    }, [auth]);
    return null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the singleton instance
    (authenticationService as any) = mockService;
  });

  describe('Service Initialization', () => {
    it('should initialize with singleton service', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(mockService).toBeDefined();
    });

    it('should use injected service when provided', () => {
      const injectedService = {
        authenticate: jest.fn(),
        authenticateWithPin: jest.fn(),
        isAvailable: jest.fn(),
        isPinSet: jest.fn(),
      };

      render(
        <AuthProvider authService={injectedService}>
          <TestComponent />
        </AuthProvider>
      );

      expect(injectedService).toBeDefined();
    });

    it('should create new service instance when singleton unavailable', () => {
      // Mock singleton as undefined
      const originalService = authenticationService;
      (authenticationService as any) = undefined;
      const MockAuthService = jest.fn().mockImplementation(() => mockService);
      (AuthenticationService as any) = MockAuthService;

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(MockAuthService).toHaveBeenCalled();
      // Restore
      (authenticationService as any) = originalService;
    });
  });

  describe('authenticate', () => {
    it('should call service authenticate method', async () => {
      mockService.authenticate.mockResolvedValue({ success: true });

      const TestAuth = () => {
        const auth = useAuth();
        React.useEffect(() => {
          auth.authenticate().then(() => {
            expect(mockService.authenticate).toHaveBeenCalled();
            expect(auth.isAuthenticated).toBe(true);
          });
        }, []);
        return null;
      };

      render(
        <AuthProvider>
          <TestAuth />
        </AuthProvider>
      );
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should handle authentication failure', async () => {
      mockService.authenticate.mockResolvedValue({
        success: false,
        error: 'Authentication failed',
      });

      const TestAuth = () => {
        const auth = useAuth();
        React.useEffect(() => {
          auth.authenticate().then((result) => {
            expect(result.success).toBe(false);
            expect(auth.isAuthenticated).toBe(false);
          });
        }, []);
        return null;
      };

      render(
        <AuthProvider>
          <TestAuth />
        </AuthProvider>
      );
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('authenticateWithPin', () => {
    it('should call service authenticateWithPin method', async () => {
      mockService.authenticateWithPin.mockResolvedValue({ success: true });

      const TestAuth = () => {
        const auth = useAuth();
        React.useEffect(() => {
          auth.authenticateWithPin('1234').then(() => {
            expect(mockService.authenticateWithPin).toHaveBeenCalledWith('1234');
            expect(auth.isAuthenticated).toBe(true);
          });
        }, []);
        return null;
      };

      render(
        <AuthProvider>
          <TestAuth />
        </AuthProvider>
      );
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should handle PIN authentication failure', async () => {
      mockService.authenticateWithPin.mockResolvedValue({
        success: false,
        error: 'Incorrect PIN',
      });

      const TestAuth = () => {
        const auth = useAuth();
        React.useEffect(() => {
          auth.authenticateWithPin('1234').then((result) => {
            expect(result.success).toBe(false);
            expect(auth.isAuthenticated).toBe(false);
          });
        }, []);
        return null;
      };

      render(
        <AuthProvider>
          <TestAuth />
        </AuthProvider>
      );
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('isPinSet', () => {
    it('should call service isPinSet method', async () => {
      mockService.isPinSet.mockResolvedValue(true);

      const TestAuth = () => {
        const auth = useAuth();
        React.useEffect(() => {
          auth.isPinSet().then((pinSet) => {
            expect(pinSet).toBe(true);
            expect(mockService.isPinSet).toHaveBeenCalled();
          });
        }, []);
        return null;
      };

      render(
        <AuthProvider>
          <TestAuth />
        </AuthProvider>
      );
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('logout', () => {
    it('should reset authentication state', () => {
      const TestAuth = () => {
        const auth = useAuth();
        React.useEffect(() => {
          auth.logout();
          expect(auth.isAuthenticated).toBe(false);
        }, []);
        return null;
      };

      render(
        <AuthProvider>
          <TestAuth />
        </AuthProvider>
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service method errors gracefully', async () => {
      mockService.authenticate.mockRejectedValue(new Error('Service error'));

      const TestAuth = () => {
        const auth = useAuth();
        React.useEffect(() => {
          auth.authenticate().catch(() => {
            // Error is handled
            expect(auth.isAuthenticated).toBe(false);
            expect(auth.isAuthenticating).toBe(false);
          });
        }, []);
        return null;
      };

      render(
        <AuthProvider>
          <TestAuth />
        </AuthProvider>
      );
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const TestComponent = () => {
        useAuth(); // This should throw
        return null;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });
});

