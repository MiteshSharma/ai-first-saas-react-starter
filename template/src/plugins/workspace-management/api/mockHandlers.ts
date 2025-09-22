import MockAdapter from 'axios-mock-adapter';
import { Workspace, WorkspaceSettings } from '../../../core/types';
import {
  WorkspaceWithMembers,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  InviteWorkspaceMemberPayload,
  ExtendedWorkspaceMember,
  WorkspaceInvitation,
  WorkspaceActivity,
  WorkspaceListFilter,
  WorkspaceStats
} from '../types';

/**
 * Workspace Mock Data Handler
 */
class WorkspaceMockHandlers {
  private static workspaces: { [tenantId: string]: WorkspaceWithMembers[] } = {
    // Workspaces for tenant-1 (Acme Corporation)
    'tenant-1': [
      {
        id: 'workspace-1',
        tenantId: 'tenant-1',
        name: 'Engineering Team',
        description: 'Core engineering and development workspace',
        type: 'department' as const,
        status: 'active' as const,
        visibility: 'tenant' as const,
        joinPolicy: 'request' as const,
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-03-01T14:30:00Z',
        settings: {
          access: {
            visibility: 'tenant' as const,
            joinPolicy: 'request' as const,
            externalAccess: true
          },
          data: {
            allowDataExport: true,
            backupEnabled: true,
            dataRetentionDays: 90
          },
          notifications: {
            projectUpdates: true,
            memberActivity: true,
            systemAlerts: true
          }
        },
        memberCount: 8,
        isOwner: true,
        canManage: true
      },
      {
        id: 'workspace-2',
        tenantId: 'tenant-1',
        name: 'Product Management',
        description: 'Product strategy and roadmap workspace',
        type: 'department' as const,
        status: 'active' as const,
        visibility: 'tenant' as const,
        joinPolicy: 'invite_only' as const,
        createdAt: '2024-01-25T09:00:00Z',
        updatedAt: '2024-02-28T16:45:00Z',
        settings: {
          access: {
            visibility: 'tenant' as const,
            joinPolicy: 'invite_only' as const,
            externalAccess: false
          },
          data: {
            allowDataExport: true,
            backupEnabled: true,
            dataRetentionDays: 60
          },
          notifications: {
            projectUpdates: true,
            memberActivity: false,
            systemAlerts: true
          }
        },
        memberCount: 5,
        isOwner: false,
        canManage: false
      },
      {
        id: 'workspace-3',
        tenantId: 'tenant-1',
        name: 'Client Project Alpha',
        description: 'Dedicated workspace for Project Alpha client work',
        type: 'client' as const,
        status: 'active' as const,
        visibility: 'private' as const,
        joinPolicy: 'invite_only' as const,
        createdAt: '2024-02-01T11:30:00Z',
        updatedAt: '2024-03-05T10:15:00Z',
        settings: {
          access: {
            visibility: 'private' as const,
            joinPolicy: 'invite_only' as const,
            externalAccess: true
          },
          data: {
            allowDataExport: true,
            backupEnabled: true,
            dataRetentionDays: 365
          },
          notifications: {
            projectUpdates: true,
            memberActivity: true,
            systemAlerts: true
          }
        },
        memberCount: 12,
        isOwner: false,
        canManage: true
      }
    ],
    // Workspaces for tenant-2 (Startup Inc)
    'tenant-2': [
      {
        id: 'workspace-4',
        tenantId: 'tenant-2',
        name: 'General',
        description: 'Main workspace for all team activities',
        type: 'team' as const,
        status: 'active' as const,
        visibility: 'tenant' as const,
        joinPolicy: 'open' as const,
        createdAt: '2024-02-10T08:00:00Z',
        updatedAt: '2024-03-02T12:20:00Z',
        settings: {
          access: {
            visibility: 'tenant' as const,
            joinPolicy: 'open' as const,
            externalAccess: true
          },
          data: {
            allowDataExport: true,
            backupEnabled: false,
            dataRetentionDays: 30
          },
          notifications: {
            projectUpdates: true,
            memberActivity: true,
            systemAlerts: true
          }
        },
        memberCount: 6,
        isOwner: true,
        canManage: true
      },
      {
        id: 'workspace-5',
        tenantId: 'tenant-2',
        name: 'Marketing Campaign',
        description: 'Q2 marketing campaign planning and execution',
        type: 'project' as const,
        status: 'active' as const,
        visibility: 'tenant' as const,
        joinPolicy: 'request' as const,
        createdAt: '2024-02-15T14:00:00Z',
        updatedAt: '2024-03-01T09:30:00Z',
        settings: {
          access: {
            visibility: 'tenant' as const,
            joinPolicy: 'request' as const,
            externalAccess: false
          },
          data: {
            allowDataExport: true,
            backupEnabled: true,
            dataRetentionDays: 90
          },
          notifications: {
            projectUpdates: true,
            memberActivity: false,
            systemAlerts: true
          }
        },
        memberCount: 4,
        isOwner: false,
        canManage: true
      }
    ]
  };

