# Architecture Overview

The AI-First React Framework is designed with a modern, scalable architecture that promotes maintainability, testability, and developer productivity. This document outlines the key architectural decisions and patterns used throughout the framework.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI-First React Framework                 │
├─────────────────────────────────────────────────────────────┤
│  🎨 Presentation Layer                                      │
│  ├── React Components (Functional + Hooks)                 │
│  ├── Styled Components + Ant Design                        │
│  ├── Pages & Routing                                       │
│  └── UI State Management                                   │
├─────────────────────────────────────────────────────────────┤
│  🧠 State Management Layer                                  │
│  ├── Zustand Stores (Business Logic)                      │
│  ├── Derived State & Selectors                            │
│  ├── Actions & Subscriptions                              │
│  └── Store Composition & Middleware                       │
├─────────────────────────────────────────────────────────────┤
│  🌐 Service Layer                                           │
│  ├── API Services (HTTP Client)                            │
│  ├── Data Fetching (SWR)                                   │
│  ├── Validation (Zod Schemas)                              │
│  └── Error Handling                                        │
├─────────────────────────────────────────────────────────────┤
│  🛠️ Infrastructure Layer                                    │
│  ├── Build System (Craco + Webpack)                        │
│  ├── TypeScript Configuration                              │
│  ├── Testing Framework (Jest + RTL)                        │
│  ├── Code Quality (ESLint + Prettier)                      │
│  └── CI/CD Pipeline                                        │
└─────────────────────────────────────────────────────────────┘
```

## 📐 Design Principles

### 1. **Separation of Concerns**
- **Components**: Focus solely on rendering and user interaction
- **Stores**: Handle business logic and state management
- **Services**: Manage data fetching and external API communication
- **Utilities**: Provide reusable helper functions

### 2. **Unidirectional Data Flow**
```
User Action → Component → Store Action → State Update → Component Re-render
```

Zustand follows a simple, predictable data flow where actions directly update the store state, triggering re-renders in subscribed components.

### 3. **Type Safety First**
- Strict TypeScript configuration
- Runtime validation with Zod
- Interface-driven development
- Compile-time error detection

### 4. **Performance by Default**
- Component memoization
- Lazy loading
- Code splitting
- Optimized bundle sizes

## 🎨 Presentation Layer

### Component Architecture

```tsx
// Modern functional component pattern
export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onEdit,
  loading = false
}) => {
  // Custom hooks for logic
  const { isEditing, toggleEdit } = useEditMode();
  
  // Early returns for loading/error states
  if (loading) return <Spinner />;
  
  return (
    <StyledWrapper data-testid="user-profile">
      {/* JSX with clear component composition */}
    </StyledWrapper>
  );
};
```

### Styling Strategy

**Hybrid Approach**: Styled Components + Ant Design

```tsx
// Styled Components for custom styling
const StyledCard = styled(Card)`
  margin: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .ant-card-body {
    padding: 24px;
  }
`;

// Ant Design for consistent UI components
<StyledCard>
  <Form>
    <Form.Item label="Name">
      <Input value={name} onChange={handleNameChange} />
    </Form.Item>
  </Form>
</StyledCard>
```

### Component Patterns

1. **Container vs Presentational**
   - Container components connect to stores
   - Presentational components receive props

2. **Compound Components**
   - Related components grouped together
   - Shared context and state

3. **Render Props & Custom Hooks**
   - Logic reuse across components
   - Cleaner component interfaces

## 🧠 State Management Layer

### Zustand Architecture

```tsx
// Store structure with Zustand
import { create } from 'zustand';

export interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  // Actions
  fetchUsers: () => Promise<void>;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  // Computed/derived state
  getActiveUsers: () => User[];
}

