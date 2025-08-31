import { render, screen } from '@testing-library/react';
import { expect, test, describe, it, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import Counter from '@/app/counter';
import { useStore } from './store';
import { act } from 'react';

// Test suite for the Counter component.
describe('Counter Component', () => {
  // Resets the store state before each test.
  beforeEach(() => {
    act(() => {
      useStore.setState({ count: 0 });
    });
  });

  // Test case to ensure the component renders with an initial count of 0.
  it('should render with an initial count of 0', () => {
    render(<Counter />);
    const countElement = screen.getByTestId('count');
    expect(countElement.textContent).toBe('0');
  });

  // Test case to verify that the increment action updates the count.
  it('should increment the count when the increment action is called', () => {
    render(<Counter />);
    act(() => {
      useStore.getState().increment();
    });
    const countElement = screen.getByTestId('count');
    expect(countElement.textContent).toBe('1');
  });

  // Test case to verify that the decrement action updates the count.
  it('should decrement the count when the decrement action is called', () => {
    render(<Counter />);
    act(() => {
      useStore.getState().decrement();
    });
    const countElement = screen.getByTestId('count');
    expect(countElement.textContent).toBe('-1');
  });
});