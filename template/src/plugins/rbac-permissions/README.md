# RBAC & Permissions Plugin

A comprehensive Role-Based Access Control (RBAC) system for multi-tenant applications with hierarchical permissions and event-driven, local permission evaluation.

## Overview

This plugin provides a complete RBAC solution with:

- **Event-Driven Architecture**: Permissions loaded via events from tenant/workspace management
- **Local Evaluation**: All permission checks performed synchronously without API calls
- **Hierarchical Permissions**: System > Tenant > Workspace > Resource scopes
- **Role-Based Access**: Flexible role definitions with permission inheritance
- **Context-Aware Security**: Permissions evaluated based on current context
- **UI Components**: Ready-to-use components for permission management
- **Type Safety**: Full TypeScript support

## Architecture

### Event-Driven Permission Loading

The RBAC plugin uses an event-driven architecture where permissions are:
1. Loaded by the tenant-management module when users log in or switch tenants
2. Broadcast via events to the RBAC permission store
3. Evaluated locally without any API calls

### Core Concepts

#### Permission Scopes
- **System**: Global application permissions
- **Tenant**: Tenant-level permissions
- **Workspace**: Workspace-level permissions
- **Resource**: Individual resource permissions

#### Permission Format
Permissions follow the `resource.action` format:
- `tenant.read` - Read tenant information
- `workspace.manage` - Manage workspace settings
- `user.create` - Create new users

#### Role Hierarchy
Roles can inherit permissions from parent roles, creating flexible hierarchies:
```
Admin → Manager → Member
```

## Quick Start

### 1. Install Dependencies

The plugin requires these peer dependencies:
```bash
npm install zustand react antd @ant-design/icons
```

### 2. Initialize the Plugin with Event Bus

```typescript
import { initializePermissionStore } from './plugins/rbac-permissions';
import { eventBus } from './core/event-bus';

// Initialize the permission store with event bus
const cleanup = initializePermissionStore(eventBus);

// The store will now listen for permission events:
// - TENANT_EVENTS.USER_PERMISSIONS_LOADED
// - workspace.permissions.loaded
```

### 3. Use Permission Guards

```tsx
import { PermissionGuard } from './plugins/rbac-permissions';

function ProtectedComponent() {
  return (
    <PermissionGuard permission="workspace.manage">
      <div>This content requires workspace.manage permission</div>
    </PermissionGuard>
  );
}
```

### 4. Check Permissions in Code (Synchronous)

```typescript
import { usePermissions } from './plugins/rbac-permissions';

function MyComponent() {
  const { hasPermission } = usePermissions();

  // Note: Permission checks are now synchronous
  const canEdit = hasPermission('workspace.update');

  return (
    <button disabled={!canEdit}>
      Edit Workspace
    </button>
  );
}
```

## Event Integration

### Receiving Permission Events

The RBAC store listens for these events:

#### From Tenant Management
```typescript
// Event: TENANT_EVENTS.USER_PERMISSIONS_LOADED
{
  userId: string;
  tenantId: string;
  tenantRole: string;
  workspaces: Array<{
    workspaceId: string;
    effectivePermissions: Array<{ id: string }>;
  }>;
}
```

#### From Workspace Management
```typescript
// Event: workspace.permissions.loaded
{
  userId: string;
  tenantId: string;
  workspaceId: string;
  permissions: string[];
  groupIds: string[];
}
```

## Components

### PermissionGuard

Conditional rendering based on permissions:

```tsx
<PermissionGuard
  permission="workspace.read"
  fallback={<div>Access denied</div>}
>
  <WorkspaceContent />
</PermissionGuard>
```

**Props:**
- `permission?: string` - Single permission to check
- `permissions?: string[]` - Multiple permissions to check
- `operator?: 'AND' | 'OR'` - Logic for multiple permissions (default: 'OR')
- `roles?: string[]` - Roles to check instead of permissions
- `context?: Partial<AccessContext>` - Override context for permission check
- `fallback?: React.ReactNode` - Content to show when access denied
- `loading?: boolean` - External loading state
- `showLoader?: boolean` - Show loading spinner (default: true)
- `showFallback?: boolean` - Show fallback content (default: true)

### Specialized Guards

#### ActionPermissionGuard
```tsx
<ActionPermissionGuard action="read" resource="workspace">
  <WorkspaceData />
</ActionPermissionGuard>
```