export const useUserStore = create<UserState>()((set, get) => ({
  // Initial state
  users: [],
  loading: false,
  error: null,

  // Computed values (derived state)
  getActiveUsers: () => {
    return get().users.filter(user => user.isActive);
  },

  // Actions
  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await userService.getUsers();
      set({ users, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addUser: (user) => set((state) => ({ 
    users: [...state.users, user] 
  })),

  updateUser: (id, updates) => set((state) => ({
    users: state.users.map(user => 
      user.id === id ? { ...user, ...updates } : user
    )
  }))
}));
```

### Zustand Middleware

```tsx
// Persist middleware for data persistence
import { persist } from 'zustand/middleware';

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'user-storage',
      // Optional: customize what gets persisted
      partialize: (state) => ({ users: state.users }),
    }
  )
);

// DevTools middleware for debugging
import { devtools } from 'zustand/middleware';

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      // Store implementation
    }),
    { name: 'UserStore' }
  )
);

// Immer middleware for complex state updates
import { immer } from 'zustand/middleware/immer';

export const useUserStore = create<UserState>()(
  immer((set, get) => ({
    users: [],
    updateUser: (id, updates) => 
      set((state) => {
        const user = state.users.find(u => u.id === id);
        if (user) {
          Object.assign(user, updates);
        }
      })
  }))
);
```

### Store Composition

```tsx
// Modular store pattern with Zustand
// Individual stores are self-contained
export const useUserStore = create<UserState>()(/* user store implementation */);
export const useAuthStore = create<AuthState>()(/* auth store implementation */);
export const useUIStore = create<UIState>()(/* UI store implementation */);

// Store composition through custom hooks when needed
export const useAppState = () => {
  const users = useUserStore((state) => state.users);
  const currentUser = useAuthStore((state) => state.user);
  const isLoading = useUIStore((state) => state.isLoading);
  
  return { users, currentUser, isLoading };
};

// Cross-store actions using subscriptions
export const useStoreSubscriptions = () => {
  useEffect(() => {
    const unsubAuth = useAuthStore.subscribe(
      (state) => state.isAuthenticated,
      (isAuthenticated) => {
        if (!isAuthenticated) {
          useUserStore.getState().clearUsers();
        }
      }
    );
    
    return unsubAuth;
  }, []);
};
```

### State Flow Patterns

1. **Immutable Updates**
   - Actions create new state objects
   - Shallow equality checks for optimized re-renders
   - Clear separation between state and actions

2. **Selective Subscriptions**
   - Components subscribe to specific state slices
   - Prevents unnecessary re-renders
   - Optimized performance by default

3. **Error Boundaries**
   - Graceful error handling
   - Fallback UI components
   - Error reporting

## 🌐 Service Layer

### API Service Architecture

```tsx
// Base API client
export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Global error handling
        return Promise.reject(error);
      }
    );
  }
}
```

### Data Fetching with SWR

```tsx
// SWR integration for caching and revalidation
export const useUsers = () => {
  const { data, error, mutate } = useSWR(
    'users',
    () => userService.getUsers(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  );

  return {
    users: data || [],
    loading: !error && !data,
    error,
    refresh: mutate,
  };
};
```

### Validation Strategy

```tsx
// Zod schemas for runtime validation
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(18).max(120),
  role: z.enum(['admin', 'user', 'moderator']),
});

export type User = z.infer<typeof UserSchema>;

