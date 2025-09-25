/**
 * @fileoverview User Management Backend Helper - API calls with mock/real backend switching
 *
 * Helper for making API calls for user management operations following template guidelines
 */

import { apiHelper } from '../../../core/api/apiHelper';
import { USER_MANAGEMENT_ENDPOINTS } from './endpoints';
import UserManagementMockHandlers from './mockHandlers';
import {
  UserWithTenantInfo,
  UserListResponse,
  UserSearchFilters,
  UpdateUserProfileRequest,
  UpdateUserPreferencesRequest,
  UserPreferences,
} from '../types';

/**
 * API response types (as received from backend)
 */

export interface UserListApiResponse {
  users: UserWithTenantInfo[];
  total: number;
  page: number;
  limit: number;
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

}

// Export singleton instance
const userManagementBackendHelper = new UserManagementBackendHelper();
export default userManagementBackendHelper;