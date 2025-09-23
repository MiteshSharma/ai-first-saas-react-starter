# Admin Auth API

This module provides admin authentication functionality with support for both real backend calls and mock responses.

## Usage

### Basic Token Validation

```typescript
import { adminAuthService } from '../../auth/AdminAuthService';

// Validate admin token (uses mock or real backend based on REACT_APP_USE_MOCK_API)
try {
  const result = await adminAuthService.validateAdminToken('your-admin-token');
  console.log('Admin user:', result.user);
  console.log('Tenant:', result.tenant);
} catch (error) {
  console.error('Invalid admin token:', error);
}
```

### With Tenant ID

```typescript
// Validate token for specific tenant
const result = await adminAuthService.validateAdminToken('token', 'tenant-id');
```

### Mock Mode

When `REACT_APP_USE_MOCK_API=true`, the following mock tokens are available:

- `valid-admin-token` - System admin with full permissions
- `valid-tenant-admin-token` - Tenant admin with limited permissions

### Getting Mock Tokens (Development Only)

```typescript
// Only works when REACT_APP_USE_MOCK_API=true
const mockTokens = await adminAuthService.getMockTokens();
console.log('Available mock tokens:', mockTokens);
```

## Architecture

- **AdminAuthService**: Main service class (unchanged API)
- **AdminAuthBackendHelper**: Handles mock/real backend switching
- **mockHandlers**: Mock implementations
- **endpoints**: API endpoint definitions

## Environment Variables

- `REACT_APP_USE_MOCK_API=true` - Enable mock mode
- `REACT_APP_USE_MOCK_API=false` - Use real backend (default)