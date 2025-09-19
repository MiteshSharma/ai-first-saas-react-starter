/**
 * @fileoverview User Service
 *
 * Service layer for user profile and management operations
 */

import UserManagementBackendHelper from '../api/backendHelper';
import {
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

declare global {
  interface Window {
    eventBus?: {
      emit: (event: string, data: any) => void;
    };
  }
}

/**
 * User management service
 * Handles all user-related operations including profile management, preferences, and security settings
 */
export class UserService {
  // ============================================================================
  // User Profile Operations
  // ============================================================================

  /**
   * Get user by ID
   *
   * @param userId - ID of the user to fetch
   * @returns Promise<UserWithTenantInfo | null> - User data or null if not found
   */
  async getUser(userId: string): Promise<UserWithTenantInfo | null> {
    try {
      return await UserManagementBackendHelper.getUserById(userId);
    } catch (error) {
      throw new Error('Failed to fetch user. Please try again.');
    }
  }

  /**
   * Get users for a tenant with optional filtering
   *
   * @param tenantId - ID of the tenant to get users for
   * @param filters - Optional search and filter criteria
   * @returns Promise<UserListResponse> - List of users with metadata
   */
  async getUsers(tenantId: string, filters?: UserSearchFilters): Promise<UserListResponse> {
    try {
      return await UserManagementBackendHelper.getUsers(tenantId, filters);
    } catch (error) {
      throw new Error('Failed to fetch users. Please try again.');
    }
  }

  /**
   * Update user profile information
   *
   * @param userId - ID of the user to update
   * @param data - Profile data to update
   * @returns Promise<void>
   */
  async updateProfile(userId: string, data: UpdateUserProfileRequest): Promise<void> {
    try {
      await UserManagementBackendHelper.updateUserProfile(userId, data);

      // Log audit event for profile update
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit('audit.event', {
          action: 'user.profile.updated',
          actorId: userId,
          meta: {
            updatedFields: Object.keys(data),
          }
        });
      }
    } catch (error) {
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  /**
   * Upload user avatar
   *
   * @param userId - ID of the user to upload avatar for
   * @param file - Avatar image file
   * @returns Promise<UploadAvatarResponse> - Response with avatar URLs
   */
  async uploadAvatar(userId: string, file: File): Promise<UploadAvatarResponse> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      const response = await UserManagementBackendHelper.uploadUserAvatar(userId, file);

      // Log audit event for avatar upload
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit('audit.event', {
          action: 'user.avatar.uploaded',
          actorId: userId,
          meta: {
            fileName: file.name,
            fileSize: file.size,
            avatarUrl: response.avatarUrl,
          }
        });
      }

      return response;
    } catch (error) {
      throw new Error('Failed to upload avatar. Please try again.');
    }
  }

  // ============================================================================
  // User Preferences Operations
  // ============================================================================

  /**
   * Get user preferences
   *
   * @param userId - ID of the user to get preferences for
   * @returns Promise<UserPreferences> - User preferences
   */
  async getPreferences(userId: string): Promise<UserPreferences> {
    try {
      return await UserManagementBackendHelper.getUserPreferences(userId);
    } catch (error) {
      throw new Error('Failed to fetch preferences. Please try again.');
    }
  }

  /**
   * Update user preferences
   *
   * @param userId - ID of the user to update preferences for
   * @param data - Preferences data to update
   * @returns Promise<void>
   */
  async updatePreferences(userId: string, data: UpdateUserPreferencesRequest): Promise<void> {
    try {
      await UserManagementBackendHelper.updateUserPreferences(userId, data);

      // Log audit event for preferences update
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit('audit.event', {
          action: 'user.preferences.updated',
          actorId: userId,
          meta: {
            updatedFields: Object.keys(data),
          }
        });
      }
    } catch (error) {
      throw new Error('Failed to update preferences. Please try again.');
    }
  }

  // ============================================================================
  // Security Operations
  // ============================================================================

  /**
   * Get user security settings
   *
   * @param userId - ID of the user to get security settings for
   * @returns Promise<SecuritySettings> - Security settings
   */
  async getSecuritySettings(userId: string): Promise<SecuritySettings> {
    try {
      return await UserManagementBackendHelper.getSecuritySettings(userId);
    } catch (error) {
      throw new Error('Failed to fetch security settings. Please try again.');
    }
  }

  /**
   * Update user security settings
   *
   * @param userId - ID of the user to update security settings for
   * @param data - Security settings data to update
   * @returns Promise<void>
   */
  async updateSecuritySettings(userId: string, data: UpdateSecuritySettingsRequest): Promise<void> {
    try {
      await UserManagementBackendHelper.updateSecuritySettings(userId, data);

      // Log audit event for security settings update
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit('audit.event', {
          action: 'user.security.updated',
          actorId: userId,
          meta: {
            updatedFields: Object.keys(data),
          }
        });
      }
    } catch (error) {
      throw new Error('Failed to update security settings. Please try again.');
    }
  }

  /**
   * Enable two-factor authentication
   *
   * @param userId - ID of the user to enable 2FA for
   * @returns Promise<{qrCode: string; backupCodes: string[]}> - 2FA setup data
   */
  async enableTwoFactor(userId: string): Promise<{ qrCode: string; backupCodes: string[] }> {
    try {
      const response = await UserManagementBackendHelper.enableTwoFactor(userId);

      // Log audit event for 2FA enablement
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit('audit.event', {
          action: 'user.2fa.enabled',
          actorId: userId,
          meta: {
            method: 'totp',
          }
        });
      }

      return response;
    } catch (error) {
      throw new Error('Failed to enable two-factor authentication. Please try again.');
    }
  }

  /**
   * Disable two-factor authentication
   *
   * @param userId - ID of the user to disable 2FA for
   * @returns Promise<void>
   */
  async disableTwoFactor(userId: string): Promise<void> {
    try {
      await UserManagementBackendHelper.disableTwoFactor(userId);

      // Log audit event for 2FA disablement
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit('audit.event', {
          action: 'user.2fa.disabled',
          actorId: userId,
          meta: {
            method: 'totp',
          }
        });
      }
    } catch (error) {
      throw new Error('Failed to disable two-factor authentication. Please try again.');
    }
  }

  // ============================================================================
  // User Management Operations (Admin functions)
  // ============================================================================

  /**
   * Update user role in tenant
   *
   * @param tenantId - ID of the tenant
   * @param userId - ID of the user to update
   * @param role - New role to assign
   * @returns Promise<void>
   */
  async updateUserRole(tenantId: string, userId: string, role: string): Promise<void> {
    try {
      await UserManagementBackendHelper.updateUserRole(tenantId, userId, role);

      // Log audit event for role update
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit('audit.event', {
          action: 'user.role.updated',
          actorId: 'current-user', // This should come from auth context
          tenantId,
          meta: {
            targetUserId: userId,
            newRole: role,
          }
        });
      }
    } catch (error) {
      throw new Error('Failed to update user role. Please try again.');
    }
  }

  /**
   * Deactivate user
   *
   * @param tenantId - ID of the tenant
   * @param userId - ID of the user to deactivate
   * @returns Promise<void>
   */
  async deactivateUser(tenantId: string, userId: string): Promise<void> {
    try {
      await UserManagementBackendHelper.deactivateUser(tenantId, userId);

      // Log audit event for user deactivation
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit('audit.event', {
          action: 'user.deactivated',
          actorId: 'current-user', // This should come from auth context
          tenantId,
          meta: {
            targetUserId: userId,
          }
        });
      }
    } catch (error) {
      throw new Error('Failed to deactivate user. Please try again.');
    }
  }

  /**
   * Reactivate user
   *
   * @param tenantId - ID of the tenant
   * @param userId - ID of the user to reactivate
   * @returns Promise<void>
   */
  async reactivateUser(tenantId: string, userId: string): Promise<void> {
    try {
      await UserManagementBackendHelper.reactivateUser(tenantId, userId);

      // Log audit event for user reactivation
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit('audit.event', {
          action: 'user.reactivated',
          actorId: 'current-user', // This should come from auth context
          tenantId,
          meta: {
            targetUserId: userId,
          }
        });
      }
    } catch (error) {
      throw new Error('Failed to reactivate user. Please try again.');
    }
  }

  /**
   * Remove user from tenant
   *
   * @param tenantId - ID of the tenant
   * @param userId - ID of the user to remove
   * @returns Promise<void>
   */
  async removeUser(tenantId: string, userId: string): Promise<void> {
    try {
      await UserManagementBackendHelper.removeUser(tenantId, userId);

      // Log audit event for user removal
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit('audit.event', {
          action: 'user.removed',
          actorId: 'current-user', // This should come from auth context
          tenantId,
          meta: {
            targetUserId: userId,
          }
        });
      }
    } catch (error) {
      throw new Error('Failed to remove user. Please try again.');
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Search users across multiple criteria
   *
   * @param tenantId - ID of the tenant to search within
   * @param query - Search query string
   * @returns Promise<UserWithTenantInfo[]> - Array of matching users
   */
  async searchUsers(tenantId: string, query: string): Promise<UserWithTenantInfo[]> {
    try {
      const filters: UserSearchFilters = {
        search: query,
      };

      const response = await this.getUsers(tenantId, filters);
      return response.users;
    } catch (error) {
      throw new Error('Failed to search users. Please try again.');
    }
  }

  /**
   * Get user statistics for a tenant
   *
   * @param tenantId - Tenant ID to get stats for
   * @returns Promise<object> - User statistics
   */
  async getUserStats(tenantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    byRole: Record<string, number>;
  }> {
    try {
      const response = await this.getUsers(tenantId);
      const users = response.users;

      const byRole: Record<string, number> = {};
      users.forEach(user => {
        if (user.tenantRole) {
          byRole[user.tenantRole] = (byRole[user.tenantRole] || 0) + 1;
        }
      });

      return {
        total: users.length,
        active: users.filter(user => user.status === 'active').length,
        inactive: users.filter(user => user.status === 'inactive').length,
        suspended: users.filter(user => user.status === 'suspended').length,
        byRole,
      };
    } catch (error) {
      throw new Error('Failed to get user statistics. Please try again.');
    }
  }

  /**
   * Validate user profile data
   *
   * @param data - Profile data to validate
   * @returns object - Validation result with errors if any
   */
  validateProfileData(data: UpdateUserProfileRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.firstName && data.firstName.trim().length < 1) {
      errors.push('First name is required');
    }

    if (data.lastName && data.lastName.trim().length < 1) {
      errors.push('Last name is required');
    }

    if (data.displayName && data.displayName.trim().length < 1) {
      errors.push('Display name is required');
    }

    if (data.firstName && data.firstName.length > 50) {
      errors.push('First name must be less than 50 characters');
    }

    if (data.lastName && data.lastName.length > 50) {
      errors.push('Last name must be less than 50 characters');
    }

    if (data.displayName && data.displayName.length > 100) {
      errors.push('Display name must be less than 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
const userService = new UserService();
export default userService;