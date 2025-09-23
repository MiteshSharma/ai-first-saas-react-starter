/**
 * @fileoverview Tenant Management Mock Handlers
 *
 * Mock implementations for tenant API operations
 */

import {
  Tenant,
  TenantSettings,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantRole,
  TenantUser,
  TenantInvitation
} from '../types';

// Mock API delay simulation
const mockApiDelay = () => new Promise(resolve => setTimeout(resolve, 500));

// Mock tenant data
const mockTenants: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    status: 'active' as const,
    settings: {
      security: {
        ssoEnabled: true,
        mfaRequired: true,
        sessionTimeout: 480,
        ipWhitelist: ['192.168.1.0/24']
      },
      dataRetention: {
        auditLogsDays: 90
      },
      features: {
        advancedAnalytics: true,
        apiAccess: true,
        customBranding: true,
        advancedSecurity: true,
        ssoEnabled: true,
        auditLogs: true,
        userLimit: 100,
        storageLimit: 1000,
        apiCallsLimit: 10000
      },
      notifications: {
        emailNotifications: true,
        slackIntegration: {
          webhook: 'https://hooks.slack.com/services/xxx',
          channel: '#alerts'
        }
      },
      branding: {
        primaryColor: '#1677ff',
        secondaryColor: '#f0f2f5'
      },
      timezone: 'UTC',
      currency: 'USD',
      language: 'en'
    },
    subscription: {
      plan: 'enterprise',
      status: 'active',
      billingCycle: 'yearly'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tenant-2',
    name: 'Startup Inc',
    slug: 'startup-inc',
    status: 'active' as const,
    settings: {
      security: {
        ssoEnabled: false,
        mfaRequired: false,
        sessionTimeout: 240,
        ipWhitelist: undefined
      },
      dataRetention: {
        auditLogsDays: 30
      },
      features: {
        advancedAnalytics: false,
        apiAccess: true,
        customBranding: false,
        advancedSecurity: false,
        ssoEnabled: false,
        auditLogs: false,
        userLimit: 10,
        storageLimit: 100,
        apiCallsLimit: 1000
      },
      notifications: {
        emailNotifications: true
      },
      branding: {
        primaryColor: '#52c41a',
        secondaryColor: '#f6ffed'
      },
      timezone: 'UTC',
      currency: 'USD',
      language: 'en'
    },
    subscription: {
      plan: 'professional',
      status: 'active',
      billingCycle: 'monthly'
    },
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  }
];

let tenantData = [...mockTenants];

/**
 * Mock handlers for tenant operations
 */
export class TenantMockHandlers {
  /**
   * Get all tenants for current user
   */
  static async getUserTenants(): Promise<Tenant[]> {
    await mockApiDelay();
    return [...tenantData];
  }

