/**
 * @fileoverview User Management Mock API Handlers
 *
 * Mock implementations for user management API endpoints
 */

import {
  Invitation,
  SendInvitationRequest,
  InvitationListResponse,
  UserWithTenantInfo,
  UserListResponse,
  UserSearchFilters,
  UpdateUserProfileRequest,
  UpdateUserPreferencesRequest,
  UpdateSecuritySettingsRequest,
  UserPreferences,
  SecuritySettings,
  UploadAvatarResponse,
  TENANT_ROLES,
  INVITATION_STATUSES,
  WORKSPACE_ROLES,
} from '../types';

class UserManagementMockHandlers {
  private static invitations: Invitation[] = [];
  private static users: UserWithTenantInfo[] = [];
  private static userPreferences: Map<string, UserPreferences> = new Map();
  private static securitySettings: Map<string, SecuritySettings> = new Map();
  private static initialized = false;

  private static initializeData() {
    if (!this.initialized) {
      this.generateMockUsers();
      this.generateMockInvitations();
      this.generateMockPreferences();
      this.generateMockSecuritySettings();
      this.initialized = true;
    }
  }

  private static generateMockUsers(): void {
    this.users = [
      {
        id: 'user-1',
        email: 'john.doe@example.com',
        emailVerified: true,
        status: 'active',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
          timezone: 'America/New_York',
          locale: 'en-US',
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-09-18T16:30:00Z',
        tenantRole: TENANT_ROLES.ADMIN,
        workspaceRoles: [
          { workspaceId: 'ws-1', role: WORKSPACE_ROLES.ADMIN },
          { workspaceId: 'ws-2', role: WORKSPACE_ROLES.MEMBER },
        ],
        lastLogin: '2024-09-18T15:30:00Z',
        permissions: ['user.read', 'user.write', 'tenant.read', 'workspace.admin'],
      },
      {
        id: 'user-2',
        email: 'jane.smith@example.com',
        emailVerified: true,
        status: 'active',
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
          displayName: 'Jane Smith',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
          timezone: 'America/Los_Angeles',
          locale: 'en-US',
        },
        createdAt: '2024-02-20T14:30:00Z',
        updatedAt: '2024-09-18T14:00:00Z',
        tenantRole: TENANT_ROLES.MEMBER,
        workspaceRoles: [
          { workspaceId: 'ws-1', role: WORKSPACE_ROLES.MEMBER },
        ],
        lastLogin: '2024-09-18T14:00:00Z',
        permissions: ['user.read', 'workspace.read'],
      },
      {
        id: 'user-3',
        email: 'bob.wilson@example.com',
        emailVerified: false,
        status: 'inactive',
        profile: {
          firstName: 'Bob',
          lastName: 'Wilson',
          displayName: 'Bob Wilson',
          timezone: 'Europe/London',
          locale: 'en-GB',
        },
        createdAt: '2024-03-10T09:15:00Z',
        updatedAt: '2024-09-15T11:20:00Z',
        tenantRole: TENANT_ROLES.GUEST,
        lastLogin: '2024-09-10T16:45:00Z',
        permissions: ['user.read'],
      },
      {
        id: 'user-4',
        email: 'alice.johnson@example.com',
        emailVerified: true,
        status: 'active',
        profile: {
          firstName: 'Alice',
          lastName: 'Johnson',
          displayName: 'Alice Johnson',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
          timezone: 'Australia/Sydney',
          locale: 'en-AU',
        },
        createdAt: '2024-04-05T12:00:00Z',
        updatedAt: '2024-09-18T09:30:00Z',
        tenantRole: TENANT_ROLES.BILLING_MANAGER,
        workspaceRoles: [
          { workspaceId: 'ws-2', role: WORKSPACE_ROLES.VIEWER },
        ],
        lastLogin: '2024-09-18T09:30:00Z',
        permissions: ['user.read', 'billing.read', 'billing.write'],
      },
      {
        id: 'user-5',
        email: 'charlie.brown@example.com',
        emailVerified: true,
        status: 'suspended',
        profile: {
          firstName: 'Charlie',
          lastName: 'Brown',
          displayName: 'Charlie Brown',
          timezone: 'America/Chicago',
          locale: 'en-US',
        },
        createdAt: '2024-05-12T16:20:00Z',
        updatedAt: '2024-09-01T10:00:00Z',
        tenantRole: TENANT_ROLES.MEMBER,
        lastLogin: '2024-08-30T14:15:00Z',
        permissions: [],
      },
    ];
  }

  private static generateMockInvitations(): void {
    this.invitations = [
      {
        id: 'inv-1',
        email: 'newuser1@example.com',
        tenantId: 'tenant-1',
        tenantRole: TENANT_ROLES.MEMBER,
        workspaceRoles: [
          { workspaceId: 'ws-1', role: WORKSPACE_ROLES.MEMBER },
        ],
        invitedBy: 'user-1',
        status: INVITATION_STATUSES.PENDING,
        token: 'invite-token-1',
        expiresAt: '2024-09-25T16:30:00Z',
        createdAt: '2024-09-18T16:30:00Z',
      },
      {
        id: 'inv-2',
        email: 'newuser2@example.com',
        tenantId: 'tenant-1',
        tenantRole: TENANT_ROLES.ADMIN,
        invitedBy: 'user-1',
        status: INVITATION_STATUSES.PENDING,
        token: 'invite-token-2',
        expiresAt: '2024-09-25T14:00:00Z',
        createdAt: '2024-09-18T14:00:00Z',
      },
      {
        id: 'inv-3',
        email: 'expired@example.com',
        tenantId: 'tenant-1',
        tenantRole: TENANT_ROLES.GUEST,
        invitedBy: 'user-1',
        status: INVITATION_STATUSES.EXPIRED,
        token: 'invite-token-3',
        expiresAt: '2024-09-10T12:00:00Z',
        createdAt: '2024-09-03T12:00:00Z',
      },
    ];
  }

  private static generateMockPreferences(): void {
    this.users.forEach(user => {
      this.userPreferences.set(user.id, {
        theme: 'light',
        language: user.profile.locale,
        timezone: user.profile.timezone,
        notifications: {
          email: {
            invitations: true,
            updates: true,
            security: true,
            marketing: false,
          },
          inApp: {
            mentions: true,
            updates: true,
            security: true,
          },
        },
        dashboard: {
          layout: 'grid',
          defaultWorkspace: user.workspaceRoles?.[0]?.workspaceId,
          widgets: ['recent-activity', 'quick-actions', 'stats'],
        },
      });
    });
  }

  private static generateMockSecuritySettings(): void {
    this.users.forEach(user => {
      this.securitySettings.set(user.id, {
        twoFactorEnabled: user.id === 'user-1' || user.id === 'user-4',
        lastPasswordChange: '2024-07-15T10:00:00Z',
        sessionTimeout: 60,
        trustedDevices: [
          {
            id: `device-${user.id}-1`,
            name: 'MacBook Pro',
            browser: 'Chrome',
            os: 'macOS',
            lastUsed: '2024-09-18T16:30:00Z',
            location: 'New York, NY',
          },
        ],
      });
    });
  }

  // ============================================================================
  // Invitation Operations
  // ============================================================================

  static async sendInvitations(data: SendInvitationRequest): Promise<Invitation[]> {
    this.initializeData();

    const newInvitations: Invitation[] = data.emails.map((email, index) => ({
      id: `inv-${Date.now()}-${index}`,
      email,
      tenantId: data.tenantId,
      tenantRole: data.orgRole,
      workspaceRoles: data.workspaceRoles?.map(wr => ({
        workspaceId: wr.wsId,
        role: wr.role
      })),
      invitedBy: 'current-user',
      status: INVITATION_STATUSES.PENDING,
      token: `invite-token-${Date.now()}-${index}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    }));

    this.invitations.push(...newInvitations);
    return newInvitations;
  }

  static async getInvitations(tenantId: string): Promise<InvitationListResponse> {
    this.initializeData();

    const filteredInvitations = this.invitations.filter(inv => inv.tenantId === tenantId);
    return {
      invitations: filteredInvitations,
      total: filteredInvitations.length,
    };
  }

  static async cancelInvitation(invitationId: string): Promise<void> {
    this.initializeData();

    const invitation = this.invitations.find(inv => inv.id === invitationId);
    if (invitation) {
      invitation.status = INVITATION_STATUSES.CANCELLED;
    }
  }

  static async resendInvitation(invitationId: string): Promise<void> {
    this.initializeData();

    const invitation = this.invitations.find(inv => inv.id === invitationId);
    if (invitation) {
      invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      invitation.status = INVITATION_STATUSES.PENDING;
    }
  }

  static async acceptInvitation(token: string): Promise<void> {
    this.initializeData();

    const invitation = this.invitations.find(inv => inv.token === token);
    if (invitation) {
      invitation.status = INVITATION_STATUSES.ACCEPTED;
      invitation.acceptedAt = new Date().toISOString();
    }
  }

  // ============================================================================
  // User Operations
  // ============================================================================

  static async getUsers(tenantId: string, filters?: UserSearchFilters): Promise<UserListResponse> {
    this.initializeData();

    let filteredUsers = [...this.users];

    if (filters) {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user =>
          user.profile.firstName.toLowerCase().includes(search) ||
          user.profile.lastName.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
        );
      }

      if (filters.role) {
        filteredUsers = filteredUsers.filter(user => user.tenantRole === filters.role);
      }

      if (filters.status) {
        filteredUsers = filteredUsers.filter(user => user.status === filters.status);
      }

      if (filters.workspaceId) {
        filteredUsers = filteredUsers.filter(user =>
          user.workspaceRoles?.some(wr => wr.workspaceId === filters.workspaceId)
        );
      }
    }

    return {
      users: filteredUsers,
      total: filteredUsers.length,
      page: 1,
      limit: 50,
      filters: filters || {},
    };
  }

  static async getUserById(userId: string): Promise<UserWithTenantInfo | null> {
    this.initializeData();

    return this.users.find(user => user.id === userId) || null;
  }

  static async updateUserProfile(userId: string, data: UpdateUserProfileRequest): Promise<void> {
    this.initializeData();

    const user = this.users.find(u => u.id === userId);
    if (user) {
      if (data.firstName) user.profile.firstName = data.firstName;
      if (data.lastName) user.profile.lastName = data.lastName;
      if (data.displayName) user.profile.displayName = data.displayName;
      if (data.timezone) user.profile.timezone = data.timezone;
      if (data.locale) user.profile.locale = data.locale;
      user.updatedAt = new Date().toISOString();
    }
  }

  static async uploadUserAvatar(userId: string, file: File): Promise<UploadAvatarResponse> {
    this.initializeData();

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}-${Date.now()}`;

    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.profile.avatar = avatarUrl;
      user.updatedAt = new Date().toISOString();
    }

    return {
      avatarUrl,
      thumbnailUrl: avatarUrl,
    };
  }

  // ============================================================================
  // User Preferences Operations
  // ============================================================================

  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    this.initializeData();

    return this.userPreferences.get(userId) || {
      theme: 'light',
      language: 'en-US',
      timezone: 'America/New_York',
      notifications: {
        email: {
          invitations: true,
          updates: true,
          security: true,
          marketing: false,
        },
        inApp: {
          mentions: true,
          updates: true,
          security: true,
        },
      },
      dashboard: {
        layout: 'grid',
        widgets: ['recent-activity'],
      },
    };
  }

  static async updateUserPreferences(userId: string, data: UpdateUserPreferencesRequest): Promise<void> {
    this.initializeData();

    const current = this.userPreferences.get(userId) || await this.getUserPreferences(userId);
    const updated: UserPreferences = {
      theme: data.theme ?? current.theme,
      language: data.language ?? current.language,
      timezone: data.timezone ?? current.timezone,
      notifications: data.notifications
        ? {
            email: { ...current.notifications.email, ...data.notifications.email },
            inApp: { ...current.notifications.inApp, ...data.notifications.inApp }
          }
        : current.notifications,
      dashboard: data.dashboard
        ? { ...current.dashboard, ...data.dashboard }
        : current.dashboard
    };

    this.userPreferences.set(userId, updated);
  }

  // ============================================================================
  // Security Operations
  // ============================================================================

  static async getSecuritySettings(userId: string): Promise<SecuritySettings> {
    this.initializeData();

    return this.securitySettings.get(userId) || {
      twoFactorEnabled: false,
      sessionTimeout: 60,
      trustedDevices: [],
    };
  }

  static async updateSecuritySettings(userId: string, data: UpdateSecuritySettingsRequest): Promise<void> {
    this.initializeData();

    const current = this.securitySettings.get(userId) || await this.getSecuritySettings(userId);
    const updated = { ...current, ...data };
    this.securitySettings.set(userId, updated);
  }

  static async enableTwoFactor(userId: string): Promise<{ qrCode: string; backupCodes: string[] }> {
    this.initializeData();

    const settings = this.securitySettings.get(userId) || await this.getSecuritySettings(userId);
    settings.twoFactorEnabled = true;
    this.securitySettings.set(userId, settings);

    return {
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      backupCodes: [
        '12345678',
        '87654321',
        '11111111',
        '22222222',
        '33333333',
        '44444444',
        '55555555',
        '66666666',
      ],
    };
  }

  static async disableTwoFactor(userId: string): Promise<void> {
    this.initializeData();

    const settings = this.securitySettings.get(userId) || await this.getSecuritySettings(userId);
    settings.twoFactorEnabled = false;
    this.securitySettings.set(userId, settings);
  }

  // ============================================================================
  // User Management Operations
  // ============================================================================

  static async updateUserRole(tenantId: string, userId: string, role: string): Promise<void> {
    this.initializeData();

    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.tenantRole = role;
      user.updatedAt = new Date().toISOString();
    }
  }

  static async deactivateUser(tenantId: string, userId: string): Promise<void> {
    this.initializeData();

    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.status = 'inactive';
      user.updatedAt = new Date().toISOString();
    }
  }

  static async reactivateUser(tenantId: string, userId: string): Promise<void> {
    this.initializeData();

    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.status = 'active';
      user.updatedAt = new Date().toISOString();
    }
  }

  static async removeUser(tenantId: string, userId: string): Promise<void> {
    this.initializeData();

    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }
}

export default UserManagementMockHandlers;