  private static members: { [workspaceId: string]: ExtendedWorkspaceMember[] } = {
    'workspace-1': [
      {
        id: 'member-1',
        workspaceId: 'workspace-1',
        userId: 'user-1',
        role: 'admin' as const,
        permissions: [],
        status: 'active' as const,
        joinedAt: '2024-01-20T10:00:00Z',
        invitedAt: '2024-01-20T10:00:00Z',
        invitedBy: 'user-1'
      },
      {
        id: 'member-2',
        workspaceId: 'workspace-1',
        userId: 'user-2',
        role: 'editor' as const,
        permissions: [],
        status: 'active' as const,
        joinedAt: '2024-01-22T09:30:00Z',
        invitedAt: '2024-01-21T16:00:00Z',
        invitedBy: 'user-1'
      }
    ]
  };

  private static invitations: { [workspaceId: string]: WorkspaceInvitation[] } = {
    'workspace-1': [
      {
        id: 'invite-1',
        workspaceId: 'workspace-1',
        email: 'newdev@acme.com',
        role: 'editor' as const,
        status: 'pending' as const,
        invitedBy: 'user-1',
        invitedAt: '2024-03-01T10:00:00Z',
        expiresAt: '2024-03-15T10:00:00Z',
        token: 'invite-token-1',
        message: 'Welcome to the Engineering Team!'
      }
    ]
  };

  private static activities: { [workspaceId: string]: WorkspaceActivity[] } = {
    'workspace-1': [
      {
        id: 'activity-1',
        workspaceId: 'workspace-1',
        userId: 'user-1',
        userName: 'John Doe',
        action: 'workspace.member.invited',
        description: 'Invited newdev@acme.com to the workspace',
        metadata: { email: 'newdev@acme.com', role: 'editor' },
        createdAt: '2024-03-01T10:00:00Z'
      }
    ]
  };

  private static stats: { [workspaceId: string]: WorkspaceStats } = {
    'workspace-1': {
      workspaceId: 'workspace-1',
      memberCount: 8,
      activeMembers: 7,
      totalActivities: 45,
      recentActivities: 12,
      storageUsed: 2500,
      apiCallsUsed: 1200,
      lastActivity: '2024-03-01T10:00:00Z'
    }
  };

  // Helper methods
  static getWorkspacesByTenant(tenantId: string): WorkspaceWithMembers[] {
    return this.workspaces[tenantId] || [];
  }

