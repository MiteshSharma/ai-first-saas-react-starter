/**
 * @fileoverview User Management Backend Helper - API calls with mock/real backend switching
 *
 * Helper for making API calls for user management operations following template guidelines
 */

import { apiHelper } from '../../../core/api/apiHelper';
import { USER_MANAGEMENT_ENDPOINTS } from './endpoints';
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
} from '../types';
import UserManagementMockHandlers from './mockHandlers';

/**
 * API response types (as received from backend)
 */
export interface InvitationApiResponse {
  invitations: Invitation[];
  total: number;
  page?: number;
  limit?: number;
}

export interface UserListApiResponse {
  users: UserWithTenantInfo[];
  total: number;
  page: number;
  limit: number;
}

export interface TwoFactorSetupResponse {
  qrCode: string;
  backupCodes: string[];
}

/**
 * Backend helper for API calls with mock mode support
 */
export class UserManagementBackendHelper {
  private isMockMode: boolean;

  constructor() {
    this.isMockMode = this.isMockModeEnabled();
  }

  /**
   * Check if mock mode is enabled
   */
  private isMockModeEnabled(): boolean {
    return process.env.REACT_APP_USE_MOCK_API === 'true' || process.env.NODE_ENV === 'test';
  }

  // ============================================================================
  // Invitation Operations
  // ============================================================================