  /**
   * Get specific tenant
   */
  static async getTenant(tenantId: string): Promise<Tenant> {
    await mockApiDelay();
    const tenant = tenantData.find(t => t.id === tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    return { ...tenant };
  }

  /**
   * Switch tenant context
   */
  static async switchTenant(tenantId: string): Promise<{ tenant: Tenant; workspaces: any[] }> {
    await mockApiDelay();
    const tenant = tenantData.find(t => t.id === tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Mock workspaces for the tenant
    const workspaces = [
      {
        id: `workspace-${tenantId}-1`,
        name: 'Default Workspace',
        tenantId,
        description: 'Default workspace for tenant',
        settings: {},
        members: []
      }
    ];

    return { tenant: { ...tenant }, workspaces };
  }

  /**
   * Create new tenant
   */
  static async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    await mockApiDelay();

    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: data.name,
      slug: data.slug,
      status: 'active',
      settings: {
        security: {
          ssoEnabled: false,
          mfaRequired: false,
          sessionTimeout: 240,
          ipWhitelist: undefined
        },
        dataRetention: {
          auditLogsDays: 30
        },
        features: {
          advancedAnalytics: false,
          apiAccess: true,
          customBranding: false,
          advancedSecurity: false,
          ssoEnabled: false,
          auditLogs: false,
          userLimit: 10,
          storageLimit: 100,
          apiCallsLimit: 1000
        },
        notifications: {
          emailNotifications: true
        },
        branding: {
          primaryColor: '#1677ff',
          secondaryColor: '#f0f2f5'
        },
        timezone: 'UTC',
        currency: 'USD',
        language: 'en',
        ...data.settings
      },
      subscription: {
        plan: 'free',
        status: 'active',
        billingCycle: 'monthly'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tenantData.push(newTenant);
    return { ...newTenant };
  }

  /**
   * Update tenant
   */
  static async updateTenant(tenantId: string, data: UpdateTenantRequest): Promise<Tenant> {
    await mockApiDelay();

    const tenantIndex = tenantData.findIndex(t => t.id === tenantId);
    if (tenantIndex === -1) {
      throw new Error('Tenant not found');
    }

    const existingTenant = tenantData[tenantIndex];
    const updatedTenant: Tenant = {
      ...existingTenant,
      name: data.name || existingTenant.name,
      settings: data.settings ? {
        ...existingTenant.settings,
        ...data.settings
      } as TenantSettings : existingTenant.settings,
      updatedAt: new Date().toISOString()
    };

    tenantData[tenantIndex] = updatedTenant;
    return { ...updatedTenant };
  }

  /**
   * Delete tenant
   */
  static async deleteTenant(tenantId: string): Promise<void> {
    await mockApiDelay();

    const tenantIndex = tenantData.findIndex(t => t.id === tenantId);
    if (tenantIndex === -1) {
      throw new Error('Tenant not found');
    }

    tenantData.splice(tenantIndex, 1);
  }

  /**
   * Update tenant settings
   */
  static async updateSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<Tenant> {
    await mockApiDelay();

    const tenantIndex = tenantData.findIndex(t => t.id === tenantId);
    if (tenantIndex === -1) {
      throw new Error('Tenant not found');
    }

    const existingTenant = tenantData[tenantIndex];
    const updatedTenant: Tenant = {
      ...existingTenant,
      settings: {
        ...existingTenant.settings,
        ...settings
      } as TenantSettings,
      updatedAt: new Date().toISOString()
    };

    tenantData[tenantIndex] = updatedTenant;
    return { ...updatedTenant };
  }

  /**
   * Get tenant members
   */
  static async getTenantMembers(tenantId: string): Promise<TenantUser[]> {
    await mockApiDelay();

    // Mock tenant users
    return [
      {
        id: 'user-1',
        tenantId,
        userId: 'user-1',
        tenantRole: 'admin',
        workspaces: [
          {
            workspaceId: 'workspace-1',
            workspaceName: 'Default Workspace',
            role: 'admin',
            groupIds: ['admin-group'],
            effectivePermissions: [
              { id: 'workspace.manage', name: 'Manage Workspace', resource: 'workspace', action: 'manage' },
              { id: 'project.create', name: 'Create Project', resource: 'project', action: 'create' },
              { id: 'user.invite', name: 'Invite User', resource: 'user', action: 'invite' }
            ]
          }
        ],
        joinedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'user-2',
        tenantId,
        userId: 'user-2',
        tenantRole: 'member',
        workspaces: [
          {
            workspaceId: 'workspace-1',
            workspaceName: 'Default Workspace',
            role: 'member',
            groupIds: ['member-group'],
            effectivePermissions: [
              { id: 'project.read', name: 'Read Project', resource: 'project', action: 'read' },
              { id: 'workspace.read', name: 'Read Workspace', resource: 'workspace', action: 'read' }
            ]
          }
        ],
        joinedAt: '2024-02-15T00:00:00Z'
      }
    ];
  }

  /**
   * Invite user to tenant
   */
  static async inviteUser(tenantId: string, data: { email: string; role: TenantRole }): Promise<TenantInvitation> {
    await mockApiDelay();

    return {
      id: `invitation-${Date.now()}`,
      tenantId,
      email: data.email,
      role: data.role,
      invitedBy: 'current-user-id',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'pending'
    };
  }

  /**
   * Remove user from tenant
   */
  static async removeUser(tenantId: string, userId: string): Promise<void> {
    await mockApiDelay();

    // Mock implementation - log the removal for debugging
    console.log(`Mock: Removing user ${userId} from tenant ${tenantId}`);

    // In a real implementation, this would remove the user from the tenant
    // For mock purposes, we just simulate the delay and operation success
  }

  /**
   * Update user role
   */
  static async updateUserRole(tenantId: string, userId: string, role: TenantRole): Promise<TenantUser> {
    await mockApiDelay();

    // Define mock users data for consistency
    const mockUsers = {
      'user-1': {
        id: 'user-1',
        tenantId,
        userId: 'user-1',
        workspaces: [
          {
            workspaceId: 'workspace-1',
            workspaceName: 'Default Workspace',
            groupIds: ['admin-group'],
          }
        ],
        joinedAt: '2024-01-01T00:00:00Z'
      },
      'user-2': {
        id: 'user-2',
        tenantId,
        userId: 'user-2',
        workspaces: [
          {
            workspaceId: 'workspace-1',
            workspaceName: 'Default Workspace',
            groupIds: ['member-group'],
          }
        ],
        joinedAt: '2024-02-15T00:00:00Z'
      }
    };

    // Get base user data or create new user if not found
    const baseUser = mockUsers[userId as keyof typeof mockUsers] || {
      id: userId,
      tenantId,
      userId,
      workspaces: [
        {
          workspaceId: 'workspace-1',
          workspaceName: 'Default Workspace',
          groupIds: ['member-group'],
        }
      ],
      joinedAt: new Date().toISOString()
    };

    // Determine workspace role and permissions based on tenant role
    const workspaceRole = (role === 'admin' || role === 'owner') ? 'admin' : 'member';
    const groupIds = (role === 'admin' || role === 'owner') ? ['admin-group'] : ['member-group'];
    const effectivePermissions = (role === 'admin' || role === 'owner') ? [
      { id: 'workspace.manage', name: 'Manage Workspace', resource: 'workspace', action: 'manage' },
      { id: 'project.create', name: 'Create Project', resource: 'project', action: 'create' },
      { id: 'user.invite', name: 'Invite User', resource: 'user', action: 'invite' }
    ] : [
      { id: 'project.read', name: 'Read Project', resource: 'project', action: 'read' },
      { id: 'workspace.read', name: 'Read Workspace', resource: 'workspace', action: 'read' }
    ];

    return {
      ...baseUser,
      tenantRole: role,
      workspaces: baseUser.workspaces.map(workspace => ({
        ...workspace,
        role: workspaceRole,
        groupIds,
        effectivePermissions
      }))
    };
  }

  /**
   * Update member workspace permissions
   */
  static async updateMemberWorkspacePermissions(
    tenantId: string,
    userId: string,
    permissions: { workspaceId: string; role: string }[]
  ): Promise<TenantUser> {
    await mockApiDelay();

    // Get existing tenant members to find the user
    const existingMembers = await this.getTenantMembers(tenantId);
    const existingUser = existingMembers.find(u => u.userId === userId);

    if (!existingUser) {
      throw new Error('User not found in tenant');
    }

    // Create updated user with new workspace permissions
    const updatedUser: TenantUser = {
      ...existingUser,
      workspaces: permissions.map(perm => {
        const workspaceName = perm.workspaceId === 'workspace-1' ? 'Default Workspace' : `Workspace ${perm.workspaceId}`;
        const groupIds = perm.role === 'admin' ? ['admin-group'] : ['member-group'];
        const effectivePermissions = perm.role === 'admin' ? [
          { id: 'workspace.manage', name: 'Manage Workspace', resource: 'workspace', action: 'manage' },
          { id: 'project.create', name: 'Create Project', resource: 'project', action: 'create' },
          { id: 'user.invite', name: 'Invite User', resource: 'user', action: 'invite' }
        ] : [
          { id: 'project.read', name: 'Read Project', resource: 'project', action: 'read' },
          { id: 'workspace.read', name: 'Read Workspace', resource: 'workspace', action: 'read' }
        ];

        return {
          workspaceId: perm.workspaceId,
          workspaceName,
          role: perm.role as 'admin' | 'member',
          groupIds,
          effectivePermissions
        };
      })
    };

    return updatedUser;
  }

  /**
   * Test tenant isolation
   */
  static async testTenantIsolation(tenantId: string): Promise<any> {
    await mockApiDelay();

    return {
      tenantId,
      isolationLevel: 'complete',
      accessibleResources: ['tenant-specific-data'],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get tenant data sources
   */
  static async getDataSources(tenantId: string): Promise<any[]> {
    await mockApiDelay();

    return [
      {
        id: 'ds-1',
        name: 'Primary Database',
        type: 'postgresql',
        tenantId,
        status: 'active'
      }
    ];
  }

  /**
   * Get tenant charts
   */
  static async getCharts(tenantId: string): Promise<any[]> {
    await mockApiDelay();

    return [
      {
        id: 'chart-1',
        name: 'Revenue Dashboard',
        type: 'dashboard',
        tenantId,
        config: {}
      }
    ];
  }
}

export default TenantMockHandlers;