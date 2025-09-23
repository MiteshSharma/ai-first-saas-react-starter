/**
 * @fileoverview Admin Context Provider
 *
 * Provides admin mode state and utilities throughout the application
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useAuthStore } from '../auth/AuthStore';
import { useTenantStore } from '../../plugins/tenant-management/stores/tenantStore';
import { useAdminPermissions } from '../auth/useAdminPermissions';

interface AdminContextState {
  // Admin session info
  isAdminMode: boolean;
  adminUser: {
    id: string;
    email: string;
    displayName: string;
  } | null;
  adminTenant: {
    id: string;
    name: string;
  } | null;

  // Permission checks
  canPerformWriteOperations: boolean;
  canSwitchTenants: boolean;
  isRestrictedToTenant: boolean;

  // Session metadata
  sessionInfo: {
    loginTime: string;
    accessLevel: 'read-only';
    forcedTenantId?: string;
  } | null;

  // Permission overrides
  adminPermissions: {
    canViewAllTenants: boolean;
    canViewAllWorkspaces: boolean;
    canViewAllUsers: boolean;
    canViewAuditLogs: boolean;
    canBypassPermissions: boolean;
  };
}

const AdminContext = createContext<AdminContextState>({
  isAdminMode: false,
  adminUser: null,
  adminTenant: null,
  canPerformWriteOperations: false,
  canSwitchTenants: false,
  isRestrictedToTenant: false,
  sessionInfo: null,
  adminPermissions: {
    canViewAllTenants: false,
    canViewAllWorkspaces: false,
    canViewAllUsers: false,
    canViewAuditLogs: false,
    canBypassPermissions: false
  }
});

interface AdminProviderProps {
  children: React.ReactNode;
}

/**
 * Admin Context Provider Component
 *
 * Provides admin session state and utilities
 */
export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const { isAdminSession, adminMetadata, user } = useAuthStore();
  const { currentTenant, getAdminForcedTenant } = useTenantStore();
  const {
    hasAdminAccess,
    canPerformWriteOperations,
    canSwitchTenants,
    getAdminSessionInfo,
    getAdminOverrides
  } = useAdminPermissions();

  const contextValue = useMemo((): AdminContextState => {
    const sessionInfo = getAdminSessionInfo();
    const adminOverrides = getAdminOverrides();
    const forcedTenantId = getAdminForcedTenant();

    return {
      // Admin session info
      isAdminMode: hasAdminAccess(),
      adminUser: user ? {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName || user.email
      } : null,
      adminTenant: currentTenant ? {
        id: currentTenant.id,
        name: currentTenant.name
      } : null,

      // Permission checks
      canPerformWriteOperations: canPerformWriteOperations(),
      canSwitchTenants: canSwitchTenants(),
      isRestrictedToTenant: !!forcedTenantId,

      // Session metadata
      sessionInfo: sessionInfo ? {
        loginTime: sessionInfo.loginTime,
        accessLevel: sessionInfo.accessLevel,
        forcedTenantId: sessionInfo.forcedTenantId
      } : null,

      // Permission overrides
      adminPermissions: adminOverrides
    };
  }, [
    hasAdminAccess,
    user,
    currentTenant,
    canPerformWriteOperations,
    canSwitchTenants,
    getAdminSessionInfo,
    getAdminOverrides,
    getAdminForcedTenant
  ]);

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};

/**
 * Hook to use Admin Context
 */
export const useAdminContext = (): AdminContextState => {
  const context = useContext(AdminContext);

  if (context === undefined) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }

  return context;
};

/**
 * Hook to check if current session is admin mode (simplified check)
 */
export const useIsAdminMode = (): boolean => {
  const { isAdminMode } = useAdminContext();
  return isAdminMode;
};

/**
 * Hook to get admin permissions from context (simplified access)
 */
export const useAdminContextPermissions = (): AdminContextState['adminPermissions'] => {
  const { adminPermissions } = useAdminContext();
  return adminPermissions;
};

export default AdminContext;