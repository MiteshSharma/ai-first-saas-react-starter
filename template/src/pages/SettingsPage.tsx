/**
 * @fileoverview Central Settings Page
 *
 * Provides navigation to all settings sections
 */

import React from 'react';
import { Card, Row, Col, Typography, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  TeamOutlined,
  ApartmentOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const settingsSections = [
    {
      title: 'User Profile',
      description: 'Manage your personal profile, preferences, and account settings',
      icon: <UserOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
      path: '/settings/profile',
      available: true
    },
    {
      title: 'Workspace Settings',
      description: 'Configure workspace settings, members, and preferences',
      icon: <ApartmentOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      path: '/settings/workspaces',
      available: true
    },
    {
      title: 'Tenant Settings',
      description: 'Manage tenant configuration, security, and subscription',
      icon: <TeamOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      path: '/settings/tenants',
      available: true
    },
    {
      title: 'User Management',
      description: 'Manage users, invitations, and team members',
      icon: <UserOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      path: '/users',
      available: true
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2}>
          <SettingOutlined style={{ marginRight: 8 }} />
          Settings
        </Title>
        <Text type="secondary">
          Manage your account, workspace, and application settings
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {settingsSections.map((section) => (
          <Col xs={24} sm={12} lg={8} key={section.title}>
            <Card
              hoverable
              style={{
                height: '100%',
                border: '1px solid #d9d9d9',
                borderRadius: 8
              }}
              bodyStyle={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                  {section.icon}
                </div>

                <div style={{ textAlign: 'center', flex: 1 }}>
                  <Title level={4} style={{ margin: '8px 0' }}>
                    {section.title}
                  </Title>
                  <Text type="secondary" style={{ display: 'block', lineHeight: 1.5 }}>
                    {section.description}
                  </Text>
                </div>

                <Button
                  type="primary"
                  block
                  disabled={!section.available}
                  onClick={() => navigate(section.path)}
                  style={{ marginTop: 'auto' }}
                >
                  {section.available ? 'Open Settings' : 'Coming Soon'}
                </Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default SettingsPage;