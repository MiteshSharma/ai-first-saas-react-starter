/**
 * @fileoverview Project store for workspace-scoped data management
 * 
 * This store demonstrates how to implement workspace-scoped data management:
 * - Automatically filters data by current workspace
 * - Clears data when workspace changes
 * - Provides workspace-aware API operations
 * - Manages workspace context switching
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  createRequestLifecycleMethods,
  createInitialRequestState,
  createErrorFromResponse 
} from '../base';
import { useTenantStore } from '../tenant/tenantStore';
import apiHelper from '../../api/apiHelper';
import {
  ProjectState,
  ProjectActions,
  Project,
  ProjectMember,
  ProjectFilters,
  ProjectPagination,
  CreateProjectPayload,
  UpdateProjectPayload,
  AddProjectMemberPayload,
  ProjectRequestType,
  ProjectRole,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ProjectStatus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ProjectPriority
} from './types';

interface ProjectStore extends ProjectState, ProjectActions {
  // Computed values
  readonly currentWorkspaceProjects: Project[];
  readonly canCreateProject: boolean;
  readonly currentProjectMembers: ProjectMember[];
}

/**
 * @store useProjectStore
 * @description Zustand store for workspace-scoped project management
 * 
 * Key Features:
 * - Workspace-scoped data operations
 * - Automatic context switching when workspace changes
 * - Consistent request lifecycle management
 * - Real-time data filtering and searching
 */
