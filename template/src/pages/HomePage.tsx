import React from 'react';
import { Button, Card, Space, Typography, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { TestComponent } from '../components/TestComponent';
import { useTestStore } from '../hooks/useTestStore';
import { useAuthStore } from '../auth/AuthStore';
import { testUtilFunction } from '../utils/testUtils';

const { Title, Text } = Typography;

const HomePage: React.FC = () => {
  const testStore = useTestStore();
  const { user, logout } = useAuthStore();
  const utilResult = testUtilFunction('Hello World');

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={1}>AI-First SaaS React Starter</Title>
      
      {user ? (
        <Card title="Welcome Back!" style={{ marginBottom: '2rem' }}>
          <Text>Logged in as: <strong>{user.email}</strong></Text>
          <div style={{ marginTop: '1rem' }}>
            <Button onClick={logout} danger>
              Logout
            </Button>
          </div>
        </Card>
      ) : (
        <Card title="Authentication Test" style={{ marginBottom: '2rem' }}>
          <Text>Test all authentication flows:</Text>
          <div style={{ marginTop: '1rem' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Title level={4}>Direct Login/Register</Title>
                <Space>
                  <Link to="/auth/login">
                    <Button type="primary">Login Page</Button>
                  </Link>
                  <Link to="/auth/register">
                    <Button>Register Page</Button>
                  </Link>
                </Space>
              </div>
              
              <div>
                <Title level={4}>Email-Based Signup</Title>
                <Link to="/auth/signup-with-email">
                  <Button>Signup with Email</Button>
                </Link>
              </div>
              
              <div>
                <Title level={4}>Password Reset</Title>
                <Link to="/auth/password-reset-request">
                  <Button>Request Password Reset</Button>
                </Link>
              </div>
            </Space>
          </div>
        </Card>
      )}
      
      <Divider />
      
      <Card title="Framework Test">
        <Button type='primary' onClick={(): void => testStore.increment()}>
          Count: {testStore.count}
        </Button>
        <div style={{ marginTop: '1rem' }}>
          <TestComponent message={utilResult} />
        </div>
      </Card>
    </div>
  );
};

export default HomePage;