  /**
   * Static list method for backend helper compatibility
   */
  static async list(tenantId: string, filter?: WorkspaceListFilter): Promise<WorkspaceWithMembers[]> {
    let workspaces = this.getWorkspacesByTenant(tenantId);

    // Apply filters if provided
    if (filter) {
      // Filter by status
      if (filter.status && filter.status.length > 0) {
        workspaces = workspaces.filter(w => filter.status!.includes(w.status));
      }

      // Filter by type
      if (filter.type && filter.type.length > 0) {
        workspaces = workspaces.filter(w => filter.type!.includes(w.type));
      }

      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        workspaces = workspaces.filter(w =>
          w.name.toLowerCase().includes(searchLower) ||
          (w.description && w.description.toLowerCase().includes(searchLower))
        );
      }

      // Sort
      const sortBy = filter.sortBy || 'name';
      const sortOrder = filter.sortOrder || 'asc';

      workspaces.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'updatedAt':
            aValue = new Date(a.updatedAt).getTime();
            bValue = new Date(b.updatedAt).getTime();
            break;
          case 'memberCount':
            aValue = a.memberCount || 0;
            bValue = b.memberCount || 0;
            break;
          default: // name
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
        }

        if (sortOrder === 'desc') {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    // Simulate async behavior
    return Promise.resolve(workspaces);
  }

  static getWorkspaceById(workspaceId: string): WorkspaceWithMembers | null {
    for (const tenantWorkspaces of Object.values(this.workspaces)) {
      const workspace = tenantWorkspaces.find(w => w.id === workspaceId);
      if (workspace) {
        return workspace;
      }
    }
    return null;
  }

  static addWorkspace(tenantId: string, workspace: WorkspaceWithMembers): void {
    if (!this.workspaces[tenantId]) {
      this.workspaces[tenantId] = [];
    }
    this.workspaces[tenantId].push(workspace);
  }

  static updateWorkspace(workspaceId: string, updates: Partial<WorkspaceWithMembers>): WorkspaceWithMembers | null {
    for (const tenantWorkspaces of Object.values(this.workspaces)) {
      const workspaceIndex = tenantWorkspaces.findIndex(w => w.id === workspaceId);
      if (workspaceIndex !== -1) {
        tenantWorkspaces[workspaceIndex] = { ...tenantWorkspaces[workspaceIndex], ...updates };
        return tenantWorkspaces[workspaceIndex];
      }
    }
    return null;
  }

  static updateWorkspaceSettings(workspaceId: string, settingsUpdate: any): WorkspaceWithMembers | null {
    for (const tenantWorkspaces of Object.values(this.workspaces)) {
      const workspaceIndex = tenantWorkspaces.findIndex(w => w.id === workspaceId);
      if (workspaceIndex !== -1) {
        const workspace = tenantWorkspaces[workspaceIndex];
        workspace.settings = { ...workspace.settings, ...settingsUpdate };
        workspace.updatedAt = new Date().toISOString();
        return workspace;
      }
    }
    return null;
  }

  static archiveWorkspace(workspaceId: string): WorkspaceWithMembers | null {
    for (const tenantWorkspaces of Object.values(this.workspaces)) {
      const workspaceIndex = tenantWorkspaces.findIndex(w => w.id === workspaceId);
      if (workspaceIndex !== -1) {
        const workspace = tenantWorkspaces[workspaceIndex];
        workspace.status = 'archived';
        workspace.updatedAt = new Date().toISOString();
        return workspace;
      }
    }
    return null;
  }

  static removeWorkspace(workspaceId: string): boolean {
    for (const tenantWorkspaces of Object.values(this.workspaces)) {
      const workspaceIndex = tenantWorkspaces.findIndex(w => w.id === workspaceId);
      if (workspaceIndex !== -1) {
        tenantWorkspaces.splice(workspaceIndex, 1);
        return true;
      }
    }
    return false;
  }

  static getActivities(workspaceId: string): WorkspaceActivity[] {
    return this.activities[workspaceId] || [];
  }

  static getStats(workspaceId: string): WorkspaceStats | null {
    return this.stats[workspaceId] || null;
  }

  /**
   * Static async methods for backend helper compatibility
   */
  static async get(workspaceId: string): Promise<WorkspaceWithMembers | null> {
    return Promise.resolve(this.getWorkspaceById(workspaceId));
  }

