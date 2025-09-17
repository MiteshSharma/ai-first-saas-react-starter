/**
 * @fileoverview Audit Logs Page
 *
 * Main page component for viewing and managing audit logs
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Tooltip,
  Typography,
  Dropdown,
  Menu,
  Badge,
  Alert,
  Statistic,
  Empty,
} from 'antd';
import {
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuditStore } from '../stores/auditStore';
import {
  AuditLog,
  AuditAction,
  AuditResource,
  AuditStatus,
  AuditSeverity,
} from '../types';
import AuditLogDetail from '../components/AuditLogDetail';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

const AuditLogsPage: React.FC = () => {
  const {
    logs,
    loading,
    error,
    filters,
    page,
    pageSize,
    total,
    stats,
    fetchLogs,
    fetchStats,
    setFilters,
    clearFilters,
    setPage,
    setPageSize,
    clearError,
  } = useAuditStore();

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => {
    // Fetch initial data
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  const handleSearch = (value: string) => {
    setFilters({ search: value });
  };


  const handleViewDetail = (record: AuditLog) => {
    setSelectedLog(record);
    setDetailVisible(true);
  };

  const getStatusColor = (status: AuditStatus) => {
    switch (status) {
      case AuditStatus.SUCCESS:
        return 'success';
      case AuditStatus.FAILURE:
        return 'error';
      case AuditStatus.WARNING:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSeverityColor = (severity: AuditSeverity) => {
    switch (severity) {
      case AuditSeverity.CRITICAL:
        return 'red';
      case AuditSeverity.HIGH:
        return 'orange';
      case AuditSeverity.MEDIUM:
        return 'gold';
      case AuditSeverity.LOW:
        return 'green';
      default:
        return 'default';
    }
  };

  const getActionIcon = (action: AuditAction) => {
    if (action.includes('CREATE')) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    if (action.includes('DELETE')) return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    if (action.includes('UPDATE')) return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    if (action.includes('LOGIN')) return <InfoCircleOutlined style={{ color: '#722ed1' }} />;
    return <InfoCircleOutlined />;
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: Date) => (
        <Tooltip title={dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}>
          <Text type="secondary">{dayjs(timestamp).fromNow()}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
      render: (userName: string, record: AuditLog) => (
        <Space direction="vertical" size={0}>
          <Text strong>{userName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.userEmail}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action: AuditAction) => (
        <Space>
          {getActionIcon(action)}
          <Text>{action.replace(/_/g, ' ')}</Text>
        </Space>
      ),
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      width: 120,
      render: (resource: AuditResource) => (
        <Tag color="blue">{resource.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AuditStatus) => (
        <Badge status={getStatusColor(status) as 'success' | 'error' | 'warning' | 'default'} text={status} />
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: AuditSeverity) => (
        <Tag color={getSeverityColor(severity)}>{severity.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
      render: (ip: string) => <Text code>{ip}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_: unknown, record: AuditLog) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="view"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
              >
                View Details
              </Menu.Item>
            </Menu>
          }
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];


  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
              <Col>
                <Title level={4} style={{ margin: 0 }}>
                  <FileTextOutlined /> Audit Logs
                </Title>
              </Col>
              <Col>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      fetchLogs();
                      fetchStats();
                    }}
                    loading={loading}
                  >
                    Refresh
                  </Button>
                </Space>
              </Col>
            </Row>

            {/* Statistics */}
            {stats && (
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Total Logs"
                      value={stats.totalLogs}
                      prefix={<FileTextOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Success"
                      value={stats.successCount}
                      valueStyle={{ color: '#3f8600' }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Failures"
                      value={stats.failureCount}
                      valueStyle={{ color: '#cf1322' }}
                      prefix={<CloseCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Warnings"
                      value={stats.warningCount}
                      valueStyle={{ color: '#faad14' }}
                      prefix={<WarningOutlined />}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            {/* Filters */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Input.Search
                  placeholder="Search by user, email, or description"
                  allowClear
                  enterButton={<SearchOutlined />}
                  onSearch={handleSearch}
                  onChange={() => {}}
                />
              </Col>
              <Col span={4}>
                <Select
                  placeholder="Action"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => setFilters({ action: value })}
                  value={filters.action}
                >
                  {Object.values(AuditAction).map((action) => (
                    <Option key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  placeholder="Resource"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => setFilters({ resource: value })}
                  value={filters.resource}
                >
                  {Object.values(AuditResource).map((resource) => (
                    <Option key={resource} value={resource}>
                      {resource.toUpperCase()}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  placeholder="Status"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => setFilters({ status: value })}
                  value={filters.status}
                >
                  {Object.values(AuditStatus).map((status) => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Button
                  icon={<FilterOutlined />}
                  onClick={clearFilters}
                  disabled={Object.keys(filters).length === 0}
                >
                  Clear Filters
                </Button>
              </Col>
            </Row>

            {/* Error Alert */}
            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                closable
                onClose={clearError}
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Table */}
            <Table
              columns={columns}
              dataSource={logs}
              rowKey="id"
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} items`,
                onChange: (page, pageSize) => {
                  setPage(page);
                  if (pageSize) setPageSize(pageSize);
                },
              }}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No audit logs found"
                  />
                ),
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detail Modal */}
      {selectedLog && (
        <AuditLogDetail
          log={selectedLog}
          visible={detailVisible}
          onClose={() => {
            setDetailVisible(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
};

export default AuditLogsPage;