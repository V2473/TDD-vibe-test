import { useAuthStore } from './authStore';

// Mocks
const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;

describe('authStore', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.email).toBe('');
      expect(state.password).toBe('');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.isLoggedIn).toBe(false);
      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
    });
  });

  describe('setEmail', () => {
    it('should update the email when setEmail is called', () => {
      const { setEmail } = useAuthStore.getState();
      useAuthStore.getState().setEmail('test@example.com');
      const { email } = useAuthStore.getState();
      expect(email).toBe('test@example.com');
    });
  });

  describe('setPassword', () => {
    it('should update the password when setPassword is called', () => {
      const { setPassword } = useAuthStore.getState();
      useAuthStore.getState().setPassword('password123');
      const { password } = useAuthStore.getState();
      expect(password).toBe('password123');
    });
  });

  describe('login', () => {
    it('should login successfully and update state', async () => {
      // Mock successful response
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          token: 'jwt-token',
          user: { id: 1, email: 'test@example.com' }
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const { login } = useAuthStore.getState();

      // Set email and password first
      useAuthStore.getState().setEmail('test@example.com');
      useAuthStore.getState().setPassword('password');
      await useAuthStore.getState().login();

      const state = useAuthStore.getState();

      expect(state.isLoading).toBe(false);
      expect(state.isLoggedIn).toBe(true);
      expect(state.error).toBe(null);
      expect(state.token).toBe('jwt-token');
      expect(state.user).toEqual({ id: 1, email: 'test@example.com' });
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'jwt-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ id: 1, email: 'test@example.com' }));
    });

    it('should handle login failure', async () => {
      // Mock failed response
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ message: 'Invalid credentials' })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const { login } = useAuthStore.getState();

      // Set email and password first
      useAuthStore.getState().setEmail('test@example.com');
      useAuthStore.getState().setPassword('wrong-password');
      await useAuthStore.getState().login();

      const state = useAuthStore.getState();

      expect(state.isLoading).toBe(false);
      expect(state.isLoggedIn).toBe(false);
      expect(state.error).toBe('Invalid credentials');
      expect(state.token).toBe(null);
      expect(state.user).toBe(null);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should set loading state during login', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          token: 'jwt-token',
          user: { id: 1, email: 'test@example.com' }
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const { login } = useAuthStore.getState();

      // Set email and password first
      useAuthStore.getState().setEmail('test@example.com');
      useAuthStore.getState().setPassword('password');

      // Check loading is set to true during async operation
      const loginPromise = useAuthStore.getState().login();
      expect(useAuthStore.getState().isLoading).toBe(true);

      await loginPromise;
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Set login state first
      useAuthStore.setState({
        isLoggedIn: true,
        token: 'jwt-token',
        user: { id: 1, email: 'test@example.com' }
      });
    });

    it('should logout and clear state', () => {
      const { logout } = useAuthStore.getState();
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();

      expect(state.isLoggedIn).toBe(false);
      expect(state.token).toBe(null);
      expect(state.user).toBe(null);
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('initialize', () => {
    it('should initialize with stored token and user', () => {
      (localStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'token') return 'stored-jwt-token';
        if (key === 'user') return JSON.stringify({ id: 1, email: 'stored@example.com' });
        return null;
      });

      const { initialize } = useAuthStore.getState();
      useAuthStore.getState().initialize();

      const state = useAuthStore.getState();

      expect(state.isLoggedIn).toBe(true);
      expect(state.token).toBe('stored-jwt-token');
      expect(state.user).toEqual({ id: 1, email: 'stored@example.com' });
    });

    it('should handle invalid stored data', () => {
      (localStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'token') return 'stored-jwt-token';
        if (key === 'user') return 'invalid-json';
        return null;
      });

      const { initialize } = useAuthStore.getState();
      useAuthStore.getState().initialize();

      const state = useAuthStore.getState();

      expect(state.isLoggedIn).toBe(false);
      expect(state.token).toBe(null);
      expect(state.user).toBe(null);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { login } = useAuthStore.getState();

      // Set email and password first
      useAuthStore.getState().setEmail('test@example.com');
      useAuthStore.getState().setPassword('password');

      await useAuthStore.getState().login();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Network error');
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should clear error when starting new login', async () => {
      // First set an error
      useAuthStore.setState({ error: 'Previous error' });

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          token: 'jwt-token',
          user: { id: 1, email: 'test@example.com' }
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      // Set credentials
      useAuthStore.getState().setEmail('test@example.com');
      useAuthStore.getState().setPassword('password');

      await useAuthStore.getState().login();

      const state = useAuthStore.getState();
      expect(state.error).toBe(null);
    });
  });
});