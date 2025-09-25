/**
 * @fileoverview Typed API wrappers with automatic placeholder expansion
 * 
 * This file provides typed wrappers around the API helper, automatically
 * expanding URL template placeholders and providing type-safe method calls.
 * 
 * All API calls should go through these methods instead of directly using apiHelper.
 */

import { AxiosResponse } from 'axios';
import apiHelper from './apiHelper';
import * as URLS from './urlHelper';
import type {
  Tenant,
  TenantMember,
  Workspace,
  CreateTenantPayload,
  UpdateTenantPayload,
  InviteMemberPayload,
  CreateWorkspacePayload,
  UpdateWorkspacePayload
} from '../../plugins/tenant-management/types';
import type { User, AuthResponse } from '../auth/types';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PlaceholderParams {
  [key: string]: string | number;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Expand URL template placeholders with actual values
 * @param template - URL template with placeholders like "/users/{user-id}"
 * @param params - Object with placeholder values like { "user-id": "123" }
 * @returns Expanded URL like "/users/123"
 */
export const expandUrlTemplate = (template: string, params: PlaceholderParams = {}): string => {
  return template.replace(/\{([^}]+)\}/g, (match, placeholder) => {
    const value = params[placeholder];
    if (value === undefined || value === null) {
      throw new Error(`Missing parameter for placeholder: ${placeholder} in URL: ${template}`);
    }
    return String(value);
  });
};

/**
 * Validate that all required placeholders are provided
 * @param template - URL template
 * @param params - Provided parameters
 * @throws Error if any required placeholder is missing
 */
export const validatePlaceholders = (template: string, params: PlaceholderParams = {}): void => {
  const placeholders = template.match(/\{([^}]+)\}/g);
  if (!placeholders) return;

  const missing = placeholders
    .map(p => p.slice(1, -1)) // Remove { and }
    .filter(placeholder => params[placeholder] === undefined || params[placeholder] === null);

  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')} for URL: ${template}`);
  }
};

// ==========================================
// AUTHENTICATION API WRAPPERS
// ==========================================

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName?: string;
}

export interface SignupWithEmailPayload {
  email: string;
}

export interface SignupCompletePayload {
  token: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  password: string;
  organizationName?: string;
}

export interface PasswordResetRequestPayload {
  email: string;
}

export interface PasswordResetCompletePayload {
  token: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}


export const postUserLogin = async (payload: LoginPayload): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => {
  return apiHelper.post<ApiResponse<AuthResponse>>(URLS.AUTH_LOGIN, payload);
};

export const postUserRegister = async (payload: RegisterPayload): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => {
  return apiHelper.post<ApiResponse<AuthResponse>>(URLS.AUTH_REGISTER, payload);
};

export const postUserSignupWithEmail = async (payload: SignupWithEmailPayload): Promise<AxiosResponse<ApiResponse>> => {
  return apiHelper.post<ApiResponse>(URLS.AUTH_SIGNUP_WITH_EMAIL, payload);
};

export const postUserSignupResendWithEmail = async (payload: SignupWithEmailPayload): Promise<AxiosResponse<ApiResponse>> => {
  return apiHelper.post<ApiResponse>(URLS.AUTH_SIGNUP_RESEND, payload);
};

export const postUserSignupComplete = async (payload: SignupCompletePayload): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => {
  return apiHelper.post<ApiResponse<AuthResponse>>(URLS.AUTH_SIGNUP_COMPLETE, payload);
};

export const postResetPasswordGetLink = async (payload: PasswordResetRequestPayload): Promise<AxiosResponse<ApiResponse>> => {
  return apiHelper.post<ApiResponse>(URLS.AUTH_PASSWORD_RESET_REQUEST, payload);
};

export const putResetPasswordWithToken = async (payload: PasswordResetCompletePayload): Promise<AxiosResponse<ApiResponse>> => {
  return apiHelper.put<ApiResponse>(URLS.AUTH_PASSWORD_RESET_COMPLETE, payload);
};

export const postChangePassword = async (payload: ChangePasswordPayload): Promise<AxiosResponse<ApiResponse>> => {
  return apiHelper.post<ApiResponse>(URLS.AUTH_CHANGE_PASSWORD, payload);
};

export const deleteUserSignOut = async (): Promise<AxiosResponse<ApiResponse>> => {
  return apiHelper.post<ApiResponse>(URLS.AUTH_LOGOUT);
};

export const putRefreshAccessToken = async (payload: RefreshTokenPayload): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => {
  return apiHelper.post<ApiResponse<AuthResponse>>(URLS.AUTH_REFRESH, payload);
};

