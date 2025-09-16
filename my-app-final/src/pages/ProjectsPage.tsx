/**
 * @fileoverview Projects page demonstrating workspace-scoped data management
 * 
 * This page shows how to build workspace-aware functionality:
 * - Automatically filters data by current workspace
 * - Updates when workspace changes
 * - Handles workspace-scoped operations (create, update, delete)
 * - Provides proper loading and error states
 */

import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Progress, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Alert,
  Divider,
  Empty
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ProjectOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useProjectStore } from '../core/stores/projects';
import { useTenantStore } from '../plugins/tenant-management/stores/tenantStore';
import type { Project, ProjectStatus, ProjectPriority, CreateProjectPayload } from '../core/stores/projects/types';
import { logger } from '../core/utils/logger';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

export const ProjectsPage: React.FC = () => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();

  // Store hooks
  const { 
    currentWorkspaceProjects,
    loading,
    error,
    canCreateProject,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    searchProjects,
    setCurrentProject,
    setError
  } = useProjectStore();

  const { currentTenant } = useTenantStore();

  // Load projects when tenant changes
  useEffect(() => {
    if (currentTenant) {
      fetchProjects(currentTenant.id);
    }
  }, [currentTenant, fetchProjects]);

  // Handle create project
  const handleCreateProject = async (values: CreateProjectPayload) => {
    if (!currentTenant) return;
    
    try {
      await createProject(currentTenant.id, values);
      setCreateModalVisible(false);
      form.resetFields();
    } catch (error) {
      logger.error('Failed to create project', 'ProjectsPage', error);
    }
  };

  // Handle edit project
  const handleEditProject = async (values: Partial<CreateProjectPayload>) => {
    if (!editingProject) return;
    
    try {
      await updateProject(editingProject.id, values);
      setEditingProject(null);
      form.resetFields();
    } catch (error) {
      logger.error('Failed to update project', 'ProjectsPage', error);
    }
  };

  // Handle delete project
  const handleDeleteProject = (project: Project) => {
    Modal.confirm({
      title: 'Delete Project',
      content: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteProject(project.id);
        } catch (error) {
          logger.error('Failed to delete project', 'ProjectsPage', error);
        }
      }
    });
  };

  // Handle search
  const handleSearch = async (value: string) => {
    if (!currentTenant) return;
    
    if (value.trim()) {
      await searchProjects(currentTenant.id, value);
    } else {
      await fetchProjects(currentTenant.id);
    }
  };

  // Status color mapping
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'purple';
      case 'on_hold': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority: ProjectPriority) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Project',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, project: Project) => (
        <Space direction="vertical" size="small">
          <Button 
            type="link" 
            style={{ padding: 0, fontSize: '16px', fontWeight: 600 }}
            onClick={() => setCurrentProject(project)}
          >
            {name}
          </Button>
          {project.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {project.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: ProjectStatus) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: ProjectPriority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress 
          percent={progress} 
          size="small" 
          status={progress === 100 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: 'Members',
      dataIndex: 'memberIds',
      key: 'memberIds',
      render: (memberIds: string[]) => (
        <Space>
          <TeamOutlined />
          <Text>{memberIds?.length || 0}</Text>
        </Space>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (dueDate: string) => 
        dueDate ? dayjs(dueDate).format('MMM D, YYYY') : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, project: Project) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingProject(project);
              form.setFieldsValue({
                name: project.name,
                description: project.description,
                status: project.status,
                priority: project.priority,
                dueDate: project.dueDate ? dayjs(project.dueDate) : undefined
              });
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeleteProject(project)}
          />
        </Space>
      ),
    },
  ];

  // Show tenant selection prompt if no tenant is selected
  if (!currentTenant) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Please select a tenant to view projects"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <ProjectOutlined style={{ marginRight: '0.5rem' }} />
              Projects
            </Title>
            <Paragraph type="secondary" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
              Tenant: <strong>{currentTenant.name}</strong>
            </Paragraph>
          </div>
          {canCreateProject && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              New Project
            </Button>
          )}
        </Space>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Error"
          description={error.message}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '1rem' }}
        />
      )}

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <Search
          placeholder="Search projects..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          loading={loading}
        />
      </div>

      {/* Projects Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={currentWorkspaceProjects}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} projects`
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        open={createModalVisible || !!editingProject}
        onCancel={() => {
          setCreateModalVisible(false);
          setEditingProject(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingProject ? handleEditProject : handleCreateProject}
        >
          <Form.Item
            name="name"
            label="Project Name"
            rules={[
              { required: true, message: 'Please enter a project name' },
              { min: 2, message: 'Name must be at least 2 characters' }
            ]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              rows={3}
              placeholder="Enter project description (optional)"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="draft"
          >
            <Select>
              <Select.Option value="draft">Draft</Select.Option>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="on_hold">On Hold</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            initialValue="medium"
          >
            <Select>
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="urgent">Urgent</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Due Date"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingProject ? 'Update Project' : 'Create Project'}
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false);
                setEditingProject(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;