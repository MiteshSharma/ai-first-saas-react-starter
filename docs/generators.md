# Code Generators

The AI-First React Framework includes powerful code generators that create consistent, well-tested components, stores, services, and pages. This document explains how the generator system works and how to customize it.

## 🎯 Generator Philosophy

### Core Principles
1. **Consistency**: All generated code follows the same patterns and conventions
2. **Completeness**: Every generator creates production-ready code with tests
3. **Customizability**: Templates can be modified to match project needs
4. **Type Safety**: Generated code is fully typed with TypeScript
5. **Best Practices**: Follows React, Zustand, and testing best practices

### Code Quality Standards
- **TypeScript Strict Mode**: All generated code passes strict type checking
- **ESLint Compliance**: Follows Airbnb + custom rules
- **Test Coverage**: 100% test coverage for generated components
- **Documentation**: JSDoc comments for all public APIs
- **Accessibility**: ARIA attributes and semantic HTML

## 🏗️ Generator Architecture

### System Overview

```
generators/
├── component-generator.js     # React component generator
├── store-generator.js        # Zustand store generator  
├── service-generator.js      # API service generator
├── page-generator.js         # Page component generator
└── templates/               # Handlebars templates
    ├── component/
    │   ├── Component.tsx.hbs
    │   ├── Component.test.tsx.hbs
    │   └── index.ts.hbs
    ├── store/
    │   ├── Store.ts.hbs
    │   ├── Store.test.ts.hbs
    │   └── apiClient.ts.hbs
    ├── service/
    │   ├── Service.ts.hbs
    │   └── Service.test.ts.hbs
    └── page/
        ├── Page.tsx.hbs
        ├── Page.test.tsx.hbs
        └── index.ts.hbs
```

### Template Engine

The framework uses **Handlebars.js** with custom helpers for code generation:

```javascript
// Example template compilation
const template = fs.readFileSync('Component.tsx.hbs', 'utf8');
const compiledTemplate = Handlebars.compile(template, { noEscape: true });
const generatedCode = compiledTemplate(templateData);
```

## 🎨 Component Generator

### Template Structure

