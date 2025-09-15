# Code Generators Documentation

The AI-First SaaS React Starter includes a powerful **code generation system** that accelerates development by automatically creating consistent, well-structured code following framework best practices.

## 🎯 Overview

The code generators provide **scaffolding tools** that create complete, production-ready code structures for plugins, components, stores, services, and more. Each generator follows established patterns and includes TypeScript types, tests, and documentation.

### Key Features

- **Template-Based Generation** - Flexible template system with variable substitution
- **Multiple Generators** - Plugins, components, stores, services, pages, hooks
- **Convention Enforcement** - Automatic adherence to naming and structure conventions
- **TypeScript Integration** - Full type safety and IntelliSense support
- **Test Generation** - Automatic test file creation with basic test cases
- **Documentation Generation** - README files and inline documentation
- **Custom Templates** - Extensible template system for team-specific patterns

### Architecture

```
Code Generation System
├── 🏗️ Generator Engine              # Core generation logic
│   ├── Template Processor           # Template parsing and rendering
│   ├── File System Manager          # File creation and management
│   ├── Variable Resolver            # Dynamic variable substitution
│   └── Validation Engine            # Input validation and conflicts
├── 📋 Generator Types               # Available generators
│   ├── Plugin Generator             # Complete plugin scaffolding
│   ├── Component Generator          # React component creation
│   ├── Store Generator              # Zustand store creation
│   ├── Service Generator            # API service layer
│   ├── Page Generator               # Page-level components
│   ├── Hook Generator               # Custom React hooks
│   └── Utility Generator            # Helper functions
├── 📝 Template System              # Template management
│   ├── Built-in Templates          # Framework-provided templates
│   ├── Custom Templates            # User-defined templates
│   ├── Template Variables          # Dynamic substitution system
│   └── Template Inheritance        # Template extension system
└── 🔧 Configuration                # Generator configuration
    ├── Global Settings             # Framework-wide settings
    ├── Project Settings            # Project-specific settings
    └── Template Settings           # Template-specific options
```

## 🏗️ Generator Engine

### Core Generator Class

```typescript
// src/cli/generators/core/Generator.ts
export abstract class Generator {
  protected templateEngine: TemplateEngine;
  protected fileManager: FileManager;
  protected validator: ValidationEngine;

  constructor(
    protected name: string,
    protected config: GeneratorConfig
  ) {
    this.templateEngine = new TemplateEngine(config.templatePath);
    this.fileManager = new FileManager(config.outputPath);
    this.validator = new ValidationEngine(config.validationRules);
  }

  /**
   * Main generation method
   */
  async generate(options: GeneratorOptions): Promise<GenerationResult> {
    console.log(`🏗️ Generating ${this.name}...`);

    try {
      // Validate input
      await this.validateInput(options);

      // Prepare variables
      const variables = await this.prepareVariables(options);

      // Generate files
      const files = await this.generateFiles(variables);

      // Post-generation tasks
      await this.postGeneration(files, options);

      console.log(`✅ ${this.name} generated successfully`);
      return {
        success: true,
        files,
        message: `Generated ${files.length} files`
      };
    } catch (error) {
      console.error(`❌ Failed to generate ${this.name}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate generator input
   */
  protected async validateInput(options: GeneratorOptions): Promise<void> {
    // Check required options
    await this.validator.validateRequired(options);

    // Check naming conventions
    await this.validator.validateNaming(options);

    // Check for conflicts
    await this.validator.validateConflicts(options);

    // Custom validation
    await this.customValidation(options);
  }

  /**
   * Prepare template variables
   */
  protected async prepareVariables(options: GeneratorOptions): Promise<TemplateVariables> {
    const baseVariables = {
      // Basic information
      name: options.name,
      nameCamelCase: this.toCamelCase(options.name),
      namePascalCase: this.toPascalCase(options.name),
      nameKebabCase: this.toKebabCase(options.name),
      nameSnakeCase: this.toSnakeCase(options.name),

      // Paths
      outputPath: this.config.outputPath,
      relativePath: this.getRelativePath(options),

      // Metadata
      author: this.getAuthor(),
      date: new Date().toISOString(),
      version: this.getVersion(),

      // Framework info
      frameworkVersion: this.getFrameworkVersion(),
      dependencies: this.getDependencies(),
    };

    // Add custom variables
    const customVariables = await this.prepareCustomVariables(options);

    return { ...baseVariables, ...customVariables };
  }

  /**
   * Generate files from templates
   */
  protected async generateFiles(variables: TemplateVariables): Promise<GeneratedFile[]> {
    const templates = await this.getTemplates();
    const files: GeneratedFile[] = [];

    for (const template of templates) {
      const content = await this.templateEngine.render(template, variables);
      const outputPath = this.resolveOutputPath(template, variables);

      // Check if file already exists
      if (await this.fileManager.exists(outputPath) && !this.config.overwrite) {
        if (this.config.interactive) {
          const shouldOverwrite = await this.promptOverwrite(outputPath);
          if (!shouldOverwrite) continue;
        } else {
          console.warn(`⚠️ Skipping existing file: ${outputPath}`);
          continue;
        }
      }

      // Write file
      await this.fileManager.writeFile(outputPath, content);

      files.push({
        path: outputPath,
        content,
        template: template.name,
        size: content.length
      });

      console.log(`📄 Created: ${outputPath}`);
    }

    return files;
  }

  /**
   * Post-generation tasks
   */
  protected async postGeneration(
    files: GeneratedFile[],
    options: GeneratorOptions
  ): Promise<void> {
    // Update package.json if needed
    await this.updatePackageJson(files, options);

    // Update imports/exports
    await this.updateImports(files, options);

    // Format generated code
    await this.formatCode(files);

    // Run custom post-generation tasks
    await this.customPostGeneration(files, options);
  }

  // Abstract methods to be implemented by specific generators
  protected abstract getTemplates(): Promise<Template[]>;
  protected abstract prepareCustomVariables(options: GeneratorOptions): Promise<Partial<TemplateVariables>>;
  protected abstract customValidation(options: GeneratorOptions): Promise<void>;
  protected abstract customPostGeneration(files: GeneratedFile[], options: GeneratorOptions): Promise<void>;

  // Utility methods
  private toCamelCase(str: string): string {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
  }

  private toPascalCase(str: string): string {
    return this.toCamelCase(str).replace(/^./, char => char.toUpperCase());
  }

  private toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }
}
```

### Template Engine

```typescript
// src/cli/generators/core/TemplateEngine.ts
export class TemplateEngine {
  private handlebars: typeof Handlebars;

