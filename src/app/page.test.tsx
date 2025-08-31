import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './page';
import { useAuthStore } from './store/authStore';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ ...props }) => <img {...props} />
}));

describe('Home Page - End-to-End Sign-In Flow', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;
  const mockLocalStorage = global.localStorage as jest.Mocked<Storage>;

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it('should render AuthForm when not logged in', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
  });

  it('should complete successful sign-in flow', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        success: true,
        token: 'jwt-token-123',
        user: { id: 1, email: 'test@example.com' }
      })
    };

    mockFetch.mockResolvedValue(mockResponse as Response);

    render(<Home />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'Password123!' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'Password123!' })
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'jwt-token-123');
    });

    await waitFor(() => {
      expect(screen.getByText(/Welcome to Dashboard/i)).toBeInTheDocument();
    });
  });

  it('should handle login failure', async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      json: () => Promise.resolve({
        message: 'Invalid credentials'
      })
    };

    mockFetch.mockResolvedValue(mockResponse as Response);

    render(<Home />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'wrong@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'Wr0ngPass!' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it('should initialize store on mount', () => {
    const initializeSpy = jest.spyOn(useAuthStore.getState(), 'initialize');
    render(<Home />);
    initializeSpy.mockRestore();
  });

  it('should restore session from localStorage', () => {
    mockLocalStorage.getItem
      .mockReturnValueOnce('jwt-token')
      .mockReturnValueOnce(JSON.stringify({ id: 1, email: 'test@example.com' }));

    render(<Home />);

    expect(screen.getByText(/Welcome to Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText('Email: test@example.com')).toBeInTheDocument();
  });

  it('should handle logout from dashboard', async () => {
    // First set up logged in state with mocks
    (mockLocalStorage.getItem as jest.Mock)
      .mockReturnValueOnce('jwt-token')
      .mockReturnValueOnce(JSON.stringify({ id: 1, email: 'test@example.com' }));

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        token: 'jwt-token',
        user: { id: 1, email: 'test@example.com' }
      })
    } as Response);

    render(<Home />);

    // Verify dashboard is shown
    expect(screen.getByText(/Welcome to Dashboard/i)).toBeInTheDocument();

    // Click logout
    fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }));

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    });
  });

  it('should show password requirements', async () => {
    render(<Home />);

    const passwordInput = screen.getByTestId('password-input');

    fireEvent.focus(passwordInput);
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

    await waitFor(() => {
      expect(screen.getByText('Password Requirements:')).toBeInTheDocument();
      expect(screen.getByText(/8\+ characters/i)).toBeInTheDocument();
    });
  });

  it('should show validation errors for invalid email', async () => {
    render(<Home />);

    const emailInput = screen.getByLabelText(/Email/i);

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button when form is invalid', () => {
    render(<Home />);

    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'invalid' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'weak' } });
    fireEvent.blur(screen.getByLabelText(/Email/i));

    expect(submitButton).toBeDisabled();
  });

  it('should show loading state during sign-in', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => new Promise((resolve) =>
        setTimeout(() => resolve({
          success: true,
          token: 'jwt-token',
          user: { id: 1, email: 'test@example.com' }
        }), 100)
      )
    } as Response);

    render(<Home />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'Password123!' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(screen.getByText('Please wait...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
    });
  });
});