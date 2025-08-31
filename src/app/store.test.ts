import { useStore } from '@/app/store';
import { renderHook, act } from '@testing-library/react';
import { expect, describe, it, beforeEach } from '@jest/globals';

describe('useStore', () => {
  // Resets the store state before each test
  beforeEach(() => {
    act(() => {
      useStore.setState({ count: 0 });
    });
  });

  it('should have an initial state of { count: 0 }', () => {
    const { result } = renderHook(() => useStore());
    expect(result.current.count).toBe(0);
  });

  it('should increment the count', () => {
    const { result } = renderHook(() => useStore());
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(1);
  });

  it('should decrement the count', () => {
    const { result } = renderHook(() => useStore());
    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(-1);
  });
});