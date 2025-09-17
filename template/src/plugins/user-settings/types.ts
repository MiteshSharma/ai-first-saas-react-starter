/**
 * @fileoverview User Settings Plugin Types
 *
 * Type definitions for user settings and profile management
 */

// User profile interface
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  phone?: string;
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Password change request
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Profile update request
export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'auto';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  marketingEmails?: boolean;
}

// Avatar upload response
export interface AvatarUploadResponse {
  url: string;
  filename: string;
  size: number;
}

// Security settings
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  backupCodes: string[];
  trustedDevices: TrustedDevice[];
  activeSessions: UserSession[];
}

export interface TrustedDevice {
  id: string;
  name: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  addedAt: Date;
  lastUsedAt: Date;
}

export interface UserSession {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  current: boolean;
  createdAt: Date;
  lastActiveAt: Date;
}

// Notification preferences
export interface NotificationPreferences {
  email: {
    security: boolean;
    updates: boolean;
    marketing: boolean;
    digest: boolean;
  };
  push: {
    security: boolean;
    mentions: boolean;
    updates: boolean;
  };
  inApp: {
    mentions: boolean;
    comments: boolean;
    updates: boolean;
  };
}

// API response types
export interface UserProfileResponse {
  user: UserProfile;
  security: SecuritySettings;
  preferences: NotificationPreferences;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form validation errors
export interface ValidationErrors {
  [key: string]: string;
}

// User settings events
export const USER_SETTINGS_EVENTS = {
  PROFILE_UPDATED: 'user.profile.updated',
  PASSWORD_CHANGED: 'user.password.changed',
  AVATAR_UPDATED: 'user.avatar.updated',
  PREFERENCES_UPDATED: 'user.preferences.updated',
  TWO_FACTOR_ENABLED: 'user.security.two_factor_enabled',
  TWO_FACTOR_DISABLED: 'user.security.two_factor_disabled',
  SESSION_TERMINATED: 'user.session.terminated',
} as const;

export type UserSettingsEventType = typeof USER_SETTINGS_EVENTS[keyof typeof USER_SETTINGS_EVENTS];

// Available timezones
export const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

// Available languages
export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'ru', label: 'Русский' },
];