#### RoleGuard
```tsx
<RoleGuard roles={['admin', 'manager']}>
  <AdminPanel />
</RoleGuard>
```

#### WorkspacePermissionGuard
```tsx
<WorkspacePermissionGuard
  permission="workspace.manage"
  workspaceId="workspace-123"
>
  <WorkspaceSettings />
</WorkspacePermissionGuard>
```

### Management Components

#### RoleManagement
Complete role management interface:

```tsx
import { RoleManagement } from './plugins/rbac-permissions';

<RoleManagement
  tenantId="tenant-123"
  workspaceId="workspace-456"
  onRoleChange={(roles) => console.log('Roles updated:', roles)}
/>
```

#### UserRoleAssignment
User role assignment interface:

```tsx
import { UserRoleAssignment } from './plugins/rbac-permissions';

<UserRoleAssignment
  tenantId="tenant-123"
  workspaceId="workspace-456"
  onAssignmentChange={(assignments) => console.log('Assignments updated:', assignments)}
/>
```

#### PermissionViewer
Permission display and analysis:

```tsx
import { PermissionViewer } from './plugins/rbac-permissions';

<PermissionViewer
  userId="user-123"
  context={{ tenantId: 'tenant-123' }}
  groupBy="category"
  viewMode="table"
/>
```

## Hooks

### usePermissions

Main hook for permission checking (all methods are synchronous):

```typescript
const {
  // Permission checking (synchronous)
  hasPermission,           // (permission: string, context?: Partial<AccessContext>) => boolean
  hasAnyPermission,        // (permissions: string[], context?: Partial<AccessContext>) => boolean
  hasAllPermissions,       // (permissions: string[], context?: Partial<AccessContext>) => boolean
  checkBulkPermissions,    // (permissions: string[], operator?: 'AND' | 'OR', context?: Partial<AccessContext>) => boolean

  // Utilities
  canPerformAction,        // (action: string, resource: string, context?: Partial<AccessContext>) => boolean
  getPermissionsByCategory,// (category: string) => ContextualPermission[]
  getEffectivePermissions, // (context?: Partial<AccessContext>) => ContextualPermission[]

  // State
  permissions,             // ContextualPermission[]
  loading,                 // boolean
  error,                   // string | null

  // Actions
  refreshPermissions,      // () => void (compatibility method - does nothing now)
  clearError              // () => void
} = usePermissions(defaultContext);
```

### Specialized Hooks

```typescript
// Context-specific hooks
const workspacePerms = useWorkspacePermissions('workspace-123');
const tenantPerms = useTenantPermissions('tenant-123');
const resourcePerms = useResourcePermissions('resource-123', 'document');

// Simple boolean hooks (synchronous)
const canRead = useHasPermission('workspace.read');
const canDoAny = useHasAnyPermission(['workspace.read', 'workspace.update']);
const canDoAll = useHasAllPermissions(['workspace.read', 'workspace.update']);
```

## Store

### usePermissionStore

Zustand store for permission state with local evaluation:

```typescript
import { usePermissionStore } from './plugins/rbac-permissions';

const {
  permissions,                     // Permission[]
  userPermissions,                 // ContextualPermission[]
  loading,                         // boolean
  error,                          // string | null
  setPermissions,                 // (permissions: any[]) => void
  setUserPermissionsFromEvent,     // (permissions: string[], role: string, context: AccessContext) => void
  checkPermission,                // (permission: string, context: AccessContext) => boolean
  checkMultiplePermissions,       // (permissions: string[], context: AccessContext, requireAll?: boolean) => boolean
  clearError                      // () => void
} = usePermissionStore();
```

### Store Utilities

```typescript
import { permissionStoreUtils } from './plugins/rbac-permissions';

// Initialize on app startup (sets up static permissions)
permissionStoreUtils.initialize();

// Check action permission (synchronous)
const canEdit = permissionStoreUtils.canPerformAction('update', 'workspace', context);

// Get permissions by category
const userPerms = permissionStoreUtils.getPermissionsByCategory('User Management');

// Check multiple permissions (synchronous)
const hasAny = permissionStoreUtils.hasAnyPermission(['user.read', 'user.write'], context);
const hasAll = permissionStoreUtils.hasAllPermissions(['user.read', 'user.write'], context);

// Get effective permissions for context
const effectivePerms = permissionStoreUtils.getEffectivePermissions(context);

// Get workspace-specific permissions
const workspacePerms = permissionStoreUtils.getWorkspacePermissions('workspace-123');
```

