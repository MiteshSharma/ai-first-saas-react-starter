import React from 'react';
import { render, screen } from '@testing-library/react';
import { StyledTestComponent } from '../StyledTestComponent';

describe('StyledTestComponent', () => {
  const defaultProps = {
    title: 'Test Component'
  };

  it('should render with provided title', () => {
    render(<StyledTestComponent {...defaultProps} />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should render feature list', () => {
    render(<StyledTestComponent {...defaultProps} />);
    expect(screen.getByText('styled-components theming')).toBeInTheDocument();
    expect(screen.getByText('Ant Design component styling')).toBeInTheDocument();
    expect(screen.getByText('TypeScript prop integration')).toBeInTheDocument();
    expect(screen.getByText('Responsive design patterns')).toBeInTheDocument();
  });

  it('should render test action button', () => {
    render(<StyledTestComponent {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Test Action' })).toBeInTheDocument();
  });

  it('should render without highlighted styling by default', () => {
    render(<StyledTestComponent {...defaultProps} />);
    const button = screen.getByRole('button', { name: 'Test Action' });
    expect(button).toBeInTheDocument();
  });

  it('should render with highlighted styling when highlighted prop is true', () => {
    render(<StyledTestComponent {...defaultProps} highlighted={true} />);
    const button = screen.getByRole('button', { name: 'Test Action' });
    expect(button).toBeInTheDocument();
  });

  it('should render description text', () => {
    render(<StyledTestComponent {...defaultProps} />);
    expect(screen.getByText('This demonstrates:')).toBeInTheDocument();
  });
});