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
import { usePermissions } from '../../../core/permissions/usePermissions';
import { analytics } from '../../../analytics';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * Workspace Settings Page Component
 */
export const WorkspaceSettingsPage: React.FC = () => {
  const { state: { currentWorkspace } } = useCoreContext();
  const { updateWorkspace, loading } = useWorkspaceStore();

  // Permission checks
  const { hasPermission } = usePermissions();
  const canUpdateWorkspace = hasPermission('workspace', 'update').allowed;

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
    analytics.track('button_click', { button_name: 'Save Workspace Name' });

    if (!currentWorkspace) {
      message.error('No workspace selected');
      setIsEditingName(false);
      setEditedName('');
      return;
    }

    if (!editedName.trim()) {
      message.error('Workspace name cannot be empty');
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
  const handleCancelEditName = () => {
    analytics.track('button_click', { button_name: 'Cancel Edit Workspace Name' });
    setEditedName(mockWorkspace?.name || '');
    setIsEditingName(false);
  };

  const handleEditName = () => {
    analytics.track('button_click', { button_name: 'Edit Workspace Name' });
    setIsEditingName(true);
  };

  const handleCopyWorkspaceId = async () => {
    analytics.track('button_click', { button_name: 'Copy Workspace ID' });

    if (!currentWorkspace?.id) return;

    try {
      await navigator.clipboard.writeText(currentWorkspace.id);
      message.success('Workspace ID copied to clipboard');
    } catch (error) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = currentWorkspace.id;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          message.success('Workspace ID copied to clipboard');
        } else {
          message.error('Failed to copy workspace ID');
        }
      } catch (fallbackError) {
        message.error('Failed to copy workspace ID');
      }
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
                        <div>
                          <Space>
                            <Input
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              onPressEnter={handleNameSave}
                              style={{
                                width: 200,
                                borderColor: !editedName.trim() ? '#ff4d4f' : undefined
                              }}
                              status={!editedName.trim() ? 'error' : undefined}
                              autoFocus
                              placeholder="Enter workspace name"
                            />
                            <Button
                              type="primary"
                              size="small"
                              icon={<CheckCircleOutlined />}
                              onClick={handleNameSave}
                              loading={loading}
                              disabled={!editedName.trim()}
                            />
                            <Button
                              size="small"
                              icon={<CloseOutlined />}
                              onClick={handleCancelEditName}
                            />
                          </Space>
                          {!editedName.trim() && (
                            <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginLeft: '0' }}>
                              Workspace name cannot be empty
                            </div>
                          )}
                        </div>
                      ) : (
                        <Space>
                          <Text strong style={{ fontSize: '16px' }}>
                            {mockWorkspace.name}
                          </Text>
                          {canUpdateWorkspace && (
                            <Tooltip title="Edit workspace name">
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={handleEditName}
                              />
                            </Tooltip>
                          )}
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