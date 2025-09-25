import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../DashboardPage';

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('DashboardPage', () => {
  it('should render dashboard title', () => {
    renderWithRouter(<DashboardPage />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('should render main dashboard content', () => {
    renderWithRouter(<DashboardPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