  /**
   * Send invitations to users
   */
  async sendInvitations(data: SendInvitationRequest): Promise<Invitation[]> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.sendInvitations(data);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.SEND_INVITATIONS.replace(':tenantId', data.tenantId);
        const response = await apiHelper.post<{ invitations: Invitation[] }>(endpoint, {
          emails: data.emails,
          orgRole: data.orgRole,
          workspaceRoles: data.workspaceRoles,
        });
        return response.data.invitations;
      }
    } catch (error) {
      throw new Error('Failed to send invitations');
    }
  }

  /**
   * Get list of invitations for a tenant
   */
  async getInvitations(tenantId: string): Promise<InvitationListResponse> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.getInvitations(tenantId);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.GET_INVITATIONS.replace(':tenantId', tenantId);
        const response = await apiHelper.get<InvitationApiResponse>(endpoint);
        return {
          invitations: response.data.invitations,
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
        };
      }
    } catch (error) {
      throw new Error('Failed to fetch invitations');
    }
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.cancelInvitation(invitationId);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.CANCEL_INVITATION.replace(':id', invitationId);
        await apiHelper.delete(endpoint);
      }
    } catch (error) {
      throw new Error('Failed to cancel invitation');
    }
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(invitationId: string): Promise<void> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.resendInvitation(invitationId);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.RESEND_INVITATION.replace(':id', invitationId);
        await apiHelper.post(endpoint);
      }
    } catch (error) {
      throw new Error('Failed to resend invitation');
    }
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string): Promise<void> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.acceptInvitation(token);
      } else {
        await apiHelper.post(USER_MANAGEMENT_ENDPOINTS.ACCEPT_INVITATION, { token });
      }
    } catch (error) {
      throw new Error('Failed to accept invitation');
    }
  }

  // ============================================================================
  // User Operations
  // ============================================================================

  /**
   * Get users for a tenant with filters
   */
  async getUsers(tenantId: string, filters?: UserSearchFilters): Promise<UserListResponse> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.getUsers(tenantId, filters);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.GET_USERS.replace(':tenantId', tenantId);
        const params = new URLSearchParams();

        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, String(value));
            }
          });
        }

        const response = await apiHelper.get<UserListApiResponse>(`${endpoint}?${params}`);
        return {
          users: response.data.users,
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          filters: filters || {},
        };
      }
    } catch (error) {
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Get a specific user by ID
   */
  async getUserById(userId: string): Promise<UserWithTenantInfo | null> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.getUserById(userId);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.GET_USER_BY_ID.replace(':id', userId);
        const response = await apiHelper.get<UserWithTenantInfo>(endpoint);
        return response.data;
      }
    } catch (error) {
      throw new Error(`Failed to fetch user ${userId}`);
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, data: UpdateUserProfileRequest): Promise<void> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.updateUserProfile(userId, data);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.UPDATE_USER_PROFILE.replace(':id', userId);
        await apiHelper.put(endpoint, data);
      }
    } catch (error) {
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Upload user avatar
   */
  async uploadUserAvatar(userId: string, file: File): Promise<UploadAvatarResponse> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.uploadUserAvatar(userId, file);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.UPLOAD_USER_AVATAR.replace(':id', userId);
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await apiHelper.post<UploadAvatarResponse>(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      }
    } catch (error) {
      throw new Error('Failed to upload avatar');
    }
  }

  // ============================================================================
  // User Preferences Operations
  // ============================================================================

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.getUserPreferences(userId);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.GET_USER_PREFERENCES.replace(':id', userId);
        const response = await apiHelper.get<UserPreferences>(endpoint);
        return response.data;
      }
    } catch (error) {
      throw new Error('Failed to fetch user preferences');
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, data: UpdateUserPreferencesRequest): Promise<void> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.updateUserPreferences(userId, data);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.UPDATE_USER_PREFERENCES.replace(':id', userId);
        await apiHelper.put(endpoint, data);
      }
    } catch (error) {
      throw new Error('Failed to update user preferences');
    }
  }

  // ============================================================================
  // Security Operations
  // ============================================================================

  /**
   * Get security settings
   */
  async getSecuritySettings(userId: string): Promise<SecuritySettings> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.getSecuritySettings(userId);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.GET_SECURITY_SETTINGS.replace(':id', userId);
        const response = await apiHelper.get<SecuritySettings>(endpoint);
        return response.data;
      }
    } catch (error) {
      throw new Error('Failed to fetch security settings');
    }
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(userId: string, data: UpdateSecuritySettingsRequest): Promise<void> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.updateSecuritySettings(userId, data);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.UPDATE_SECURITY_SETTINGS.replace(':id', userId);
        await apiHelper.put(endpoint, data);
      }
    } catch (error) {
      throw new Error('Failed to update security settings');
    }
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(userId: string): Promise<TwoFactorSetupResponse> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.enableTwoFactor(userId);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.ENABLE_TWO_FACTOR.replace(':id', userId);
        const response = await apiHelper.post<TwoFactorSetupResponse>(endpoint);
        return response.data;
      }
    } catch (error) {
      throw new Error('Failed to enable two-factor authentication');
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(userId: string): Promise<void> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.disableTwoFactor(userId);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.DISABLE_TWO_FACTOR.replace(':id', userId);
        await apiHelper.post(endpoint);
      }
    } catch (error) {
      throw new Error('Failed to disable two-factor authentication');
    }
  }

  // ============================================================================
  // User Management Operations
  // ============================================================================

  /**
   * Update user role in tenant
   */
  async updateUserRole(tenantId: string, userId: string, role: string): Promise<void> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.updateUserRole(tenantId, userId, role);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.UPDATE_USER_ROLE
          .replace(':tenantId', tenantId)
          .replace(':userId', userId);
        await apiHelper.put(endpoint, { role });
      }
    } catch (error) {
      throw new Error('Failed to update user role');
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(tenantId: string, userId: string): Promise<void> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.deactivateUser(tenantId, userId);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.DEACTIVATE_USER
          .replace(':tenantId', tenantId)
          .replace(':userId', userId);
        await apiHelper.post(endpoint);
      }
    } catch (error) {
      throw new Error('Failed to deactivate user');
    }
  }

  /**
   * Reactivate user
   */
  async reactivateUser(tenantId: string, userId: string): Promise<void> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.reactivateUser(tenantId, userId);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.REACTIVATE_USER
          .replace(':tenantId', tenantId)
          .replace(':userId', userId);
        await apiHelper.post(endpoint);
      }
    } catch (error) {
      throw new Error('Failed to reactivate user');
    }
  }

  /**
   * Remove user from tenant
   */
  async removeUser(tenantId: string, userId: string): Promise<void> {
    try {
      if (this.isMockMode) {
        return await UserManagementMockHandlers.removeUser(tenantId, userId);
      } else {
        const endpoint = USER_MANAGEMENT_ENDPOINTS.REMOVE_USER
          .replace(':tenantId', tenantId)
          .replace(':userId', userId);
        await apiHelper.delete(endpoint);
      }
    } catch (error) {
      throw new Error('Failed to remove user');
    }
  }
}

// Export singleton instance
const userManagementBackendHelper = new UserManagementBackendHelper();
export default userManagementBackendHelper;