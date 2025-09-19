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
  WorkspaceStatus,
  INVITE_STATUSES,
  WORKSPACE_STATUSES
} from '../../plugins/tenant-management/types';
import { CreateWorkspaceRequest } from '../../core/types';

/**
 * Setup mock handlers for tenant-related API endpoints
 * Provides comprehensive multi-tenant functionality for testing
 */
export const setupTenantMocks = (mock: MockAdapter) => {
  console.log('🏢 Setting up tenant mock handlers');

  // Get current user's tenants
  mock.onGet('/tenants').reply((config) => {
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
  mock.onGet(/\/tenants\/([^/]+)$/).reply((config) => {
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
  mock.onPost('/tenants/switch').reply((config) => {
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
  mock.onPost('/tenants').reply((config) => {
    const payload: CreateTenantPayload = JSON.parse(config.data);
    console.log('🆕 Mock: Create tenant', payload);
    
    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: payload.name,
      slug: payload.slug || (payload.name || 'unnamed').toLowerCase().replace(/\s+/g, '-'),
      type: payload.type || 'team',
      status: 'active',
      description: payload.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        timezone: payload.settings?.timezone || 'UTC',
        currency: payload.settings?.currency || 'USD',
        language: payload.settings?.language || 'en',
        security: {
          ssoEnabled: payload.settings?.security?.ssoEnabled || false,
          mfaRequired: payload.settings?.security?.mfaRequired || false,
          sessionTimeout: payload.settings?.security?.sessionTimeout || 3600,
          ipWhitelist: payload.settings?.security?.ipWhitelist || []
        },
        dataRetention: {
          auditLogsDays: payload.settings?.dataRetention?.auditLogsDays || 90
        },
        features: {
          advancedAnalytics: payload.settings?.features?.advancedAnalytics || false,
          apiAccess: payload.settings?.features?.apiAccess || true,
          customBranding: payload.settings?.features?.customBranding || false,
          advancedSecurity: payload.settings?.features?.advancedSecurity || false,
          ssoEnabled: payload.settings?.features?.ssoEnabled || false,
          auditLogs: payload.settings?.features?.auditLogs || false,
          userLimit: payload.settings?.features?.userLimit || 10,
          storageLimit: payload.settings?.features?.storageLimit || 100,
          apiCallsLimit: payload.settings?.features?.apiCallsLimit || 1000
        },
        notifications: {
          emailNotifications: payload.settings?.notifications?.emailNotifications || true,
          slackIntegration: payload.settings?.notifications?.slackIntegration,
          webhookUrl: payload.settings?.notifications?.webhookUrl
        },
        branding: {
          primaryColor: payload.settings?.branding?.primaryColor || '#1890ff',
          secondaryColor: payload.settings?.branding?.secondaryColor || '#52c41a',
          logo: payload.settings?.branding?.logo,
          favicon: payload.settings?.branding?.favicon
        }
      },
      subscription: {
        plan: 'free',
        status: 'active',
        billingCycle: 'monthly'
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
  mock.onPut(/\/tenants\/([^/]+)$/).reply((config) => {
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
    
    
    // Merge settings properly with new structure
    if (updatedTenant.settings) {
      const existingSettings = tenantMocks.tenants[tenantIndex].settings;
      updatedTenant.settings = {
        timezone: updatedTenant.settings.timezone || existingSettings.timezone,
        currency: updatedTenant.settings.currency || existingSettings.currency,
        language: updatedTenant.settings.language || existingSettings.language,
        features: {
          ...existingSettings.features,
          ...updatedTenant.settings.features
        },
        branding: {
          ...existingSettings.branding,
          ...updatedTenant.settings.branding
        }
      };
    }
    
    tenantMocks.tenants[tenantIndex] = updatedTenant as Tenant;
    
    return [200, {
      success: true,
      data: tenantMocks.tenants[tenantIndex],
      message: 'Tenant updated successfully'
    }];
  });

  // Get tenant members
  mock.onGet(/\/tenants\/([^/]+)\/members$/).reply((config) => {
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
  mock.onPost(/\/tenants\/([^/]+)\/members\/invite$/).reply((config) => {
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
      status: INVITE_STATUSES.PENDING,
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
  mock.onGet(/\/tenants\/([^/]+)\/workspaces$/).reply((config) => {
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
  mock.onPost(/\/tenants\/([^/]+)\/workspaces$/).reply((config) => {
    const tenantId = config.url?.split('/')[3];
    const payload: CreateWorkspaceRequest = JSON.parse(config.data);
    console.log(`🆕 Mock: Create workspace in tenant ${tenantId}`, payload);

    const newWorkspace = {
      id: `workspace-${Date.now()}`,
      tenantId: tenantId!,
      name: payload.name,
      type: payload.type || 'project',
      status: WORKSPACE_STATUSES.ACTIVE,
      settings: payload.settings || {
        access: {
          visibility: 'tenant',
          joinPolicy: 'request',
          externalAccess: false
        },
        data: {
          allowDataExport: true,
          backupEnabled: true,
          dataRetentionDays: 365
        },
        integrations: {},
        notifications: {
          projectUpdates: true,
          memberActivity: true,
          systemAlerts: true
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    (tenantMocks.workspaces as any[]).push(newWorkspace);

    return [201, {
      success: true,
      data: newWorkspace,
      message: 'Workspace created successfully'
    }];
  });

  // Update workspace
  mock.onPut(/\/workspaces\/([^/]+)$/).reply((config) => {
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
    
    // No settings to merge for workspaces in current implementation
    
    (tenantMocks.workspaces as any[])[workspaceIndex] = updatedWorkspace;
    
    return [200, {
      success: true,
      data: tenantMocks.workspaces[workspaceIndex],
      message: 'Workspace updated successfully'
    }];
  });

  // Delete workspace
  mock.onDelete(/\/workspaces\/([^/]+)$/).reply((config) => {
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

  // Get specific workspace
  mock.onGet(/\/workspaces\/([^/]+)$/).reply((config) => {
    const workspaceId = config.url?.split('/').pop();
    console.log(`📋 Mock: Get workspace details for ${workspaceId}`);

    const workspace = tenantMocks.workspaces.find((w: Workspace) => w.id === workspaceId);
    if (!workspace) {
      return [404, { success: false, error: 'Workspace not found' }];
    }

    // Add computed properties for workspace management
    const workspaceWithMembers = {
      ...workspace,
      memberCount: 3, // Mock member count
      isOwner: true,   // Mock ownership
      canManage: true  // Mock management permission
    };

    return [200, {
      success: true,
      data: workspaceWithMembers
    }];
  });

  // Update workspace settings
  mock.onPut(/\/workspaces\/([^/]+)\/settings$/).reply((config) => {
    const workspaceId = config.url?.split('/')[3];
    const settings = JSON.parse(config.data);
    console.log(`⚙️ Mock: Update workspace settings for ${workspaceId}`, settings);

    const workspaceIndex = tenantMocks.workspaces.findIndex((w: Workspace) => w.id === workspaceId);
    if (workspaceIndex === -1) {
      return [404, { success: false, error: 'Workspace not found' }];
    }

    // Merge settings
    const currentWorkspace = tenantMocks.workspaces[workspaceIndex] as any;
    const updatedWorkspace = {
      ...currentWorkspace,
      settings: {
        ...currentWorkspace.settings,
        ...settings
      },
      updatedAt: new Date().toISOString()
    };

    (tenantMocks.workspaces as any[])[workspaceIndex] = updatedWorkspace;

    return [200, {
      success: true,
      data: updatedWorkspace,
      message: 'Workspace settings updated successfully'
    }];
  });

  // Archive workspace
  mock.onPut(/\/workspaces\/([^/]+)\/archive$/).reply((config) => {
    const workspaceId = config.url?.split('/')[3];
    console.log(`📦 Mock: Archive workspace ${workspaceId}`);

    const workspaceIndex = tenantMocks.workspaces.findIndex((w: Workspace) => w.id === workspaceId);
    if (workspaceIndex === -1) {
      return [404, { success: false, error: 'Workspace not found' }];
    }

    (tenantMocks.workspaces as any[])[workspaceIndex].status = 'archived';
    (tenantMocks.workspaces as any[])[workspaceIndex].updatedAt = new Date().toISOString();

    return [200, {
      success: true,
      message: 'Workspace archived successfully'
    }];
  });

  // Switch workspace context
  mock.onPost('/workspaces/switch').reply((config) => {
    const { workspaceId } = JSON.parse(config.data);
    console.log(`🔄 Mock: Switch to workspace ${workspaceId}`);

    const workspace = tenantMocks.workspaces.find((w: Workspace) => w.id === workspaceId);
    if (!workspace) {
      return [404, { success: false, error: 'Workspace not found' }];
    }

    // Mock workspace members
    const members = [
      {
        id: 'member-1',
        userId: 'user-1',
        workspaceId,
        role: 'admin',
        permissions: ['workspace.read', 'workspace.write', 'workspace.manage'],
        joinedAt: new Date().toISOString()
      },
      {
        id: 'member-2',
        userId: 'user-2',
        workspaceId,
        role: 'editor',
        permissions: ['workspace.read', 'workspace.write'],
        joinedAt: new Date().toISOString()
      }
    ];

    return [200, {
      success: true,
      data: {
        workspace,
        members
      },
      message: `Switched to ${workspace.name}`
    }];
  });

  // Get tenant-scoped data sources (testing data isolation)
  mock.onGet('/data-sources').reply((config) => {
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
  mock.onGet('/charts').reply((config) => {
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
  mock.onGet('/test/tenant-isolation').reply((config) => {
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