// ==========================================
// USER MANAGEMENT API WRAPPERS
// ==========================================


export interface UpdateUserPayload {
  name?: string;
  email?: string;
  avatar?: string;
}

export const getUserProfile = async (params: { 'user-id': string }): Promise<AxiosResponse<User>> => {
  const url = expandUrlTemplate(URLS.USER_PROFILE, params);
  return apiHelper.get<User>(url);
};

export const putUserProfile = async (
  params: { 'user-id': string }, 
  payload: UpdateUserPayload
): Promise<AxiosResponse<User>> => {
  const url = expandUrlTemplate(URLS.USER_PROFILE, params);
  return apiHelper.put<User>(url, payload);
};

export const getUserNotifications = async (params: { 'user-id': string }): Promise<AxiosResponse<PaginatedResponse>> => {
  const url = expandUrlTemplate(URLS.USER_NOTIFICATIONS, params);
  return apiHelper.get<PaginatedResponse>(url);
};

// ==========================================
// TENANT MANAGEMENT API WRAPPERS
// ==========================================


export const getTenants = async (): Promise<AxiosResponse<Tenant[]>> => {
  return apiHelper.get<Tenant[]>(URLS.TENANTS_LIST);
};

export const getTenant = async (params: { 'tenant-id': string }): Promise<AxiosResponse<Tenant>> => {
  const url = expandUrlTemplate(URLS.TENANT_DETAILS, params);
  return apiHelper.get<Tenant>(url);
};

export const postTenant = async (payload: CreateTenantPayload): Promise<AxiosResponse<Tenant>> => {
  return apiHelper.post<Tenant>(URLS.TENANT_CREATE, payload);
};

export const putTenant = async (
  params: { 'tenant-id': string }, 
  payload: UpdateTenantPayload
): Promise<AxiosResponse<Tenant>> => {
  const url = expandUrlTemplate(URLS.TENANT_UPDATE, params);
  return apiHelper.put<Tenant>(url, payload);
};

export const deleteTenant = async (params: { 'tenant-id': string }): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.TENANT_DELETE, params);
  return apiHelper.delete<ApiResponse>(url);
};

// ==========================================
// TENANT MEMBER API WRAPPERS
// ==========================================


export interface UpdateMemberRolePayload {
  role: string;
}

export const getTenantMembers = async (params: { 'tenant-id': string }): Promise<AxiosResponse<TenantMember[]>> => {
  const url = expandUrlTemplate(URLS.TENANT_MEMBERS, params);
  return apiHelper.get<TenantMember[]>(url);
};

export const postTenantMemberInvite = async (
  params: { 'tenant-id': string }, 
  payload: InviteMemberPayload
): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.TENANT_INVITES, params);
  return apiHelper.post<ApiResponse>(url, payload);
};

export const putTenantMemberRole = async (
  params: { 'member-id': string }, 
  payload: UpdateMemberRolePayload
): Promise<AxiosResponse<TenantMember>> => {
  const url = expandUrlTemplate(URLS.TENANT_MEMBER_UPDATE, params);
  return apiHelper.put<TenantMember>(url, payload);
};

export const deleteTenantMember = async (params: { 'member-id': string }): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.TENANT_MEMBER_REMOVE, params);
  return apiHelper.delete<ApiResponse>(url);
};

// ==========================================
// WORKSPACE API WRAPPERS
// ==========================================


export const getWorkspaces = async (params: { 'tenant-id': string }): Promise<AxiosResponse<Workspace[]>> => {
  const url = expandUrlTemplate(URLS.WORKSPACES_LIST, params);
  return apiHelper.get<Workspace[]>(url);
};

export const getWorkspace = async (params: { 'workspace-id': string }): Promise<AxiosResponse<Workspace>> => {
  const url = expandUrlTemplate(URLS.WORKSPACE_DETAILS, params);
  return apiHelper.get<Workspace>(url);
};

export const postWorkspace = async (
  params: { 'tenant-id': string }, 
  payload: CreateWorkspacePayload
): Promise<AxiosResponse<Workspace>> => {
  const url = expandUrlTemplate(URLS.WORKSPACE_CREATE, params);
  return apiHelper.post<Workspace>(url, payload);
};

export const putWorkspace = async (
  params: { 'workspace-id': string }, 
  payload: UpdateWorkspacePayload
): Promise<AxiosResponse<Workspace>> => {
  const url = expandUrlTemplate(URLS.WORKSPACE_UPDATE, params);
  return apiHelper.put<Workspace>(url, payload);
};

export const deleteWorkspace = async (params: { 'workspace-id': string }): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.WORKSPACE_DELETE, params);
  return apiHelper.delete<ApiResponse>(url);
};

