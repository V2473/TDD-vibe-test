import { render, screen } from '@testing-library/react';
import { expect, test, describe, it } from '@jest/globals';
import '@testing-library/jest-dom';
import Home from './page';

describe('Home Page', () => {
  it('should render the Counter component', () => {
    render(<Home />);
    const incrementButton = screen.getByText(/increment/i);
    expect(incrementButton).toBeInTheDocument();
  });
});