  constructor(private templatePath: string) {
    this.handlebars = require('handlebars');
    this.registerHelpers();
    this.registerPartials();
  }

  /**
   * Render template with variables
   */
  async render(template: Template, variables: TemplateVariables): Promise<string> {
    try {
      const templateContent = await this.loadTemplate(template);
      const compiledTemplate = this.handlebars.compile(templateContent);
      return compiledTemplate(variables);
    } catch (error) {
      throw new Error(`Failed to render template ${template.name}: ${error.message}`);
    }
  }

  /**
   * Load template content
   */
  private async loadTemplate(template: Template): Promise<string> {
    const templateFile = path.join(this.templatePath, template.file);
    return await fs.readFile(templateFile, 'utf-8');
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // String case helpers
    this.handlebars.registerHelper('camelCase', (str: string) => {
      return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
    });

    this.handlebars.registerHelper('pascalCase', (str: string) => {
      return this.handlebars.helpers.camelCase(str).replace(/^./, char => char.toUpperCase());
    });

    this.handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });

    this.handlebars.registerHelper('snakeCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    });

    this.handlebars.registerHelper('upperCase', (str: string) => {
      return str.toUpperCase();
    });

    this.handlebars.registerHelper('lowerCase', (str: string) => {
      return str.toLowerCase();
    });

    // Conditional helpers
    this.handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    this.handlebars.registerHelper('ifNotEquals', function(arg1, arg2, options) {
      return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
    });

    // Array helpers
    this.handlebars.registerHelper('each', function(context, options) {
      let ret = '';
      for (let i = 0; i < context.length; i++) {
        ret += options.fn({ ...context[i], index: i });
      }
      return ret;
    });

    // Date helpers
    this.handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      // Simple date formatting - could use moment.js for more complex formats
      return date.toISOString().split('T')[0];
    });

    // File path helpers
    this.handlebars.registerHelper('relativePath', (from: string, to: string) => {
      return path.relative(from, to);
    });

    // Import path helpers
    this.handlebars.registerHelper('importPath', (filePath: string, currentPath: string) => {
      const relative = path.relative(path.dirname(currentPath), filePath);
      return relative.startsWith('.') ? relative : `./${relative}`;
    });
  }

  /**
   * Register partial templates
   */
  private registerPartials(): void {
    const partialsPath = path.join(this.templatePath, 'partials');

    if (fs.existsSync(partialsPath)) {
      const partialFiles = fs.readdirSync(partialsPath);

      for (const file of partialFiles) {
        if (file.endsWith('.hbs')) {
          const partialName = path.basename(file, '.hbs');
          const partialContent = fs.readFileSync(path.join(partialsPath, file), 'utf-8');
          this.handlebars.registerPartial(partialName, partialContent);
        }
      }
    }
  }
}
```

## 🔌 Plugin Generator

### Plugin Generator Implementation

```typescript
// src/cli/generators/PluginGenerator.ts
export class PluginGenerator extends Generator {
  constructor() {
    super('Plugin', {
      templatePath: path.join(__dirname, '../templates/plugin'),
      outputPath: 'src/plugins',
      validationRules: {
        required: ['name'],
        naming: /^[A-Z][a-zA-Z0-9]*$/,
        conflicts: ['existing-plugins']
      }
    });
  }

