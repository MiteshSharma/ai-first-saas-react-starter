import React, { useState } from 'react';
import { Button, Input, Select, Spin, Alert } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { TenantListProps, TenantListItem } from '../types';
import TenantCard from './TenantCard';
import {
  TenantsGrid,
  EmptyState,
  LoadingContainer,
} from '../styles/TenantsPage.styles';

const { Search } = Input;
const { Option } = Select;

const TenantList: React.FC<TenantListProps> = ({
  tenants,
  loading = false,
  error = null,
  onRefresh,
  onCreateTenant,
  onTenantSelect,
}) => {
  const [selectedTenant, setSelectedTenant] = useState<TenantListItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant.description && tenant.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'active' && tenant.isActive) ||
      (filterStatus === 'inactive' && !tenant.isActive);

    return matchesSearch && matchesFilter;
  });

  const handleTenantSelect = (tenant: TenantListItem) => {
    const newSelectedTenant = tenant.id === selectedTenant?.id ? null : tenant;
    setSelectedTenant(newSelectedTenant);
    if (onTenantSelect && newSelectedTenant) {
      onTenantSelect(newSelectedTenant);
    }
  };

  const handleTenantEdit = (tenant: TenantListItem) => {
    // TODO: Implement edit functionality
    // console.log('Edit tenant:', tenant);
  };

  const handleTenantDelete = (tenant: TenantListItem) => {
    // TODO: Implement delete functionality
    // console.log('Delete tenant:', tenant);
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spin size="large" />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error loading tenants"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={onRefresh}>
            Try Again
          </Button>
        }
      />
    );
  }

  if (tenants.length === 0) {
    return (
      <EmptyState>
        <AppstoreOutlined />
        <h3>No tenants found</h3>
        <p>Create your first tenant to get started with multi-tenant management.</p>
        {onCreateTenant && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreateTenant}>
            Create Tenant
          </Button>
        )}
      </EmptyState>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Search
          placeholder="Search tenants..."
          allowClear
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 120 }}
        >
          <Option value="all">All Status</Option>
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
        </Select>
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          Refresh
        </Button>
        {onCreateTenant && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreateTenant}>
            New Tenant
          </Button>
        )}
      </div>

      {filteredTenants.length === 0 ? (
        <EmptyState>
          <SearchOutlined />
          <h3>No matching tenants</h3>
          <p>Try adjusting your search criteria or filters.</p>
        </EmptyState>
      ) : (
        <TenantsGrid>
          {filteredTenants.map(tenant => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              onSelect={handleTenantSelect}
              onEdit={handleTenantEdit}
              onDelete={handleTenantDelete}
              isSelected={selectedTenant?.id === tenant.id}
            />
          ))}
        </TenantsGrid>
      )}
    </div>
  );
};

export default TenantList;