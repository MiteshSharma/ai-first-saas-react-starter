# 🚀 AI-First SaaS React Starter

A comprehensive multi-tenant SaaS React starter template designed for AI-assisted development with production-ready architecture, complete authentication system, tenant management, and modern development practices built-in.

## ✨ Features

### 🏗️ **Production-Ready SaaS Architecture**
- **Multi-Tenant Architecture** with workspace isolation
- **Complete Authentication System** (login, register, password reset, email verification)
- **Role-Based Access Control** (Admin, User, Moderator roles)
- **TypeScript** with strict configuration and path aliases
- **Zustand** for predictable state management
- **Ant Design** for professional UI components
- **Axios** with interceptors and retry logic
- **Jest + Testing Library** with 70%+ coverage requirements
- **ESLint + Prettier** with Airbnb standards

### 🔐 **Authentication & Authorization**
- **Complete Auth Flow** - Registration, login, logout, password reset
- **JWT Token Management** - Automatic refresh and secure storage
- **Role-Based Permissions** - Admin, User, Moderator access levels
- **Multi-Tenant Support** - User can belong to multiple organizations
- **Email Verification** - Account activation and security
- **Session Management** - Persistent login with secure token storage

### 🤖 **AI-Optimized Code Generation**
- **Component Generator** - Create React components with tests and documentation
- **Store Generator** - Generate Zustand stores with API integration
- **Service Generator** - Build API services with Zod validation
- **Page Generator** - Complete pages with routing and CRUD operations

### 🔒 **Security & Best Practices**
- **Zod** runtime type validation
- **Result types** for error handling
- **Security headers** and CSP configuration
- **Docker** containerization
- **CI/CD** pipeline with GitHub Actions

### 📚 **AI-Friendly Documentation**
- Comprehensive JSDoc comments
- Self-documenting code patterns
- Minimal cognitive complexity (≤25)
- Consistent naming conventions

## 🚀 Quick Start

### Prerequisites
- Node.js v22.0.0 or higher
- npm v10.0.0 or higher

## 📦 Installation

### Option 1: Global Installation from Local Source (Recommended for Development)

```bash
# Clone or download this repository
git clone https://github.com/MiteshSharma/ai-first-saas-react-starter.git
cd ai-first-saas-react-starter

# Install globally from local source
npm install -g .
```

### Option 2: Using npm link (Best for Active Development)

```bash
# In the ai-first-saas-react-starter directory
npm link

# This creates a global symlink - any changes to the code are immediately available
```

### Option 3: From NPM (When Published)

```bash
npm install -g ai-first-saas-react-starter
```

After installation, you can use the CLI commands directly:

```bash
npx ai-first-saas-react-starter create-app my-app
cd my-app
npm start
```

## 🔐 Authentication & Multi-Tenant System

### 🧪 **Mock API Development**

The starter includes a complete mock API system for development and testing:

```bash
# Start with mock API enabled
npm run start:mock
# or
REACT_APP_USE_MOCK_API=true npm start
```

### 🎭 **Test Credentials**

Use these pre-configured accounts for testing:

```bash
# Admin Account (Full Access)
Email: admin@example.com
Password: admin123
Role: Admin
Access: All features, tenant management, user administration

# Regular User Account
Email: john.doe@example.com
Password: user123
Role: User
Access: Standard features within assigned tenants

# Moderator Account
Email: moderator@example.com
Password: mod123
Role: Moderator
Access: Content moderation and user management
```

### 🏢 **Multi-Tenant Organizations**

Test with these pre-configured tenants:

#### **Acme Corporation** (Enterprise Plan)
- **Features**: Advanced analytics, custom branding, SSO
- **Workspaces**: Product Development, Marketing Analytics, Customer Support
- **Member Limit**: 100 users
- **Status**: Active

#### **StartupXYZ** (Starter Plan)
- **Features**: Basic analytics
- **Workspaces**: MVP Development, User Research
- **Member Limit**: 10 users
- **Status**: Active

#### **DevTeam Pro** (Professional Plan)
- **Features**: Advanced analytics, integrations
- **Workspaces**: Client Projects, Internal Tools
- **Member Limit**: 25 users
- **Status**: Trial

### 🚀 **Authentication Flow**

1. **Registration/Login** → `/auth/login` or `/auth/register`
2. **Email Verification** → Check email for activation link
3. **Dashboard Access** → `/dashboard` with tenant context
4. **Tenant Switching** → Switch between organizations via tenant switcher
5. **Role-Based Access** → Features unlock based on user role

### 🔄 **API Integration**

The authentication system provides:

```typescript
// Auth Store (Zustand)
const { login, logout, user, isAuthenticated } = useAuthStore();

// Tenant Store
const { currentTenant, switchTenant, tenants } = useTenantStore();

// API Helper with auto-retry and token refresh
import { apiHelper } from './helpers/apiHelper';
```

### Generate Components

```bash
# Generate a React component
ai-first generate component UserProfile

# Generate a Zustand store  
ai-first generate store UserStore

# Generate an API service
ai-first generate service UserService

# Generate a complete page
ai-first generate page UsersPage
```

## 📖 Documentation

