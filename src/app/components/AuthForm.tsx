"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';

// Utility functions for validation
const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/(?=.*[a-z])/.test(password)) return 'Password must contain lowercase letter';
  if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain uppercase letter';
  if (!/(?=.*\d)/.test(password)) return 'Password must contain number';
  if (!/(?=.*[!@#$%^&*()_+={}\[\]|:;"'<>?,./])/.test(password)) return 'Password must contain special character';
  return null;
};

const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Confirm password is required';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: { [key: string]: boolean };
}

const getPasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    lowercase: /(?=.*[a-z])/.test(password),
    uppercase: /(?=.*[A-Z])/.test(password),
    number: /(?=.*\d)/.test(password),
    special: /(?=.*[!@#$%^&*()_+={}\[\]|:;"'<>?,./])/.test(password),
  };
  const score = Object.values(requirements).filter(Boolean).length;
  if (score < 2) return { score, label: 'Weak', color: 'text-red-600', requirements };
  if (score < 4) return { score, label: 'Fair', color: 'text-yellow-600', requirements };
  if (score < 6) return { score, label: 'Good', color: 'text-blue-600', requirements };
  return { score, label: 'Strong', color: 'text-green-600', requirements };
};

const AuthForm = () => {
  const {
    email,
    password,
    confirmPassword,
    setEmail,
    setPassword,
    setConfirmPassword,
    login,
    register,
    isLoading,
    error,
    initialize
  } = useAuthStore();
  const emailRef = useRef<HTMLInputElement>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [dismissedError, setDismissedError] = useState(false);

  // Auto-focus email on mount
  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
  }, []);

  // Initialize store
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Real-time email validation
  useEffect(() => {
    if (touched.email) {
      setEmailError(validateEmail(email));
    }
  }, [email, touched.email]);

  // Real-time password validation
  useEffect(() => {
    if (touched.password) {
      setPasswordError(validatePassword(password));
      setPasswordStrength(getPasswordStrength(password));
    }
  }, [password, touched.password]);

  // Real-time confirm password validation
  useEffect(() => {
    if (touched.confirmPassword && isSignUp) {
      setConfirmPasswordError(validateConfirmPassword(password, confirmPassword));
    }
  }, [password, confirmPassword, touched.confirmPassword, isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValid = validateEmail(email) === null;
    const passwordValid = validatePassword(password) === null;
    const confirmPasswordValid = !isSignUp || validateConfirmPassword(password, confirmPassword) === null;

    setTouched({
      email: true,
      password: true,
      confirmPassword: isSignUp
    });

    if (!emailValid || !passwordValid || !confirmPasswordValid) return;
    setDismissedError(false);

    if (isSignUp) {
      await register();
    } else {
      await login();
    }
  };

  const handleDismissError = () => {
    setDismissedError(true);
  };

  const displayError = error && !dismissedError;

  const handleModeToggle = () => {
    setIsSignUp(!isSignUp);
    // Clear validation errors when switching modes
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setTouched({ email: false, password: false, confirmPassword: false });
    setPasswordStrength(null);
    setDismissedError(true);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg absolute m-10 ">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-gray-600">Please wait...</div>
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        {isSignUp ? 'Create Account' : 'Sign In'}
      </h2>

      {/* Global Error Alert */}
      {displayError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg relative" role="alert">
          <div className="flex justify-between items-start">
            <span>{error}</span>
            <button
              type="button"
              onClick={handleDismissError}
              className="text-red-500 hover:text-red-700 ml-4"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setDismissedError(true);
              if (emailRef.current) emailRef.current.focus();
            }}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-sm rounded"
            aria-label="Retry after dismissing error"
          >
            Retry
          </button>
        </div>
      )}

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="flex flex-col">
          <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            ref={emailRef}
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setTouched({ ...touched, email: true });
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            required
            aria-describedby={emailError ? 'email-error' : undefined}
            className={`p-3 border rounded-lg transition-colors duration-200 w-full ${
              emailError
                ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400'
            } focus:outline-none`}
          />
          {emailError && (
            <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
              {emailError}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="flex flex-col">
          <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setTouched((prev) => ({ ...prev, password: true }));
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              required
              aria-describedby={passwordError ? 'password-error' : 'password-strength'}
              className={`p-3 border rounded-lg transition-colors duration-200 w-full pr-10 ${
                passwordError
                  ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400'
              } focus:outline-none`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Password Requirements */}
          {password && touched.password && (
            <div id="password-strength" className="mt-2">
              <div className="text-xs text-gray-600 mb-1">
                Password Requirements:
              </div>
              <ul className="text-xs space-y-1">
                {passwordStrength &&
                  Object.entries(passwordStrength.requirements).map(([req, met]) => (
                    <li key={req} className={met ? 'text-green-600' : 'text-red-600'}>
                      <span className={met ? '✓' : '✗'} />{' '}
                      {req === 'length' ? '8+ characters' :
                       req === 'lowercase' ? 'Lowercase letter' :
                       req === 'uppercase' ? 'Uppercase letter' :
                       req === 'number' ? 'Number' : 'Special character'}
                    </li>
                  ))}
              </ul>
              {passwordStrength && (
                <div className={`mt-2 text-xs font-medium ${passwordStrength.color}`}>
                  Strength: {passwordStrength.label}
                </div>
              )}
            </div>
          )}

          {passwordError && (
            <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
              {passwordError}
            </p>
          )}
        </div>

        {/* Confirm Password Field (only in sign-up mode) */}
        {isSignUp && (
          <div className="flex flex-col">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setTouched((prev) => ({ ...prev, confirmPassword: true }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                required={isSignUp}
                aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
                className={`p-3 border rounded-lg transition-colors duration-200 w-full pr-10 ${
                  confirmPasswordError
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400'
                } focus:outline-none`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {confirmPasswordError && (
              <p id="confirm-password-error" className="mt-1 text-sm text-red-600" role="alert">
                {confirmPasswordError}
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !!emailError || !!passwordError || (isSignUp && !!confirmPasswordError)}
          className="relative p-3 bg-blue-500 text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
          aria-label={isSignUp ? 'Create new account' : 'Sign in to your account'}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {isSignUp ? 'Creating account...' : 'Signing in...'}
            </>
          ) : (
            isSignUp ? 'Create Account' : 'Sign In'
          )}
        </button>
      </form>

      {/* Mode Toggle */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            type="button"
            onClick={handleModeToggle}
            className="ml-1 text-blue-500 hover:text-blue-600 font-medium transition-colors duration-200"
            aria-label={isSignUp ? 'Switch to sign in' : 'Switch to sign up'}
          >
            {isSignUp ? 'Sign In' : 'Create Account'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;