  async generate(options: PluginGeneratorOptions): Promise<GenerationResult> {
    console.log(`🔌 Generating plugin: ${options.name}`);
    return super.generate(options);
  }

  protected async getTemplates(): Promise<Template[]> {
    const templates: Template[] = [
      {
        name: 'plugin-main',
        file: 'Plugin.ts.hbs',
        outputPath: '{{namePascalCase}}Plugin.ts'
      }
    ];

    // Add store templates if requested
    if (this.currentOptions.withStore) {
      templates.push({
        name: 'plugin-store',
        file: 'stores/store.ts.hbs',
        outputPath: 'stores/{{nameCamelCase}}Store.ts'
      });
    }

    // Add component templates if requested
    if (this.currentOptions.withComponents) {
      templates.push(
        {
          name: 'main-component',
          file: 'components/MainComponent.tsx.hbs',
          outputPath: 'components/{{namePascalCase}}.tsx'
        },
        {
          name: 'list-component',
          file: 'components/ListComponent.tsx.hbs',
          outputPath: 'components/{{namePascalCase}}List.tsx'
        },
        {
          name: 'form-component',
          file: 'components/FormComponent.tsx.hbs',
          outputPath: 'components/{{namePascalCase}}Form.tsx'
        }
      );
    }

    // Add page templates if requested
    if (this.currentOptions.withPages) {
      templates.push(
        {
          name: 'list-page',
          file: 'pages/ListPage.tsx.hbs',
          outputPath: 'pages/{{namePascalCase}}ListPage.tsx'
        },
        {
          name: 'detail-page',
          file: 'pages/DetailPage.tsx.hbs',
          outputPath: 'pages/{{namePascalCase}}DetailPage.tsx'
        }
      );
    }

    // Add service templates if requested
    if (this.currentOptions.withService) {
      templates.push({
        name: 'service',
        file: 'services/service.ts.hbs',
        outputPath: 'services/{{nameCamelCase}}Service.ts'
      });
    }

    // Add route templates if requested
    if (this.currentOptions.withRoutes) {
      templates.push({
        name: 'routes',
        file: 'routes.ts.hbs',
        outputPath: 'routes.ts'
      });
    }

    // Add test templates if requested
    if (this.currentOptions.withTests) {
      templates.push(
        {
          name: 'plugin-test',
          file: '__tests__/Plugin.test.ts.hbs',
          outputPath: '__tests__/{{namePascalCase}}Plugin.test.ts'
        },
        {
          name: 'store-test',
          file: '__tests__/store.test.ts.hbs',
          outputPath: '__tests__/{{nameCamelCase}}Store.test.ts'
        }
      );
    }

    // Add documentation templates
    templates.push({
      name: 'readme',
      file: 'README.md.hbs',
      outputPath: 'README.md'
    });

    // Add type definitions
    templates.push({
      name: 'types',
      file: 'types.ts.hbs',
      outputPath: 'types/{{nameCamelCase}}.types.ts'
    });

    return templates;
  }

  protected async prepareCustomVariables(options: PluginGeneratorOptions): Promise<Partial<TemplateVariables>> {
    return {
      // Plugin-specific variables
      description: options.description || `${options.name} plugin for AI-First SaaS React Starter`,
      version: options.version || '1.0.0',
      author: options.author || this.getAuthor(),

      // Feature flags
      withStore: options.withStore || false,
      withComponents: options.withComponents || false,
      withPages: options.withPages || false,
      withService: options.withService || false,
      withRoutes: options.withRoutes || false,
      withTests: options.withTests || true,

      // Dependencies
      dependencies: this.getDependencies(options),

      // Navigation
      navigationIcon: options.navigationIcon || 'AppstoreOutlined',
      navigationOrder: options.navigationOrder || 10,

      // Permissions
      permissions: this.generatePermissions(options.name),

      // API endpoints
      apiEndpoints: this.generateApiEndpoints(options.name),

      // Event names
      events: this.generateEventNames(options.name)
    };
  }

