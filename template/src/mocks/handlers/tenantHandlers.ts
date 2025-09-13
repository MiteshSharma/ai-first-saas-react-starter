import MockAdapter from 'axios-mock-adapter';
import { 
  tenantMocks, 
  getTenantById, 
  getTenantMembers, 
  getTenantInvites, 
  getTenantWorkspaces,
  getTenantScopedData,
  getUserTenants
} from '../tenantMocks';
import { 
  Tenant,
  TenantMember,
  TenantInvite,
  Workspace,
  CreateTenantPayload,
  UpdateTenantPayload,
  InviteMemberPayload,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  TenantPlan,
  TenantStatus,
  InviteStatus,
  WorkspaceStatus
} from '../../store/tenant/types';

/**
 * Setup mock handlers for tenant-related API endpoints
 * Provides comprehensive multi-tenant functionality for testing
 */
export const setupTenantMocks = (mock: MockAdapter) => {
  console.log('🏢 Setting up tenant mock handlers');

  // Get current user's tenants
  mock.onGet('/api/tenants').reply((config) => {
    console.log('📋 Mock: Get user tenants');
    
    // Simulate getting current user from auth header
    const userId = 'user-1'; // In real app, decode from JWT
    const userTenants = getUserTenants(userId);
    
    return [200, {
      success: true,
      data: userTenants,
      meta: { total: userTenants.length }
    }];
  });

  // Get specific tenant details
  mock.onGet(/\/api\/tenants\/([^\/]+)$/).reply((config) => {
    const tenantId = config.url?.split('/').pop();
    console.log(`📋 Mock: Get tenant details for ${tenantId}`);
    
    const tenant = getTenantById(tenantId!);
    if (!tenant) {
      return [404, { success: false, error: 'Tenant not found' }];
    }
    
    return [200, {
      success: true,
      data: tenant
    }];
  });

  // Switch tenant context
  mock.onPost('/api/tenants/switch').reply((config) => {
    const { tenantId } = JSON.parse(config.data);
    console.log(`🔄 Mock: Switch to tenant ${tenantId}`);
    
    const tenant = getTenantById(tenantId);
    if (!tenant) {
      return [404, { success: false, error: 'Tenant not found' }];
    }
    
    // Simulate tenant access validation
    const userId = 'user-1';
    const userTenants = getUserTenants(userId);
    const hasAccess = userTenants.some((t: Tenant) => t.id === tenantId);
    
    if (!hasAccess) {
      return [403, { success: false, error: 'Access denied to tenant' }];
    }
    
    return [200, {
      success: true,
      data: {
        tenant,
        workspaces: getTenantWorkspaces(tenantId),
        message: `Switched to ${tenant.name}`
      }
    }];
  });

  // Create new tenant
  mock.onPost('/api/tenants').reply((config) => {
    const payload: CreateTenantPayload = JSON.parse(config.data);
    console.log('🆕 Mock: Create tenant', payload);
    
    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: payload.name,
      slug: payload.slug || payload.name.toLowerCase().replace(/\s+/g, '-'),
      plan: payload.plan || TenantPlan.FREE,
      status: TenantStatus.ACTIVE,
      ownerId: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        allowInvites: true,
        maxMembers: 5,
        features: ['basic']
      }
    };
    
    // Add to mock data
    tenantMocks.tenants.push(newTenant);
    
    return [201, {
      success: true,
      data: newTenant,
      message: 'Tenant created successfully'
    }];
  });

  // Update tenant
  mock.onPut(/\/api\/tenants\/([^\/]+)$/).reply((config) => {
    const tenantId = config.url?.split('/').pop();
    const payload: UpdateTenantPayload = JSON.parse(config.data);
    console.log(`✏️ Mock: Update tenant ${tenantId}`, payload);
    
    const tenantIndex = tenantMocks.tenants.findIndex((t: Tenant) => t.id === tenantId);
    if (tenantIndex === -1) {
      return [404, { success: false, error: 'Tenant not found' }];
    }
    
    // Update tenant
    const updatedTenant = {
      ...tenantMocks.tenants[tenantIndex],
      ...payload,
      updatedAt: new Date().toISOString()
    };
    
    
    // Ensure proper full settings object
    if (updatedTenant.settings) {
      const fullSettings = {
        allowInvites: true,
        maxMembers: 5,
        features: ['basic'] as string[],
        ...(tenantMocks.tenants[tenantIndex].settings || {}),
        ...updatedTenant.settings
      };
      updatedTenant.settings = fullSettings;
    }
    
    tenantMocks.tenants[tenantIndex] = updatedTenant as Tenant;
    
    return [200, {
      success: true,
      data: tenantMocks.tenants[tenantIndex],
      message: 'Tenant updated successfully'
    }];
  });

  // Get tenant members
  mock.onGet(/\/api\/tenants\/([^\/]+)\/members$/).reply((config) => {
    const tenantId = config.url?.split('/')[3];
    console.log(`👥 Mock: Get tenant members for ${tenantId}`);
    
    const members = getTenantMembers(tenantId!);
    
    return [200, {
      success: true,
      data: members,
      meta: { total: members.length }
    }];
  });

  // Invite member
  mock.onPost(/\/api\/tenants\/([^\/]+)\/members\/invite$/).reply((config) => {
    const tenantId = config.url?.split('/')[3];
    const payload: InviteMemberPayload = JSON.parse(config.data);
    console.log(`📧 Mock: Invite member to tenant ${tenantId}`, payload);
    
    // Check if email already exists
    const existingMember = tenantMocks.members.find(
      (m: TenantMember) => m.tenantId === tenantId && m.email === payload.email
    );
    
    if (existingMember) {
      return [409, { success: false, error: 'User already a member' }];
    }
    
    // Create invite
    const invite = {
      id: `invite-${Date.now()}`,
      tenantId: tenantId!,
      email: payload.email,
      role: payload.role,
      status: InviteStatus.PENDING,
      invitedBy: 'user-1',
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      token: `token-${Date.now()}`
    };
    
    (tenantMocks.invites as any[]).push(invite);
    
    return [200, {
      success: true,
      data: invite,
      message: 'Invitation sent successfully'
    }];
  });

  // Get tenant workspaces
  mock.onGet(/\/api\/tenants\/([^\/]+)\/workspaces$/).reply((config) => {
    const tenantId = config.url?.split('/')[3];
    console.log(`📁 Mock: Get workspaces for tenant ${tenantId}`);
    
    const workspaces = getTenantWorkspaces(tenantId!);
    
    return [200, {
      success: true,
      data: workspaces,
      meta: { total: workspaces.length }
    }];
  });

  // Create workspace
  mock.onPost(/\/api\/tenants\/([^\/]+)\/workspaces$/).reply((config) => {
    const tenantId = config.url?.split('/')[3];
    const payload: CreateWorkspacePayload = JSON.parse(config.data);
    console.log(`🆕 Mock: Create workspace in tenant ${tenantId}`, payload);
    
    const newWorkspace = {
      id: `workspace-${Date.now()}`,
      tenantId: tenantId!,
      name: payload.name,
      description: payload.description,
      slug: payload.slug || payload.name.toLowerCase().replace(/\s+/g, '-'),
      ownerId: 'user-1',
      status: WorkspaceStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        isPublic: false,
        allowGuests: false,
        retentionDays: 90
      }
    };
    
    (tenantMocks.workspaces as any[]).push(newWorkspace);
    
    return [201, {
      success: true,
      data: newWorkspace,
      message: 'Workspace created successfully'
    }];
  });

  // Update workspace
  mock.onPut(/\/api\/workspaces\/([^\/]+)$/).reply((config) => {
    const workspaceId = config.url?.split('/').pop();
    const payload: UpdateWorkspacePayload = JSON.parse(config.data);
    console.log(`✏️ Mock: Update workspace ${workspaceId}`, payload);
    
    const workspaceIndex = tenantMocks.workspaces.findIndex((w: Workspace) => w.id === workspaceId);
    if (workspaceIndex === -1) {
      return [404, { success: false, error: 'Workspace not found' }];
    }
    
    const updatedWorkspace = {
      ...tenantMocks.workspaces[workspaceIndex],
      ...payload,
      updatedAt: new Date().toISOString()
    };
    
    // Ensure proper full settings object
    if (updatedWorkspace.settings) {
      const fullSettings = {
        isPublic: false,
        allowGuests: false,
        retentionDays: 90,
        ...(tenantMocks.workspaces[workspaceIndex].settings || {}),
        ...updatedWorkspace.settings
      };
      updatedWorkspace.settings = fullSettings;
    }
    
    (tenantMocks.workspaces as any[])[workspaceIndex] = updatedWorkspace;
    
    return [200, {
      success: true,
      data: tenantMocks.workspaces[workspaceIndex],
      message: 'Workspace updated successfully'
    }];
  });

  // Delete workspace
  mock.onDelete(/\/api\/workspaces\/([^\/]+)$/).reply((config) => {
    const workspaceId = config.url?.split('/').pop();
    console.log(`🗑️ Mock: Delete workspace ${workspaceId}`);
    
    const workspaceIndex = tenantMocks.workspaces.findIndex((w: Workspace) => w.id === workspaceId);
    if (workspaceIndex === -1) {
      return [404, { success: false, error: 'Workspace not found' }];
    }
    
    tenantMocks.workspaces.splice(workspaceIndex, 1);
    
    return [200, {
      success: true,
      message: 'Workspace deleted successfully'
    }];
  });

  // Get tenant-scoped data sources (testing data isolation)
  mock.onGet('/api/data-sources').reply((config) => {
    const tenantId = config.headers?.['X-Tenant-Id'];
    console.log(`📊 Mock: Get data sources for tenant ${tenantId}`);
    
    if (!tenantId) {
      return [400, { success: false, error: 'Tenant ID required' }];
    }
    
    const scopedData = getTenantScopedData(tenantId);
    
    return [200, {
      success: true,
      data: scopedData.dataSources,
      meta: { 
        total: scopedData.dataSources.length,
        tenantId,
        message: `Data isolated to tenant ${tenantId}`
      }
    }];
  });

  // Get tenant-scoped charts (testing data isolation)
  mock.onGet('/api/charts').reply((config) => {
    const tenantId = config.headers?.['X-Tenant-Id'];
    console.log(`📈 Mock: Get charts for tenant ${tenantId}`);
    
    if (!tenantId) {
      return [400, { success: false, error: 'Tenant ID required' }];
    }
    
    const scopedData = getTenantScopedData(tenantId);
    
    return [200, {
      success: true,
      data: scopedData.charts,
      meta: { 
        total: scopedData.charts.length,
        tenantId,
        message: `Charts isolated to tenant ${tenantId}`
      }
    }];
  });

  // Test tenant isolation endpoint
  mock.onGet('/api/test/tenant-isolation').reply((config) => {
    const tenantId = config.headers?.['X-Tenant-Id'];
    console.log(`🔒 Mock: Test tenant isolation for ${tenantId}`);
    
    if (!tenantId) {
      return [400, { 
        success: false, 
        error: 'Tenant ID required in headers',
        isolation: 'FAILED - No tenant context'
      }];
    }
    
    const tenant = getTenantById(tenantId);
    if (!tenant) {
      return [404, { 
        success: false, 
        error: 'Invalid tenant ID',
        isolation: 'FAILED - Invalid tenant'
      }];
    }
    
    const scopedData = getTenantScopedData(tenantId);
    
    return [200, {
      success: true,
      data: {
        tenantId,
        tenantName: tenant.name,
        isolation: 'SUCCESS - Data properly isolated',
        dataScope: {
          dataSources: scopedData.dataSources.length,
          charts: scopedData.charts.length,
          workspaces: getTenantWorkspaces(tenantId).length,
          members: getTenantMembers(tenantId).length
        }
      },
      message: `Tenant isolation validated for ${tenant.name}`
    }];
  });

  console.log('✅ Tenant mock handlers registered');
};