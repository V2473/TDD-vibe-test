import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
}

interface AuthState {
  email: string;
  password: string;
  confirmPassword: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (confirmPassword: string) => void;
  isLoading: boolean;
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
  login: () => Promise<void>;
  register: () => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      email: '',
      password: '',
      confirmPassword: '',
      isLoading: false,
      isLoggedIn: false,
      user: null,
      token: null,
      error: null,
      setEmail: (email) => set({ email }),
      setPassword: (password) => set({ password }),
      setConfirmPassword: (confirmPassword) => set({ confirmPassword }),
      login: async () => {
        const { email, password } = get();
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          const data = await response.json();
          if (response.ok) {
            set({
              isLoading: false,
              isLoggedIn: true,
              user: data.user,
              token: data.token,
              error: null,
              email: '',
              password: '',
              confirmPassword: '',
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
          } else {
            set({
              isLoading: false,
              error: data.message,
              isLoggedIn: false,
              user: null,
              token: null,
            });
          }
        } catch (error) {
          set({
            isLoading: false,
            error: (error as Error).message,
            isLoggedIn: false,
            user: null,
            token: null,
          });
        }
      },
      register: async () => {
        const { email, password, confirmPassword } = get();
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, confirmPassword }),
          });
          const data = await response.json();
          if (response.ok) {
            // Auto-login on successful registration
            set({
              isLoading: false,
              isLoggedIn: true,
              user: data.user,
              token: data.token,
              error: null,
              email: '',
              password: '',
              confirmPassword: '',
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
          } else {
            set({
              isLoading: false,
              error: data.message,
              isLoggedIn: false,
              user: null,
              token: null,
            });
          }
        } catch (error) {
          set({
            isLoading: false,
            error: (error as Error).message,
            isLoggedIn: false,
            user: null,
            token: null,
          });
        }
      },
      logout: () => {
        set({
          isLoggedIn: false,
          user: null,
          token: null,
          email: '',
          password: '',
          confirmPassword: '',
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
      initialize: () => {
        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');
        if (token && userJson) {
          try {
            const user = JSON.parse(userJson);
            set({
              isLoggedIn: true,
              token,
              user,
            });
          } catch (error) {
            // Invalid stored data, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({
              isLoggedIn: false,
              token: null,
              user: null,
            });
          }
        }
      },
    }),
    { name: 'AuthStore' }
  )
);