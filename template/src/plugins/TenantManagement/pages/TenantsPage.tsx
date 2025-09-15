import React, { useState, useEffect, useMemo } from 'react';
import { Button, message } from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useTenantStore } from '../../../core/stores/tenant/tenantStore';
import { TenantListItem } from '../types';
import TenantList from '../components/TenantList';
import TenantDetails from '../components/TenantDetails';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  HeaderActions,
  ContentContainer,
  SidePanel,
} from '../styles/TenantsPage.styles';

const TenantsPage: React.FC = () => {
  const {
    tenants,
    currentTenant,
    tenantMembers,
    workspaces,
    loading,
    error,
    fetchTenants,
    fetchTenantMembers,
    fetchWorkspaces,
    createTenant,
    updateTenant,
    setCurrentTenant,
  } = useTenantStore();

  const [selectedTenant, setSelectedTenant] = useState<TenantListItem | null>(null);

  // Transform tenants into list items with additional metadata
  const tenantListItems: TenantListItem[] = useMemo(() => {
    return tenants.map(tenant => ({
      ...tenant,
      memberCount: tenant.id === currentTenant?.id ? tenantMembers.length : 0,
      workspaceCount: tenant.id === currentTenant?.id ? workspaces.length : 0,
      isActive: true, // TODO: Add actual status logic
      description: `Tenant managed through ${tenant.name}`,
    }));
  }, [tenants, currentTenant, tenantMembers, workspaces]);

  useEffect(() => {
    // Load tenants on component mount
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    // Load additional data when a tenant is selected
    if (selectedTenant) {
      fetchTenantMembers(selectedTenant.id);
      fetchWorkspaces(selectedTenant.id);
    }
  }, [selectedTenant, fetchTenantMembers, fetchWorkspaces]);

  const handleRefresh = async () => {
    try {
      await fetchTenants();
      if (selectedTenant) {
        await fetchTenantMembers(selectedTenant.id);
        await fetchWorkspaces(selectedTenant.id);
      }
      message.success('Tenants refreshed successfully');
    } catch (err) {
      message.error('Failed to refresh tenants');
    }
  };

  const handleCreateTenant = async () => {
    try {
      // TODO: Show create tenant modal
      const newTenant = await createTenant({
        name: `New Tenant ${Date.now()}`,
      });
      message.success('Tenant created successfully');

      // Auto-select the new tenant
      const newTenantItem: TenantListItem = {
        ...newTenant,
        memberCount: 1,
        workspaceCount: 0,
        isActive: true,
        description: 'A new tenant created from the management interface',
      };
      setSelectedTenant(newTenantItem);
    } catch (err) {
      message.error('Failed to create tenant');
    }
  };

  const handleTenantSelect = React.useCallback((tenant: TenantListItem) => {
    setSelectedTenant(tenant.id === selectedTenant?.id ? null : tenant);

    // Also switch to this tenant in the global state
    if (tenant.id !== currentTenant?.id) {
      setCurrentTenant(tenant);
    }
  }, [selectedTenant, currentTenant, setCurrentTenant]);

  const handleUpdateTenant = async (tenant: TenantListItem) => {
    try {
      await updateTenant(tenant.id, {
        name: tenant.name,
      });
      message.success('Tenant updated successfully');
    } catch (err) {
      message.error('Failed to update tenant');
    }
  };

  const handleInviteMember = async (email: string, role: string) => {
    if (!selectedTenant) return;

    try {
      // TODO: Implement invite member functionality
      message.success('Member invited successfully');
    } catch (err) {
      message.error('Failed to invite member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      // TODO: Implement remove member functionality
      message.success('Member removed successfully');
    } catch (err) {
      message.error('Failed to remove member');
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <h1>
            <TeamOutlined style={{ marginRight: 12 }} />
            Tenant Management
          </h1>
          <p>Manage your organization's tenants, members, and workspaces</p>
        </PageTitle>
        <HeaderActions>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateTenant}
            loading={loading}
          >
            New Tenant
          </Button>
        </HeaderActions>
      </PageHeader>

      <ContentContainer>
        <div>
          <TenantList
            tenants={tenantListItems}
            loading={loading}
            error={error?.message || null}
            onRefresh={handleRefresh}
            onCreateTenant={handleCreateTenant}
            onTenantSelect={handleTenantSelect}
          />
        </div>

        {selectedTenant && (
          <SidePanel>
            <TenantDetails
              tenant={selectedTenant}
              members={tenantMembers}
              workspaces={workspaces}
              onUpdateTenant={handleUpdateTenant}
              onInviteMember={handleInviteMember}
              onRemoveMember={handleRemoveMember}
            />
          </SidePanel>
        )}
      </ContentContainer>
    </PageContainer>
  );
};

export default TenantsPage;