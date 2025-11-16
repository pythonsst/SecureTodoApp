import * as LocalAuthentication from 'expo-local-authentication';
import { SecureStorage } from '../../utils/SecureStorage';
import { STRINGS } from '../../constants/strings';
import { AuthenticationService } from '../AuthenticationService';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

jest.mock('../../utils/SecureStorage', () => ({
  SecureStorage: {
    KEYS: {
      PIN_HASH: 'PIN_HASH',
      SESSION_LAST_AUTH: 'SESSION_LAST_AUTH',
    },
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../../constants/strings', () => ({
  STRINGS: {
    auth: {
      authenticateBtn: 'Authenticate',
      pinRequired: 'PIN_REQUIRED',
      pinErrorLength: 'PIN_LENGTH_ERROR',
      pinErrorIncorrect: 'PIN_INCORRECT',
    },
    todos: {
      cancel: 'Cancel',
    },
  },
}));


const SESSION_DURATION_MS = 60 * 60 * 1000; // must match service

describe('AuthenticationService', () => {
  let service: AuthenticationService;

  beforeEach(() => {
    service = new AuthenticationService();
    jest.clearAllMocks();
  });

  // ------------------------
  // authenticate()
  // ------------------------
  describe('authenticate', () => {
    it('returns error when biometrics are not available', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

      const result = await service.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe(STRINGS.auth.pinRequired);
      expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
    });

    it('returns success and marks session when biometric auth succeeds', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await service.authenticate();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(SecureStorage.setItem).toHaveBeenCalledWith(
        SecureStorage.KEYS.SESSION_LAST_AUTH,
        expect.any(String),
      );
    });

    it('returns pinRequired when biometric auth fails', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
      });

      const result = await service.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe(STRINGS.auth.pinRequired);
      expect(SecureStorage.setItem).not.toHaveBeenCalled();
    });

    it('returns pinRequired on unexpected errors', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValue(
        new Error('Test error'),
      );

      const result = await service.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe(STRINGS.auth.pinRequired);
    });
  });

  // ------------------------
  // authenticateWithPin()
  // ------------------------
  describe('authenticateWithPin', () => {
    it('rejects short PINs (< 4)', async () => {
      const result = await service.authenticateWithPin('12');

      expect(result.success).toBe(false);
      expect(result.error).toBe(STRINGS.auth.pinErrorLength);
      expect(SecureStorage.getItem).not.toHaveBeenCalled();
    });

    it('creates PIN if not set yet and marks session', async () => {
      (SecureStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.authenticateWithPin('1234');

      expect(SecureStorage.getItem).toHaveBeenCalledWith(
        SecureStorage.KEYS.PIN_HASH,
      );
      expect(SecureStorage.setItem).toHaveBeenNthCalledWith(
        1,
        SecureStorage.KEYS.PIN_HASH,
        expect.any(String),
      );
      expect(SecureStorage.setItem).toHaveBeenNthCalledWith(
        2,
        SecureStorage.KEYS.SESSION_LAST_AUTH,
        expect.any(String),
      );
      expect(result.success).toBe(true);
    });

    it('returns success when PIN is correct and marks session', async () => {
      // simulate stored hash == hash(pin)
      const pin = '9876';
      const serviceForHash = new AuthenticationService();
      // @ts-ignore accessing private for test hack
      const hash = (serviceForHash as any).hashPin(pin);

      (SecureStorage.getItem as jest.Mock).mockResolvedValue(hash);

      const result = await service.authenticateWithPin(pin);

      expect(result.success).toBe(true);
      expect(SecureStorage.setItem).toHaveBeenCalledWith(
        SecureStorage.KEYS.SESSION_LAST_AUTH,
        expect.any(String),
      );
    });

    it('returns error when PIN is incorrect', async () => {
      (SecureStorage.getItem as jest.Mock).mockResolvedValue('some-other-hash');

      const result = await service.authenticateWithPin('1234');

      expect(result.success).toBe(false);
      expect(result.error).toBe(STRINGS.auth.pinErrorIncorrect);
      expect(SecureStorage.setItem).not.toHaveBeenCalled();
    });
  });

  // ------------------------
  // isAvailable()
  // ------------------------
  describe('isAvailable', () => {
    it('returns true when hardware and enrolled are true', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      const result = await service.isAvailable();

      expect(result).toBe(true);
    });

    it('returns false if any check fails or throws', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

      const result = await service.isAvailable();

      expect(result).toBe(false);
    });
  });

  // ------------------------
  // getSessionRemainingMs()
  // ------------------------
  describe('getSessionRemainingMs', () => {
    const now = 1700000000000; // some fixed timestamp

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(now);
    });

    afterEach(() => {
      (Date.now as jest.Mock).mockRestore?.();
    });

    it('returns 0 when no session timestamp', async () => {
      (SecureStorage.getItem as jest.Mock).mockResolvedValue(null);

      const remaining = await service.getSessionRemainingMs();

      expect(remaining).toBe(0);
    });

    it('returns remaining ms when session is valid', async () => {
      const half = SESSION_DURATION_MS / 2;
      const ts = (now - half).toString();

      (SecureStorage.getItem as jest.Mock).mockResolvedValue(ts);

      const remaining = await service.getSessionRemainingMs();

      // should be roughly half the duration
      expect(remaining).toBeGreaterThan(half - 10_000);
      expect(remaining).toBeLessThanOrEqual(half);
    });

    it('returns 0 when session is expired', async () => {
      const expired = (now - SESSION_DURATION_MS - 1000).toString();
      (SecureStorage.getItem as jest.Mock).mockResolvedValue(expired);

      const remaining = await service.getSessionRemainingMs();

      expect(remaining).toBe(0);
    });
  });

  // ------------------------
  // isSessionValid()
  // ------------------------
  describe('isSessionValid', () => {
    const now = 1700000000000;

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(now);
    });

    afterEach(() => {
      (Date.now as jest.Mock).mockRestore?.();
    });

    it('returns false when there is no session', async () => {
      (SecureStorage.getItem as jest.Mock).mockResolvedValue(null);

      const valid = await service.isSessionValid();

      expect(valid).toBe(false);
    });

    it('returns true when session is within duration', async () => {
      const ts = (now - SESSION_DURATION_MS + 1000).toString();
      (SecureStorage.getItem as jest.Mock).mockResolvedValue(ts);

      const valid = await service.isSessionValid();

      expect(valid).toBe(true);
    });

    it('returns false when session is expired', async () => {
      const ts = (now - SESSION_DURATION_MS - 1).toString();
      (SecureStorage.getItem as jest.Mock).mockResolvedValue(ts);

      const valid = await service.isSessionValid();

      expect(valid).toBe(false);
    });
  });

  // ------------------------
  // logout()
  // ------------------------
  describe('logout', () => {
    it('removes session timestamp', async () => {
      await service.logout();

      expect(SecureStorage.removeItem).toHaveBeenCalledWith(
        SecureStorage.KEYS.SESSION_LAST_AUTH,
      );
    });
  });

  // ------------------------
  // isPinSet()
  // ------------------------
  describe('isPinSet', () => {
    it('returns true when PIN hash exists', async () => {
      (SecureStorage.getItem as jest.Mock).mockResolvedValue('hash');

      const result = await service.isPinSet();

      expect(result).toBe(true);
    });

    it('returns false when PIN hash does not exist', async () => {
      (SecureStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.isPinSet();

      expect(result).toBe(false);
    });
  });
});