// Service with validation
export class UserService {
  async createUser(userData: unknown): Promise<User> {
    // Validate input
    const validatedData = UserSchema.parse(userData);
    
    // API call
    const response = await apiClient.post('/users', validatedData);
    
    // Validate response
    return UserSchema.parse(response.data);
  }
}
```

## 🛠️ Infrastructure Layer

### Build Configuration

```javascript
// craco.config.js - Webpack customization
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Bundle splitting
      webpackConfig.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };

      // Path aliases
      webpackConfig.resolve.alias = {
        '@components': path.resolve(__dirname, 'src/components'),
        '@stores': path.resolve(__dirname, 'src/stores'),
        '@services': path.resolve(__dirname, 'src/services'),
      };

      return webpackConfig;
    },
  },
};
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"],
      "@stores/*": ["stores/*"],
      "@services/*": ["services/*"],
      "@types/*": ["types/*"],
      "@utils/*": ["utils/*"]
    }
  }
}
```

### Testing Architecture

```tsx
// Testing strategy layers
describe('UserProfile Component', () => {
  // Unit tests - isolated component testing
  it('renders user information correctly', () => {
    render(<UserProfile user={mockUser} />);
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
  });

  // Integration tests - component + store interaction
  it('handles user editing flow', async () => {
    // Zustand stores are global, so no provider needed
    // Reset store state before test
    useUserStore.setState({ users: [mockUser], loading: false, error: null });
    
    render(<UserProfile user={mockUser} />);
    
    fireEvent.click(screen.getByText('Edit'));
    
    // Test store state changes
    await waitFor(() => {
      const updatedUser = useUserStore.getState().users[0];
      expect(updatedUser).toEqual(expect.objectContaining({ isEditing: true }));
    });
  });
});
```

## 🔄 Data Flow Patterns

### 1. **Optimistic Updates**
```tsx
// Optimistic updates with Zustand
const optimisticUpdateUser = async (id: string, updates: Partial<User>) => {
  const { users, updateUser, fetchUsers } = useUserStore.getState();
  
  // Store original state for rollback
  const originalUsers = users;
  
  // Optimistic update
  updateUser(id, updates);

  try {
    await userService.updateUser(id, updates);
  } catch (error) {
    // Rollback on error
    useUserStore.setState({ users: originalUsers });
    throw error;
  }
};
```

### 2. **Error Boundaries**
```tsx
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    errorService.captureException(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 3. **Loading States**
```tsx
// Centralized loading state management with Zustand
interface UIState {
  loadingStates: Record<string, boolean>;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: () => boolean;
  isLoadingKey: (key: string) => boolean;
}

export const useUIStore = create<UIState>()((set, get) => ({
  loadingStates: {},
  
  setLoading: (key: string, loading: boolean) => 
    set((state) => ({
      loadingStates: { ...state.loadingStates, [key]: loading }
    })),
  
  isLoading: () => {
    const { loadingStates } = get();
    return Object.values(loadingStates).some(Boolean);
  },
  
  isLoadingKey: (key: string) => {
    const { loadingStates } = get();
    return loadingStates[key] || false;
  }
}));
```

## 📊 Performance Patterns

### 1. **Component Optimization**
```tsx
// Memoization for expensive computations
const ExpensiveComponent = React.memo<Props>(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data]);

  return <div>{processedData}</div>;
});
```

### 2. **Lazy Loading**
```tsx
// Route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

// Component lazy loading
const HeavyChart = lazy(() => import('./components/HeavyChart'));
```

### 3. **Virtual Scrolling**
```tsx
// Large list optimization
const VirtualizedList: React.FC<{ items: Item[] }> = ({ items }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      itemData={items}
    >
      {ItemRenderer}
    </FixedSizeList>
  );
};
```

## 🔒 Security Patterns

### 1. **Authentication Flow**
```tsx
// JWT-based authentication with Zustand
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    token: null,
    user: null,

    login: async (credentials) => {
      const response = await authService.login(credentials);
      set({ 
        token: response.token, 
        user: response.user 
      });
      
      // Token is automatically persisted via persist middleware
    },

    logout: () => set({ token: null, user: null }),

    isAuthenticated: () => {
      const { token, user } = get();
      return !!token && !!user;
    }
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({ token: state.token, user: state.user })
  }
));
```

### 2. **Route Protection**
```tsx
// Protected route component with Zustand
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

## 📈 Scalability Patterns

### 1. **Feature-Based Organization**
```
src/
├── features/
│   ├── user-management/
│   │   ├── components/
│   │   ├── stores/
│   │   ├── services/
│   │   └── pages/
│   └── dashboard/
│       ├── components/
│       ├── stores/
│       ├── services/
│       └── pages/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
```

### 2. **Micro-Frontend Ready**
```tsx
// Module federation configuration
const ModuleFederationPlugin = require('@module-federation/webpack');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'user_management',
      filename: 'remoteEntry.js',
      exposes: {
        './UserManagement': './src/features/user-management',
      },
      shared: ['react', 'react-dom', 'zustand'],
    }),
  ],
};
```

---

**Next**: Learn about [Code Generators](./generators.md) to understand how the framework creates consistent code.