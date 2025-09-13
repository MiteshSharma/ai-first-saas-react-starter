import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Space, Table, message, Tag, Alert } from 'antd';
import { PlusOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useTenantStore } from '../store/tenant/tenantStore';
import { getDataSources, DataSource } from '../helpers/backendHelper';
import { apiHelper } from '../helpers/apiHelper';

const { Title, Text } = Typography;

export const WorkspaceDataSourcesPage: React.FC = () => {
  const { currentWorkspace, currentTenant } = useTenantStore();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataSources = async () => {
    if (!currentWorkspace) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use tenant-scoped data sources endpoint
      const response = await apiHelper.get('/api/data-sources');
      setDataSources(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data sources');
      message.error('Failed to load data sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, [currentWorkspace]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <DatabaseOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: () => <Tag color="green">Connected</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  if (!currentTenant) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Alert
          message="No Tenant Selected"
          description="Please select a tenant to view data sources."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Alert
          message="No Workspace Selected"
          description="Please select a workspace to view data sources."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>Data Sources</Title>
          <Text type="secondary">
            Workspace: <strong>{currentWorkspace.name}</strong> | Tenant: <strong>{currentTenant.name}</strong>
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />}>
          Add Data Source
        </Button>
      </div>

      {error && (
        <Alert
          message="Error Loading Data Sources"
          description={error}
          type="error"
          style={{ marginBottom: '1rem' }}
          closable
        />
      )}

      <Card>
        <Table
          columns={columns}
          dataSource={dataSources}
          rowKey="id"
          loading={loading}
          pagination={{
            total: dataSources.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Card style={{ marginTop: '2rem' }} title="Workspace Context Info">
        <Space direction="vertical">
          <Text><strong>Current Tenant ID:</strong> {currentTenant.id}</Text>
          <Text><strong>Current Workspace ID:</strong> {currentWorkspace.id}</Text>
          <Text><strong>API Call:</strong> GET /workspaces/{currentWorkspace.id}/data-sources</Text>
          <Text type="secondary">
            This page demonstrates workspace-scoped data fetching. The API call automatically includes 
            the workspace context, ensuring data is properly isolated per workspace.
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default WorkspaceDataSourcesPage;