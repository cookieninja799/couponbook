// Auth service unit tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock oidc-client-ts BEFORE importing authService
const mockUserManager = {
  signinRedirect: vi.fn().mockResolvedValue(),
  signoutRedirect: vi.fn().mockResolvedValue(),
  removeUser: vi.fn().mockResolvedValue(),
  getUser: vi.fn(),
  signinSilent: vi.fn(),
  signinRedirectCallback: vi.fn(),
};

vi.mock('oidc-client-ts', () => ({
  UserManager: vi.fn(() => mockUserManager),
  WebStorageStateStore: vi.fn(),
}));

describe('Auth Service', () => {
  let signIn, signOut, getCurrentUser, getAccessToken, getIdToken, handleSignInCallback;

  beforeEach(async () => {
    vi.resetModules();
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    // Mock window.location
    global.window = {
      location: {
        origin: 'http://localhost:8080',
        pathname: '/',
        search: '',
        hash: '',
        href: 'http://localhost:8080/',
      },
    };

    // Reset all mocks before each test
    vi.clearAllMocks();
    mockUserManager.signinRedirect.mockResolvedValue();
    mockUserManager.removeUser.mockResolvedValue();
    mockUserManager.signinRedirectCallback.mockResolvedValue();
    mockUserManager.getUser.mockResolvedValue(null);
    mockUserManager.signinSilent.mockResolvedValue(null);

    // Import after mocks are set up
    const authService = await import('../../../../src/services/authService.js');
    signIn = authService.signIn;
    signOut = authService.signOut;
    getCurrentUser = authService.getCurrentUser;
    getAccessToken = authService.getAccessToken;
    getIdToken = authService.getIdToken;
    handleSignInCallback = authService.handleSignInCallback;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should redirect to Cognito sign-in', async () => {
      await signIn();
      expect(mockUserManager.signinRedirect).toHaveBeenCalled();
    });

    it('should store post-login redirect path', async () => {
      global.window.location.pathname = '/profile';
      await signIn();
      expect(global.localStorage.setItem).toHaveBeenCalledWith('postLoginRedirect', '/profile');
    });
  });

  describe('signOut', () => {
    it('should remove user and redirect to logout', async () => {
      global.window.location.href = '';
      await signOut();
      expect(mockUserManager.removeUser).toHaveBeenCalled();
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('idToken');
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('accessToken');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user if not expired', async () => {
      const mockUser = {
        id_token: 'id-token',
        access_token: 'access-token',
        expired: false,
      };
      mockUserManager.getUser.mockResolvedValueOnce(mockUser);

      const user = await getCurrentUser();
      expect(user).toEqual(mockUser);
      expect(mockUserManager.getUser).toHaveBeenCalled();
      expect(mockUserManager.signinSilent).not.toHaveBeenCalled();
    });

    it('should attempt silent sign-in if user is expired', async () => {
      const expiredUser = {
        id_token: 'id-token',
        access_token: 'access-token',
        expired: true,
      };
      const renewedUser = {
        id_token: 'new-id-token',
        access_token: 'new-access-token',
        expired: false,
      };

      mockUserManager.getUser.mockResolvedValueOnce(expiredUser);
      mockUserManager.signinSilent.mockResolvedValueOnce(renewedUser);

      const user = await getCurrentUser();
      expect(user).toEqual(renewedUser);
      expect(mockUserManager.signinSilent).toHaveBeenCalled();
    });

    it('should return null if no user found', async () => {
      // getUser returns null, signinSilent is called but also returns null
      mockUserManager.getUser.mockResolvedValueOnce(null);
      mockUserManager.signinSilent.mockResolvedValueOnce(null);

      const user = await getCurrentUser();
      expect(user).toBeNull();
      expect(mockUserManager.signinSilent).toHaveBeenCalled();
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from user', async () => {
      const mockUser = {
        access_token: 'access-token-123',
        expired: false,
      };
      mockUserManager.getUser.mockResolvedValueOnce(mockUser);

      const token = await getAccessToken();
      expect(token).toBe('access-token-123');
    });

    it('should fallback to localStorage if user has no token', async () => {
      // getUser returns null, signinSilent also returns null, so it falls back to localStorage
      mockUserManager.getUser.mockResolvedValueOnce(null);
      mockUserManager.signinSilent.mockResolvedValueOnce(null);
      global.localStorage.getItem.mockReturnValue('local-storage-token');

      const token = await getAccessToken();
      expect(token).toBe('local-storage-token');
      expect(global.localStorage.getItem).toHaveBeenCalledWith('accessToken');
    });

    it('should return empty string if no token found', async () => {
      mockUserManager.getUser.mockResolvedValueOnce(null);
      mockUserManager.signinSilent.mockResolvedValueOnce(null);
      global.localStorage.getItem.mockReturnValue(null);

      const token = await getAccessToken();
      expect(token).toBe('');
    });
  });

  describe('getIdToken', () => {
    it('should return id token from user', async () => {
      const mockUser = {
        id_token: 'id-token-123',
        expired: false,
      };
      mockUserManager.getUser.mockResolvedValueOnce(mockUser);

      const token = await getIdToken();
      expect(token).toBe('id-token-123');
    });

    it('should fallback to localStorage if user has no token', async () => {
      mockUserManager.getUser.mockResolvedValueOnce(null);
      mockUserManager.signinSilent.mockResolvedValueOnce(null);
      global.localStorage.getItem.mockReturnValue('local-storage-id-token');

      const token = await getIdToken();
      expect(token).toBe('local-storage-id-token');
      expect(global.localStorage.getItem).toHaveBeenCalledWith('idToken');
    });
  });

  describe('handleSignInCallback', () => {
    it('should handle successful callback and store tokens', async () => {
      const mockUser = {
        id_token: 'id-token-123',
        access_token: 'access-token-123',
      };
      mockUserManager.signinRedirectCallback.mockResolvedValueOnce(mockUser);

      const user = await handleSignInCallback();
      expect(user).toEqual(mockUser);
      expect(global.localStorage.setItem).toHaveBeenCalledWith('idToken', 'id-token-123');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('accessToken', 'access-token-123');
    });

    it('should throw error on failed callback', async () => {
      const error = new Error('Callback failed');
      mockUserManager.signinRedirectCallback.mockRejectedValueOnce(error);

      await expect(handleSignInCallback()).rejects.toThrow('Callback failed');
    });
  });
});
