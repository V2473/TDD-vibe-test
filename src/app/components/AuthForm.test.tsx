import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AuthForm from './AuthForm';
import { useAuthStore } from '../store/authStore';

const initialStoreState = useAuthStore.getState();

describe('AuthForm', () => {
  beforeEach(() => {
    useAuthStore.setState(initialStoreState);
  });

  it('should render an email input, a password input, and a sign in button', () => {
    render(<AuthForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByTestId('password-input'); // Use test id to avoid matching multiple
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(loginButton).toBeInTheDocument();
  });

  it('should call setEmail when the email input is changed', () => {
    const setEmail = jest.fn();
    useAuthStore.setState({ ...initialStoreState, setEmail });

    render(<AuthForm />);
    const emailInput = screen.getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(setEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('should call setPassword when the password input is changed', () => {
    const setPassword = jest.fn();
    useAuthStore.setState({ ...initialStoreState, setPassword });

    render(<AuthForm />);
    const passwordInput = screen.getByTestId('password-input');

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(setPassword).toHaveBeenCalledWith('password123');
  });
});