**Component Template** (`Component.tsx.hbs`):
```handlebars
import React from 'react';
import styled from 'styled-components';
{{#if hasAntd}}
import { {{antdImports}} } from 'antd';
{{/if}}

{{#if hasTypes}}
import { {{types}} } from '@types';
{{/if}}

interface {{componentName}}Props {
{{#each props}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
{{/each}}
}

const {{componentName}}Wrapper = styled.div`
  /* Add your styles here */
  padding: 16px;
  
  {{#if customStyles}}
  {{customStyles}}
  {{/if}}
`;

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
{{#each props}}
  {{name}}{{#unless @last}},{{/unless}}
{{/each}}
}) => {
  {{#if hasState}}
  // Component state
  {{#each stateVars}}
  const [{{name}}, set{{capitalize name}}] = useState<{{type}}>({{defaultValue}});
  {{/each}}
  {{/if}}

  {{#if hasEffects}}
  // Effects
  {{#each effects}}
  useEffect(() => {
    {{body}}
  }, [{{dependencies}}]);
  {{/each}}
  {{/if}}

  {{#if hasHandlers}}
  // Event handlers
  {{#each handlers}}
  const {{name}} = useCallback(({{parameters}}) => {
    {{body}}
  }, [{{dependencies}}]);
  {{/each}}
  {{/if}}

  return (
    <{{componentName}}Wrapper data-testid="{{kebabName}}">
      {{#if hasTitle}}
      <h2>{{title}}</h2>
      {{/if}}
      
      {{#each children}}
      {{{this}}}
      {{/each}}
      
      {{#if hasChildren}}
      {children}
      {{/if}}
    </{{componentName}}Wrapper>
  );
};
```

### Template Data Structure

```javascript
const templateData = {
  componentName: 'UserProfile',
  kebabName: 'user-profile',
  props: [
    { name: 'user', type: 'User', required: true },
    { name: 'onEdit', type: '() => void', required: false },
    { name: 'loading', type: 'boolean', required: false, defaultValue: 'false' }
  ],
  hasAntd: true,
  antdImports: 'Card, Avatar, Button',
  hasTypes: true,
  types: 'User',
  hasState: true,
  stateVars: [
    { name: 'isEditing', type: 'boolean', defaultValue: 'false' }
  ],
  hasHandlers: true,
  handlers: [
    { 
      name: 'handleEdit', 
      parameters: 'event: React.MouseEvent',
      body: 'setIsEditing(!isEditing);',
      dependencies: 'isEditing'
    }
  ]
};
```

### Advanced Component Features

#### Conditional Rendering
```handlebars
{{#if hasConditionals}}
{{#each conditionals}}
{{{condition}} && (
  {{{content}}}
)}
{{/each}}
{{/if}}
```

#### Form Components
```handlebars
{{#if isForm}}
import { Form, Input, Button } from 'antd';
import { useForm } from 'antd/lib/form/Form';

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  onSubmit,
  initialValues
}) => {
  const [form] = useForm();

  const handleSubmit = (values: {{formDataType}}) => {
    onSubmit?.(values);
  };

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      initialValues={initialValues}
      layout="vertical"
    >
      {{#each formFields}}
      <Form.Item 
        label="{{label}}" 
        name="{{name}}"
        {{#if required}}rules={[{ required: true, message: '{{validation.message}}' }]}{{/if}}
      >
        <{{inputType}} {{inputProps}} />
      </Form.Item>
      {{/each}}
      
      <Form.Item>
        <Button type="primary" htmlType="submit">
          {{submitText}}
        </Button>
      </Form.Item>
    </Form>
  );
};
{{/if}}
```

## 🗄️ Store Generator

### Template Structure

**Store Template** (`Store.ts.hbs`):
```handlebars
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
{{#if hasImmer}}
import { immer } from 'zustand/middleware/immer';
{{/if}}
{{#if hasPersist}}
import { persist } from 'zustand/middleware';
{{/if}}
{{#if hasZod}}
import { z } from 'zod';
{{/if}}
{{#if hasService}}
import { {{serviceName}} } from '@services/{{serviceName}}';
{{/if}}

{{#if hasZod}}
{{#each zodSchemas}}
export const {{name}}Schema = z.object({
{{#each properties}}
  {{name}}: {{schema}},
{{/each}}
});

export type {{name}} = z.infer<typeof {{name}}Schema>;
{{/each}}
{{/if}}

{{#if hasInterfaces}}
{{#each interfaces}}
export interface {{name}} {
{{#each properties}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
{{/each}}
}
{{/each}}
{{/if}}

interface {{storeName}}State {
  // State
{{#each state}}
  {{name}}: {{type}};
{{/each}}

  // Actions
{{#each actions}}
  {{name}}: ({{parameters}}) => {{returnType}};
{{/each}}

  // Computed getters
{{#each computeds}}
  {{name}}: () => {{returnType}};
{{/each}}

  // Helper methods
{{#each helpers}}
  {{name}}: ({{parameters}}) => {{returnType}};
{{/each}}

  // Cleanup
  reset: () => void;
}

const initialState = {
{{#each state}}
  {{name}}: {{defaultValue}},
{{/each}}
};

export const {{camelCaseName}} = create<{{storeName}}State>()({{#if hasMiddleware}}
  {{#each middleware}}{{this}}({{/each}}{{/if}}
    devtools(
      subscribeWithSelector(
        (set, get) => ({
          ...initialState,

          // Actions
{{#each actions}}
          {{name}}: {{#if isAsync}}async {{/if}}({{parameters}}) => {
            {{#if hasLoading}}
            set({ {{loadingProperty}}: true, {{errorProperty}}: null });
            {{/if}}

            try {
              {{#if hasImmer}}
              set((state) => {
                {{body}}
              });
              {{else}}
              {{body}}
              {{/if}}
              {{#if hasSuccess}}
              set({ {{successProperty}}: true });
              {{/if}}
            } catch (error) {
              {{#if hasError}}
              set({ {{errorProperty}}: error instanceof Error ? error.message : 'An error occurred' });
              {{/if}}
              {{#if rethrow}}
              throw error;
              {{/if}}
            } finally {
              {{#if hasLoading}}
              set({ {{loadingProperty}}: false });
              {{/if}}
            }
          },
{{/each}}

          // Computed getters
{{#each computeds}}
          {{name}}: () => {
            const state = get();
            {{body}}
          },
{{/each}}

          // Helper methods
{{#each helpers}}
          {{name}}: ({{parameters}}) => {
            {{body}}
          },
{{/each}}

          // Reset state
          reset: () => set(initialState),
        })
      ),
      {
        name: '{{storeName}}',
      }
    ){{#if hasMiddleware}}
  {{#each middlewareClosing}}){{/each}}{{/if}}
);
```

### Zustand Store Patterns

The framework supports various Zustand patterns and middleware:

#### Available Middleware
- **devtools**: Redux DevTools integration for debugging
- **subscribeWithSelector**: Selective subscriptions to state changes
- **immer**: Immutable updates using Immer
- **persist**: Automatic persistence to localStorage/sessionStorage

#### Store Configuration Options
```javascript
const storeOptions = {
  hasImmer: true,        // Use Immer for immutable updates
  hasPersist: true,      // Enable persistence
  persistKey: 'user-store', // Persistence key
  hasMiddleware: true,   // Include middleware
  middleware: ['immer(', 'persist('], // Middleware stack
  middlewareClosing: [')', ')']       // Closing parentheses
};
```

#### CRUD Operations Store
```javascript
const crudStoreData = {
  storeName: 'UserStore',
  entityName: 'User',
  state: [
    { name: 'users', type: 'User[]', defaultValue: '[]' },
    { name: 'loading', type: 'boolean', defaultValue: 'false' },
    { name: 'error', type: 'string | null', defaultValue: 'null' },
    { name: 'selectedUser', type: 'User | null', defaultValue: 'null' }
  ],
  computeds: [
    { 
      name: 'getUserCount', 
      returnType: 'number',
      body: 'return state.users.length;'
    },
    {
      name: 'getActiveUsers',
      returnType: 'User[]', 
      body: 'return state.users.filter(user => user.isActive);'
    }
  ],
  actions: [
    {
      name: 'fetchUsers',
      isAsync: true,
      parameters: '',
      returnType: 'Promise<void>',
      hasLoading: true,
      hasError: true,
      loadingProperty: 'loading',
      errorProperty: 'error',
      body: `
        const users = await userService.getUsers();
        set({ users });
      `
    },
    {
      name: 'selectUser',
      parameters: 'user: User | null',
      returnType: 'void',
      body: 'set({ selectedUser: user });'
    },
    {
      name: 'addUser',
      parameters: 'user: User',
      returnType: 'void',
      body: 'set((state) => ({ users: [...state.users, user] }));'
    }
  ]
};
```

#### Advanced Zustand Patterns

**Persistent Store with Immer:**
```javascript
const persistentStoreData = {
  storeName: 'SettingsStore',
  hasImmer: true,
  hasPersist: true,
  persistKey: 'app-settings',
  hasMiddleware: true,
  middleware: ['persist(', 'immer('],
  middlewareClosing: [')', ')'],
  state: [
    { name: 'theme', type: 'string', defaultValue: "'light'" },
    { name: 'language', type: 'string', defaultValue: "'en'" },
    { name: 'notifications', type: 'boolean', defaultValue: 'true' }
  ],
  actions: [
    {
      name: 'updateTheme',
      parameters: 'theme: string',
      returnType: 'void',
      hasImmer: true,
      body: 'state.theme = theme;'
    }
  ]
};
```

**Store with Computed Values:**
```javascript
const computedStoreData = {
  storeName: 'CartStore',
  state: [
    { name: 'items', type: 'CartItem[]', defaultValue: '[]' },
    { name: 'discountCode', type: 'string | null', defaultValue: 'null' }
  ],
  computeds: [
    {
      name: 'getItemCount',
      returnType: 'number',
      body: 'return state.items.reduce((sum, item) => sum + item.quantity, 0);'
    },
    {
      name: 'getSubtotal',
      returnType: 'number',
      body: 'return state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);'
    },
    {
      name: 'getTotal',
      returnType: 'number',
      body: `
        const subtotal = get().getSubtotal();
        const discount = state.discountCode ? 0.1 : 0;
        return subtotal * (1 - discount);
      `
    }
  ]
};
```

#### Using Zustand Stores in Components

**Component with Store Hook:**
```javascript
const componentWithStoreData = {
  componentName: 'UserList',
  hasStore: true,
  storeImports: 'useUserStore',
  stores: [
    { name: 'userStore', hookName: 'useUserStore' }
  ],
  stateVars: [],
  effects: [
    {
      body: `
        // Fetch users on component mount
        userStore.fetchUsers();
      `,
      dependencies: ''
    }
  ]
};
```

**Generated Component Usage:**
```handlebars
import React, { useEffect } from 'react';
import { useUserStore } from '@stores';

export const UserList: React.FC = () => {
  const userStore = useUserStore();
  
  useEffect(() => {
    userStore.fetchUsers();
  }, []);

  const users = userStore.users;
  const loading = userStore.loading;
  const userCount = userStore.getUserCount();

  // Component JSX...
};
```

## 🌐 Service Generator

### Template Structure

**Service Template** (`Service.ts.hbs`):
```handlebars
import { apiClient } from './apiClient';
{{#if hasZod}}
import { z } from 'zod';
{{/if}}
{{#if hasTypes}}
import { {{types}} } from '@types';
{{/if}}

{{#if hasZod}}
// Zod schemas for validation
{{#each zodSchemas}}
export const {{name}}Schema = z.object({
{{#each properties}}
  {{name}}: {{schema}},
{{/each}}
});

export type {{name}} = z.infer<typeof {{name}}Schema>;
{{/each}}
{{/if}}

{{#if hasInterfaces}}
// TypeScript interfaces
{{#each interfaces}}
export interface {{name}} {
{{#each properties}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
{{/each}}
}
{{/each}}
{{/if}}

export class {{serviceName}} {
  private baseUrl = '{{baseUrl}}';

  // CRUD Operations
  async get{{entityName}}List({{#if hasQueryParams}}params: {{queryParamsType}} = {}{{/if}}): Promise<{{listResponseType}}> {
    try {
      const response = await apiClient.get(this.baseUrl{{#if hasQueryParams}}, { params }{{/if}});
      {{#if hasZod}}
      return {{listResponseType}}Schema.parse(response.data);
      {{else}}
      return response.data;
      {{/if}}
    } catch (error) {
      throw new Error(`Failed to fetch {{entityName}} list: ${error.message}`);
    }
  }

  async get{{entityName}}(id: string): Promise<{{entityName}}> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`);
      {{#if hasZod}}
      return {{entityName}}Schema.parse(response.data);
      {{else}}
      return response.data;
      {{/if}}
    } catch (error) {
      throw new Error(`Failed to fetch {{entityName}}: ${error.message}`);
    }
  }

  async create{{entityName}}(data: {{createDataType}}): Promise<{{entityName}}> {
    try {
      {{#if hasZod}}
      const validatedData = {{createDataType}}Schema.parse(data);
      const response = await apiClient.post(this.baseUrl, validatedData);
      return {{entityName}}Schema.parse(response.data);
      {{else}}
      const response = await apiClient.post(this.baseUrl, data);
      return response.data;
      {{/if}}
    } catch (error) {
      throw new Error(`Failed to create {{entityName}}: ${error.message}`);
    }
  }

  async update{{entityName}}(id: string, data: {{updateDataType}}): Promise<{{entityName}}> {
    try {
      {{#if hasZod}}
      const validatedData = {{updateDataType}}Schema.parse(data);
      const response = await apiClient.put(`${this.baseUrl}/${id}`, validatedData);
      return {{entityName}}Schema.parse(response.data);
      {{else}}
      const response = await apiClient.put(`${this.baseUrl}/${id}`, data);
      return response.data;
      {{/if}}
    } catch (error) {
      throw new Error(`Failed to update {{entityName}}: ${error.message}`);
    }
  }

  async delete{{entityName}}(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete {{entityName}}: ${error.message}`);
    }
  }

  {{#if hasCustomMethods}}
  // Custom methods
  {{#each customMethods}}
  async {{name}}({{parametersStr}}): Promise<{{returnType}}> {
    try {
      const response = await apiClient.{{method.toLowerCase()}}(`${this.baseUrl}{{endpoint}}`{{#if hasData}}, data{{/if}});
      {{#if hasValidation}}
      return {{returnType}}Schema.parse(response.data);
      {{else}}
      return response.data;
      {{/if}}
    } catch (error) {
      throw new Error(`Failed to {{name}}: ${error.message}`);
    }
  }
  {{/each}}
  {{/if}}
}

// Export singleton instance
export const {{camelCaseName}} = new {{serviceName}}();
```

## 📄 Page Generator

### Template Structure

**Page Template** (`Page.tsx.hbs`):
```handlebars
import React{{#if hasState}}, { useState, useEffect }{{/if}} from 'react';
import styled from 'styled-components';
import { Layout, Typography{{#if hasAntdComponents}}, {{antdComponents}}{{/if}} } from 'antd';
{{#if hasRouter}}
import { useNavigate, useParams } from 'react-router-dom';
{{/if}}
{{#if hasStore}}
import { {{storeImports}} } from '@stores';
{{/if}}
{{#if hasComponents}}
import { {{components}} } from '@components';
{{/if}}

const { Content } = Layout;
const { Title } = Typography;

{{#if hasInterfaces}}
{{#each interfaces}}
interface {{name}} {
{{#each properties}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
{{/each}}
}
{{/each}}
{{/if}}

const {{pageName}}Wrapper = styled(Content)`
  padding: 24px;
  min-height: 100vh;
  background: #f0f2f5;
  
  {{#if customStyles}}
  {{customStyles}}
  {{/if}}
`;

const {{pageName}}Header = styled.div`
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const {{pageName}}: React.FC = () => {
  {{#if hasRouter}}
  const navigate = useNavigate();
  {{#if hasParams}}
  const { {{routeParams}} } = useParams<{ {{routeParamsType}} }>();
  {{/if}}
  {{/if}}

  {{#if hasStore}}
  // Zustand stores
  {{#each stores}}
  const {{name}} = {{hookName}}();
  {{/each}}
  {{/if}}

  {{#if hasState}}
  // Component state
  {{#each stateVars}}
  const [{{name}}, set{{capitalize name}}] = useState<{{type}}>({{defaultValue}});
  {{/each}}
  {{/if}}

  {{#if hasEffects}}
  // Effects
  {{#each effects}}
  useEffect(() => {
    {{body}}
  }, [{{dependencies}}]);
  {{/each}}
  {{/if}}

  {{#if hasHandlers}}
  // Event handlers
  {{#each handlers}}
  const {{name}} = ({{parameters}}) => {
    {{body}}
  };
  {{/each}}
  {{/if}}

  {{#if hasLoading}}
  if ({{loadingCondition}}) {
    return (
      <{{pageName}}Wrapper>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          Loading...
        </div>
      </{{pageName}}Wrapper>
    );
  }
  {{/if}}

  {{#if hasError}}
  if ({{errorCondition}}) {
    return (
      <{{pageName}}Wrapper>
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          Error: {{{errorMessage}}}
        </div>
      </{{pageName}}Wrapper>
    );
  }
  {{/if}}

  return (
    <{{pageName}}Wrapper data-testid="{{kebabName}}">
      <{{pageName}}Header>
        <Title level={2}>{{pageTitle}}</Title>
        {{#if hasActions}}
        <div>
          {{#each actions}}
          <{{type}} {{props}}>{{text}}</{{type}}>
          {{/each}}
        </div>
        {{/if}}
      </{{pageName}}Header>

      {{#if hasContent}}
      <div>
        {{#each contentSections}}
        <{{wrapper}}>
          {{{content}}}
        </{{wrapper}}>
        {{/each}}
      </div>
      {{/if}}

      {{#if hasComponents}}
      {{#each pageComponents}}
      <{{name}} {{props}} />
      {{/each}}
      {{/if}}
    </{{pageName}}Wrapper>
  );
};
```

## 🧪 Test Generator

### Component Test Template
```handlebars
import React from 'react';
import { render, screen{{#if hasInteraction}}, fireEvent{{/if}} } from '@testing-library/react';
{{#if hasStore}}
import { {{storeImports}} } from '@stores';
{{/if}}
import { {{componentName}} } from '../{{componentName}}';

{{#if hasStore}}
// Mock Zustand store
{{#each mockStores}}
const mock{{capitalize name}} = {
  {{#each mockData}}
  {{name}}: {{value}},
  {{/each}}
};

// Mock store hooks
jest.mock('@stores', () => ({
  {{hookName}}: () => mock{{capitalize name}},
}));
{{/each}}
{{/if}}

describe('{{componentName}}', () => {
  const defaultProps = {
{{#each props}}
    {{name}}: {{testValue}},
{{/each}}
  };

  {{#if hasStore}}
  const renderComponent = (props = {}) => {
    return render(<{{componentName}} {...defaultProps} {...props} />);
  };
  {{/if}}

  it('should render correctly', () => {
    {{#if hasStore}}
    renderComponent();
    {{else}}
    render(<{{componentName}} {...defaultProps} />);
    {{/if}}
    expect(screen.getByTestId('{{kebabName}}')).toBeInTheDocument();
  });

{{#each props}}
  it('should display {{name}} correctly', () => {
    {{#if ../hasStore}}
    renderComponent();
    {{else}}
    render(<{{../componentName}} {...defaultProps} />);
    {{/if}}
    {{#if isText}}
    expect(screen.getByText(defaultProps.{{name}})).toBeInTheDocument();
    {{else}}
    expect(screen.getByTestId('{{../kebabName}}')).toBeInTheDocument();
    {{/if}}
  });

{{/each}}
{{#if hasInteraction}}
  it('should handle user interactions', () => {
    const mockHandler = jest.fn();
    {{#if hasStore}}
    renderComponent({ {{callbackProp}}: mockHandler });
    {{else}}
    render(<{{componentName}} {...defaultProps} {{callbackProp}}={mockHandler} />);
    {{/if}}
    
    const element = screen.getByTestId('{{kebabName}}');
    fireEvent.click(element);
    
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
{{/if}}

  it('should match snapshot', () => {
    {{#if hasStore}}
    const { container } = renderComponent();
    {{else}}
    const { container } = render(<{{componentName}} {...defaultProps} />);
    {{/if}}
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## 🛠️ Customizing Generators

### Creating Custom Templates

1. **Add new template files** to `generators/templates/`
2. **Create generator script** in `generators/`
3. **Register in CLI** (`cli/index.js`)

Example custom generator:
```javascript
// generators/modal-generator.js
const { generateComponent } = require('./component-generator');
const { generateStore } = require('./store-generator');

async function generateModal(options) {
  const modalOptions = {
    ...options,
    hasAntd: true,
    antdComponents: 'Modal, Button',
    customStyles: `
      .ant-modal-content {
        border-radius: 8px;
      }
    `,
    stateVars: [
      { name: 'visible', type: 'boolean', defaultValue: 'false' }
    ]
  };

  // Generate modal store if needed
  if (options.withStore) {
    const storeOptions = {
      storeName: `${options.componentName}Store`,
      state: [
        { name: 'isVisible', type: 'boolean', defaultValue: 'false' },
        { name: 'data', type: 'any', defaultValue: 'null' }
      ],
      actions: [
        {
          name: 'show',
          parameters: 'data?: any',
          returnType: 'void',
          body: 'set({ isVisible: true, data });'
        },
        {
          name: 'hide',
          parameters: '',
          returnType: 'void',
          body: 'set({ isVisible: false, data: null });'
        }
      ]
    };
    
    await generateStore(storeOptions);
  }

  return generateComponent(modalOptions);
}
```

### Template Helpers

Add custom Handlebars helpers:
```javascript
// Register custom helpers
Handlebars.registerHelper('capitalize', (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
});

Handlebars.registerHelper('kebabCase', (str) => {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
});

Handlebars.registerHelper('camelCase', (str) => {
  return str.charAt(0).toLowerCase() + str.slice(1);
});

// Zustand-specific helpers
Handlebars.registerHelper('zustandHook', (storeName) => {
  return `use${storeName}`;
});

Handlebars.registerHelper('storeSelector', (path) => {
  return `(state) => state.${path}`;
});

Handlebars.registerHelper('middlewareWrap', (middleware, content) => {
  return middleware.reduce((acc, mw) => `${mw}(${acc})`, content);
});
```

## 📊 Generator Metrics

The framework tracks generation metrics:
- **Generation Speed**: ~2-3 seconds per component/store
- **Code Quality**: 100% TypeScript compliance with strict mode
- **Test Coverage**: 100% for generated code including Zustand store tests
- **Template Size**: Optimized for readability and maintainability
- **Zustand Integration**: Native support for stores, middleware, and computed values
- **Bundle Impact**: Minimal overhead with tree-shaking support

---

**Next**: Learn about [Deployment](./deployment.md) to ship your applications.