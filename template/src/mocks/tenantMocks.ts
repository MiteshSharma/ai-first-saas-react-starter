import { 
  Tenant, 
  TenantMember, 
  TenantInvite, 
  Workspace,
  TenantPlan,
  TenantStatus,
  TenantRole,
  MemberStatus,
  InviteStatus,
  WorkspaceStatus
} from '../store/tenant/types';

// Mock tenant data for testing
export const tenantMocks = {
  tenants: [
    {
      id: 'tenant-1',
      name: 'Acme Corporation',
      slug: 'acme-corp',
      plan: TenantPlan.ENTERPRISE,
      status: TenantStatus.ACTIVE,
      ownerId: 'user-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-03-01T15:30:00Z',
      settings: {
        allowInvites: true,
        maxMembers: 100,
        features: ['advanced-analytics', 'custom-branding', 'sso'],
        customDomain: 'workspace.acme-corp.com'
      }
    },
    {
      id: 'tenant-2', 
      name: 'StartupXYZ',
      slug: 'startup-xyz',
      plan: TenantPlan.STARTER,
      status: TenantStatus.ACTIVE,
      ownerId: 'user-1',
      createdAt: '2024-02-01T14:00:00Z',
      updatedAt: '2024-02-15T09:20:00Z',
      settings: {
        allowInvites: true,
        maxMembers: 10,
        features: ['basic-analytics']
      }
    },
    {
      id: 'tenant-3',
      name: 'DevTeam Pro',
      slug: 'devteam-pro',
      plan: TenantPlan.PROFESSIONAL,
      status: TenantStatus.TRIAL,
      ownerId: 'user-2',
      createdAt: '2024-03-01T09:00:00Z',
      updatedAt: '2024-03-01T09:00:00Z',
      settings: {
        allowInvites: true,
        maxMembers: 25,
        features: ['advanced-analytics', 'integrations']
      }
    }
  ] as Tenant[],

  members: [
    {
      id: 'member-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: TenantRole.OWNER,
      email: 'owner@acme-corp.com',
      name: 'John Smith',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      status: MemberStatus.ACTIVE,
      invitedAt: '2024-01-15T10:00:00Z',
      joinedAt: '2024-01-15T10:05:00Z'
    },
    {
      id: 'member-2',
      userId: 'user-3',
      tenantId: 'tenant-1',
      role: TenantRole.ADMIN,
      email: 'admin@acme-corp.com',
      name: 'Sarah Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      status: MemberStatus.ACTIVE,
      invitedAt: '2024-01-16T11:00:00Z',
      joinedAt: '2024-01-16T14:20:00Z'
    },
    {
      id: 'member-3',
      userId: 'user-4',
      tenantId: 'tenant-1',
      role: TenantRole.MEMBER,
      email: 'member@acme-corp.com',
      name: 'Mike Wilson',
      status: MemberStatus.ACTIVE,
      invitedAt: '2024-01-20T09:00:00Z',
      joinedAt: '2024-01-20T10:15:00Z'
    },
    {
      id: 'member-4',
      userId: 'user-1',
      tenantId: 'tenant-2',
      role: TenantRole.OWNER,
      email: 'founder@startupxyz.com',
      name: 'John Smith',
      status: MemberStatus.ACTIVE,
      invitedAt: '2024-02-01T14:00:00Z',
      joinedAt: '2024-02-01T14:00:00Z'
    },
    {
      id: 'member-5',
      userId: 'user-2',
      tenantId: 'tenant-3',
      role: TenantRole.OWNER,
      email: 'lead@devteam-pro.com',
      name: 'Alice Brown',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      status: MemberStatus.ACTIVE,
      invitedAt: '2024-03-01T09:00:00Z',
      joinedAt: '2024-03-01T09:00:00Z'
    }
  ] as TenantMember[],

  invites: [
    {
      id: 'invite-1',
      tenantId: 'tenant-1',
      email: 'newmember@acme-corp.com',
      role: TenantRole.MEMBER,
      status: InviteStatus.PENDING,
      invitedBy: 'user-1',
      invitedAt: '2024-03-15T10:00:00Z',
      expiresAt: '2024-03-22T10:00:00Z',
      token: 'invite-token-123'
    },
    {
      id: 'invite-2',
      tenantId: 'tenant-2',
      email: 'developer@startupxyz.com',
      role: TenantRole.ADMIN,
      status: InviteStatus.PENDING,
      invitedBy: 'user-1',
      invitedAt: '2024-03-10T14:00:00Z',
      expiresAt: '2024-03-17T14:00:00Z',
      token: 'invite-token-456'
    }
  ] as TenantInvite[],

  workspaces: [
    // Acme Corp Workspaces
    {
      id: 'workspace-1',
      tenantId: 'tenant-1',
      name: 'Product Development',
      description: 'Main product development workspace for new features',
      slug: 'product-dev',
      ownerId: 'user-1',
      status: WorkspaceStatus.ACTIVE,
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-03-01T15:30:00Z',
      settings: {
        isPublic: false,
        allowGuests: false,
        retentionDays: 90
      }
    },
    {
      id: 'workspace-2',
      tenantId: 'tenant-1',
      name: 'Marketing Analytics',
      description: 'Marketing campaigns and customer analytics',
      slug: 'marketing',
      ownerId: 'user-3',
      status: WorkspaceStatus.ACTIVE,
      createdAt: '2024-02-01T09:00:00Z',
      updatedAt: '2024-02-28T12:00:00Z',
      settings: {
        isPublic: true,
        allowGuests: true,
        retentionDays: 60
      }
    },
    {
      id: 'workspace-3',
      tenantId: 'tenant-1',
      name: 'Customer Support',
      description: 'Customer support tickets and knowledge base',
      slug: 'support',
      ownerId: 'user-4',
      status: WorkspaceStatus.ACTIVE,
      createdAt: '2024-02-15T14:00:00Z',
      updatedAt: '2024-03-10T10:00:00Z',
      settings: {
        isPublic: false,
        allowGuests: true,
        retentionDays: 365
      }
    },
    // StartupXYZ Workspaces
    {
      id: 'workspace-4',
      tenantId: 'tenant-2',
      name: 'MVP Development',
      description: 'Building the minimum viable product',
      slug: 'mvp',
      ownerId: 'user-1',
      status: WorkspaceStatus.ACTIVE,
      createdAt: '2024-02-05T10:00:00Z',
      updatedAt: '2024-03-01T16:00:00Z',
      settings: {
        isPublic: false,
        allowGuests: false,
        retentionDays: 30
      }
    },
    {
      id: 'workspace-5',
      tenantId: 'tenant-2',
      name: 'User Research',
      description: 'Customer interviews and market research',
      slug: 'research',
      ownerId: 'user-1',
      status: WorkspaceStatus.ACTIVE,
      createdAt: '2024-02-10T11:00:00Z',
      updatedAt: '2024-02-25T13:30:00Z',
      settings: {
        isPublic: true,
        allowGuests: true,
        retentionDays: 180
      }
    },
    // DevTeam Pro Workspaces
    {
      id: 'workspace-6',
      tenantId: 'tenant-3',
      name: 'Client Projects',
      description: 'Active client development projects',
      slug: 'client-projects',
      ownerId: 'user-2',
      status: WorkspaceStatus.ACTIVE,
      createdAt: '2024-03-02T09:00:00Z',
      updatedAt: '2024-03-15T14:00:00Z',
      settings: {
        isPublic: false,
        allowGuests: false,
        retentionDays: 120
      }
    },
    {
      id: 'workspace-7',
      tenantId: 'tenant-3',
      name: 'Internal Tools',
      description: 'Development of internal productivity tools',
      slug: 'internal-tools',
      ownerId: 'user-2',
      status: WorkspaceStatus.ACTIVE,
      createdAt: '2024-03-05T10:00:00Z',
      updatedAt: '2024-03-12T11:20:00Z',
      settings: {
        isPublic: true,
        allowGuests: false,
        retentionDays: 90
      }
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