import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Defines the state structure for the counter.
interface CounterState {
  /** The current count. */
  count: number;
  /** Increments the count by 1. */
  increment: () => void;
  /** Decrements the count by 1. */
  decrement: () => void;
}

// Creates a Zustand store for the counter state.
export const useStore = create<CounterState>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
      decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
    }),
    {
      name: 'counter',
      trace: true,
    },
  )
);