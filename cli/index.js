#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateComponent } = require('../generators/component-generator');
const { generateStore } = require('../generators/store-generator');
const { generateService } = require('../generators/service-generator');
const { generatePage } = require('../generators/page-generator');
const { generateEndpoints } = require('../generators/endpoint-generator');
const { PluginGenerator } = require('../generators/plugin-generator');
const { generateEventBus, generateStoreExtension, generateAPIHelper, generateHook } = require('../generators/core-generators');

/**
 * AI-First SaaS React Starter CLI
 * Scaffold components, stores, services, and complete SaaS applications
 */
class AIFirstCLI {
  constructor() {
    this.commands = {
      'create-app': this.createApp.bind(this),
      'generate': this.generate.bind(this),
      'g': this.generate.bind(this), // Shorthand
      'help': this.showHelp.bind(this),
      '--help': this.showHelp.bind(this),
      '-h': this.showHelp.bind(this)
    };
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || !this.commands[command]) {
      this.showHelp();
      return;
    }

    try {
      await this.commands[command](args.slice(1));
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  async createApp(args) {
    const appName = args[0];
    
    if (!appName) {
      console.error('❌ App name is required');
      console.log('Usage: ai-first create-app <app-name> [options]');
      console.log('Options: --with-auth true/false, --with-tenant true/false');
      return;
    }

    // Parse options
    const config = this.parseOptions(args.slice(1), {
      'with-auth': true,
      'with-tenant': true
    });

    console.log(`🚀 Creating AI-First SaaS React application: ${appName}`);
    if (config['with-auth']) console.log('   ✅ Including authentication scaffolding');
    if (config['with-tenant']) console.log('   ✅ Including multi-tenant patterns');
    
    const appDir = path.join(process.cwd(), appName);
    if (fs.existsSync(appDir)) {
      throw new Error(`Directory ${appName} already exists`);
    }

    // Create React app first using official CRA
    console.log('📦 Creating React app with TypeScript...');
    execSync(`npx create-react-app ${appName} --template typescript`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Navigate to the created app
    process.chdir(appDir);

    // Install additional dependencies from our template
    console.log('📦 Installing AI-First SaaS dependencies...');
    const additionalDeps = [
      'antd@^5.21.0',
      'axios@^1.11.0', 
      'zustand@^4.4.7',
      'react-router-dom@^6.28.0',
      'styled-components@^6.1.13',
      'swr@^2.3.0',
      'web-vitals@^5.1.0',
      'zod@^3.23.8'
    ];

    const devDeps = [
      '@craco/craco@^7.1.0',
      '@types/styled-components@^5.1.34',
      '@typescript-eslint/eslint-plugin@^8.15.0', 
      '@typescript-eslint/parser@^8.15.0',
      'axios-mock-adapter@^2.0.0',
      'eslint-config-airbnb@^19.0.4',
      'eslint-config-airbnb-typescript@^18.0.0',
      'eslint-config-prettier@^9.1.0',
      'eslint-import-resolver-typescript@^3.10.1',
      'eslint-plugin-import@^2.31.0',
      'eslint-plugin-jsx-a11y@^6.10.2',
      'eslint-plugin-react@^7.37.2',
      'eslint-plugin-react-hooks@^5.0.0',
      'eslint-plugin-sonarjs@^2.0.4',
      '@faker-js/faker@^9.2.0',
      'prettier@^3.3.3'
    ];

    execSync(`npm install --legacy-peer-deps ${additionalDeps.join(' ')}`, { stdio: 'inherit' });
    execSync(`npm install --save-dev --legacy-peer-deps ${devDeps.join(' ')}`, { stdio: 'inherit' });

    // Copy our custom files over the CRA defaults
    const templateDir = path.join(__dirname, '..', 'template');
    console.log('⚙️  Applying AI-First SaaS customizations...');
    
    // Copy source files
    this.copyDirectorySelective(path.join(templateDir, 'src'), path.join(appDir, 'src'));
    
    // Copy configuration files
    const configFiles = [
      '.env.development',
      '.env.example', 
      '.env.production',
      '.env.staging',
      '.eslintrc.json',
      '.prettierignore',
      '.prettierrc',
      'craco.config.js',
      'tsconfig.json',
      'Dockerfile',
      'nginx.conf'
    ];
    
    for (const file of configFiles) {
      if (fs.existsSync(path.join(templateDir, file))) {
        fs.copyFileSync(
          path.join(templateDir, file),
          path.join(appDir, file)
        );
      }
    }

    // Copy GitHub workflows
    if (fs.existsSync(path.join(templateDir, '.github'))) {
      this.copyDirectory(path.join(templateDir, '.github'), path.join(appDir, '.github'));
    }

    // Update package.json with our scripts and config
    this.updatePackageJson(appDir);

    console.log(`✅ Successfully created ${appName}`);
    console.log('📋 Next steps:');
    console.log(`   cd ${appName}`);
    console.log('   npm start');
    console.log('');
    
    if (config['with-auth']) {
      console.log('🔐 Authentication features included:');
      console.log('   - Complete auth flow (login, register, password reset)');
      console.log('   - Automatic token refresh and management');
      console.log('   - Protected routes and auth guards');
    }
    
    if (config['with-tenant']) {
      console.log('🏢 Multi-tenant features included:');
      console.log('   - Tenant store with switching capabilities');
      console.log('   - Workspace-scoped data management');
      console.log('   - Tenant isolation testing page at /tenant-isolation-test');
      console.log('   - API calls automatically include tenant headers');
    }
    
    console.log('');
    console.log('📚 Available generators:');
    console.log('   ai-first g component UserProfile');
    console.log('   ai-first g store UserStore --api true');
    console.log('   ai-first g endpoints ProductService --workspace true');
    console.log('   ai-first g page UsersPage --store true --service true');
    console.log('   ai-first g plugin UserManagement --type feature --hasStore true');
    console.log('   ai-first g eventbus UserEvents');
    console.log('   ai-first g hook useUserData');
  }

  async generate(args) {
    const type = args[0];
    const name = args[1];

    if (!type || !name) {
      console.error('❌ Generator type and name are required');
      console.log('Usage: ai-first generate <type> <name>');
      console.log('Types: component, store, service, page, plugin, eventbus, hook, apihelper');
      return;
    }

    switch (type) {
      case 'component':
      case 'c':
        await this.generateComponent(name, args.slice(2));
        break;
      case 'store':
      case 's':
        await this.generateStore(name, args.slice(2));
        break;
      case 'service':
      case 'api':
        await this.generateService(name, args.slice(2));
        break;
      case 'page':
      case 'p':
        await this.generatePage(name, args.slice(2));
        break;
      case 'endpoints':
      case 'e':
        await this.generateEndpoints(name, args.slice(2));
        break;
      case 'plugin':
      case 'pl':
        await this.generatePlugin(name, args.slice(2));
        break;
      case 'eventbus':
      case 'eb':
        await this.generateEventBus(name, args.slice(2));
        break;
      case 'storeext':
      case 'se':
        await this.generateStoreExtension(name, args.slice(2));
        break;
      case 'apihelper':
      case 'ah':
        await this.generateAPIHelper(name, args.slice(2));
        break;
      case 'hook':
      case 'h':
        await this.generateHook(name, args.slice(2));
        break;
      default:
        throw new Error(`Unknown generator type: ${type}`);
    }
  }

  async generateComponent(name, options) {
    const config = this.parseOptions(options, {
      description: `${name} component for the application`,
      category: 'UI Components',
      antd: false,
      styled: false
    });

    await generateComponent({
      name,
      description: config.description,
      category: config.category,
      props: [
        { name: 'title', type: 'string', description: 'The title to display', optional: false },
        { name: 'loading', type: 'boolean', description: 'Loading state', optional: true, defaultValue: 'false' }
      ],
      useAntd: config.antd,
      antdComponents: config.antd ? ['Card', 'Button'] : [],
      hasStyles: config.styled
    });
  }

  async generateStore(name, options) {
    const config = this.parseOptions(options, {
      description: `${name} store for state management`,
      api: true
    });

    await generateStore({
      name,
      description: config.description,
      properties: [
        { name: 'data', type: 'any[]', defaultValue: '[]' },
        { name: 'selectedId', type: 'string | null', defaultValue: 'null' }
      ],
      computed: [
        { name: 'count', type: 'number', implementation: 'return this.data.length;' },
        { name: 'selected', type: 'any | null', implementation: 'return this.data.find(item => item.id === this.selectedId) || null;' }
      ],
      actions: [
        { name: 'setSelectedId', parameters: 'id: string | null', returnType: 'void', implementation: 'this.selectedId = id;' }
      ],
      hasApi: config.api,
      apiService: config.api ? `${name.replace('Store', '').toLowerCase()}Service` : null,
      entityName: name.replace('Store', '')
    });
  }

  async generateService(name, options) {
    const config = this.parseOptions(options, {
      description: `API service for managing ${name.replace('Service', '')} resources`,
      zod: true
    });

    const entityName = name.replace('Service', '');
    
    await generateService({
      name,
      entityName,
      description: config.description,
      properties: [
        { name: 'id', type: 'string', optional: false },
        { name: 'name', type: 'string', optional: false },
        { name: 'description', type: 'string', optional: true },
        { name: 'createdAt', type: 'Date', optional: false },
        { name: 'updatedAt', type: 'Date', optional: false }
      ],
      createProperties: [
        { name: 'name', type: 'string', optional: false },
        { name: 'description', type: 'string', optional: true }
      ],
      updateProperties: [
        { name: 'name', type: 'string', optional: true },
        { name: 'description', type: 'string', optional: true }
      ],
      hasZod: config.zod
    });
  }

  async generatePage(name, options) {
    const config = this.parseOptions(options, {
      description: `${name.replace('Page', '')} management page with CRUD operations`,
      store: true,
      service: true
    });

    await generatePage({
      name,
      description: config.description,
      hasStore: config.store,
      hasService: config.service,
      route: `/${name.replace('Page', '').toLowerCase()}`
    });
  }

  async generateEndpoints(name, options) {
    const config = this.parseOptions(options, {
      description: `API endpoints for ${name.replace('Service', '')} operations`,
      auth: true,
      tenant: false,
      workspace: false
    });

    await generateEndpoints({
      domain: name,
      description: config.description,
      hasAuth: config.auth,
      hasTenant: config.tenant,
      hasWorkspace: config.workspace
    });
  }

  async generatePlugin(name, options) {
    const config = this.parseOptions(options, {
      description: `${name} plugin for the application`,
      type: 'feature',
      hasStore: false,
      hasRoutes: false,
      hasComponents: true
    });

    const generator = new PluginGenerator();
    await generator.generate({
      name,
      description: config.description,
      type: config.type,
      hasStore: config.hasStore,
      hasRoutes: config.hasRoutes,
      hasComponents: config.hasComponents
    });
  }

  async generateEventBus(name, options) {
    const config = this.parseOptions(options, {
      description: `Event bus extension for ${name}`,
      events: [],
      handlers: []
    });

    await generateEventBus({
      name,
      description: config.description,
      events: config.events || [
        { name: 'INITIALIZED', properties: [{ name: 'timestamp', type: 'Date', optional: false }] },
        { name: 'UPDATED', properties: [{ name: 'data', type: 'any', optional: false }] }
      ],
      handlers: config.handlers || [
        { event: 'INITIALIZED', implementation: '// Handle initialization' },
        { event: 'UPDATED', implementation: '// Handle updates' }
      ]
    });
  }

  async generateStoreExtension(name, options) {
    const config = this.parseOptions(options, {
      description: `Store extension for ${name}`,
      eventIntegration: true
    });

    await generateStoreExtension({
      name,
      description: config.description,
      properties: [
        { name: 'items', type: 'any[]', defaultValue: '[]' },
        { name: 'selectedItem', type: 'any | null', defaultValue: 'null' }
      ],
      computed: [
        { name: 'itemCount', type: 'number', implementation: 'return get().items.length;' }
      ],
      actions: [
        { name: 'addItem', parameters: 'item: any', returnType: 'void', implementation: 'set(state => ({ items: [...state.items, item] }));' },
        { name: 'selectItem', parameters: 'item: any', returnType: 'void', implementation: 'set({ selectedItem: item });' }
      ],
      eventIntegration: config.eventIntegration
    });
  }

  async generateAPIHelper(name, options) {
    const config = this.parseOptions(options, {
      description: `API helper for ${name}`,
      withAuth: true,
      withTenant: false
    });

    await generateAPIHelper({
      name,
      description: config.description,
      endpoints: [
        { name: 'getAll', method: 'get', path: '', description: `Get all ${name.toLowerCase()} items` },
        { name: 'getById', method: 'get', path: '/:id', description: `Get ${name.toLowerCase()} by ID`, parameters: 'id: string' },
        { name: 'create', method: 'post', path: '', description: `Create new ${name.toLowerCase()}`, parameters: 'data: any', hasBody: true },
        { name: 'update', method: 'put', path: '/:id', description: `Update ${name.toLowerCase()}`, parameters: 'id: string, data: any', hasBody: true },
        { name: 'delete', method: 'delete', path: '/:id', description: `Delete ${name.toLowerCase()}`, parameters: 'id: string' }
      ],
      withAuth: config.withAuth,
      withTenant: config.withTenant
    });
  }

  async generateHook(name, options) {
    const config = this.parseOptions(options, {
      description: `Custom hook for ${name}`,
      dependencies: [],
      returnType: 'void'
    });

    await generateHook({
      name,
      description: config.description,
      dependencies: config.dependencies || [],
      returnType: config.returnType,
      parameters: [
        { name: 'options', type: 'any', optional: true }
      ],
      implementation: `
  // Add hook implementation here
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch data logic
      setData(null); // Replace with actual data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);`
    });
  }

  parseOptions(args, defaults = {}) {
    const config = { ...defaults };
    
    for (let i = 0; i < args.length; i += 2) {
      let key = args[i]?.replace('--', '');
      const value = args[i + 1];
      
      if (key && value !== undefined) {
        // Convert string booleans
        if (value === 'true') config[key] = true;
        else if (value === 'false') config[key] = false;
        else config[key] = value;
      }
    }
    
    return config;
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyDirectorySelective(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectorySelective(srcPath, destPath);
      } else {
        // Skip only CSS files since we use styled-components
        const skipFiles = ['index.css', 'App.css'];
        if (!skipFiles.includes(item)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  }

  updatePackageJson(appDir) {
    const packageJsonPath = path.join(appDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Update scripts to use craco
    packageJson.scripts = {
      ...packageJson.scripts,
      "start": "craco start",
      "start:mock": "REACT_APP_USE_MOCK_API=true craco start",
      "start:real": "REACT_APP_USE_MOCK_API=false craco start",
      "build": "craco build",
      "build:mock": "REACT_APP_USE_MOCK_API=true craco build",
      "test": "craco test",
      "test:coverage": "craco test --coverage --watchAll=false",
      "test:mock": "REACT_APP_USE_MOCK_API=true craco test",
      "lint": "eslint src --ext .ts,.tsx",
      "lint:fix": "eslint src --ext .ts,.tsx --fix",
      "typecheck": "tsc --noEmit",
      "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
      "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css,md}\""
    };

    // Remove default ESLint config to use our custom .eslintrc.json
    if (packageJson.eslintConfig) {
      delete packageJson.eslintConfig;
    }

    // Add Jest configuration
    packageJson.jest = {
      "collectCoverageFrom": [
        "src/**/*.{ts,tsx}",
        "!src/**/*.d.ts",
        "!src/index.tsx",
        "!src/reportWebVitals.ts"
      ],
      "coverageThreshold": {
        "global": {
          "branches": 70,
          "functions": 70,
          "lines": 70,
          "statements": 70
        }
      }
    };

    // Add engines
    packageJson.engines = {
      "node": ">=22.0.0",
      "npm": ">=10.0.0"
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  showHelp() {
    console.log(`
🚀 AI-First SaaS React Starter CLI

USAGE:
  ai-first <command> [options]

COMMANDS:
  create-app <name>              Create a new AI-First SaaS React application
  generate <type> <name>         Generate code components
  g <type> <name>                Short alias for generate
  help                           Show this help message

GENERATORS:
  component <name>               Generate a React component with tests
  store <name>                   Generate a Zustand store with standardized patterns
  service <name>                 Generate an API service with Zod validation
  page <name>                    Generate a complete page with routing
  endpoints <name>               Generate API endpoints for urlHelper/backendHelper
  plugin <name>                  Generate a complete plugin with optional features
  eventbus <name>                Generate event bus extensions with events and handlers
  storeext <name>                Generate extended store with event integration
  apihelper <name>               Generate API helper with CRUD operations
  hook <name>                    Generate custom React hook

EXAMPLES:
  ai-first create-app my-saas-app --with-auth --with-tenant
  ai-first g component UserProfile --antd true --styled false
  ai-first g store UserStore --api true
  ai-first g service UserService --zod true
  ai-first g page UsersPage --store true --service true
  ai-first g endpoints ProductService --workspace true --tenant false
  ai-first g plugin UserManagement --type feature --hasStore true --hasRoutes true
  ai-first g eventbus UserEvents --events [] --handlers []
  ai-first g storeext ProductStore --eventIntegration true
  ai-first g apihelper UserAPI --withAuth true --withTenant false
  ai-first g hook useUserData --dependencies [] --returnType object

OPTIONS:
  --description "text"           Custom description
  --with-auth true/false        Include authentication scaffolding (create-app)
  --with-tenant true/false      Include tenant-aware patterns (create-app)
  --antd true/false             Use Ant Design components (component)
  --styled true/false           Use styled-components (component)
  --api true/false              Include API integration (store)
  --zod true/false              Use Zod validation (service)
  --store true/false            Include store integration (page)
  --service true/false          Include service integration (page)
  --auth true/false             Include authentication (endpoints)
  --tenant true/false           Include tenant scoping (endpoints)
  --workspace true/false        Include workspace scoping (endpoints)
  --type feature/core           Plugin type (plugin)
  --hasStore true/false         Include store in plugin (plugin)
  --hasRoutes true/false        Include routes in plugin (plugin)
  --hasComponents true/false    Include components in plugin (plugin)
  --eventIntegration true/false Event bus integration (storeext)
  --withAuth true/false         Include auth headers (apihelper)
  --withTenant true/false       Include tenant headers (apihelper)
  --dependencies []             Hook dependencies (hook)
  --returnType type             Hook return type (hook)

For more information, visit: https://github.com/MiteshSharma/ai-first-saas-react-starter
    `);
  }
}

// Run CLI if executed directly
if (require.main === module) {
  const cli = new AIFirstCLI();
  cli.run();
}

module.exports = { AIFirstCLI };