import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Alert, 
  Row, 
  Col, 
  Divider, 
  message, 
  Tag, 
  Descriptions,
  Table,
  Tabs,
  Select,
  Badge
} from 'antd';
import { 
  ReloadOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  TeamOutlined,
  FolderOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import { apiHelper } from '../core/api/apiHelper';
import { useTenantStore } from '../core/stores/tenant/tenantStore';
import { TenantSwitcher } from '../core/components/layout/tenant/TenantSwitcher';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
  tenantId?: string;
}

interface IsolationData {
  dataSources: any[];
  charts: any[];
  tenantInfo?: any;
}

export const TenantIsolationTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isolationData, setIsolationData] = useState<Record<string, IsolationData>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTenantForTest, setSelectedTenantForTest] = useState<string>('');

  const { 
    tenants, 
    currentTenant, 
    loading: tenantLoading,
    switchTenant,
    fetchTenants 
  } = useTenantStore();

  useEffect(() => {
    if (tenants.length === 0 && !tenantLoading) {
      fetchTenants();
    }
  }, [tenants.length, tenantLoading, fetchTenants]);

  const updateResult = (name: string, status: TestResult['status'], message: string, details?: any, tenantId?: string) => {
    setTestResults(prev => {
      const existingIndex = prev.findIndex(r => r.name === name);
      const newResult: TestResult = { name, status, message, details, tenantId };
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newResult;
        return updated;
      } else {
        return [...prev, newResult];
      }
    });
  };

  const runTest = async (testName: string, testFn: () => Promise<any>, tenantId?: string) => {
    updateResult(testName, 'running', 'Running test...', undefined, tenantId);
    
    try {
      const result = await testFn();
      updateResult(testName, 'success', 'Test passed', result, tenantId);
      return result;
    } catch (error: any) {
      updateResult(testName, 'error', error.message || 'Test failed', error, tenantId);
      throw error;
    }
  };

  const testTenantIsolation = async () => {
    const tenantId = currentTenant?.id;
    if (!tenantId) {
      message.error('No tenant selected');
      return;
    }

    await runTest('Tenant Isolation Validation', async () => {
      const response = await apiHelper.get('/test/tenant-isolation');
      return response.data;
    }, tenantId);
  };

  const testDataSourceIsolation = async () => {
    const tenantId = currentTenant?.id;
    if (!tenantId) {
      message.error('No tenant selected');
      return;
    }

    await runTest('Data Sources Isolation', async () => {
      const response = await apiHelper.get('/data-sources');
      
      // Cast response.data to proper type
      const responseData = response.data as { data: any[]; meta?: any };

      // Store data for comparison
      setIsolationData(prev => ({
        ...prev,
        [tenantId]: {
          ...prev[tenantId],
          dataSources: responseData.data
        }
      }));

      return {
        tenantId,
        dataSources: responseData.data,
        meta: responseData.meta
      };
    }, tenantId);
  };

  const testChartsIsolation = async () => {
    const tenantId = currentTenant?.id;
    if (!tenantId) {
      message.error('No tenant selected');
      return;
    }

    await runTest('Charts Isolation', async () => {
      const response = await apiHelper.get('/charts');
      
      // Cast response.data to proper type
      const responseData = response.data as { data: any[]; meta?: any };

      // Store data for comparison
      setIsolationData(prev => ({
        ...prev,
        [tenantId]: {
          ...prev[tenantId],
          charts: responseData.data
        }
      }));

      return {
        tenantId,
        charts: responseData.data,
        meta: responseData.meta
      };
    }, tenantId);
  };

  const testTenantSwitching = async () => {
    if (!selectedTenantForTest) {
      message.error('Please select a tenant to switch to');
      return;
    }

    await runTest(`Switch to Tenant: ${selectedTenantForTest}`, async () => {
      const targetTenant = tenants.find(t => t.id === selectedTenantForTest);
      if (!targetTenant) {
        throw new Error('Target tenant not found');
      }

      // Switch tenant
      await switchTenant(selectedTenantForTest);
      
      // Test that data changes after switch
      const [dataSources, charts] = await Promise.all([
        apiHelper.get('/data-sources'),
        apiHelper.get('/charts')
      ]);

      // Cast response data to proper types
      const dataSourcesData = dataSources.data as { data: any[]; meta?: any };
      const chartsData = charts.data as { data: any[]; meta?: any };

      // Store switched tenant data
      setIsolationData(prev => ({
        ...prev,
        [selectedTenantForTest]: {
          dataSources: dataSourcesData.data,
          charts: chartsData.data
        }
      }));

      return {
        switchedTo: targetTenant.name,
        newTenantId: selectedTenantForTest,
        dataSources: dataSourcesData.data.length,
        charts: chartsData.data.length
      };
    }, selectedTenantForTest);
  };

  const runAllIsolationTests = async () => {
    if (!currentTenant) {
      message.error('Please select a tenant first');
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Test current tenant isolation
      await testTenantIsolation();
      await testDataSourceIsolation();
      await testChartsIsolation();
      
      message.success('Tenant isolation tests completed');
    } catch (error) {
      message.error('Some tests failed - check results');
    } finally {
      setIsRunning(false);
    }
  };

  const compareTenantData = () => {
    const tenantIds = Object.keys(isolationData);
    if (tenantIds.length < 2) {
      message.warning('Switch to at least 2 tenants to compare data isolation');
      return;
    }

    const comparison = tenantIds.map(tenantId => {
      const tenant = tenants.find(t => t.id === tenantId);
      const data = isolationData[tenantId];
      
      return {
        tenantId,
        tenantName: tenant?.name || 'Unknown',
        dataSources: data?.dataSources?.length || 0,
        charts: data?.charts?.length || 0
      };
    });

    return comparison;
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'running':
        return <ReloadOutlined spin style={{ color: '#1890ff' }} />;
      default:
        return null;
    }
  };

  const comparisonData = compareTenantData();

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <Title level={2}>
        <SecurityScanOutlined style={{ marginRight: 8 }} />
        US-7: Multi-Tenant Data Isolation Testing
      </Title>
      
      <Alert
        message="Multi-Tenant Isolation Test Suite"
        description="This page validates that data is properly isolated between tenants and workspaces. Each tenant should only access their own data, and tenant switching should show different data sets."
        type="info"
        style={{ marginBottom: '2rem' }}
      />

      <Row gutter={[24, 24]}>
        <Col span={16}>
          <Card title="Current Context" style={{ marginBottom: '2rem' }}>
            <Descriptions column={2}>
              <Descriptions.Item label="Current Tenant">
                {currentTenant ? (
                  <Space>
                    <Badge color="green" />
                    <Text strong>{currentTenant.name}</Text>
                    <Tag color="blue">{currentTenant.plan}</Tag>
                  </Space>
                ) : (
                  <Text type="secondary">No tenant selected</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Tenant ID">
                <Text code>{currentTenant?.id || 'None'}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Isolation Tests" style={{ marginBottom: '2rem' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Button 
                    type="primary" 
                    onClick={runAllIsolationTests} 
                    loading={isRunning}
                    icon={<ReloadOutlined />}
                    disabled={!currentTenant}
                    block
                  >
                    Run Isolation Tests
                  </Button>
                </Col>
                <Col span={12}>
                  <Space>
                    <Select
                      placeholder="Select tenant to switch to"
                      style={{ width: 200 }}
                      value={selectedTenantForTest}
                      onChange={setSelectedTenantForTest}
                    >
                      {tenants.filter(t => t.id !== currentTenant?.id).map(tenant => (
                        <Option key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </Option>
                      ))}
                    </Select>
                    <Button 
                      onClick={testTenantSwitching}
                      disabled={!selectedTenantForTest}
                      icon={<ReloadOutlined />}
                    >
                      Test Switch
                    </Button>
                  </Space>
                </Col>
              </Row>

              <Divider />

              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Button 
                    block 
                    onClick={testTenantIsolation}
                    icon={<SecurityScanOutlined />}
                    disabled={!currentTenant}
                  >
                    Test Tenant Context
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    block 
                    onClick={testDataSourceIsolation}
                    icon={<DatabaseOutlined />}
                    disabled={!currentTenant}
                  >
                    Test Data Sources
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    block 
                    onClick={testChartsIsolation}
                    icon={<BarChartOutlined />}
                    disabled={!currentTenant}
                  >
                    Test Charts
                  </Button>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Tenant Switcher" style={{ marginBottom: '2rem' }}>
            <TenantSwitcher 
              showLabel={true}
              size="large"
              style={{ width: '100%' }}
            />
            
            {currentTenant && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  API requests will include header:
                </Text>
                <br />
                <Text code style={{ fontSize: '11px' }}>
                  X-Tenant-Id: {currentTenant.id}
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="results" style={{ marginTop: '2rem' }}>
        <TabPane tab="Test Results" key="results">
          <Card title="Test Results">
            {testResults.length === 0 && (
              <Text type="secondary">No tests run yet. Select a tenant and click "Run Isolation Tests" to start.</Text>
            )}
            
            {testResults.map((result, index) => (
              <Card 
                key={index}
                size="small" 
                style={{ marginBottom: '1rem' }}
                title={
                  <Space>
                    {getStatusIcon(result.status)}
                    {result.name}
                    {result.tenantId && (
                      <Tag color="blue" style={{ fontSize: '10px' }}>
                        {tenants.find(t => t.id === result.tenantId)?.name || result.tenantId}
                      </Tag>
                    )}
                  </Space>
                }
              >
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Status">
                    <Tag color={result.status === 'success' ? 'green' : result.status === 'error' ? 'red' : 'blue'}>
                      {result.status.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Message">
                    {result.message}
                  </Descriptions.Item>
                </Descriptions>

                {result.details && (
                  <details style={{ marginTop: '8px' }}>
                    <summary>Details</summary>
                    <pre style={{ 
                      background: '#f5f5f5', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      overflow: 'auto',
                      fontSize: '11px'
                    }}>
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </Card>
            ))}
          </Card>
        </TabPane>

        <TabPane tab="Data Comparison" key="comparison">
          <Card title="Tenant Data Comparison">
            {comparisonData && comparisonData.length > 0 ? (
              <Table
                dataSource={comparisonData}
                rowKey="tenantId"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Tenant',
                    dataIndex: 'tenantName',
                    key: 'tenantName',
                    render: (name: string, record: any) => (
                      <Space>
                        <Badge 
                          color={record.tenantId === currentTenant?.id ? 'green' : 'default'} 
                        />
                        <Text strong={record.tenantId === currentTenant?.id}>
                          {name}
                        </Text>
                        {record.tenantId === currentTenant?.id && (
                          <Tag color="green">Current</Tag>
                        )}
                      </Space>
                    )
                  },
                  {
                    title: 'Tenant ID',
                    dataIndex: 'tenantId',
                    key: 'tenantId',
                    render: (id: string) => <Text code style={{ fontSize: '11px' }}>{id}</Text>
                  },
                  {
                    title: <><DatabaseOutlined /> Data Sources</>,
                    dataIndex: 'dataSources',
                    key: 'dataSources',
                    align: 'center',
                    render: (count: number) => <Badge count={count} color="blue" />
                  },
                  {
                    title: <><BarChartOutlined /> Charts</>,
                    dataIndex: 'charts',
                    key: 'charts',
                    align: 'center',
                    render: (count: number) => <Badge count={count} color="green" />
                  }
                ]}
              />
            ) : (
              <Alert
                message="No Data to Compare"
                description="Switch between different tenants and run isolation tests to see data comparison."
                type="info"
                showIcon
              />
            )}
          </Card>
        </TabPane>
      </Tabs>

      <Card title="Expected Behaviors" style={{ marginTop: '2rem' }}>
        <Paragraph>
          <Text strong>US-7 Multi-Tenant Isolation Acceptance Criteria:</Text>
        </Paragraph>
        <ul>
          <li><Text strong>Tenant Context Validation:</Text> All API requests must include X-Tenant-Id header</li>
          <li><Text strong>Data Isolation:</Text> Each tenant sees only their own data sources and charts</li>
          <li><Text strong>Tenant Switching:</Text> Switching tenants should show different data sets immediately</li>
          <li><Text strong>Access Control:</Text> Users can only access tenants they are members of</li>
          <li><Text strong>Workspace Scoping:</Text> Data within workspaces is properly scoped to tenant</li>
        </ul>
      </Card>
    </div>
  );
};

export default TenantIsolationTestPage;