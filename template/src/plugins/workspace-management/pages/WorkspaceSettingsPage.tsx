/**
 * @fileoverview Workspace Settings Page
 *
 * Page for managing workspace settings and configuration
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  message,
  Row,
  Col,
  Tag
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  LockOutlined,
  TeamOutlined,
  GlobalOutlined,
  SlackOutlined,
  GithubOutlined
} from '@ant-design/icons';
import { useCoreContext } from '../../../core/context/CoreContext';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { usePermissions } from '../../../core/permissions/usePermissions';
import { WorkspaceSettings } from '../../../core/types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * Workspace Settings Page Component
 */
export const WorkspaceSettingsPage: React.FC = () => {
  const { state: { currentWorkspace } } = useCoreContext();
  const { updateWorkspaceSettings, loading } = useWorkspaceStore();
  const { hasPermission } = usePermissions();

  const [form] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);

  // Check permissions
  const canManageSettings = hasPermission('workspace.settings', 'manage');

  // Initialize form with current workspace settings
  useEffect(() => {
    if (currentWorkspace?.settings) {
      const initialSettings = currentWorkspace.settings;
      setSettings(initialSettings);
      form.setFieldsValue({
        // Access Control
        'access.visibility': initialSettings.access.visibility,
        'access.joinPolicy': initialSettings.access.joinPolicy,
        'access.externalAccess': initialSettings.access.externalAccess,

        // Data Management
        'data.allowDataExport': initialSettings.data.allowDataExport,
        'data.backupEnabled': initialSettings.data.backupEnabled,
        'data.dataRetentionDays': initialSettings.data.dataRetentionDays,

        // Integrations
        'integrations.slackChannel': initialSettings.integrations?.slackChannel,
        'integrations.githubRepo': initialSettings.integrations?.githubRepo,
        'integrations.jiraProject': initialSettings.integrations?.jiraProject,

        // Notifications
        'notifications.projectUpdates': initialSettings.notifications?.projectUpdates,
        'notifications.memberActivity': initialSettings.notifications?.memberActivity,
        'notifications.systemAlerts': initialSettings.notifications?.systemAlerts
      });
    }
  }, [currentWorkspace, form]);

  /**
   * Handle form value changes
   */
  const handleFormChange = () => {
    setHasChanges(true);
  };

  /**
   * Handle save settings
   */
  const handleSave = async () => {
    if (!currentWorkspace || !canManageSettings) return;

    try {
      const values = await form.validateFields();

      // Construct settings object
      const updatedSettings: Partial<WorkspaceSettings> = {
        access: {
          visibility: values['access.visibility'],
          joinPolicy: values['access.joinPolicy'],
          externalAccess: values['access.externalAccess']
        },
        data: {
          allowDataExport: values['data.allowDataExport'],
          backupEnabled: values['data.backupEnabled'],
          dataRetentionDays: values['data.dataRetentionDays']
        },
        integrations: {
          slackChannel: values['integrations.slackChannel'],
          githubRepo: values['integrations.githubRepo'],
          jiraProject: values['integrations.jiraProject']
        },
        notifications: {
          projectUpdates: values['notifications.projectUpdates'],
          memberActivity: values['notifications.memberActivity'],
          systemAlerts: values['notifications.systemAlerts']
        }
      };

      await updateWorkspaceSettings(currentWorkspace.id, updatedSettings);
      setHasChanges(false);
      message.success('Workspace settings updated successfully');
    } catch (error) {
      message.error('Failed to update workspace settings');
    }
  };

  /**
   * Handle reset form
   */
  const handleReset = () => {
    if (currentWorkspace?.settings) {
      form.resetFields();
      setHasChanges(false);
    }
  };

  if (!currentWorkspace) {
    return (
      <Alert
        message="No Workspace Selected"
        description="Please select a workspace to manage its settings."
        type="warning"
        showIcon
      />
    );
  }

  if (!canManageSettings) {
    return (
      <Alert
        message="Access Denied"
        description="You don't have permission to manage workspace settings."
        type="error"
        showIcon
      />
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <SettingOutlined style={{ marginRight: 8 }} />
          Workspace Settings
        </Title>
        <Text type="secondary">
          Configure settings for <strong>{currentWorkspace.name}</strong>
        </Text>
        <div style={{ marginTop: 8 }}>
          <Tag color="blue">{currentWorkspace.type}</Tag>
          <Tag color={currentWorkspace.status === 'active' ? 'green' : 'orange'}>
            {currentWorkspace.status}
          </Tag>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
      >
        <Row gutter={24}>
          <Col span={16}>
            {/* Access Control */}
            <Card
              title={
                <Space>
                  <LockOutlined />
                  Access Control
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="access.visibility"
                    label="Workspace Visibility"
                    help="Who can see this workspace"
                  >
                    <Select>
                      <Option value="private">
                        <Space>
                          <LockOutlined />
                          Private - Only members
                        </Space>
                      </Option>
                      <Option value="tenant">
                        <Space>
                          <TeamOutlined />
                          Tenant - All tenant members
                        </Space>
                      </Option>
                      <Option value="public">
                        <Space>
                          <GlobalOutlined />
                          Public - Anyone with access
                        </Space>
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="access.joinPolicy"
                    label="Join Policy"
                    help="How new members can join"
                  >
                    <Select>
                      <Option value="open">Open - Anyone can join</Option>
                      <Option value="request">Request - Approval required</Option>
                      <Option value="invite_only">Invite Only - Invitation required</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="access.externalAccess"
                label="External Access"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Text type="secondary">
                Allow external users to access this workspace
              </Text>
            </Card>

            {/* Data Management */}
            <Card
              title="Data Management"
              style={{ marginBottom: 24 }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="data.allowDataExport"
                    label="Data Export"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Text type="secondary">
                    Allow members to export workspace data
                  </Text>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="data.backupEnabled"
                    label="Automatic Backup"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Text type="secondary">
                    Enable automatic data backup
                  </Text>
                </Col>
              </Row>

              <Form.Item
                name="data.dataRetentionDays"
                label="Data Retention (Days)"
                help="Number of days to retain deleted data (0 = indefinite)"
              >
                <Input
                  type="number"
                  min={0}
                  max={3650}
                  placeholder="365"
                />
              </Form.Item>
            </Card>

            {/* Integrations */}
            <Card
              title="Integrations"
              style={{ marginBottom: 24 }}
            >
              <Form.Item
                name="integrations.slackChannel"
                label={
                  <Space>
                    <SlackOutlined />
                    Slack Channel
                  </Space>
                }
                help="Slack channel for workspace notifications"
              >
                <Input placeholder="#workspace-updates" />
              </Form.Item>

              <Form.Item
                name="integrations.githubRepo"
                label={
                  <Space>
                    <GithubOutlined />
                    GitHub Repository
                  </Space>
                }
                help="Connected GitHub repository"
              >
                <Input placeholder="organization/repository" />
              </Form.Item>

              <Form.Item
                name="integrations.jiraProject"
                label="Jira Project"
                help="Connected Jira project key"
              >
                <Input placeholder="PROJ" />
              </Form.Item>
            </Card>
          </Col>

          <Col span={8}>
            {/* Notifications */}
            <Card
              title="Notifications"
              style={{ marginBottom: 24 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Form.Item
                    name="notifications.projectUpdates"
                    valuePropName="checked"
                    style={{ marginBottom: 8 }}
                  >
                    <Switch size="small" />
                  </Form.Item>
                  <div>
                    <Text strong>Project Updates</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Notifications about project milestones and updates
                    </Text>
                  </div>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <div>
                  <Form.Item
                    name="notifications.memberActivity"
                    valuePropName="checked"
                    style={{ marginBottom: 8 }}
                  >
                    <Switch size="small" />
                  </Form.Item>
                  <div>
                    <Text strong>Member Activity</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Notifications about member joins, leaves, and role changes
                    </Text>
                  </div>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <div>
                  <Form.Item
                    name="notifications.systemAlerts"
                    valuePropName="checked"
                    style={{ marginBottom: 8 }}
                  >
                    <Switch size="small" />
                  </Form.Item>
                  <div>
                    <Text strong>System Alerts</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Important system notifications and maintenance alerts
                    </Text>
                  </div>
                </div>
              </Space>
            </Card>

            {/* Actions */}
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={loading}
                  disabled={!hasChanges}
                  block
                >
                  Save Settings
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={!hasChanges}
                  block
                >
                  Reset Changes
                </Button>
              </Space>

              {hasChanges && (
                <Alert
                  message="You have unsaved changes"
                  type="warning"
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default WorkspaceSettingsPage;