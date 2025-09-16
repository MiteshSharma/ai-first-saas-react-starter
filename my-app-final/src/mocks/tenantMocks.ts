import {
  Tenant,
  TenantMember,
  TenantInvite,
  Workspace,
  TENANT_PLANS,
  TENANT_STATUSES,
  TENANT_ROLES,
  MEMBER_STATUSES,
  INVITE_STATUSES,
  WORKSPACE_STATUSES
} from '../plugins/tenant-management/types';

// Mock tenant data for testing
export const tenantMocks = {
  tenants: [
    {
      id: 'tenant-1',
      name: 'Acme Corporation',
      slug: 'acme-corp',
      description: 'Enterprise corporation focused on innovation and growth',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-03-01T15:30:00Z',
      settings: {
        timezone: 'UTC',
        currency: 'USD',
        language: 'en',
        features: {
          userLimit: 100,
          storageLimit: 10000,
          apiCallsLimit: 50000,
          customBranding: true,
          ssoEnabled: true,
          auditLogs: true
        },
        branding: {
          primaryColor: '#1890ff',
          secondaryColor: '#52c41a',
          logo: 'https://api.dicebear.com/7.x/initials/svg?seed=AC'
        }
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        billingCycle: 'yearly'
      }
    },
    {
      id: 'tenant-2',
      name: 'StartupXYZ',
      slug: 'startup-xyz',
      description: 'Innovative startup building the next big thing',
      createdAt: '2024-02-01T14:00:00Z',
      updatedAt: '2024-02-15T09:20:00Z',
      settings: {
        timezone: 'PST',
        currency: 'USD',
        language: 'en',
        features: {
          userLimit: 10,
          storageLimit: 1000,
          apiCallsLimit: 5000,
          customBranding: false,
          ssoEnabled: false,
          auditLogs: false
        },
        branding: {
          primaryColor: '#ff6b35',
          secondaryColor: '#f39c12'
        }
      },
      subscription: {
        plan: 'starter',
        status: 'active',
        billingCycle: 'monthly'
      }
    },
    {
      id: 'tenant-3',
      name: 'DevTeam Pro',
      slug: 'devteam-pro',
      description: 'Professional development team workspace',
      createdAt: '2024-03-01T09:00:00Z',
      updatedAt: '2024-03-01T09:00:00Z',
      settings: {
        timezone: 'EST',
        currency: 'USD',
        language: 'en',
        features: {
          userLimit: 25,
          storageLimit: 5000,
          apiCallsLimit: 15000,
          customBranding: true,
          ssoEnabled: false,
          auditLogs: true
        },
        branding: {
          primaryColor: '#7265e6',
          secondaryColor: '#52c41a'
        }
      },
      subscription: {
        plan: 'professional',
        status: 'active',
        billingCycle: 'monthly',
        expiresAt: '2024-04-01T09:00:00Z'
      }
    }
  ] as Tenant[],

  members: [
    {
      id: 'member-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: TENANT_ROLES.OWNER,
      permissions: ['*'],
      email: 'owner@acme-corp.com',
      name: 'John Smith',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      status: MEMBER_STATUSES.ACTIVE,
      joinedAt: '2024-01-15T10:05:00Z'
    },
    {
      id: 'member-2',
      userId: 'user-3',
      tenantId: 'tenant-1',
      role: TENANT_ROLES.ADMIN,
      permissions: ['admin:*', 'tenant:read', 'tenant:update'],
      email: 'admin@acme-corp.com',
      name: 'Sarah Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      status: MEMBER_STATUSES.ACTIVE,
      joinedAt: '2024-01-16T14:20:00Z'
    },
    {
      id: 'member-3',
      userId: 'user-4',
      tenantId: 'tenant-1',
      role: TENANT_ROLES.MEMBER,
      permissions: ['tenant:read'],
      email: 'member@acme-corp.com',
      name: 'Mike Wilson',
      status: MEMBER_STATUSES.ACTIVE,
      joinedAt: '2024-01-20T10:15:00Z'
    },
    {
      id: 'member-4',
      userId: 'user-1',
      tenantId: 'tenant-2',
      role: TENANT_ROLES.OWNER,
      permissions: ['*'],
      email: 'founder@startupxyz.com',
      name: 'John Smith',
      status: MEMBER_STATUSES.ACTIVE,
      joinedAt: '2024-02-01T14:00:00Z'
    },
    {
      id: 'member-5',
      userId: 'user-2',
      tenantId: 'tenant-3',
      role: TENANT_ROLES.OWNER,
      permissions: ['*'],
      email: 'lead@devteam-pro.com',
      name: 'Alice Brown',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      status: MEMBER_STATUSES.ACTIVE,
      joinedAt: '2024-03-01T09:00:00Z'
    }
  ] as TenantMember[],

  invites: [
    {
      id: 'invite-1',
      tenantId: 'tenant-1',
      email: 'newmember@acme-corp.com',
      role: TENANT_ROLES.MEMBER,
      status: INVITE_STATUSES.PENDING,
      invitedBy: 'user-1',
      createdAt: '2024-03-15T10:00:00Z',
      expiresAt: '2024-03-22T10:00:00Z'
    },
    {
      id: 'invite-2',
      tenantId: 'tenant-2',
      email: 'developer@startupxyz.com',
      role: TENANT_ROLES.ADMIN,
      status: INVITE_STATUSES.PENDING,
      invitedBy: 'user-1',
      createdAt: '2024-03-10T14:00:00Z',
      expiresAt: '2024-03-17T14:00:00Z'
    }
  ] as TenantInvite[],

  workspaces: [
    // Acme Corp Workspaces
    {
      id: 'workspace-1',
      tenantId: 'tenant-1',
      name: 'Product Development',
      description: 'Main product development workspace for new features',
      status: WORKSPACE_STATUSES.ACTIVE,
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-03-01T15:30:00Z'
    },
    {
      id: 'workspace-2',
      tenantId: 'tenant-1',
      name: 'Marketing Analytics',
      description: 'Marketing campaigns and customer analytics',
      status: WORKSPACE_STATUSES.ACTIVE,
      createdAt: '2024-02-01T09:00:00Z',
      updatedAt: '2024-02-28T12:00:00Z'
    },
    {
      id: 'workspace-3',
      tenantId: 'tenant-1',
      name: 'Customer Support',
      description: 'Customer support tickets and knowledge base',
      status: WORKSPACE_STATUSES.ACTIVE,
      createdAt: '2024-02-15T14:00:00Z',
      updatedAt: '2024-03-10T10:00:00Z'
    },
    // StartupXYZ Workspaces
    {
      id: 'workspace-4',
      tenantId: 'tenant-2',
      name: 'MVP Development',
      description: 'Building the minimum viable product',
      status: WORKSPACE_STATUSES.ACTIVE,
      createdAt: '2024-02-05T10:00:00Z',
      updatedAt: '2024-03-01T16:00:00Z'
    },
    {
      id: 'workspace-5',
      tenantId: 'tenant-2',
      name: 'User Research',
      description: 'Customer interviews and market research',
      status: WORKSPACE_STATUSES.ACTIVE,
      createdAt: '2024-02-10T11:00:00Z',
      updatedAt: '2024-02-25T13:30:00Z'
    },
    // DevTeam Pro Workspaces
    {
      id: 'workspace-6',
      tenantId: 'tenant-3',
      name: 'Client Projects',
      description: 'Active client development projects',
      status: WORKSPACE_STATUSES.ACTIVE,
      createdAt: '2024-03-02T09:00:00Z',
      updatedAt: '2024-03-15T14:00:00Z'
    },
    {
      id: 'workspace-7',
      tenantId: 'tenant-3',
      name: 'Internal Tools',
      description: 'Development of internal productivity tools',
      status: WORKSPACE_STATUSES.ACTIVE,
      createdAt: '2024-03-05T10:00:00Z',
      updatedAt: '2024-03-12T11:20:00Z'
    }
  ] as Workspace[],

  // Sample tenant-scoped data for testing isolation
  tenantScopedData: {
    'tenant-1': {
      dataSources: [
        { id: 'ds-1', name: 'Production Database', type: 'postgresql', status: 'connected' },
        { id: 'ds-2', name: 'Analytics Warehouse', type: 'redshift', status: 'connected' },
        { id: 'ds-3', name: 'Customer CRM', type: 'salesforce', status: 'disconnected' }
      ],
      charts: [
        { id: 'chart-1', name: 'Revenue Trends', type: 'line', workspace: 'workspace-2' },
        { id: 'chart-2', name: 'User Acquisition', type: 'bar', workspace: 'workspace-2' },
        { id: 'chart-3', name: 'Support Tickets', type: 'area', workspace: 'workspace-3' }
      ]
    },
    'tenant-2': {
      dataSources: [
        { id: 'ds-4', name: 'User Database', type: 'postgresql', status: 'connected' },
        { id: 'ds-5', name: 'Event Tracking', type: 'mixpanel', status: 'connected' }
      ],
      charts: [
        { id: 'chart-4', name: 'Daily Active Users', type: 'line', workspace: 'workspace-4' },
        { id: 'chart-5', name: 'Feature Usage', type: 'pie', workspace: 'workspace-5' }
      ]
    },
    'tenant-3': {
      dataSources: [
        { id: 'ds-6', name: 'Client DB', type: 'mysql', status: 'connected' },
        { id: 'ds-7', name: 'Time Tracking', type: 'toggl', status: 'connected' }
      ],
      charts: [
        { id: 'chart-6', name: 'Project Timeline', type: 'gantt', workspace: 'workspace-6' },
        { id: 'chart-7', name: 'Team Productivity', type: 'bar', workspace: 'workspace-7' }
      ]
    }
  }
};

// Helper functions for mock data management
export const getTenantById = (id: string): Tenant | undefined => {
  return tenantMocks.tenants.find(tenant => tenant.id === id);
};

export const getTenantMembers = (tenantId: string): TenantMember[] => {
  return tenantMocks.members.filter(member => member.tenantId === tenantId);
};

export const getTenantInvites = (tenantId: string): TenantInvite[] => {
  return tenantMocks.invites.filter(invite => invite.tenantId === tenantId);
};

export const getTenantWorkspaces = (tenantId: string): Workspace[] => {
  return tenantMocks.workspaces.filter(workspace => workspace.tenantId === tenantId);
};

export const getTenantScopedData = (tenantId: string) => {
  return tenantMocks.tenantScopedData[tenantId as keyof typeof tenantMocks.tenantScopedData] || { dataSources: [], charts: [] };
};

export const getUserTenants = (userId: string): Tenant[] => {
  const userMemberIds = tenantMocks.members
    .filter(member => member.userId === userId)
    .map(member => member.tenantId);
  
  return tenantMocks.tenants.filter(tenant => userMemberIds.includes(tenant.id));
};

export default tenantMocks;