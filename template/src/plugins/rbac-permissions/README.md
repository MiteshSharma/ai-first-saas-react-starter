# RBAC & Permissions Plugin

A comprehensive Role-Based Access Control (RBAC) system for multi-tenant applications with hierarchical permissions and context-aware access control.

## Overview

This plugin provides a complete RBAC solution with:

- **Hierarchical Permissions**: System > Tenant > Workspace > Resource scopes
- **Role-Based Access**: Flexible role definitions with permission inheritance
- **Context-Aware Security**: Permissions evaluated based on current context
- **UI Components**: Ready-to-use components for permission management
- **Mock API**: Development-ready mock handlers
- **Type Safety**: Full TypeScript support

## Architecture

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

### 2. Initialize the Plugin

```typescript
import { RBACPermissionsPlugin } from './plugins/rbac-permissions';

// Initialize the plugin
await RBACPermissionsPlugin.initialize();
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

### 4. Check Permissions in Code

```typescript
import { usePermissions } from './plugins/rbac-permissions';

function MyComponent() {
  const { hasPermission } = usePermissions();

  const canEdit = await hasPermission('workspace.update');

  return (
    <button disabled={!canEdit}>
      Edit Workspace
    </button>
  );
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

#### RBACDashboard
Complete RBAC management dashboard:

```tsx
import { RBACDashboard } from './plugins/rbac-permissions';

<RBACDashboard defaultTab="overview" />
```

## Hooks

### usePermissions

Main hook for permission checking:

```typescript
const {
  // Permission checking
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  checkBulkPermissions,

  // Utilities
  canPerformAction,
  getPermissionsByCategory,
  getEffectivePermissions,

  // State
  permissions,
  loading,
  error,

  // Actions
  refreshPermissions,
  clearError
} = usePermissions(defaultContext);
```

### Specialized Hooks

```typescript
// Context-specific hooks
const workspacePerms = useWorkspacePermissions('workspace-123');
const tenantPerms = useTenantPermissions('tenant-123');
const resourcePerms = useResourcePermissions('resource-123', 'document');

// Simple boolean hooks
const canRead = useHasPermission('workspace.read');
const canDoAny = useHasAnyPermission(['workspace.read', 'workspace.update']);
const canDoAll = useHasAllPermissions(['workspace.read', 'workspace.update']);
```

## Store

### usePermissionStore

Zustand store for permission state:

```typescript
import { usePermissionStore } from './plugins/rbac-permissions';

const {
  permissions,
  userPermissions,
  loading,
  error,
  loadPermissions,
  loadUserPermissions,
  checkPermission,
  checkMultiplePermissions,
  clearError
} = usePermissionStore();
```

### Store Utilities

```typescript
import { permissionStoreUtils } from './plugins/rbac-permissions';

// Initialize on app startup
await permissionStoreUtils.initialize();

// Refresh user permissions
await permissionStoreUtils.refreshUserPermissions(context);

// Check action permission
const canEdit = await permissionStoreUtils.canPerformAction('update', 'workspace', context);

// Get permissions by category
const userPerms = permissionStoreUtils.getPermissionsByCategory('User Management');
```

## Mock API

For development and testing, the plugin includes comprehensive mock API handlers:

```typescript
import { rbacMockHandlers, rbacMockUtils } from './plugins/rbac-permissions';

// Use with MSW
import { setupWorker } from 'msw';
const worker = setupWorker(...rbacMockHandlers);
worker.start();

// Test utilities
rbacMockUtils.resetMockData();
rbacMockUtils.addTestUser('user-123', ['admin'], { tenantId: 'tenant-123' });
const permissions = rbacMockUtils.generateUserPermissions(context);
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

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  tenantId?: string;
  workspaceId?: string;
  userCount: number;
  inheritedFrom?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

interface AccessContext {
  userId: string;
  tenantId?: string;
  workspaceId?: string;
  resourceId?: string;
  resourceType?: string;
}
```

### Enums

```typescript
type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'assign' | 'export';
type PermissionResource = 'tenant' | 'workspace' | 'user' | 'role' | 'settings' | 'audit' | 'dashboard' | 'integration';
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

### Settings Management
- `settings.tenant.read` - Read tenant settings
- `settings.tenant.update` - Update tenant settings

### Audit & Monitoring
- `audit.read` - Read audit logs
- `audit.export` - Export audit data

### Dashboard & Analytics
- `dashboard.read` - Access dashboards
- `dashboard.export` - Export dashboard data

### Integration Management
- `integration.read` - Read integrations
- `integration.manage` - Manage integrations

## System Roles

Predefined role templates:

### Tenant Owner
- Full access to tenant resources
- All tenant, workspace, user, and role permissions
- Settings and audit access

### Workspace Admin
- Workspace management
- User management within workspace
- Basic settings access

### Member
- Basic workspace access
- Dashboard read access

## Testing

The plugin includes comprehensive test coverage:

### Running Tests

```bash
npm test src/plugins/rbac-permissions
```

### Test Utilities

```typescript
import {
  createMockContext,
  createMockPermission,
  createMockRole,
  TEST_PERMISSIONS,
  TEST_ROLES
} from './plugins/rbac-permissions/__tests__/setup';

// Create test data
const context = createMockContext({ tenantId: 'test-tenant' });
const permission = createMockPermission({ id: 'test.permission' });
```

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

### With Form Components

```tsx
function UserForm() {
  const { hasPermission } = usePermissions();
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    hasPermission('user.update').then(setCanEdit);
  }, []);

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
const menuItems = [
  {
    key: 'users',
    permission: 'user.read',
    label: 'Users',
  },
  {
    key: 'roles',
    permission: 'role.read',
    label: 'Roles',
  },
];