## Utilities

### Permission Validation

```typescript
import { rbacUtils } from './plugins/rbac-permissions';

const { PermissionValidator } = rbacUtils;

// Validate permission format
const isValid = PermissionValidator.isValidPermissionId('workspace.read'); // true

// Validate permission object
const errors = PermissionValidator.validatePermission(permissionData);
```

### Permission Matching

```typescript
const { PermissionMatcher } = rbacUtils;

// Check with wildcards
const hasAccess = PermissionMatcher.hasPermission(['workspace.*'], 'workspace.read'); // true

// Check multiple permissions
const hasAny = PermissionMatcher.hasAnyPermission(userPerms, requiredPerms);
const hasAll = PermissionMatcher.hasAllPermissions(userPerms, requiredPerms);
```

### Context Utilities

```typescript
const { ContextUtils } = rbacUtils;

// Build context
const context = ContextUtils.buildContext(baseContext, overrides);

// Get context scope
const scope = ContextUtils.getScope(context); // 'workspace'

// Check context hierarchy
const isWithin = ContextUtils.isWithin(childContext, parentContext);
```

## Type Definitions

### Core Types

```typescript
interface Permission {
  id: string;
  name: string;
  description: string;
  action: PermissionAction;
  resource: PermissionResource;
  scope: PermissionScope;
  category: string;
  isSystem: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

interface ContextualPermission extends Permission {
  tenantId?: string;
  workspaceId?: string;
  resourceId?: string;
  resourceType?: string;
  granted: boolean;
  inheritedFrom?: string; // Role ID that granted this permission
}

interface AccessContext {
  userId: string;
  tenantId?: string;
  workspaceId?: string;
  resourceId?: string;
  resourceType?: string;
}

interface PermissionState {
  permissions: Permission[];
  userPermissions: ContextualPermission[];
  loading: boolean;
  error: string | null;

  // Actions (all synchronous)
  setPermissions: (permissions: any[]) => void;
  setUserPermissionsFromEvent: (permissions: string[], role: string, context: AccessContext) => void;
  checkPermission: (permission: string, context: AccessContext) => boolean;
  checkMultiplePermissions: (permissions: string[], context: AccessContext, requireAll?: boolean) => boolean;
  clearError: () => void;

  // Helper
  isPermissionApplicableToContext: (permission: ContextualPermission, context: AccessContext) => boolean;
}
```

### Enums

```typescript
type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'assign' | 'export' | 'import' | 'approve' | 'reject';
type PermissionResource = 'tenant' | 'workspace' | 'user' | 'role' | 'settings' | 'audit' | 'dashboard' | 'integration' | 'resource';
type PermissionScope = 'system' | 'tenant' | 'workspace' | 'resource';
```

## System Permissions

The plugin includes predefined system permissions:

### Tenant Management
- `tenant.create` - Create new tenants
- `tenant.read` - Read tenant information
- `tenant.update` - Update tenant settings
- `tenant.manage` - Full tenant administration

### Workspace Management
- `workspace.create` - Create workspaces
- `workspace.read` - Read workspace data
- `workspace.update` - Update workspace settings
- `workspace.delete` - Delete workspaces
- `workspace.settings.manage` - Manage workspace settings

### User Management
- `user.create` - Create users
- `user.read` - Read user information
- `user.update` - Update user profiles
- `user.delete` - Delete users

### Role Management
- `role.create` - Create roles
- `role.read` - Read role information
- `role.update` - Update roles
- `role.delete` - Delete roles
- `role.assign` - Assign roles to users

## Integration Examples

### With React Router

```tsx
import { PermissionGuard } from './plugins/rbac-permissions';
import { Route } from 'react-router-dom';

<Route path="/admin" element={
  <PermissionGuard permission="tenant.manage">
    <AdminPanel />
  </PermissionGuard>
} />
```

### With Form Components (Synchronous)

```tsx
function UserForm() {
  const { hasPermission } = usePermissions();

  // Permission checks are now synchronous
  const canEdit = hasPermission('user.update');

  return (
    <form>
      <input disabled={!canEdit} />
      <PermissionGuard permission="user.update">
        <button type="submit">Save</button>
      </PermissionGuard>
    </form>
  );
}
```

### With Menu Systems

