"use client"
import React from 'react';
import { useStore } from './store';

// Counter component that displays the current count and buttons to increment and decrement it.
const Counter = () => {
  // Retrieves state and actions from the Zustand store.
  const { count, increment, decrement } = useStore();

  return (
    <div className="flex items-center space-x-4">
      {/* Displays the current count */}
      <h1 data-testid="count" className="text-2xl font-bold">
        {count}
      </h1>
      {/* Decrements the count on click */}
      <button
        onClick={decrement}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Decrement
      </button>
      {/* Increments the count on click */}
      <button
        onClick={increment}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Increment
      </button>
    </div>
  );
};

export default Counter;