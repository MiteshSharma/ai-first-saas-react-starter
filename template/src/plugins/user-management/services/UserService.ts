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
  UserPreferences,
} from '../types';
import { AUDIT_PLUGIN_EVENTS, AUDIT_ACTIONS } from '../../../events';

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
        window.eventBus.emit(AUDIT_PLUGIN_EVENTS.AUDIT_EVENT, {
          action: AUDIT_ACTIONS.USER_PROFILE_UPDATED,
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
        window.eventBus.emit(AUDIT_PLUGIN_EVENTS.AUDIT_EVENT, {
          action: AUDIT_ACTIONS.USER_PREFERENCES_UPDATED,
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