  static async create(tenantId: string, data: CreateWorkspacePayload): Promise<Workspace> {
    const newWorkspace: WorkspaceWithMembers = {
      id: `workspace-${Date.now()}`,
      tenantId,
      name: data.name,
      description: data.description || '',
      type: data.type,
      status: 'active',
      visibility: 'tenant',
      joinPolicy: 'request',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: (data.settings && data.settings.access && data.settings.data) ? data.settings as WorkspaceSettings : {
        access: {
          visibility: 'tenant' as const,
          joinPolicy: 'request' as const,
          externalAccess: false
        },
        data: {
          allowDataExport: true,
          backupEnabled: true,
          dataRetentionDays: 90
        },
        notifications: {
          projectUpdates: true,
          memberActivity: true,
          systemAlerts: true
        }
      },
      memberCount: 1,
      isOwner: true,
      canManage: true
    };

    this.addWorkspace(tenantId, newWorkspace);
    return Promise.resolve(newWorkspace);
  }

  static async update(workspaceId: string, data: UpdateWorkspacePayload): Promise<Workspace | null> {
    // Handle settings update carefully
    let finalUpdate: any = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    // If settings is provided but partial, merge with existing
    if (data.settings) {
      const existing = this.getWorkspaceById(workspaceId);
      if (existing && existing.settings) {
        finalUpdate.settings = {
          access: { ...existing.settings.access, ...(data.settings.access || {}) },
          data: { ...existing.settings.data, ...(data.settings.data || {}) },
          notifications: data.settings.notifications ?
            { ...existing.settings.notifications, ...data.settings.notifications } :
            existing.settings.notifications,
          integrations: data.settings.integrations ?
            { ...existing.settings.integrations, ...data.settings.integrations } :
            existing.settings.integrations
        };
      }
    }

    const updatedWorkspace = this.updateWorkspace(workspaceId, finalUpdate);
    return Promise.resolve(updatedWorkspace);
  }

  static async updateSettings(workspaceId: string, settings: Partial<WorkspaceSettings>): Promise<void> {
    const workspace = this.updateWorkspaceSettings(workspaceId, settings);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    return Promise.resolve();
  }