  protected async customValidation(options: PluginGeneratorOptions): Promise<void> {
    // Check if plugin name conflicts with existing plugins
    const existingPlugins = await this.getExistingPlugins();
    if (existingPlugins.includes(options.name)) {
      throw new Error(`Plugin ${options.name} already exists`);
    }

    // Validate navigation icon if provided
    if (options.navigationIcon && !this.isValidAntIcon(options.navigationIcon)) {
      throw new Error(`Invalid Ant Design icon: ${options.navigationIcon}`);
    }

    // Validate dependencies if provided
    if (options.dependencies) {
      for (const dep of options.dependencies) {
        if (!existingPlugins.includes(dep)) {
          throw new Error(`Dependency plugin ${dep} does not exist`);
        }
      }
    }
  }

  protected async customPostGeneration(
    files: GeneratedFile[],
    options: PluginGeneratorOptions
  ): Promise<void> {
    // Update plugin registry
    await this.updatePluginRegistry(options);

    // Install additional dependencies if needed
    await this.installDependencies(options);

    // Generate API mock data if mock API is enabled
    if (options.withService && process.env.REACT_APP_USE_MOCK_API) {
      await this.generateMockData(options);
    }

    // Update navigation if routes are generated
    if (options.withRoutes) {
      await this.updateNavigationConfig(options);
    }
  }

  private generatePermissions(pluginName: string): string[] {
    const baseName = pluginName.toLowerCase();
    return [
      `${baseName}.view`,
      `${baseName}.create`,
      `${baseName}.edit`,
      `${baseName}.delete`
    ];
  }

  private generateApiEndpoints(pluginName: string): any[] {
    const baseName = pluginName.toLowerCase();
    return [
      { method: 'GET', path: `/${baseName}`, description: `Get ${baseName} list` },
      { method: 'POST', path: `/${baseName}`, description: `Create ${baseName}` },
      { method: 'GET', path: `/${baseName}/:id`, description: `Get ${baseName} by ID` },
      { method: 'PUT', path: `/${baseName}/:id`, description: `Update ${baseName}` },
      { method: 'DELETE', path: `/${baseName}/:id`, description: `Delete ${baseName}` }
    ];
  }

  private generateEventNames(pluginName: string): any {
    const upperName = pluginName.toUpperCase();
    return {
      created: `${upperName}_CREATED`,
      updated: `${upperName}_UPDATED`,
      deleted: `${upperName}_DELETED`,
      selected: `${upperName}_SELECTED`
    };
  }

  private async updatePluginRegistry(options: PluginGeneratorOptions): Promise<void> {
    const registryPath = path.join(process.cwd(), 'src/plugin-registry.ts');

    if (await fs.pathExists(registryPath)) {
      let content = await fs.readFile(registryPath, 'utf-8');

      // Add import
      const importLine = `import { ${options.name}Plugin } from './plugins/${options.name}/${options.name}Plugin';`;
      content = content.replace(
        /(import.*Plugin.*from.*;\n)/g,
        `$1${importLine}\n`
      );

      // Add to plugins array
      content = content.replace(
        /(export const plugins.*=.*\[[\s\S]*?)(];)/,
        `$1  new ${options.name}Plugin(),\n$2`
      );

      await fs.writeFile(registryPath, content);
      console.log('📝 Updated plugin registry');
    }
  }
}

interface PluginGeneratorOptions extends GeneratorOptions {
  withStore?: boolean;
  withComponents?: boolean;
  withPages?: boolean;
  withService?: boolean;
  withRoutes?: boolean;
  withTests?: boolean;
  description?: string;
  version?: string;
  author?: string;
  navigationIcon?: string;
  navigationOrder?: number;
  dependencies?: string[];
}
```

## 🎨 Component Generator

### Component Generator Implementation

```typescript
// src/cli/generators/ComponentGenerator.ts
export class ComponentGenerator extends Generator {
  constructor() {
    super('Component', {
      templatePath: path.join(__dirname, '../templates/component'),
      outputPath: 'src/components',
      validationRules: {
        required: ['name'],
        naming: /^[A-Z][a-zA-Z0-9]*$/,
        conflicts: ['existing-components']
      }
    });
  }

  protected async getTemplates(): Promise<Template[]> {
    const templates: Template[] = [
      {
        name: 'component',
        file: 'Component.tsx.hbs',
        outputPath: '{{namePascalCase}}.tsx'
      }
    ];

    // Add styles if requested
    if (this.currentOptions.withStyles) {
      templates.push({
        name: 'styles',
        file: 'Component.module.css.hbs',
        outputPath: '{{namePascalCase}}.module.css'
      });
    }

    // Add test file
    if (this.currentOptions.withTests) {
      templates.push({
        name: 'test',
        file: 'Component.test.tsx.hbs',
        outputPath: '{{namePascalCase}}.test.tsx'
      });
    }

    // Add story file for Storybook
    if (this.currentOptions.withStory) {
      templates.push({
        name: 'story',
        file: 'Component.stories.tsx.hbs',
        outputPath: '{{namePascalCase}}.stories.tsx'
      });
    }

    // Add index file
    templates.push({
      name: 'index',
      file: 'index.ts.hbs',
      outputPath: 'index.ts'
    });

    return templates;
  }

