/**
 * @fileoverview Helper exports
 */

export { default as apiHelper } from './apiHelper';
export { default as backendHelper } from './backendHelper';
export * as urlHelper from './urlHelper';

// Re-export specific functions for convenience
export {
  expandUrlTemplate,
  validatePlaceholders,
  
  // Auth
  postUserLogin,
  postUserRegister,
  postUserSignupWithEmail,
  postUserSignupComplete,
  deleteUserSignOut,
  putRefreshAccessToken,
  
  // Tenants
  getTenants,
  getTenant,
  postTenant,
  putTenant,
  
  // Workspaces
  getWorkspaces,
  getWorkspace,
  postWorkspace,
  
  // Common types
  type ApiResponse,
  type PaginatedResponse,
  type PlaceholderParams,
  type AuthResponse,
} from './backendHelper';

export { default } from './apiHelper';