/**
 * @fileoverview Project types for workspace-scoped data management
 * 
 * This demonstrates how to create workspace-scoped data stores that
 * automatically filter and manage data within the current workspace context.
 */

import type { AppError, RequestLifecycle } from '../base';

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  ownerId: string;
  memberIds: string[];
  tags: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  progress: number; // 0-100
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  joinedAt: string;
}

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ProjectRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  CONTRIBUTOR = 'contributor',
  VIEWER = 'viewer'
}

export interface ProjectState extends RequestLifecycle {
  // Data scoped to current workspace
  projects: Project[];
  currentProject: Project | null;
  projectMembers: ProjectMember[];
  
  // Filtering and pagination
  filters: ProjectFilters;
  pagination: ProjectPagination;
}

export interface ProjectActions {
  // Standard request lifecycle
  resetRequestState: () => void;
  setLoading: (loading: boolean, requestType?: ProjectRequestType) => void;
  setError: (error: AppError | null) => void;

  // Project management (workspace-scoped)
  fetchProjects: (workspaceId: string, filters?: Partial<ProjectFilters>) => Promise<void>;
  fetchProject: (projectId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  createProject: (workspaceId: string, data: CreateProjectPayload) => Promise<Project>;
  updateProject: (projectId: string, data: UpdateProjectPayload) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  // Project member management
  fetchProjectMembers: (projectId: string) => Promise<void>;
  addProjectMember: (projectId: string, data: AddProjectMemberPayload) => Promise<void>;
  updateProjectMemberRole: (memberId: string, role: ProjectRole) => Promise<void>;
  removeProjectMember: (memberId: string) => Promise<void>;

  // Filters and search
  setFilters: (filters: Partial<ProjectFilters>) => void;
  clearFilters: () => void;
  searchProjects: (workspaceId: string, query: string) => Promise<void>;

  // Workspace context management
  switchWorkspaceContext: (workspaceId: string) => Promise<void>;
  clearWorkspaceData: () => void;
}

export enum ProjectRequestType {
  FETCH_PROJECTS = 'FETCH_PROJECTS',
  FETCH_PROJECT = 'FETCH_PROJECT',
  CREATE_PROJECT = 'CREATE_PROJECT',
  UPDATE_PROJECT = 'UPDATE_PROJECT',
  DELETE_PROJECT = 'DELETE_PROJECT',
  
  FETCH_PROJECT_MEMBERS = 'FETCH_PROJECT_MEMBERS',
  ADD_PROJECT_MEMBER = 'ADD_PROJECT_MEMBER',
  UPDATE_PROJECT_MEMBER = 'UPDATE_PROJECT_MEMBER',
  REMOVE_PROJECT_MEMBER = 'REMOVE_PROJECT_MEMBER',
  
  SEARCH_PROJECTS = 'SEARCH_PROJECTS',
  SWITCH_WORKSPACE_CONTEXT = 'SWITCH_WORKSPACE_CONTEXT'
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  priority?: ProjectPriority[];
  ownerId?: string;
  tags?: string[];
  dueDateStart?: string;
  dueDateEnd?: string;
}

export interface ProjectPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Payload types
export interface CreateProjectPayload {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  memberIds?: string[];
  tags?: string[];
  dueDate?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  memberIds?: string[];
  tags?: string[];
  dueDate?: string;
  progress?: number;
}

export interface AddProjectMemberPayload {
  userId: string;
  role: ProjectRole;
}

// Re-export from base types for consistency
export type { AppError } from '../base';