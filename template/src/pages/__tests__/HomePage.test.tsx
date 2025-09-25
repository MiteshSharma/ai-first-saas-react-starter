import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../HomePage';

// Mock the stores and components to avoid complex dependencies
jest.mock('../../core/hooks/useTestStore', () => ({
  useTestStore: () => ({
    count: 0,
    increment: jest.fn(),
    decrement: jest.fn(),
    reset: jest.fn(),
  }),
}));

jest.mock('../../core/auth/AuthStore', () => ({
  useAuthStore: () => ({
    user: null,
    logout: jest.fn(),
  }),
}));

jest.mock('../../components/TestComponent', () => ({
  TestComponent: ({ message }: { message: string }) => (
    <div>Test Component: {message}</div>
  ),
}));

jest.mock('../../core/utils/testUtils', () => ({
  testUtilFunction: (msg: string) => `Processed: ${msg}`,
}));

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('HomePage', () => {
  it('should render main title', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('AI-First SaaS React Starter')).toBeInTheDocument();
  });

  it('should render authentication test card when user is not logged in', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Authentication Test')).toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.getByText('Register Page')).toBeInTheDocument();
  });

  it('should render framework test section', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Framework Test')).toBeInTheDocument();
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('should render test component with processed message', () => {
    renderWithRouter(<HomePage />);
    expect(
      screen.getByText('Test Component: Processed: Hello World')
    ).toBeInTheDocument();
  });

  it('should have authentication navigation links', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.getByText('Register Page')).toBeInTheDocument();
    expect(screen.getByText('Signup with Email')).toBeInTheDocument();
    expect(screen.getByText('Request Password Reset')).toBeInTheDocument();
  });
});