// ==========================================
// PROJECT API WRAPPERS
// ==========================================

export const getProjects = async (params: { 'workspace-id': string }): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.PROJECTS_LIST, params);
  return apiHelper.get(url);
};

export const getProject = async (params: { 'project-id': string }): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.PROJECT_DETAILS, params);
  return apiHelper.get(url);
};

export const postProject = async (
  params: { 'workspace-id': string }, 
  payload: unknown
): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.PROJECT_CREATE, params);
  return apiHelper.post(url, payload);
};

export const putProject = async (
  params: { 'project-id': string }, 
  payload: unknown
): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.PROJECT_UPDATE, params);
  return apiHelper.put(url, payload);
};

export const deleteProject = async (params: { 'project-id': string }): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.PROJECT_DELETE, params);
  return apiHelper.delete(url);
};

export const searchProjects = async (
  params: { 'workspace-id': string },
  query: string
): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.PROJECT_SEARCH, params) + `?q=${encodeURIComponent(query)}`;
  return apiHelper.get(url);
};

// Project Members
export const getProjectMembers = async (params: { 'project-id': string }): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.PROJECT_MEMBERS, params);
  return apiHelper.get(url);
};

export const postProjectMember = async (
  params: { 'project-id': string }, 
  payload: unknown
): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.PROJECT_MEMBER_ADD, params);
  return apiHelper.post(url, payload);
};

export const putProjectMember = async (
  params: { 'member-id': string }, 
  payload: unknown
): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.PROJECT_MEMBER_UPDATE, params);
  return apiHelper.put(url, payload);
};

export const deleteProjectMember = async (params: { 'member-id': string }): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.PROJECT_MEMBER_REMOVE, params);
  return apiHelper.delete(url);
};

// ==========================================
// DATA SOURCE API WRAPPERS
// ==========================================

export interface DataSource {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDataSourcePayload {
  name: string;
  type: string;
  config: Record<string, unknown>;
}

export const getDataSources = async (params: { 'workspace-id': string }): Promise<AxiosResponse<DataSource[]>> => {
  const url = expandUrlTemplate(URLS.DATA_SOURCES_LIST, params);
  return apiHelper.get<DataSource[]>(url);
};

export const getDataSource = async (params: { 'data-source-id': string }): Promise<AxiosResponse<DataSource>> => {
  const url = expandUrlTemplate(URLS.DATA_SOURCE_DETAILS, params);
  return apiHelper.get<DataSource>(url);
};

export const postDataSource = async (
  params: { 'workspace-id': string }, 
  payload: CreateDataSourcePayload
): Promise<AxiosResponse<DataSource>> => {
  const url = expandUrlTemplate(URLS.DATA_SOURCE_CREATE, params);
  return apiHelper.post<DataSource>(url, payload);
};

export const testDataSource = async (params: { 'data-source-id': string }): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.DATA_SOURCE_TEST, params);
  return apiHelper.post<ApiResponse>(url);
};

// ==========================================
// CHART API WRAPPERS
// ==========================================

export interface Chart {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  dataSourceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChartPayload {
  name: string;
  type: string;
  config: Record<string, unknown>;
  dataSourceId: string;
}

export const getCharts = async (params: { 'workspace-id': string }): Promise<AxiosResponse<Chart[]>> => {
  const url = expandUrlTemplate(URLS.CHARTS_LIST, params);
  return apiHelper.get<Chart[]>(url);
};

export const getChart = async (params: { 'chart-id': string }): Promise<AxiosResponse<Chart>> => {
  const url = expandUrlTemplate(URLS.CHART_DETAILS, params);
  return apiHelper.get<Chart>(url);
};

export const postChart = async (
  params: { 'workspace-id': string }, 
  payload: CreateChartPayload
): Promise<AxiosResponse<Chart>> => {
  const url = expandUrlTemplate(URLS.CHART_CREATE, params);
  return apiHelper.post<Chart>(url, payload);
};

export const getChartData = async (params: { 'chart-id': string }): Promise<AxiosResponse<unknown>> => {
  const url = expandUrlTemplate(URLS.CHART_DATA, params);
  return apiHelper.get<unknown>(url);
};

// ==========================================
// PIPELINE API WRAPPERS
// ==========================================

export interface Pipeline {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  config: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePipelinePayload {
  name: string;
  description?: string;
  config: Record<string, unknown>;
}

export const getPipelines = async (params: { 'workspace-id': string }): Promise<AxiosResponse<Pipeline[]>> => {
  const url = expandUrlTemplate(URLS.PIPELINES_LIST, params);
  return apiHelper.get<Pipeline[]>(url);
};

export const getPipeline = async (params: { 'pipeline-id': string }): Promise<AxiosResponse<Pipeline>> => {
  const url = expandUrlTemplate(URLS.PIPELINE_DETAILS, params);
  return apiHelper.get<Pipeline>(url);
};

export const postPipeline = async (
  params: { 'workspace-id': string }, 
  payload: CreatePipelinePayload
): Promise<AxiosResponse<Pipeline>> => {
  const url = expandUrlTemplate(URLS.PIPELINE_CREATE, params);
  return apiHelper.post<Pipeline>(url, payload);
};

export const postPipelineExecute = async (params: { 'pipeline-id': string }): Promise<AxiosResponse<ApiResponse>> => {
  const url = expandUrlTemplate(URLS.PIPELINE_EXECUTE, params);
  return apiHelper.post<ApiResponse>(url);
};

// ==========================================
// SYSTEM API WRAPPERS
// ==========================================

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, 'up' | 'down'>;
  timestamp: string;
}

export interface SystemStatus {
  version: string;
  uptime: number;
  environment: string;
}

export const getSystemHealth = async (): Promise<AxiosResponse<SystemHealth>> => {
  return apiHelper.get<SystemHealth>(URLS.SYSTEM_HEALTH);
};

export const getSystemStatus = async (): Promise<AxiosResponse<SystemStatus>> => {
  return apiHelper.get<SystemStatus>(URLS.SYSTEM_STATUS);
};

// ==========================================
// PRODUCT API WRAPPERS
// ==========================================

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price?: number;
  category?: string;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
}