  protected async prepareCustomVariables(options: ComponentGeneratorOptions): Promise<Partial<TemplateVariables>> {
    return {
      // Component type
      componentType: options.type || 'functional',
      isClass: options.type === 'class',
      isFunctional: options.type === 'functional' || !options.type,

      // Props
      hasProps: options.props && options.props.length > 0,
      props: options.props || [],

      // Features
      withState: options.withState || false,
      withEffects: options.withEffects || false,
      withStyles: options.withStyles || false,
      withTests: options.withTests !== false,
      withStory: options.withStory || false,

      // UI Framework
      useAntd: options.useAntd !== false,

      // Styling approach
      stylingApproach: options.stylingApproach || 'css-modules',

      // Export type
      exportType: options.exportType || 'named'
    };
  }

  protected async customValidation(options: ComponentGeneratorOptions): Promise<void> {
    // Validate component type
    if (options.type && !['functional', 'class'].includes(options.type)) {
      throw new Error('Component type must be "functional" or "class"');
    }

    // Validate styling approach
    if (options.stylingApproach && !['css-modules', 'styled-components', 'emotion'].includes(options.stylingApproach)) {
      throw new Error('Styling approach must be "css-modules", "styled-components", or "emotion"');
    }

    // Validate props format
    if (options.props) {
      for (const prop of options.props) {
        if (!prop.name || !prop.type) {
          throw new Error('Each prop must have a name and type');
        }
      }
    }
  }

  protected async customPostGeneration(
    files: GeneratedFile[],
    options: ComponentGeneratorOptions
  ): Promise<void> {
    // Update component index if it exists
    await this.updateComponentIndex(options);

    // Install additional dependencies for styling approach
    await this.installStylingDependencies(options);
  }

  private async updateComponentIndex(options: ComponentGeneratorOptions): Promise<void> {
    const indexPath = path.join(process.cwd(), 'src/components/index.ts');

    if (await fs.pathExists(indexPath)) {
      let content = await fs.readFile(indexPath, 'utf-8');

      const exportLine = `export { ${options.name} } from './${options.name}';`;
      content += `\n${exportLine}`;

      await fs.writeFile(indexPath, content);
      console.log('📝 Updated component index');
    }
  }
}

