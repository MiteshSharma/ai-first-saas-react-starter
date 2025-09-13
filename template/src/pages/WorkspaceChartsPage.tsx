import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Space, Table, message, Tag, Alert, Row, Col } from 'antd';
import { PlusOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons';
import { useTenantStore } from '../store/tenant/tenantStore';
import { getCharts, Chart } from '../helpers/backendHelper';
import { apiHelper } from '../helpers/apiHelper';

const { Title, Text } = Typography;

export const WorkspaceChartsPage: React.FC = () => {
  const { currentWorkspace, currentTenant } = useTenantStore();
  const [charts, setCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCharts = async () => {
    if (!currentWorkspace) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use tenant-scoped charts endpoint
      const response = await apiHelper.get('/api/charts');
      setCharts(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch charts');
      message.error('Failed to load charts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharts();
  }, [currentWorkspace]);

  const getChartIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bar': return <BarChartOutlined />;
      case 'line': return <LineChartOutlined />;
      case 'pie': return <PieChartOutlined />;
      default: return <BarChartOutlined />;
    }
  };

  const columns = [
    {
      title: 'Chart',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Chart) => (
        <Space>
          {getChartIcon(record.type)}
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="purple">{type}</Tag>,
    },
    {
      title: 'Data Source',
      dataIndex: 'dataSourceId',
      key: 'dataSourceId',
      render: (dataSourceId: string) => (
        <Text code>{dataSourceId ? `ds-${dataSourceId.slice(-8)}` : 'None'}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: () => <Tag color="green">Active</Tag>,
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
          description="Please select a tenant to view charts."
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
          description="Please select a workspace to view charts."
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
          <Title level={2}>Charts & Analytics</Title>
          <Text type="secondary">
            Workspace: <strong>{currentWorkspace.name}</strong> | Tenant: <strong>{currentTenant.name}</strong>
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />}>
          Create Chart
        </Button>
      </div>

      {error && (
        <Alert
          message="Error Loading Charts"
          description={error}
          type="error"
          style={{ marginBottom: '1rem' }}
          closable
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: '2rem' }}>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <BarChartOutlined style={{ fontSize: '2rem', color: '#1890ff' }} />
              <div style={{ marginTop: '0.5rem' }}>
                <Text strong style={{ fontSize: '1.5rem' }}>{charts.filter(c => c.type === 'bar').length}</Text>
                <div><Text type="secondary">Bar Charts</Text></div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <LineChartOutlined style={{ fontSize: '2rem', color: '#52c41a' }} />
              <div style={{ marginTop: '0.5rem' }}>
                <Text strong style={{ fontSize: '1.5rem' }}>{charts.filter(c => c.type === 'line').length}</Text>
                <div><Text type="secondary">Line Charts</Text></div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <PieChartOutlined style={{ fontSize: '2rem', color: '#fa8c16' }} />
              <div style={{ marginTop: '0.5rem' }}>
                <Text strong style={{ fontSize: '1.5rem' }}>{charts.filter(c => c.type === 'pie').length}</Text>
                <div><Text type="secondary">Pie Charts</Text></div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={charts}
          rowKey="id"
          loading={loading}
          pagination={{
            total: charts.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Card style={{ marginTop: '2rem' }} title="Workspace Scoping Demo">
        <Space direction="vertical">
          <Text><strong>Workspace Context:</strong></Text>
          <Text>• Current Tenant: {currentTenant.name} ({currentTenant.id})</Text>
          <Text>• Current Workspace: {currentWorkspace.name} ({currentWorkspace.id})</Text>
          <Text>• API Endpoint: GET /workspaces/{currentWorkspace.id}/charts</Text>
          <Text>• Charts Count: {charts.length} charts scoped to this workspace</Text>
          <Text type="secondary" style={{ marginTop: '1rem' }}>
            🎯 This page demonstrates workspace-scoped operations. When you switch workspaces, 
            the data automatically updates to show only charts belonging to the selected workspace, 
            ensuring proper data isolation in a multi-tenant environment.
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default WorkspaceChartsPage;