- [**Getting Started Guide**](docs/getting-started.md) - Get started quickly
- [**Architecture Guide**](docs/architecture.md) - Understand the structure
- [**CLI Reference**](docs/cli-reference.md) - Command-line interface documentation
- [**Code Generators**](docs/generators.md) - AI-powered code generation
- [**State Management**](docs/state-management.md) - Zustand integration patterns
- [**Testing Strategy**](docs/testing.md) - Comprehensive testing approach
- [**Deployment Guide**](docs/deployment.md) - Production deployment
- [**API Mocking**](docs/API_MOCKING.md) - Development with mock APIs

## 🛠️ Available Generators

### Component Generator
```bash
ai-first g component UserCard --antd true --styled false
```
**Generates:**
- React component with TypeScript
- Comprehensive test suite
- JSDoc documentation
- Ant Design integration (optional)
- Styled-components support (optional)

### Store Generator
```bash
ai-first g store UserStore --api true
```
**Generates:**
- Zustand store with state and actions
- API integration with CRUD operations
- Comprehensive test coverage
- Error handling and loading states

### Service Generator
```bash
ai-first g service UserService --zod true
```
**Generates:**
- API service with full CRUD operations
- Zod schema validation
- TypeScript interfaces
- Error handling and retry logic
- Comprehensive test suite

### Page Generator
```bash
ai-first g page UsersPage --store true --service true
```
**Generates:**
- Complete page component
- React Router integration
- Store and service integration
- CRUD operations UI
- Comprehensive tests

## 🏗️ Project Structure

```
ai-first-saas-app/
├── src/
│   ├── auth/               # Complete authentication system
│   │   ├── AuthStore.ts    # Zustand auth state management
│   │   ├── AuthProvider.tsx # Auth context and protection
│   │   └── types.ts        # Auth TypeScript interfaces
│   ├── store/              # Feature-specific Zustand stores
│   │   ├── tenant/         # Multi-tenant state management
│   │   └── base/           # Shared store utilities
│   ├── components/         # Reusable UI components
│   │   ├── tenant/         # Tenant-specific components
│   │   └── common/         # Shared components
│   ├── pages/              # Page components with routing
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard and main app
│   │   └── tenant/         # Tenant management pages
│   ├── helpers/            # API and utility helpers
│   │   ├── apiHelper.ts    # Enhanced Axios with retry logic
│   │   ├── backendHelper.ts # Typed API wrappers
│   │   └── urlHelper.ts    # API endpoint definitions
│   ├── mocks/              # Complete mock API system
│   │   ├── handlers/       # Mock API route handlers
│   │   ├── data/           # Mock data generators
│   │   └── index.ts        # Mock setup and configuration
│   ├── services/           # Business logic services
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions and helpers
│   └── assets/             # Static assets and resources
├── public/                 # Public assets and index.html
├── test/                   # Test configuration and setup
├── .github/workflows/      # CI/CD pipelines and automation
├── Dockerfile             # Production deployment container
├── nginx.conf             # Production server configuration
├── UI_TEST.md             # Complete testing guide with credentials
└── README.md              # This comprehensive documentation
```

## 🧪 Quality Standards

### Code Quality Requirements
- **TypeScript**: Strict mode (100% compliance)
- **Test Coverage**: ≥70% for components, ≥60% for stores
- **ESLint**: 0 errors with Airbnb + custom rules
- **Bundle Size**: <2MB initial load
- **Performance**: ≥90 Lighthouse score

### Development Experience
- **Project Setup**: <5 minutes
- **Component Generation**: <30 seconds
- **Hot Reload**: <1 second
- **Build Time**: <2 minutes

### AI Integration Metrics
- **Code Generation Success**: ≥85%
- **Generated Code Quality**: ≥8/10
- **Manual Intervention**: <20%
- **Documentation Completeness**: ≥90%

## 📊 Built-in Quality Gates

Every generated project includes:

```bash
# Development
npm start                # Start development server
npm run start:mock       # Start with mock API enabled

# Type checking
npm run typecheck

# Linting with 0 errors
npm run lint

# Formatted code
npm run format

# Comprehensive testing
npm run test:coverage

# Production build
npm run build
```

## 🔧 Configuration

### TypeScript Configuration
- Strict type checking enabled
- Path aliases for clean imports  
- Modern JSX transform
- Optimized for Zustand state management

### ESLint Rules
- Airbnb configuration + TypeScript
- SonarJS complexity analysis
- Maximum 660 lines per file
- Maximum 5 parameters per function
- Import order enforcement

### Testing Setup
- Jest with 70% coverage threshold
- Testing Library for React components
- MSW for API mocking
- Snapshot testing

## 🐳 Production Deployment

### Docker Support
```bash
# Build production image
docker build -t my-app .

# Run container
docker run -p 80:80 my-app
```

### CI/CD Pipeline
- Automated testing on push
- Security scanning
- Build optimization
- Multi-environment deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards
4. Add comprehensive tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/MiteshSharma/ai-first-saas-react-starter/wiki)
- **Issues**: [GitHub Issues](https://github.com/MiteshSharma/ai-first-saas-react-starter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MiteshSharma/ai-first-saas-react-starter/discussions)

---

**Built for AI-assisted development** 🤖 **Production-ready from day one** 🚀