# AI-First SaaS React Starter

A comprehensive, production-ready React TypeScript starter for building modern SaaS applications with built-in authentication, multi-tenancy, and a powerful plugin architecture.

## 🚀 Features

### Core Framework
- **React 18** with TypeScript and strict mode
- **Zustand** for state management with persistence
- **React Router v6** for routing with protected routes
- **Ant Design** for UI components with theming
- **Styled Components** for custom styling
- **SWR** for data fetching and caching
- **Zod** for schema validation
- **Comprehensive Testing** with Jest and React Testing Library

### SaaS Essentials
- **🔐 Authentication System**
  - Complete auth flow (login, register, password reset)
  - JWT token management with automatic refresh
  - Protected routes and auth guards
  - Role-based permissions

- **🏢 Multi-Tenant Architecture**
  - Tenant switching capabilities
  - Workspace-scoped data management
  - Tenant isolation patterns
  - API calls with automatic tenant headers

- **🧩 Plugin Architecture**
  - Event-driven plugin system
  - Hot-pluggable features
  - Comprehensive plugin generators
  - Type-safe plugin development

### Developer Experience
- **🛠️ Powerful CLI** with code generators
- **📱 Progressive Web App** ready
- **🔧 Hot Reloading** for development
- **📊 Built-in Analytics** integration
- **🚀 Production Optimized** builds
- **📚 Comprehensive Documentation**

## 📦 Quick Start

### Installation

```bash
# Install the CLI globally
npm install -g @ai-first/saas-react-starter

# Create a new SaaS application
ai-first create-app my-saas-app

# Navigate to your project
cd my-saas-app

# Start development server
npm start
```

### Alternative: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/MiteshSharma/ai-first-saas-react-starter.git
cd ai-first-saas-react-starter

# Install dependencies
npm install --legacy-peer-deps

# Copy environment variables
cp .env.example .env.development

# Start development server
npm run start:mock
```

## 🏗️ Project Structure

```
src/
├── core/                    # Core framework code
│   ├── auth/               # Authentication system
│   ├── stores/             # Core state management
│   │   ├── base/           # Base store patterns
│   │   ├── auth/           # Auth store
│   │   └── tenant/         # Tenant management
│   ├── events/             # Event bus system
│   └── plugins/            # Plugin management
├── plugins/                # Application plugins
│   ├── UserManagement/     # Example user plugin
│   └── TenantManagement/   # Example tenant plugin
├── components/             # Shared React components
├── pages/                  # Application pages
├── helpers/                # API helpers and utilities
├── hooks/                  # Custom React hooks
└── routes/                 # Routing configuration
```

## 🎯 Available Scripts

### Development
```bash
npm start              # Start with real API
npm run start:mock     # Start with mock API
npm run start:real     # Start with real API (explicit)
```

### Building
```bash
npm run build          # Production build
npm run build:mock     # Build with mock API
```

### Testing
```bash
npm test               # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
npm run test:mock      # Run tests with mock API
```

### Code Quality
```bash
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run typecheck      # Run TypeScript compiler
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting
```

## 🛠️ CLI Generators

The AI-First CLI provides powerful code generators to scaffold your application quickly:

### Core Generators

```bash
# Generate React components
ai-first g component UserProfile --antd true --styled false

# Generate Zustand stores
ai-first g store UserStore --api true

# Generate API services
ai-first g service UserService --zod true

# Generate complete pages
ai-first g page UsersPage --store true --service true

# Generate API endpoints
ai-first g endpoints ProductService --workspace true --tenant false
```

### Plugin System

```bash
# Create a complete plugin
ai-first g plugin UserManagement --type feature --hasStore true --hasRoutes true

# Generate event bus extensions
ai-first g eventbus UserEvents

# Generate extended stores
ai-first g storeext ProductStore --eventIntegration true

# Generate API helpers
ai-first g apihelper UserAPI --withAuth true --withTenant false

# Generate custom hooks
ai-first g hook useUserData --returnType object
```

### Generator Options

| Option | Description | Available For |
|--------|-------------|---------------|
| `--description "text"` | Custom description | All generators |
| `--type feature\|core` | Plugin type | plugin |
| `--hasStore true\|false` | Include store | plugin |
| `--hasRoutes true\|false` | Include routes | plugin |
| `--hasComponents true\|false` | Include components | plugin |
| `--antd true\|false` | Use Ant Design | component |
| `--styled true\|false` | Use styled-components | component |
| `--api true\|false` | Include API integration | store |
| `--zod true\|false` | Use Zod validation | service |
| `--withAuth true\|false` | Include auth headers | apihelper |
| `--withTenant true\|false` | Include tenant headers | apihelper |



## 🚀 Deployment

### Environment Variables

```bash
# Authentication
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_AUTH_ENDPOINT=/auth
REACT_APP_JWT_SECRET=your-jwt-secret

# Features
REACT_APP_USE_MOCK_API=false
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PWA=true

# Multi-tenancy
REACT_APP_ENABLE_MULTI_TENANT=true
REACT_APP_DEFAULT_TENANT=your-default-tenant
```

### Docker Deployment

```dockerfile
# Use the included Dockerfile
docker build -t my-saas-app .
docker run -p 3000:80 my-saas-app
```

### Production Build

```bash
# Build for production
npm run build

# Build with mock API for testing
npm run build:mock

# Test production build locally
npx serve -s build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards
4. Add comprehensive tests
5. Submit a pull request

## 📚 Documentation

- **[Plugin Development Guide](./docs/PLUGIN_DEVELOPMENT_GUIDE.md)** - Comprehensive guide for building plugins
- **[API Documentation](./docs/API.md)** - Complete API reference
- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System architecture overview
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment strategies

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/ai-first-saas-react-starter.git

# Install dependencies
npm install --legacy-peer-deps

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes and test
npm test
npm run lint
npm run typecheck

# Commit your changes
git commit -m 'Add amazing feature'

# Push to your fork and create a pull request
git push origin feature/amazing-feature
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Ant Design** for the beautiful UI components
- **Zustand** for simple state management
- **Community** for feedback and contributions

## 📞 Support

- **Documentation**: [Full Documentation](./docs/)
- **Issues**: [GitHub Issues](https://github.com/MiteshSharma/ai-first-saas-react-starter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MiteshSharma/ai-first-saas-react-starter/discussions)
- **Email**: support@ai-first-saas.com

---

**Built with ❤️ for the SaaS development community**