export const useProjectStore = create<ProjectStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        projects: [],
        currentProject: null,
        projectMembers: [],
        
        // Request lifecycle state (from base utilities)
        ...createInitialRequestState(),

        // Filters and pagination
        filters: {},
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        },

        // Request lifecycle methods (from base utilities)
        ...createRequestLifecycleMethods(set),

        // Computed values
        get currentWorkspaceProjects() {
          const { projects } = get();
          const currentWorkspace = useTenantStore.getState().currentWorkspace;
          
          if (!currentWorkspace) return [];
          
          return projects.filter(project => project.workspaceId === currentWorkspace.id);
        },

        get canCreateProject() {
          const currentWorkspace = useTenantStore.getState().currentWorkspace;
          const currentTenantRole = useTenantStore.getState().currentTenantRole;
          
          return !!(currentWorkspace && currentTenantRole && ['owner', 'admin', 'member'].includes(currentTenantRole));
        },

        get currentProjectMembers() {
          const { projectMembers, currentProject } = get();
          
          if (!currentProject) return [];
          
          return projectMembers.filter(member => member.projectId === currentProject.id);
        },

        // Project management actions
        fetchProjects: async (workspaceId: string, filters: Partial<ProjectFilters> = {}): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, ProjectRequestType.FETCH_PROJECTS);

          try {
            // Build query parameters
            const params = new URLSearchParams();
            if (filters.status?.length) params.append('status', filters.status.join(','));
            if (filters.priority?.length) params.append('priority', filters.priority.join(','));
            if (filters.ownerId) params.append('ownerId', filters.ownerId);
            if (filters.tags?.length) params.append('tags', filters.tags.join(','));
            if (filters.dueDateStart) params.append('dueDateStart', filters.dueDateStart);
            if (filters.dueDateEnd) params.append('dueDateEnd', filters.dueDateEnd);

            const queryString = params.toString();
            const url = `/workspaces/${workspaceId}/projects${queryString ? `?${queryString}` : ''}`;
            
            const response = await apiHelper.get(url);
            const responseData = response.data as { data: Project[]; pagination: ProjectPagination };
            const { data: projects, pagination } = responseData;
            
            set({ 
              projects,
              pagination,
              filters,
              loading: false, 
              currentRequest: null,
              error: null 
            });
          } catch (error: unknown) {
            setError(createErrorFromResponse(error, 'Failed to fetch projects'));
          }
        },

        fetchProject: async (projectId: string): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, ProjectRequestType.FETCH_PROJECT);

          try {
            const response = await apiHelper.get(`/projects/${projectId}`);
            const project = response.data as Project;
            
            // Add to projects list if not already present
            set(state => ({
              projects: state.projects.some(p => p.id === project.id) 
                ? state.projects.map(p => p.id === project.id ? project : p)
                : [...state.projects, project],
              currentProject: project,
              loading: false,
              currentRequest: null,
              error: null
            }));
          } catch (error: unknown) {
            setError(createErrorFromResponse(error, 'Failed to fetch project'));
          }
        },

        setCurrentProject: (project: Project | null) => {
          set({ currentProject: project });
        },

        createProject: async (workspaceId: string, data: CreateProjectPayload): Promise<Project> => {
          const { setLoading, setError } = get();
          setLoading(true, ProjectRequestType.CREATE_PROJECT);

          try {
            const response = await apiHelper.post(`/workspaces/${workspaceId}/projects`, data);
            const newProject = response.data as Project;
            
            set(state => ({ 
              projects: [...state.projects, newProject],
              loading: false, 
              currentRequest: null,
              error: null 
            }));

            return newProject;
          } catch (error: unknown) {
            setError(createErrorFromResponse(error, 'Failed to create project'));
            throw error;
          }
        },

        updateProject: async (projectId: string, data: UpdateProjectPayload): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, ProjectRequestType.UPDATE_PROJECT);

          try {
            const response = await apiHelper.put(`/projects/${projectId}`, data);
            const updatedProject = response.data as Project;
            
            set(state => ({
              projects: state.projects.map(p => p.id === projectId ? updatedProject : p),
              currentProject: state.currentProject?.id === projectId ? updatedProject : state.currentProject,
              loading: false,
              currentRequest: null,
              error: null
            }));
          } catch (error: unknown) {
            setError(createErrorFromResponse(error, 'Failed to update project'));
          }
        },

        deleteProject: async (projectId: string): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, ProjectRequestType.DELETE_PROJECT);

          try {
            await apiHelper.delete(`/projects/${projectId}`);
            
            set(state => ({
              projects: state.projects.filter(p => p.id !== projectId),
              currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
              loading: false,
              currentRequest: null,
              error: null
            }));
          } catch (error: unknown) {
            setError(createErrorFromResponse(error, 'Failed to delete project'));
          }
        },

        // Project member management
        fetchProjectMembers: async (projectId: string): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, ProjectRequestType.FETCH_PROJECT_MEMBERS);

          try {
            const response = await apiHelper.get(`/projects/${projectId}/members`);
            const members = response.data as ProjectMember[];
            
            set({ 
              projectMembers: members,
              loading: false,
              currentRequest: null,
              error: null 
            });
          } catch (error: unknown) {
            setError(createErrorFromResponse(error, 'Failed to fetch project members'));
          }
        },

        addProjectMember: async (projectId: string, data: AddProjectMemberPayload): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, ProjectRequestType.ADD_PROJECT_MEMBER);

          try {
            const response = await apiHelper.post(`/projects/${projectId}/members`, data);
            const newMember = response.data as ProjectMember;
            
            set(state => ({ 
              projectMembers: [...state.projectMembers, newMember],
              loading: false,
              currentRequest: null,
              error: null 
            }));
          } catch (error: unknown) {
            setError(createErrorFromResponse(error, 'Failed to add project member'));
          }
        },

        updateProjectMemberRole: async (memberId: string, role: ProjectRole): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, ProjectRequestType.UPDATE_PROJECT_MEMBER);

          try {
            const response = await apiHelper.put(`/project-members/${memberId}`, { role });
            const updatedMember = response.data as ProjectMember;
            
            set(state => ({
              projectMembers: state.projectMembers.map(m => m.id === memberId ? updatedMember : m),
              loading: false,
              currentRequest: null,
              error: null
            }));
          } catch (error: unknown) {
            setError(createErrorFromResponse(error, 'Failed to update member role'));
          }
        },

        removeProjectMember: async (memberId: string): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, ProjectRequestType.REMOVE_PROJECT_MEMBER);

          try {
            await apiHelper.delete(`/project-members/${memberId}`);
            
            set(state => ({
              projectMembers: state.projectMembers.filter(m => m.id !== memberId),
              loading: false,
              currentRequest: null,
              error: null
            }));
          } catch (error: unknown) {
            setError(createErrorFromResponse(error, 'Failed to remove project member'));
          }
        },

        // Filters and search
        setFilters: (newFilters: Partial<ProjectFilters>) => {
          set(state => ({
            filters: { ...state.filters, ...newFilters }
          }));
        },

        clearFilters: () => {
          set({ filters: {} });
        },

        searchProjects: async (workspaceId: string, query: string): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, ProjectRequestType.SEARCH_PROJECTS);

          try {
            const response = await apiHelper.get(`/workspaces/${workspaceId}/projects/search?q=${encodeURIComponent(query)}`);
            const projects = response.data as Project[];
            
            set({ 
              projects,
              loading: false,
              currentRequest: null,
              error: null 
            });
          } catch (error: unknown) {
            setError(createErrorFromResponse(error, 'Failed to search projects'));
          }
        },

        // Workspace context management
        switchWorkspaceContext: async (workspaceId: string): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, ProjectRequestType.SWITCH_WORKSPACE_CONTEXT);

          try {
            // Clear current data
            set({
              projects: [],
              currentProject: null,
              projectMembers: [],
              filters: {},
              pagination: {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0
              }
            });

            // Fetch new workspace data
            await get().fetchProjects(workspaceId);
          } catch (error: unknown) {
            setError(createErrorFromResponse(error, 'Failed to switch workspace context'));
          }
        },

        clearWorkspaceData: () => {
          set({
            projects: [],
            currentProject: null,
            projectMembers: [],
            filters: {},
            loading: false,
            error: null,
            currentRequest: null,
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0
            }
          });
        }
      }),
      {
        name: 'project-store',
        partialize: (state) => ({ 
          currentProject: state.currentProject,
          filters: state.filters
        })
      }
    ),
    {
      name: 'project-store'
    }
  )
);

// Subscribe to workspace changes to automatically update project context
let previousWorkspaceId: string | null = null;

useTenantStore.subscribe((state) => {
  const currentWorkspaceId = state.currentWorkspace?.id || null;
  
  if (currentWorkspaceId !== previousWorkspaceId) {
    const projectStore = useProjectStore.getState();
    
    if (currentWorkspaceId) {
      // Switch to new workspace context
      projectStore.switchWorkspaceContext(currentWorkspaceId);
    } else {
      // Clear data when no workspace is selected
      projectStore.clearWorkspaceData();
    }
    
    previousWorkspaceId = currentWorkspaceId;
  }
});