  static async archive(workspaceId: string): Promise<void> {
    const workspace = this.archiveWorkspace(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    return Promise.resolve();
  }

  static async delete(workspaceId: string): Promise<void> {
    const removed = this.removeWorkspace(workspaceId);
    if (!removed) {
      throw new Error('Workspace not found');
    }
    return Promise.resolve();
  }

  static async getActivityMock(workspaceId: string): Promise<WorkspaceActivity[]> {
    return Promise.resolve(this.getActivities(workspaceId));
  }

  static async getStatsMock(workspaceId: string): Promise<WorkspaceStats> {
    const stats = this.getStats(workspaceId);
    if (!stats) {
      throw new Error('Workspace stats not found');
    }
    return Promise.resolve(stats);
  }

  static async switchContextMock(workspaceId: string): Promise<{ workspace: Workspace; }> {
    const workspace = this.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    return Promise.resolve({
      workspace
    });
  }
}

export { WorkspaceMockHandlers };
export default WorkspaceMockHandlers;

export const setupWorkspaceMocks = (mock: MockAdapter) => {
  // Get workspaces for a tenant
  mock.onGet(/\/tenants\/[^/]+\/workspaces/).reply((config) => {
    const url = config.url || '';
    const tenantIdMatch = url.match(/\/tenants\/([^/]+)\/workspaces/);

    if (!tenantIdMatch) {
      return [400, { error: 'Invalid tenant ID' }];
    }

    const tenantId = tenantIdMatch[1];
    const workspaces = WorkspaceMockHandlers.getWorkspacesByTenant(tenantId);

    // Apply filters if provided
    const params = new URLSearchParams(url.split('?')[1] || '');
    let filteredWorkspaces = [...workspaces];

    // Filter by status
    const statusFilters = params.getAll('status');
    if (statusFilters.length > 0) {
      filteredWorkspaces = filteredWorkspaces.filter(w => statusFilters.includes(w.status));
    }

    // Filter by type
    const typeFilters = params.getAll('type');
    if (typeFilters.length > 0) {
      filteredWorkspaces = filteredWorkspaces.filter(w => typeFilters.includes(w.type));
    }

    // Search filter
    const search = params.get('search');
    if (search) {
      const searchLower = search.toLowerCase();
      filteredWorkspaces = filteredWorkspaces.filter(w =>
        w.name.toLowerCase().includes(searchLower) ||
        (w.description && w.description.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    const sortBy = params.get('sortBy') || 'name';
    const sortOrder = params.get('sortOrder') || 'asc';

    filteredWorkspaces.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'memberCount':
          aValue = a.memberCount || 0;
          bValue = b.memberCount || 0;
          break;
        default: // name
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    return [200, { data: filteredWorkspaces }];
  });

  // Get specific workspace
  mock.onGet(/\/workspaces\/[^/]+$/).reply((config) => {
    const url = config.url || '';
    const workspaceIdMatch = url.match(/\/workspaces\/([^/]+)$/);

    if (!workspaceIdMatch) {
      return [400, { error: 'Invalid workspace ID' }];
    }

    const workspaceId = workspaceIdMatch[1];
    const workspace = WorkspaceMockHandlers.getWorkspaceById(workspaceId);

    if (!workspace) {
      return [404, { error: 'Workspace not found' }];
    }

    return [200, { data: workspace }];
  });

  // Create workspace
  mock.onPost(/\/tenants\/[^/]+\/workspaces/).reply((config) => {
    const url = config.url || '';
    const tenantIdMatch = url.match(/\/tenants\/([^/]+)\/workspaces/);

    if (!tenantIdMatch) {
      return [400, { error: 'Invalid tenant ID' }];
    }

    const tenantId = tenantIdMatch[1];
    const data = JSON.parse(config.data) as CreateWorkspacePayload;

    const newWorkspace: WorkspaceWithMembers = {
      id: `workspace-${Date.now()}`,
      tenantId,
      name: data.name,
      description: data.description || '',
      type: data.type,
      status: 'active',
      visibility: 'tenant',
      joinPolicy: 'request',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: (data.settings && data.settings.access && data.settings.data) ? data.settings as WorkspaceSettings : {
        access: {
          visibility: 'tenant' as const,
          joinPolicy: 'request' as const,
          externalAccess: false
        },
        data: {
          allowDataExport: true,
          backupEnabled: true,
          dataRetentionDays: 90
        },
        notifications: {
          projectUpdates: true,
          memberActivity: true,
          systemAlerts: true
        }
      },
      memberCount: 1,
      isOwner: true,
      canManage: true
    };

    WorkspaceMockHandlers.addWorkspace(tenantId, newWorkspace);

    return [201, { data: newWorkspace }];
  });

  // Update workspace
  mock.onPut(/\/workspaces\/[^/]+$/).reply((config) => {
    const url = config.url || '';
    const workspaceIdMatch = url.match(/\/workspaces\/([^/]+)$/);

    if (!workspaceIdMatch) {
      return [400, { error: 'Invalid workspace ID' }];
    }

    const workspaceId = workspaceIdMatch[1];
    const updateData = JSON.parse(config.data) as UpdateWorkspacePayload;

    // Handle settings update carefully
    let finalUpdate: any = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // If settings is provided but partial, merge with existing
    if (updateData.settings) {
      const existing = WorkspaceMockHandlers.getWorkspaceById(workspaceId);
      if (existing && existing.settings) {
        finalUpdate.settings = {
          access: { ...existing.settings.access, ...(updateData.settings.access || {}) },
          data: { ...existing.settings.data, ...(updateData.settings.data || {}) },
          notifications: updateData.settings.notifications ?
            { ...existing.settings.notifications, ...updateData.settings.notifications } :
            existing.settings.notifications,
          integrations: updateData.settings.integrations ?
            { ...existing.settings.integrations, ...updateData.settings.integrations } :
            existing.settings.integrations
        };
      }
    }

    const updatedWorkspace = WorkspaceMockHandlers.updateWorkspace(workspaceId, finalUpdate);

    if (updatedWorkspace) {
      return [200, { data: updatedWorkspace }];
    }

    return [404, { error: 'Workspace not found' }];
  });

  // Update workspace settings
  mock.onPut(/\/workspaces\/[^/]+\/settings/).reply((config) => {
    const url = config.url || '';
    const workspaceIdMatch = url.match(/\/workspaces\/([^/]+)\/settings/);

    if (!workspaceIdMatch) {
      return [400, { error: 'Invalid workspace ID' }];
    }

    const workspaceId = workspaceIdMatch[1];
    const settingsUpdate = JSON.parse(config.data);

    const workspace = WorkspaceMockHandlers.updateWorkspaceSettings(workspaceId, settingsUpdate);

    if (workspace) {
      return [200, { data: workspace }];
    }

    return [404, { error: 'Workspace not found' }];
  });

  // Archive workspace
  mock.onPut(/\/workspaces\/[^/]+\/archive/).reply((config) => {
    const url = config.url || '';
    const workspaceIdMatch = url.match(/\/workspaces\/([^/]+)\/archive/);

    if (!workspaceIdMatch) {
      return [400, { error: 'Invalid workspace ID' }];
    }

    const workspaceId = workspaceIdMatch[1];

    const workspace = WorkspaceMockHandlers.archiveWorkspace(workspaceId);

    if (workspace) {
      return [200, { data: workspace }];
    }

    return [404, { error: 'Workspace not found' }];
  });

  // Delete workspace
  mock.onDelete(/\/workspaces\/[^/]+$/).reply((config) => {
    const url = config.url || '';
    const workspaceIdMatch = url.match(/\/workspaces\/([^/]+)$/);

    if (!workspaceIdMatch) {
      return [400, { error: 'Invalid workspace ID' }];
    }

    const workspaceId = workspaceIdMatch[1];

    const removed = WorkspaceMockHandlers.removeWorkspace(workspaceId);

    if (removed) {
      return [204];
    }

    return [404, { error: 'Workspace not found' }];
  });

  // Get workspace activity
  mock.onGet(/\/workspaces\/[^/]+\/activity/).reply((config) => {
    const url = config.url || '';
    const workspaceIdMatch = url.match(/\/workspaces\/([^/]+)\/activity/);

    if (!workspaceIdMatch) {
      return [400, { error: 'Invalid workspace ID' }];
    }

    const workspaceId = workspaceIdMatch[1];
    const activities = WorkspaceMockHandlers.getActivities(workspaceId);

    return [200, { data: activities }];
  });

  // Get workspace stats
  mock.onGet(/\/workspaces\/[^/]+\/stats/).reply((config) => {
    const url = config.url || '';
    const workspaceIdMatch = url.match(/\/workspaces\/([^/]+)\/stats/);

    if (!workspaceIdMatch) {
      return [400, { error: 'Invalid workspace ID' }];
    }

    const workspaceId = workspaceIdMatch[1];
    const stats = WorkspaceMockHandlers.getStats(workspaceId);

    if (!stats) {
      return [404, { error: 'Workspace stats not found' }];
    }

    return [200, { data: stats }];
  });

  // Switch workspace context
  mock.onPost('/workspaces/switch').reply((config) => {
    const { workspaceId } = JSON.parse(config.data);
    const workspace = WorkspaceMockHandlers.getWorkspaceById(workspaceId);

    if (!workspace) {
      return [404, { error: 'Workspace not found' }];
    }

    return [200, {
      data: {
        workspace
      }
    }];
  });
};