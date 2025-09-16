import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTestStore } from '../core/hooks/useTestStore';
import { renderHook, act } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useTestStore());
    act(() => {
      result.current.reset();
    });
  });
  it('should render main heading', () => {
    render(<App />);
    expect(
      screen.getByText('AI-First React Framework Test')
    ).toBeInTheDocument();
  });

  it('should render counter button with initial count 0', () => {
    render(<App />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('should increment count when button is clicked', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /count:/i });

    fireEvent.click(button);
    
    // Check if the UI was updated to reflect the increment
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('should render TestComponent with processed message', () => {
    render(<App />);
    expect(
      screen.getByText('Message: Processed: Hello World')
    ).toBeInTheDocument();
  });

  it('should have proper app structure', () => {
    render(<App />);
    expect(screen.getByText('This component tests:')).toBeInTheDocument();
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});