interface ComponentGeneratorOptions extends GeneratorOptions {
  type?: 'functional' | 'class';
  props?: Array<{ name: string; type: string; required?: boolean; default?: string }>;
  withState?: boolean;
  withEffects?: boolean;
  withStyles?: boolean;
  withTests?: boolean;
  withStory?: boolean;
  useAntd?: boolean;
  stylingApproach?: 'css-modules' | 'styled-components' | 'emotion';
  exportType?: 'default' | 'named';
}
```

## 📝 Template Examples

### Plugin Template

```handlebars
{{!-- src/cli/templates/plugin/Plugin.ts.hbs --}}
import { Plugin, PluginContext } from '../../core/plugins/types';
import { eventBus } from '../../core/events/EventBus';
{{#if withPages}}
import { {{namePascalCase}}ListPage } from './pages/{{namePascalCase}}ListPage';
import { {{namePascalCase}}DetailPage } from './pages/{{namePascalCase}}DetailPage';
{{/if}}

export class {{namePascalCase}}Plugin implements Plugin {
  name = '{{namePascalCase}}';
  version = '{{version}}';
  description = '{{description}}';
  {{#if dependencies}}
  dependencies = [{{#each dependencies}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}];
  {{/if}}

  async install(context: PluginContext): Promise<void> {
    console.log('🔧 Installing {{namePascalCase}} plugin');
    // One-time setup tasks
  }

  async activate(context: PluginContext): Promise<void> {
    console.log('✅ Activating {{namePascalCase}} plugin');

    {{#if withRoutes}}
    // Register routes
    {{#if withPages}}
    context.registerRoute('/{{nameKebabCase}}', {{namePascalCase}}ListPage);
    context.registerRoute('/{{nameKebabCase}}/:id', {{namePascalCase}}DetailPage);
    {{/if}}
    {{/if}}

    {{#if withRoutes}}
    // Register navigation
    context.registerNavItem({
      key: '{{nameKebabCase}}',
      path: '/{{nameKebabCase}}',
      label: '{{namePascalCase}}',
      icon: '{{navigationIcon}}',
      order: {{navigationOrder}},
      permissions: ['{{permissions.0}}']
    });
    {{/if}}

    // Subscribe to events
    context.eventBus.subscribe('USER_LOGIN', this.handleUserLogin);
    context.eventBus.subscribe('USER_LOGOUT', this.handleUserLogout);

    {{#if withStore}}
    // Initialize store
    const {{nameCamelCase}}Store = use{{namePascalCase}}Store.getState();
    await {{nameCamelCase}}Store.initialize();
    {{/if}}
  }

  async deactivate(context: PluginContext): Promise<void> {
    console.log('❌ Deactivating {{namePascalCase}} plugin');

    // Unsubscribe from events
    context.eventBus.unsubscribe('USER_LOGIN', this.handleUserLogin);
    context.eventBus.unsubscribe('USER_LOGOUT', this.handleUserLogout);

    {{#if withStore}}
    // Cleanup store
    const {{nameCamelCase}}Store = use{{namePascalCase}}Store.getState();
    {{nameCamelCase}}Store.cleanup();
    {{/if}}
  }

  async uninstall(context: PluginContext): Promise<void> {
    console.log('🗑️ Uninstalling {{namePascalCase}} plugin');
    // Complete removal tasks
  }

  private handleUserLogin = (event: any) => {
    {{#if withStore}}
    const {{nameCamelCase}}Store = use{{namePascalCase}}Store.getState();
    {{nameCamelCase}}Store.loadUserData(event.user.id);
    {{/if}}
  };

  private handleUserLogout = () => {
    {{#if withStore}}
    const {{nameCamelCase}}Store = use{{namePascalCase}}Store.getState();
    {{nameCamelCase}}Store.clearData();
    {{/if}}
  };
}
```

### Component Template

```handlebars
{{!-- src/cli/templates/component/Component.tsx.hbs --}}
import React{{#if withState}}, { useState }{{/if}}{{#if withEffects}}, { useEffect }{{/if}} from 'react';
{{#if useAntd}}
import { Button, Card } from 'antd';
{{/if}}
{{#if withStyles}}
import styles from './{{namePascalCase}}.module.css';
{{/if}}

{{#if hasProps}}
interface {{namePascalCase}}Props {
  {{#each props}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
  {{/each}}
}
{{/if}}

{{#if isFunctional}}
export const {{namePascalCase}}: React.FC{{#if hasProps}}<{{namePascalCase}}Props>{{/if}} = ({{#if hasProps}}{
  {{#each props}}
  {{name}}{{#if default}} = {{default}}{{/if}},
  {{/each}}
}{{/if}}) => {
  {{#if withState}}
  const [state, setState] = useState<any>(null);
  {{/if}}

  {{#if withEffects}}
  useEffect(() => {
    // Effect logic here
  }, []);
  {{/if}}

  return (
    <div{{#if withStyles}} className={styles.{{nameCamelCase}}}{{/if}}>
      {{#if useAntd}}
      <Card title="{{namePascalCase}}">
        <p>{{namePascalCase}} component generated successfully!</p>
        <Button type="primary">Action</Button>
      </Card>
      {{else}}
      <h2>{{namePascalCase}}</h2>
      <p>{{namePascalCase}} component generated successfully!</p>
      {{/if}}
    </div>
  );
};
{{/if}}

{{#if isClass}}
export class {{namePascalCase}} extends React.Component{{#if hasProps}}<{{namePascalCase}}Props>{{/if}} {
  {{#if withState}}
  state = {
    // State properties here
  };
  {{/if}}

  {{#if withEffects}}
  componentDidMount() {
    // Component did mount logic
  }
  {{/if}}

  render() {
    return (
      <div{{#if withStyles}} className={styles.{{nameCamelCase}}}{{/if}}>
        {{#if useAntd}}
        <Card title="{{namePascalCase}}">
          <p>{{namePascalCase}} component generated successfully!</p>
          <Button type="primary">Action</Button>
        </Card>
        {{else}}
        <h2>{{namePascalCase}}</h2>
        <p>{{namePascalCase}} component generated successfully!</p>
        {{/if}}
      </div>
    );
  }
}
{{/if}}

{{#ifEquals exportType "default"}}
export default {{namePascalCase}};
{{/ifEquals}}
```

### Store Template

```handlebars
{{!-- src/cli/templates/store/store.ts.hbs --}}
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
{{#if withApi}}
import { {{nameCamelCase}}Service } from '../services/{{nameCamelCase}}Service';
{{/if}}
import { eventBus } from '../../../core/events/EventBus';
import { {{namePascalCase}} } from '../types/{{nameCamelCase}}.types';

interface {{namePascalCase}}State {
  // Data state
  {{namePlural}}: {{namePascalCase}}[];
  selected{{namePascalCase}}: {{namePascalCase}} | null;

  // UI state
  loading: boolean;
  error: string | null;

  {{#if withPagination}}
  // Pagination
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
  {{/if}}

  {{#if withFilters}}
  // Filters
  filters: {{namePascalCase}}Filters;
  {{/if}}

  // Actions
  {{#if withApi}}
  load{{namePascalCase}}s: () => Promise<void>;
  create{{namePascalCase}}: (data: Create{{namePascalCase}}Request) => Promise<{{namePascalCase}}>;
  update{{namePascalCase}}: (id: string, data: Update{{namePascalCase}}Request) => Promise<{{namePascalCase}}>;
  delete{{namePascalCase}}: (id: string) => Promise<void>;
  {{/if}}
  select{{namePascalCase}}: ({{nameCamelCase}}: {{namePascalCase}} | null) => void;
  {{#if withFilters}}
  setFilters: (filters: Partial<{{namePascalCase}}Filters>) => void;
  {{/if}}
  clearError: () => void;
  reset: () => void;
}

export const use{{namePascalCase}}Store = create<{{namePascalCase}}State>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      {{namePlural}}: [],
      selected{{namePascalCase}}: null,
      loading: false,
      error: null,
      {{#if withPagination}}
      page: 1,
      pageSize: 20,
      totalCount: 0,
      hasMore: false,
      {{/if}}
      {{#if withFilters}}
      filters: {
        search: '',
        // Add more filter properties as needed
      },
      {{/if}}

      {{#if withApi}}
      // Load {{namePlural}}
      load{{namePascalCase}}s: async () => {
        set({ loading: true, error: null });

        try {
          {{#if withPagination}}
          const state = get();
          const response = await {{nameCamelCase}}Service.get{{namePascalCase}}s({
            page: state.page,
            pageSize: state.pageSize,
            {{#if withFilters}}
            ...state.filters
            {{/if}}
          });

          set({
            {{namePlural}}: response.{{namePlural}},
            totalCount: response.total,
            hasMore: response.{{namePlural}}.length === state.pageSize,
            loading: false
          });
          {{else}}
          const {{namePlural}} = await {{nameCamelCase}}Service.get{{namePascalCase}}s();
          set({ {{namePlural}}, loading: false });
          {{/if}}

          // Emit event
          eventBus.emit('{{events.loaded}}', { count: {{namePlural}}.length });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // Create {{namePascalCase}}
      create{{namePascalCase}}: async (data: Create{{namePascalCase}}Request) => {
        set({ loading: true, error: null });

        try {
          const new{{namePascalCase}} = await {{nameCamelCase}}Service.create{{namePascalCase}}(data);

          set(state => ({
            {{namePlural}}: [new{{namePascalCase}}, ...state.{{namePlural}}],
            {{#if withPagination}}
            totalCount: state.totalCount + 1,
            {{/if}}
            loading: false
          }));

          // Emit event
          eventBus.emit('{{events.created}}', { {{nameCamelCase}}: new{{namePascalCase}} });

          return new{{namePascalCase}};
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Update {{namePascalCase}}
      update{{namePascalCase}}: async (id: string, data: Update{{namePascalCase}}Request) => {
        try {
          const updated{{namePascalCase}} = await {{nameCamelCase}}Service.update{{namePascalCase}}(id, data);

          set(state => ({
            {{namePlural}}: state.{{namePlural}}.map(item =>
              item.id === id ? updated{{namePascalCase}} : item
            ),
            selected{{namePascalCase}}: state.selected{{namePascalCase}}?.id === id
              ? updated{{namePascalCase}}
              : state.selected{{namePascalCase}}
          }));

          // Emit event
          eventBus.emit('{{events.updated}}', { {{nameCamelCase}}: updated{{namePascalCase}} });

          return updated{{namePascalCase}};
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // Delete {{namePascalCase}}
      delete{{namePascalCase}}: async (id: string) => {
        try {
          await {{nameCamelCase}}Service.delete{{namePascalCase}}(id);

          set(state => ({
            {{namePlural}}: state.{{namePlural}}.filter(item => item.id !== id),
            selected{{namePascalCase}}: state.selected{{namePascalCase}}?.id === id
              ? null
              : state.selected{{namePascalCase}},
            {{#if withPagination}}
            totalCount: Math.max(0, state.totalCount - 1)
            {{/if}}
          }));

          // Emit event
          eventBus.emit('{{events.deleted}}', { id });
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },
      {{/if}}

      // Select {{namePascalCase}}
      select{{namePascalCase}}: ({{nameCamelCase}}: {{namePascalCase}} | null) => {
        set({ selected{{namePascalCase}}: {{nameCamelCase}} });

        if ({{nameCamelCase}}) {
          eventBus.emit('{{events.selected}}', { {{nameCamelCase}} });
        }
      },

      {{#if withFilters}}
      // Set filters
      setFilters: (newFilters: Partial<{{namePascalCase}}Filters>) => {
        const state = get();
        const updatedFilters = { ...state.filters, ...newFilters };
        set({ filters: updatedFilters, page: 1 });

        // Reload data with new filters
        {{#if withApi}}
        state.load{{namePascalCase}}s();
        {{/if}}
      },
      {{/if}}

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Reset store
      reset: () => {
        set({
          {{namePlural}}: [],
          selected{{namePascalCase}}: null,
          loading: false,
          error: null,
          {{#if withPagination}}
          page: 1,
          totalCount: 0,
          hasMore: false,
          {{/if}}
          {{#if withFilters}}
          filters: {
            search: '',
          }
          {{/if}}
        });
      }
    })),
    {
      name: '{{nameKebabCase}}-store'
    }
  )
);

// Subscribe to auth events to clear store on logout
use{{namePascalCase}}Store.subscribe(
  (state) => state,
  () => {
    eventBus.subscribe('USER_LOGOUT', () => {
      use{{namePascalCase}}Store.getState().reset();
    });
  }
);
```

## 🔧 CLI Commands

### Available Commands

```bash
# Plugin generation
ai-first g plugin <name> [options]
  --with-store         # Include Zustand store
  --with-components    # Include React components
  --with-pages         # Include page components
  --with-service       # Include API service
  --with-routes        # Include route definitions
  --with-tests         # Include test files (default: true)
  --description <desc> # Plugin description
  --icon <icon>        # Navigation icon

# Component generation
ai-first g component <name> [options]
  --type <type>        # Component type: functional|class (default: functional)
  --with-props         # Include props interface
  --with-state         # Include state management
  --with-effects       # Include useEffect/lifecycle methods
  --with-styles        # Include CSS module
  --with-tests         # Include test file (default: true)
  --with-story         # Include Storybook story
  --use-antd           # Use Ant Design components (default: true)

# Store generation
ai-first g store <name> [options]
  --with-api           # Include API integration
  --with-pagination    # Include pagination support
  --with-filters       # Include filtering support
  --with-cache         # Include caching logic
  --with-tests         # Include test file (default: true)

# Service generation
ai-first g service <name> [options]
  --with-crud          # Include CRUD operations
  --with-auth          # Include authentication headers
  --with-cache         # Include response caching
  --with-retry         # Include retry logic
  --with-tests         # Include test file (default: true)

# Page generation
ai-first g page <name> [options]
  --with-layout        # Include layout wrapper
  --with-seo           # Include SEO meta tags
  --with-auth          # Include authentication guards
  --with-tests         # Include test file (default: true)

# Hook generation
ai-first g hook <name> [options]
  --with-deps          # Include dependency array
  --with-cleanup       # Include cleanup logic
  --with-tests         # Include test file (default: true)

# Utility generation
ai-first g util <name> [options]
  --type <type>        # Utility type: helper|validator|formatter
  --with-tests         # Include test file (default: true)
```

## 📋 Best Practices

### 1. Template Design
- **Consistent Structure** - Follow established patterns across all templates
- **Variable Naming** - Use clear, descriptive variable names
- **Conditional Logic** - Use helpers for complex conditional rendering
- **Partials** - Break down complex templates into reusable partials

### 2. Generator Configuration
- **Validation Rules** - Define comprehensive validation rules
- **Default Values** - Provide sensible defaults for all options
- **Error Handling** - Provide clear error messages for validation failures
- **Documentation** - Document all generator options and their effects

### 3. Code Quality
- **Consistent Formatting** - Ensure generated code follows project standards
- **Type Safety** - Include proper TypeScript types in all generated code
- **Documentation** - Generate inline documentation and README files
- **Testing** - Include comprehensive test files with generated code

### 4. Maintenance
- **Template Versioning** - Version control template changes
- **Testing Generators** - Test generators with various option combinations
- **User Feedback** - Collect and incorporate user feedback
- **Performance** - Optimize generation speed for large templates

---

The code generation system provides a powerful foundation for rapid development while maintaining consistency and quality across your codebase.

## 📚 Next Steps

Continue exploring the framework:

1. **[CLI Reference](./cli-reference.md)** - Complete command-line interface documentation
2. **[Testing](./testing.md)** - Test generated code and generators themselves
3. **[Plugin Development](./plugin-development.md)** - Use generators in plugin development
4. **[Best Practices](./best-practices.md)** - Coding standards and patterns

**Accelerate development with powerful code generation!** 🏗️✨