/**
 * @fileoverview Audit Log Detail Component
 *
 * Modal component for displaying detailed audit log information
 */

import React from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Typography,
  Space,
  Card,
  Row,
  Col,
  Badge,
  Tooltip,
  Divider,
  Timeline,
  Alert,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AuditLog, AuditStatus, AuditSeverity, AuditAction } from '../types';

const { Title, Text, Paragraph } = Typography;

interface AuditLogDetailProps {
  log: AuditLog;
  visible: boolean;
  onClose: () => void;
}

const AuditLogDetail: React.FC<AuditLogDetailProps> = ({ log, visible, onClose }) => {
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

  const renderChanges = () => {
    if (!log.changes) return null;

    return (
      <Card title="Changes" size="small" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Title level={5}>Before</Title>
            <Card size="small" style={{ backgroundColor: '#fff2f0' }}>
              <pre style={{ margin: 0, fontSize: 12 }}>
                {JSON.stringify(log.changes.before, null, 2)}
              </pre>
            </Card>
          </Col>
          <Col span={12}>
            <Title level={5}>After</Title>
            <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
              <pre style={{ margin: 0, fontSize: 12 }}>
                {JSON.stringify(log.changes.after, null, 2)}
              </pre>
            </Card>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderMetadata = () => {
    if (!log.metadata || Object.keys(log.metadata).length === 0) return null;

    return (
      <Card title="Metadata" size="small" style={{ marginTop: 16 }}>
        <Descriptions column={2} size="small">
          {Object.entries(log.metadata).map(([key, value]) => (
            <Descriptions.Item key={key} label={key}>
              {typeof value === 'object' ? (
                <pre style={{ margin: 0, fontSize: 12 }}>
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                String(value)
              )}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>
    );
  };

  const renderTimeline = () => {
    const timelineItems = [
      {
        color: getStatusColor(log.status),
        dot: getActionIcon(log.action),
        children: (
          <div>
            <Space direction="vertical" size={0}>
              <Text strong>{log.action.replace(/_/g, ' ')}</Text>
              <Text type="secondary">{log.description}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
            </Space>
          </div>
        ),
      },
    ];

    if (log.duration) {
      timelineItems.push({
        color: 'blue',
        dot: <ClockCircleOutlined />,
        children: (
          <div>
            <Text>Operation completed</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Duration: {log.duration}ms
            </Text>
          </div>
        ),
      });
    }

    return (
      <Card title="Timeline" size="small" style={{ marginTop: 16 }}>
        <Timeline items={timelineItems} />
      </Card>
    );
  };

  return (
    <Modal
      title={
        <Space>
          {getActionIcon(log.action)}
          <span>Audit Log Details</span>
          <Badge status={getStatusColor(log.status) as any} text={log.status} />
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Error Message */}
        {log.errorMessage && (
          <Alert
            message="Error Details"
            description={log.errorMessage}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Basic Information */}
        <Descriptions title="Basic Information" column={2} bordered>
          <Descriptions.Item label="ID" span={2}>
            <Text code>{log.id}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Timestamp">
            <Tooltip title={dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}>
              <Space>
                <ClockCircleOutlined />
                {dayjs(log.timestamp).fromNow()}
              </Space>
            </Tooltip>
          </Descriptions.Item>

          <Descriptions.Item label="Duration">
            {log.duration ? `${log.duration}ms` : 'N/A'}
          </Descriptions.Item>

          <Descriptions.Item label="User">
            <Space direction="vertical" size={0}>
              <Space>
                <UserOutlined />
                <Text strong>{log.userName}</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {log.userEmail}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ID: {log.userId}
              </Text>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Tenant">
            <Space direction="vertical" size={0}>
              <Text strong>{log.tenantName || 'N/A'}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ID: {log.tenantId}
              </Text>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Action">
            <Space>
              {getActionIcon(log.action)}
              <Tag color="blue">{log.action.replace(/_/g, ' ')}</Tag>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Resource">
            <Space direction="vertical" size={0}>
              <Tag color="green">{log.resource.toUpperCase()}</Tag>
              {log.resourceName && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {log.resourceName}
                </Text>
              )}
              {log.resourceId && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ID: {log.resourceId}
                </Text>
              )}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Status">
            <Badge status={getStatusColor(log.status) as any} text={log.status.toUpperCase()} />
          </Descriptions.Item>

          <Descriptions.Item label="Severity">
            <Tag color={getSeverityColor(log.severity)}>{log.severity.toUpperCase()}</Tag>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Technical Details */}
        <Descriptions title="Technical Details" column={2} bordered>
          <Descriptions.Item label="IP Address">
            <Space>
              <GlobalOutlined />
              <Text code>{log.ipAddress || 'N/A'}</Text>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Location">
            {log.location ? (
              <Space>
                <GlobalOutlined />
                <Text>{log.location.city}, {log.location.country}</Text>
              </Space>
            ) : (
              'N/A'
            )}
          </Descriptions.Item>

          <Descriptions.Item label="User Agent" span={2}>
            <Text code style={{ fontSize: 12, wordBreak: 'break-all' }}>
              {log.userAgent || 'N/A'}
            </Text>
          </Descriptions.Item>

          {log.traceId && (
            <Descriptions.Item label="Trace ID" span={2}>
              <Space>
                <CodeOutlined />
                <Text code>{log.traceId}</Text>
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* Description */}
        {log.description && (
          <>
            <Divider />
            <Card title="Description" size="small">
              <Paragraph>{log.description}</Paragraph>
            </Card>
          </>
        )}

        {/* Changes */}
        {renderChanges()}

        {/* Metadata */}
        {renderMetadata()}

        {/* Timeline */}
        {renderTimeline()}
      </div>
    </Modal>
  );
};

export default AuditLogDetail;