```tsx
function NavigationMenu() {
  const { hasPermission } = usePermissions();

  const menuItems = [
    { key: 'users', permission: 'user.read', label: 'Users' },
    { key: 'roles', permission: 'role.read', label: 'Roles' },
  ].filter(item => hasPermission(item.permission));

  return (
    <Menu>
      {menuItems.map(item => (
        <Menu.Item key={item.key}>{item.label}</Menu.Item>
      ))}
    </Menu>
  );
}
```

## Best Practices

### 1. Use Specific Permissions
```typescript
// Good: Specific permission
<PermissionGuard permission="workspace.settings.manage">

// Avoid: Overly broad permission
<PermissionGuard permission="workspace.manage">
```

### 2. Provide User-Friendly Fallbacks
```tsx
<PermissionGuard
  permission="workspace.read"
  fallback={
    <Alert
      message="Workspace access required"
      description="Contact your administrator for access."
      type="info"
    />
  }
>
  <WorkspaceContent />
</PermissionGuard>
```

### 3. Use Context Appropriately
```typescript
// Good: Pass relevant context
const workspaceContext = { workspaceId: currentWorkspace.id };
<PermissionGuard permission="workspace.manage" context={workspaceContext}>

// Avoid: Missing context when needed
<PermissionGuard permission="workspace.manage">
```

### 4. Leverage Synchronous Checks
```typescript
// Good: Direct synchronous check
const canEdit = hasPermission('user.update');

// No longer needed: Async pattern
// useEffect(() => {
//   hasPermission('user.update').then(setCanEdit);
// }, []);
```

## Performance Considerations

### 1. Local Evaluation
- All permission checks are performed locally in memory
- No network latency or API calls
- Instant permission evaluation

### 2. Event-Driven Updates
- Permissions updated automatically via events
- No polling or manual refresh needed
- Changes propagate immediately

### 3. Component Optimization
- PermissionGuard uses React.memo internally
- Permissions checked only when dependencies change
- Synchronous checks eliminate async state management

### 4. Efficient Store Design
- Permissions cached in Zustand store
- Minimal re-renders on permission changes
- Optimized context comparison

## Migration Guide

### From Async to Sync Permission Checks

Before (Async API-based):
```typescript
const [canEdit, setCanEdit] = useState(false);

useEffect(() => {
  async function checkPermission() {
    const result = await hasPermission('user.update');
    setCanEdit(result);
  }
  checkPermission();
}, []);
```

After (Sync Local Evaluation):
```typescript
const canEdit = hasPermission('user.update');
```

### From API Calls to Event Listeners

Before (API-based loading):
```typescript
// Load permissions from API
await permissionService.loadUserPermissions(userId);
```

After (Event-driven):
```typescript
// Permissions loaded automatically via events from tenant/workspace management
// No manual loading required
```

## Troubleshooting

### Common Issues

1. **Permissions not loading**
   - Ensure event bus is properly initialized with the store
   - Check that tenant-management is emitting permission events
   - Verify user has logged in and tenant context is set

2. **Permission checks returning false**
   - Check permission ID format (`resource.action`)
   - Verify permissions were loaded via events
   - Ensure context matches permission scope
   - Check the browser console for event logs

3. **Components not updating**
   - Permissions are now synchronous - remove async patterns
   - Check that you're not caching old permission values
   - Ensure components re-render on context changes

4. **Events not being received**
   - Verify event bus is connected
   - Check event names match exactly
   - Look for console logs from permission store initialization

### Debug Mode

Enable debug logging:
```typescript
// The permission store logs events to console by default
// Look for messages like:
// [RBAC Store] Initializing permission store with event listeners
// [RBAC Store] Received USER_PERMISSIONS_LOADED event
// [RBAC Store] Received workspace.permissions.loaded event
```

## Architecture Benefits

### Event-Driven Design
- **Decoupled**: RBAC doesn't depend on specific API implementations
- **Flexible**: Easy to integrate with different backend systems
- **Testable**: Can mock events for testing

### Local Evaluation
- **Fast**: No network latency
- **Reliable**: Works offline once permissions are loaded
- **Secure**: Permissions validated on backend, evaluated on frontend
- **Simple**: No async complexity in components

### Synchronous API
- **Predictable**: No race conditions or loading states
- **Clean**: No async/await or promise handling
- **Performant**: Direct memory access

## License

This plugin is part of the AI-First SaaS React Starter and follows the same license terms.