function NavigationMenu() {
  return (
    <Menu>
      {menuItems.map(item => (
        <PermissionGuard key={item.key} permission={item.permission}>
          <Menu.Item>{item.label}</Menu.Item>
        </PermissionGuard>
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

### 4. Handle Loading States
```tsx
<PermissionGuard
  permission="data.read"
  loading={dataLoading}
  showLoader={true}
>
  <DataTable />
</PermissionGuard>
```

### 5. Batch Permission Checks
```typescript
// Good: Single call for multiple permissions
const results = await checkBulkPermissions(['user.read', 'user.update', 'user.delete']);

// Avoid: Multiple individual calls
const canRead = await hasPermission('user.read');
const canUpdate = await hasPermission('user.update');
const canDelete = await hasPermission('user.delete');
```

## Performance Considerations

### 1. Permission Caching
- Permissions are cached in Zustand store
- Use `refreshPermissions()` to update cache
- Cache persists across page reloads

### 2. Context Optimization
- Pass minimal context needed for permission check
- Avoid unnecessary context changes that trigger re-evaluation

### 3. Component Optimization
- PermissionGuard uses React.memo internally
- Permissions are checked only when dependencies change
- Use `showLoader={false}` to disable loading states when not needed

### 4. Bulk Operations
- Use `checkBulkPermissions` for multiple permission checks
- Use `hasAnyPermission`/`hasAllPermissions` for logic operations

## Migration Guide

### From Simple Role Checks

Before:
```typescript
if (user.role === 'admin') {
  // Show admin content
}
```

After:
```tsx
<PermissionGuard permission="admin.access">
  {/* Admin content */}
</PermissionGuard>
```

### From Custom Permission Logic

Before:
```typescript
function checkUserAccess(user, resource) {
  // Custom permission logic
  return user.permissions.includes(`${resource}.read`);
}
```

After:
```typescript
const { hasPermission } = usePermissions();
const hasAccess = await hasPermission(`${resource}.read`);
```

## Troubleshooting

### Common Issues

1. **Permissions not loading**
   - Ensure plugin is initialized: `await RBACPermissionsPlugin.initialize()`
   - Check context is properly set
   - Verify API endpoints are responding

2. **Permission checks failing**
   - Check permission ID format (`resource.action`)
   - Verify user has required role assignments
   - Ensure context matches permission scope

3. **Components not re-rendering**
   - Check permission dependencies in useEffect
   - Verify context changes trigger re-evaluation
   - Use `refreshPermissions()` after role changes

4. **Performance issues**
   - Use bulk permission checks
   - Minimize context changes
   - Consider disabling loading states for non-critical checks

### Debug Mode

Enable debug logging:
```typescript
// Add to development environment
localStorage.setItem('rbac-debug', 'true');
```

This will log permission checks, context changes, and cache operations to the console.

## License

This plugin is part of the AI-First SaaS React Starter and follows the same license terms.