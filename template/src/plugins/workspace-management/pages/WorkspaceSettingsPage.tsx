/**
 * @fileoverview Workspace Settings Page
 *
 * Simple page for viewing and managing workspace details
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Tabs,
  Space,
  message,
  Tooltip,
  Row,
  Col
} from 'antd';
import {
  SettingOutlined,
  EditOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { useCoreContext } from '../../../core/context/CoreContext';
import { useWorkspaceStore } from '../stores/workspaceStore';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * Workspace Settings Page Component
 */
export const WorkspaceSettingsPage: React.FC = () => {
  const { state: { currentWorkspace } } = useCoreContext();
  const { updateWorkspace, loading } = useWorkspaceStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    if (currentWorkspace?.name) {
      setEditedName(currentWorkspace.name);
    }
  }, [currentWorkspace]);

  /**
   * Handle workspace name save
   */
  const handleNameSave = async () => {
    if (!currentWorkspace || !editedName.trim()) {
      setIsEditingName(false);
      setEditedName(currentWorkspace?.name || '');
      return;
    }

    if (editedName === currentWorkspace.name) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateWorkspace(currentWorkspace.id, { name: editedName.trim() });
      message.success('Workspace name updated successfully');
      setIsEditingName(false);
    } catch (error) {
      message.error('Failed to update workspace name');
      setEditedName(currentWorkspace.name);
      setIsEditingName(false);
    }
  };

  /**
   * Handle copy workspace ID to clipboard
   */
  const handleCopyWorkspaceId = async () => {
    if (!currentWorkspace?.id) return;

    try {
      await navigator.clipboard.writeText(currentWorkspace.id);
      message.success('Workspace ID copied to clipboard');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentWorkspace.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      message.success('Workspace ID copied to clipboard');
    }
  };

  const mockWorkspace = currentWorkspace || {
    id: '2ecd2f32dewd3e32',
    name: 'Production Workspace'
  };

  if (!currentWorkspace) {
    return (
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <Card>
          <Text type="secondary">No workspace selected</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Workspace settings
        </Title>
      </div>

      {/* Tabs Section */}
      <Card>
        <Tabs defaultActiveKey="general" size="large">
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                General
              </span>
            }
            key="general"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Workspace Details Card */}
              <Card
                title={
                  <Space>
                    <FolderOutlined />
                    <Text strong>Workspace Details</Text>
                  </Space>
                }
                style={{ border: '1px solid #d9d9d9' }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {/* Workspace Name */}
                  <Row align="middle" justify="space-between">
                    <Col>
                      <Text type="secondary">Workspace name</Text>
                    </Col>
                    <Col>
                      {isEditingName ? (
                        <Space>
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onPressEnter={handleNameSave}
                            style={{ width: 200 }}
                            autoFocus
                          />
                          <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            onClick={handleNameSave}
                            loading={loading}
                          />
                          <Button
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={() => {
                              setEditedName(mockWorkspace.name || '');
                              setIsEditingName(false);
                            }}
                          />
                        </Space>
                      ) : (
                        <Space>
                          <Text strong style={{ fontSize: '16px' }}>
                            {mockWorkspace.name}
                          </Text>
                          <Tooltip title="Edit workspace name">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => setIsEditingName(true)}
                            />
                          </Tooltip>
                        </Space>
                      )}
                    </Col>
                  </Row>

                  {/* Workspace ID */}
                  <Row align="middle" justify="space-between">
                    <Col>
                      <Text type="secondary">Workspace ID</Text>
                    </Col>
                    <Col>
                      <Space>
                        <Text code style={{ fontSize: '14px' }}>
                          {mockWorkspace.id}
                        </Text>
                        <Tooltip title="Copy workspace ID">
                          <Button
                            type="text"
                            icon={<CopyOutlined />}
                            size="small"
                            onClick={handleCopyWorkspaceId}
                          />
                        </Tooltip>
                      </Space>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Space>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default WorkspaceSettingsPage;