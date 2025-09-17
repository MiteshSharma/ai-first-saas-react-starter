/**
 * @fileoverview User Settings Service - Mock API Integration
 *
 * Service layer for user profile and settings operations
 */

import {
  UserProfile,
  UserProfileResponse,
  PasswordChangeRequest,
  ProfileUpdateRequest,
  AvatarUploadResponse,
  SecuritySettings,
  NotificationPreferences,
  ApiResponse,
  TrustedDevice,
  UserSession,
  TIMEZONES,
  LANGUAGES,
} from '../types';

// Mock user data
const mockUserProfile: UserProfile = {
  id: 'user-1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  displayName: 'John Doe',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  phone: '+1 (555) 123-4567',
  timezone: 'America/New_York',
  language: 'en',
  theme: 'light',
  emailNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
  twoFactorEnabled: false,
  lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
};

const mockSecuritySettings: SecuritySettings = {
  twoFactorEnabled: false,
  backupCodes: ['ABC123', 'DEF456', 'GHI789', 'JKL012'],
  trustedDevices: [
    {
      id: 'device-1',
      name: 'MacBook Pro',
      deviceType: 'desktop',
      browser: 'Chrome',
      os: 'macOS',
      addedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastUsedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: 'device-2',
      name: 'iPhone 14',
      deviceType: 'mobile',
      browser: 'Safari',
      os: 'iOS',
      addedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      lastUsedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  ],
  activeSessions: [
    {
      id: 'session-1',
      deviceName: 'MacBook Pro',
      browser: 'Chrome 119',
      os: 'macOS 14.1',
      ipAddress: '192.168.1.100',
      location: 'New York, NY',
      current: true,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      lastActiveAt: new Date(),
    },
    {
      id: 'session-2',
      deviceName: 'iPhone 14',
      browser: 'Safari',
      os: 'iOS 17.1',
      ipAddress: '192.168.1.101',
      location: 'New York, NY',
      current: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ],
};

const mockNotificationPreferences: NotificationPreferences = {
  email: {
    security: true,
    updates: true,
    marketing: false,
    digest: true,
  },
  push: {
    security: true,
    mentions: true,
    updates: false,
  },
  inApp: {
    mentions: true,
    comments: true,
    updates: true,
  },
};

class UserSettingsService {
  private currentUser: UserProfile = { ...mockUserProfile };
  private securitySettings: SecuritySettings = { ...mockSecuritySettings };
  private notificationPreferences: NotificationPreferences = { ...mockNotificationPreferences };

  /**
   * Get user profile and settings
   */
  async getUserProfile(): Promise<ApiResponse<UserProfileResponse>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      data: {
        user: { ...this.currentUser },
        security: { ...this.securitySettings },
        preferences: { ...this.notificationPreferences },
      },
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: ProfileUpdateRequest): Promise<ApiResponse<UserProfile>> {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Validate required fields
    if (updates.firstName !== undefined && updates.firstName.trim().length < 2) {
      return {
        success: false,
        error: 'First name must be at least 2 characters long',
      };
    }

    if (updates.lastName !== undefined && updates.lastName.trim().length < 2) {
      return {
        success: false,
        error: 'Last name must be at least 2 characters long',
      };
    }

    // Apply updates
    this.currentUser = {
      ...this.currentUser,
      ...updates,
      updatedAt: new Date(),
    };

    // Update display name if first or last name changed
    if (updates.firstName || updates.lastName) {
      this.currentUser.displayName = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }

    return {
      success: true,
      data: { ...this.currentUser },
      message: 'Profile updated successfully',
    };
  }

  /**
   * Change user password
   */
  async changePassword(request: PasswordChangeRequest): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate current password (mock validation)
    if (request.currentPassword !== 'password123') {
      return {
        success: false,
        error: 'Current password is incorrect',
      };
    }

    // Validate new password
    if (request.newPassword.length < 8) {
      return {
        success: false,
        error: 'New password must be at least 8 characters long',
      };
    }

    if (request.newPassword !== request.confirmPassword) {
      return {
        success: false,
        error: 'New password and confirmation do not match',
      };
    }

    if (request.newPassword === request.currentPassword) {
      return {
        success: false,
        error: 'New password must be different from current password',
      };
    }

    // Simulate password change
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<ApiResponse<AvatarUploadResponse>> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Validate file
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'File must be an image',
      };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      return {
        success: false,
        error: 'File size must be less than 5MB',
      };
    }

    // Simulate upload
    const mockUrl = `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&t=${Date.now()}`;

    this.currentUser.avatar = mockUrl;
    this.currentUser.updatedAt = new Date();

    return {
      success: true,
      data: {
        url: mockUrl,
        filename: file.name,
        size: file.size,
      },
      message: 'Avatar uploaded successfully',
    };
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<ApiResponse<NotificationPreferences>> {
    await new Promise(resolve => setTimeout(resolve, 500));

    this.notificationPreferences = {
      ...this.notificationPreferences,
      ...preferences,
    };

    return {
      success: true,
      data: { ...this.notificationPreferences },
      message: 'Notification preferences updated successfully',
    };
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(): Promise<ApiResponse<{ qrCode: string; secret: string }>> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.securitySettings.twoFactorEnabled = true;
    this.currentUser.twoFactorEnabled = true;

    return {
      success: true,
      data: {
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        secret: 'ABCD1234EFGH5678',
      },
      message: 'Two-factor authentication enabled successfully',
    };
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 500));

    this.securitySettings.twoFactorEnabled = false;
    this.currentUser.twoFactorEnabled = false;

    return {
      success: true,
      message: 'Two-factor authentication disabled successfully',
    };
  }

  /**
   * Terminate user session
   */
  async terminateSession(sessionId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));

    this.securitySettings.activeSessions = this.securitySettings.activeSessions.filter(
      session => session.id !== sessionId
    );

    return {
      success: true,
      message: 'Session terminated successfully',
    };
  }

  /**
   * Remove trusted device
   */
  async removeTrustedDevice(deviceId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));

    this.securitySettings.trustedDevices = this.securitySettings.trustedDevices.filter(
      device => device.id !== deviceId
    );

    return {
      success: true,
      message: 'Trusted device removed successfully',
    };
  }

  /**
   * Get available timezones
   */
  getTimezones() {
    return TIMEZONES;
  }

  /**
   * Get available languages
   */
  getLanguages() {
    return LANGUAGES;
  }

  /**
   * Reset mock data (for testing)
   */
  resetMockData(): void {
    this.currentUser = { ...mockUserProfile };
    this.securitySettings = { ...mockSecuritySettings };
    this.notificationPreferences = { ...mockNotificationPreferences };
  }
}

export const userSettingsService = new UserSettingsService();
export default userSettingsService;