/**
 * Get all products
 * GET /products (getProductList)
 */
export const getProductList = async (): Promise<AxiosResponse<Product[]>> => {
  return apiHelper.get<Product[]>(URLS.GET_PRODUCT_LIST);
};

/**
 * Get a single product by ID
 * GET /products/{id} (getProduct)
 */
export const getProduct = async (id: string): Promise<AxiosResponse<Product>> => {
  const url = expandUrlTemplate(URLS.GET_PRODUCT, { id });
  return apiHelper.get<Product>(url);
};

/**
 * Create a new product
 * POST /products (createProduct)
 */
export const createProduct = async (data: CreateProductPayload): Promise<AxiosResponse<Product>> => {
  return apiHelper.post<Product>(URLS.CREATE_PRODUCT, data);
};

/**
 * Update a product
 * PUT /products/{id} (updateProduct)
 */
export const updateProduct = async (id: string, data: UpdateProductPayload): Promise<AxiosResponse<Product>> => {
  const url = expandUrlTemplate(URLS.UPDATE_PRODUCT, { id });
  return apiHelper.put<Product>(url, data);
};

/**
 * Delete a product
 * DELETE /products/{id} (deleteProduct)
 */
export const deleteProduct = async (id: string): Promise<AxiosResponse<ApiResponse<void>>> => {
  const url = expandUrlTemplate(URLS.DELETE_PRODUCT, { id });
  return apiHelper.delete<ApiResponse<void>>(url);
};

// ==========================================
// EXPORT ALL FUNCTIONS
// ==========================================

const backendHelper = {
  // Utilities
  expandUrlTemplate,
  validatePlaceholders,

  // Auth
  postUserLogin,
  postUserRegister,
  postUserSignupWithEmail,
  postUserSignupResendWithEmail,
  postUserSignupComplete,
  postResetPasswordGetLink,
  putResetPasswordWithToken,
  postChangePassword,
  deleteUserSignOut,
  putRefreshAccessToken,

  // Users
  getUserProfile,
  putUserProfile,
  getUserNotifications,

  // Tenants
  getTenants,
  getTenant,
  postTenant,
  putTenant,
  deleteTenant,

  // Tenant Members
  getTenantMembers,
  postTenantMemberInvite,
  putTenantMemberRole,
  deleteTenantMember,

  // Workspaces
  getWorkspaces,
  getWorkspace,
  postWorkspace,
  putWorkspace,
  deleteWorkspace,

  // Projects
  getProjects,
  getProject,
  postProject,
  putProject,
  deleteProject,
  searchProjects,
  getProjectMembers,
  postProjectMember,
  putProjectMember,
  deleteProjectMember,

  // Data Sources
  getDataSources,
  getDataSource,
  postDataSource,
  testDataSource,

  // Charts
  getCharts,
  getChart,
  postChart,
  getChartData,

  // Pipelines
  getPipelines,
  getPipeline,
  postPipeline,
  postPipelineExecute,

  // System
  getSystemHealth,
  getSystemStatus,

  // Products
  getProductList,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};

export default backendHelper;