import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../core/auth/AuthStore';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={1}>Dashboard</Title>
      
      <Card title="Welcome!" style={{ marginBottom: '2rem' }}>
        {user ? (
          <div>
            <Text>Successfully logged in as: <strong>{user.email}</strong></Text>
            {user.profile?.displayName && <div><Text>Name: <strong>{user.profile.displayName}</strong></Text></div>}
            <div style={{ marginTop: '1rem' }}>
              <Space>
                <Button onClick={logout} danger>
                  Logout
                </Button>
                <Link to="/">
                  <Button>Back to Home</Button>
                </Link>
              </Space>
            </div>
          </div>
        ) : (
          <div>
            <Text>Not logged in. Please log in to access the dashboard.</Text>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/auth/login">
                <Button type="primary">Login</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;