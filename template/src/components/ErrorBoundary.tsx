/**
 * @fileoverview Error Boundary Component
 *
 * React Error Boundary to catch and handle React component errors gracefully
 */

import React, { Component, ReactNode } from 'react';
import { Result, Button, Typography } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={{ padding: '48px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
          <Result
            status="error"
            title="Something went wrong"
            subTitle="An unexpected error occurred. Please try refreshing the page or contact support if the problem persists."
            extra={[
              <Button type="primary" key="retry" icon={<ReloadOutlined />} onClick={this.handleRetry}>
                Try Again
              </Button>,
              <Button key="reload" icon={<ReloadOutlined />} onClick={this.handleReload}>
                Reload Page
              </Button>,
              <Button key="home" icon={<HomeOutlined />} onClick={this.handleGoHome}>
                Go Home
              </Button>,
            ]}
          >
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{ textAlign: 'left', marginTop: 24 }}>
                <Typography.Title level={5}>Error Details (Development Only):</Typography.Title>
                <Paragraph>
                  <Text code>{this.state.error.toString()}</Text>
                </Paragraph>
                {this.state.errorInfo && (
                  <Paragraph>
                    <Text code style={{ whiteSpace: 'pre-wrap' }}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </Paragraph>
                )}
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;