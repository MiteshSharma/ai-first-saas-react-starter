/**
 * @fileoverview Permission Viewer Component
 *
 * Display user permissions in an organized, searchable format
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  Alert,
  Badge,
  Collapse,
  Tree,
  Button,
  Divider,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  SearchOutlined,
  SecurityScanOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  FolderOutlined,
  FileOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { usePermissions } from '../hooks/usePermissions';
import { ContextualPermission, AccessContext } from '../types';

const { Text, Title } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

interface PermissionViewerProps {
  userId?: string;
  context?: Partial<AccessContext>;
  showInherited?: boolean;
  groupBy?: 'category' | 'scope' | 'resource';
  viewMode?: 'table' | 'tree' | 'grid';
}

interface PermissionGroup {
  key: string;
  name: string;
  permissions: ContextualPermission[];
  grantedCount: number;
  totalCount: number;
}

export const PermissionViewer: React.FC<PermissionViewerProps> = ({
  userId,
  context,
  showInherited = true,
  groupBy = 'category',
  viewMode = 'table',
}) => {
  const { permissions, getEffectivePermissions, loading } = usePermissions(context);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScope, setFilterScope] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // Get effective permissions for display
  const effectivePermissions = useMemo(() => {
    try {
      return getEffectivePermissions(context);
    } catch {
      return permissions;
    }
  }, [permissions, context, getEffectivePermissions]);

  // Filter permissions based on search and filters
  const filteredPermissions = useMemo(() => {
    return effectivePermissions.filter(permission => {
      const matchesSearch = !searchTerm ||
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesScope = filterScope === 'all' || permission.scope === filterScope;

      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'granted' && permission.granted) ||
        (filterStatus === 'denied' && !permission.granted);

      return matchesSearch && matchesScope && matchesStatus;
    });
  }, [effectivePermissions, searchTerm, filterScope, filterStatus]);

  // Group permissions based on groupBy prop
  const groupedPermissions = useMemo(() => {
    const groups: PermissionGroup[] = [];
    const groupMap = new Map<string, ContextualPermission[]>();

    filteredPermissions.forEach(permission => {
      let groupKey: string;
      let groupName: string;

      switch (groupBy) {
        case 'scope':
          groupKey = permission.scope;
          groupName = permission.scope.charAt(0).toUpperCase() + permission.scope.slice(1);
          break;
        case 'resource':
          groupKey = permission.resource;
          groupName = permission.resource.charAt(0).toUpperCase() + permission.resource.slice(1);
          break;
        case 'category':
        default:
          groupKey = permission.category;
          groupName = permission.category;
          break;
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(permission);
    });

    groupMap.forEach((perms, key) => {
      const grantedCount = perms.filter(p => p.granted).length;
      groups.push({
        key,
        name: key,
        permissions: perms,
        grantedCount,
        totalCount: perms.length,
      });
    });

    return groups.sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredPermissions, groupBy]);

  // Create tree data for tree view
  const treeData = useMemo(() => {
    return groupedPermissions.map(group => ({
      title: (
        <Space>
          <FolderOutlined />
          <Text strong>{group.name}</Text>
          <Badge count={group.grantedCount} style={{ backgroundColor: '#52c41a' }} />
          <Text type="secondary">({group.grantedCount}/{group.totalCount})</Text>
        </Space>
      ),
      key: group.key,
      children: group.permissions.map(permission => ({
        title: (
          <Space>
            <FileOutlined />
            <Text>{permission.name}</Text>
            {permission.granted ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            )}
            {permission.inheritedFrom && (
              <Tag color="blue">
                via {permission.inheritedFrom}
              </Tag>
            )}
          </Space>
        ),
        key: permission.id,
        isLeaf: true,
      })),
    }));
  }, [groupedPermissions]);

  // Export permissions data
  const handleExport = () => {
    const exportData = {
      userId,
      context,
      timestamp: new Date().toISOString(),
      permissions: filteredPermissions.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        scope: p.scope,
        granted: p.granted,
        inheritedFrom: p.inheritedFrom,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permissions-${userId || 'current'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Table columns for table view
  const columns = [
    {
      title: 'Permission',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ContextualPermission) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong>{text}</Text>
            {record.granted ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: 'Scope',
      dataIndex: 'scope',
      key: 'scope',
      render: (scope: string) => (
        <Tag color={
          scope === 'system' ? 'red' :
          scope === 'tenant' ? 'orange' :
          scope === 'workspace' ? 'green' : 'default'
        }>
          {scope}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'granted',
      key: 'granted',
      render: (granted: boolean) => (
        <Badge
          status={granted ? 'success' : 'error'}
          text={granted ? 'Granted' : 'Denied'}
        />
      ),
    },
    {
      title: 'Source',
      dataIndex: 'inheritedFrom',
      key: 'inheritedFrom',
      render: (inheritedFrom?: string) => (
        inheritedFrom ? (
          <Tag color="purple">via {inheritedFrom}</Tag>
        ) : (
          <Tag color="default">Direct</Tag>
        )
      ),
    },
  ];

  // Statistics
  const stats = useMemo(() => {
    const total = filteredPermissions.length;
    const granted = filteredPermissions.filter(p => p.granted).length;
    const inherited = filteredPermissions.filter(p => p.inheritedFrom).length;
    const direct = total - inherited;

    return { total, granted, denied: total - granted, inherited, direct };
  }, [filteredPermissions]);

  return (
    <Card
      title={
        <Space>
          <SecurityScanOutlined />
          <Title level={4} style={{ margin: 0 }}>Permission Viewer</Title>
          {userId && <Text type="secondary">for User: {userId}</Text>}
        </Space>
      }
      extra={
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExport}
          size="small"
        >
          Export
        </Button>
      }
    >
      {/* Statistics Row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic
            title="Total Permissions"
            value={stats.total}
            prefix={<EyeOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Granted"
            value={stats.granted}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Direct"
            value={stats.direct}
            prefix={<FileOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Inherited"
            value={stats.inherited}
            prefix={<FolderOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
      </Row>

      <Divider />

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Input
            placeholder="Search permissions..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col span={4}>
          <Select
            placeholder="Scope"
            value={filterScope}
            onChange={setFilterScope}
            style={{ width: '100%' }}
          >
            <Option value="all">All Scopes</Option>
            <Option value="system">System</Option>
            <Option value="tenant">Tenant</Option>
            <Option value="workspace">Workspace</Option>
            <Option value="resource">Resource</Option>
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: '100%' }}
          >
            <Option value="all">All Status</Option>
            <Option value="granted">Granted</Option>
            <Option value="denied">Denied</Option>
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="Group By"
            value={groupBy}
            onChange={(value) => {
              // This would trigger a prop change in parent component
              console.log('Group by changed:', value);
            }}
            style={{ width: '100%' }}
          >
            <Option value="category">Category</Option>
            <Option value="scope">Scope</Option>
            <Option value="resource">Resource</Option>
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="View"
            value={viewMode}
            onChange={(value) => {
              // This would trigger a prop change in parent component
              console.log('View mode changed:', value);
            }}
            style={{ width: '100%' }}
          >
            <Option value="table">Table</Option>
            <Option value="tree">Tree</Option>
            <Option value="grid">Grid</Option>
          </Select>
        </Col>
      </Row>

      {/* Alert for context */}
      {context && Object.keys(context).length > 0 && (
        <Alert
          message="Context Filter Active"
          description={`Viewing permissions for: ${Object.entries(context)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')}`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Content based on view mode */}
      {viewMode === 'table' && (
        <Table
          columns={columns}
          dataSource={filteredPermissions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="small"
        />
      )}

      {viewMode === 'tree' && (
        <Tree
          treeData={treeData}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys.map(key => String(key)))}
          showIcon
          defaultExpandAll
        />
      )}

      {viewMode === 'grid' && (
        <Collapse>
          {groupedPermissions.map(group => (
            <Panel
              key={group.key}
              header={
                <Space>
                  <Text strong>{group.name}</Text>
                  <Badge count={group.grantedCount} style={{ backgroundColor: '#52c41a' }} />
                  <Text type="secondary">({group.grantedCount}/{group.totalCount})</Text>
                </Space>
              }
            >
              <Row gutter={[8, 8]}>
                {group.permissions.map(permission => (
                  <Col key={permission.id} span={12}>
                    <Card size="small" style={{ height: '100%' }}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                          <Text strong>{permission.name}</Text>
                          {permission.granted ? (
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          ) : (
                            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                          )}
                        </Space>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {permission.description}
                        </Text>
                        <Space wrap>
                          <Tag color="blue">{permission.scope}</Tag>
                          {permission.inheritedFrom && (
                            <Tag color="purple">
                              via {permission.inheritedFrom}
                            </Tag>
                          )}
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Panel>
          ))}
        </Collapse>
      )}

      {filteredPermissions.length === 0 && !loading && (
        <Alert
          message="No Permissions Found"
          description="No permissions match the current filters."
          type="info"
          showIcon
        />
      )}
    </Card>
  );
};

export default PermissionViewer;