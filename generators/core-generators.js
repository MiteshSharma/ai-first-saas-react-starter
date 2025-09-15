const fs = require('fs');
const path = require('path');

/**
 * Core framework generators for essential system components
 */

/**
 * Generate Event Bus extensions
 */
async function generateEventBus(options = {}) {
  const {
    name,
    description = `Event bus extension for ${name}`,
    events = [],
    handlers = []
  } = options;

  const eventBusDir = path.join(process.cwd(), 'src', 'core', 'events');

  if (!fs.existsSync(eventBusDir)) {
    fs.mkdirSync(eventBusDir, { recursive: true });
  }

  // Generate event definitions
  const eventsFile = path.join(eventBusDir, `${name.toLowerCase()}Events.ts`);
  const eventsContent = `// Generated Event definitions for ${name}
${description ? `// ${description}` : ''}

export const ${name.toUpperCase()}_EVENTS = {
${events.map(event => `  ${event.name}: '${event.name}' as const`).join(',\n')}
} as const;

export type ${name}EventType = typeof ${name.toUpperCase()}_EVENTS[keyof typeof ${name.toUpperCase()}_EVENTS];

${events.map(event => `
export interface ${event.payloadType || `${event.name}Payload`} {
${event.properties ? event.properties.map(prop => `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`).join('\n') : '  // Add payload properties here'}
}
`).join('')}

export type ${name}EventPayloads = {
${events.map(event => `  [${name.toUpperCase()}_EVENTS.${event.name}]: ${event.payloadType || `${event.name}Payload`};`).join('\n')}
};
`;

  fs.writeFileSync(eventsFile, eventsContent);

  // Generate event handlers
  if (handlers.length > 0) {
    const handlersFile = path.join(eventBusDir, `${name.toLowerCase()}Handlers.ts`);
    const handlersContent = `// Generated Event handlers for ${name}
import { EventBus } from '../eventBus';
import { ${name.toUpperCase()}_EVENTS, type ${name}EventPayloads } from './${name.toLowerCase()}Events';

export class ${name}EventHandlers {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.registerHandlers();
  }

  private registerHandlers(): void {
${handlers.map(handler => `
    this.eventBus.on(${name.toUpperCase()}_EVENTS.${handler.event}, this.handle${handler.event});`).join('')}
  }

${handlers.map(handler => `
  private handle${handler.event} = (payload: ${name}EventPayloads[typeof ${name.toUpperCase()}_EVENTS.${handler.event}]): void => {
    // TODO: Implement ${handler.event} handler
    console.log('Handling ${handler.event}:', payload);
    ${handler.implementation || ''}
  };`).join('\n')}

  public destroy(): void {
${handlers.map(handler => `
    this.eventBus.off(${name.toUpperCase()}_EVENTS.${handler.event}, this.handle${handler.event});`).join('')}
  }
}
`;

    fs.writeFileSync(handlersFile, handlersContent);
  }

  console.log(`✅ Generated Event Bus extension: ${name}`);
  console.log(`   📄 Events: ${eventsFile}`);
  if (handlers.length > 0) {
    console.log(`   📄 Handlers: ${path.join(eventBusDir, `${name.toLowerCase()}Handlers.ts`)}`);
  }
}

/**
 * Generate Store extensions
 */
async function generateStoreExtension(options = {}) {
  const {
    name,
    description = `Store extension for ${name}`,
    baseStore = 'BaseStore',
    properties = [],
    computed = [],
    actions = [],
    eventIntegration = true
  } = options;

  const storeDir = path.join(process.cwd(), 'src', 'core', 'stores', name.toLowerCase());

  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true });
  }

  // Generate types
  const typesFile = path.join(storeDir, 'types.ts');
  const typesContent = `// Generated types for ${name} store
${description ? `// ${description}` : ''}

import type { BaseStoreState, BaseStoreActions } from '../base';

export interface ${name}State extends BaseStoreState {
${properties.map(prop => `  ${prop.name}: ${prop.type};`).join('\n')}
}

export interface ${name}Actions extends BaseStoreActions {
${actions.map(action => `  ${action.name}: (${action.parameters || ''}) => ${action.returnType || 'void'};`).join('\n')}
}

export interface ${name}Computed {
${computed.map(comp => `  ${comp.name}: ${comp.type};`).join('\n')}
}

export interface ${name}Store extends ${name}State, ${name}Actions, ${name}Computed {}
`;

  fs.writeFileSync(typesFile, typesContent);

  // Generate store implementation
  const storeFile = path.join(storeDir, `${name.toLowerCase()}Store.ts`);
  const storeContent = `// Generated ${name} store implementation
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
${eventIntegration ? `import { EventBus } from '../../events/eventBus';` : ''}
import type { ${name}Store } from './types';

interface Create${name}StoreOptions {
${eventIntegration ? '  eventBus?: EventBus;' : ''}
}

export const create${name}Store = (options: Create${name}StoreOptions = {}) => {
${eventIntegration ? '  const { eventBus } = options;' : ''}

  return create<${name}Store>()(
    subscribeWithSelector(
      (set, get) => ({
        // Base state
        isLoading: false,
        error: null,
        lastUpdated: null,

        // ${name} specific state
${properties.map(prop => `        ${prop.name}: ${prop.defaultValue || 'undefined'},`).join('\n')}

        // Computed properties
${computed.map(comp => `        get ${comp.name}() {
          ${comp.implementation || `return get().${comp.name};`}
        },`).join('\n')}

        // Actions
        setLoading: (loading: boolean) => set({ isLoading: loading }),
        setError: (error: string | null) => set({ error }),

${actions.map(action => `        ${action.name}: (${action.parameters || ''}) => {
          ${action.implementation || `// TODO: Implement ${action.name}`}
        },`).join('\n')}

        // Base actions
        reset: () => set({
          isLoading: false,
          error: null,
          lastUpdated: null,
${properties.map(prop => `          ${prop.name}: ${prop.defaultValue || 'undefined'},`).join('\n')}
        }),

        updateLastUpdated: () => set({ lastUpdated: new Date() }),
      })
    )
  );
};

// Default store instance
export const ${name.toLowerCase()}Store = create${name}Store();
`;

  fs.writeFileSync(storeFile, storeContent);

  // Generate store index
  const indexFile = path.join(storeDir, 'index.ts');
  const indexContent = `// Generated ${name} store exports
export * from './types';
export * from './${name.toLowerCase()}Store';
`;

  fs.writeFileSync(indexFile, indexContent);

  console.log(`✅ Generated Store extension: ${name}`);
  console.log(`   📄 Types: ${typesFile}`);
  console.log(`   📄 Store: ${storeFile}`);
  console.log(`   📄 Index: ${indexFile}`);
}

/**
 * Generate API Helper extensions
 */
async function generateAPIHelper(options = {}) {
  const {
    name,
    description = `API helper for ${name}`,
    endpoints = [],
    baseURL = '',
    withAuth = true,
    withTenant = false
  } = options;

  const helpersDir = path.join(process.cwd(), 'src', 'helpers');

  if (!fs.existsSync(helpersDir)) {
    fs.mkdirSync(helpersDir, { recursive: true });
  }

  const helperFile = path.join(helpersDir, `${name.toLowerCase()}Helper.ts`);
  const helperContent = `// Generated API helper for ${name}
${description ? `// ${description}` : ''}

import { apiClient } from './apiClient';
${withAuth ? "import { getAuthHeaders } from './authHelper';" : ''}
${withTenant ? "import { getTenantHeaders } from './tenantHelper';" : ''}

const BASE_URL = '${baseURL || `/api/${name.toLowerCase()}`}';

${endpoints.map(endpoint => `
/**
 * ${endpoint.description || `${endpoint.method.toUpperCase()} ${endpoint.path}`}
 */
export const ${endpoint.name} = async (${endpoint.parameters || ''}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
${withAuth ? '      ...getAuthHeaders(),' : ''}
${withTenant ? '      ...getTenantHeaders(),' : ''}
    };

    const response = await apiClient.${endpoint.method.toLowerCase()}(
      \`\${BASE_URL}${endpoint.path}\`${endpoint.hasBody ? ',\n      data' : ''}${endpoint.hasParams ? ',\n      { params }' : ''},
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error('${endpoint.name} error:', error);
    throw error;
  }
};`).join('\n')}

// Batch operations
export const ${name.toLowerCase()}Helper = {
${endpoints.map(endpoint => `  ${endpoint.name},`).join('\n')}
};
`;

  fs.writeFileSync(helperFile, helperContent);

  console.log(`✅ Generated API Helper: ${name}`);
  console.log(`   📄 Helper: ${helperFile}`);
}

/**
 * Generate Hook extensions
 */
async function generateHook(options = {}) {
  const {
    name,
    description = `Custom hook for ${name}`,
    dependencies = [],
    returnType = 'void',
    parameters = [],
    implementation = ''
  } = options;

  const hooksDir = path.join(process.cwd(), 'src', 'hooks');

  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  const hookFile = path.join(hooksDir, `use${name}.ts`);
  const hookContent = `// Generated custom hook: use${name}
${description ? `// ${description}` : ''}

import { useState, useEffect, useCallback } from 'react';
${dependencies.map(dep => `import ${dep.import} from '${dep.from}';`).join('\n')}

interface Use${name}Options {
${parameters.map(param => `  ${param.name}${param.optional ? '?' : ''}: ${param.type};`).join('\n')}
}

interface Use${name}Return {
  // Add return type properties here
  isLoading: boolean;
  error: string | null;
  // TODO: Add specific return properties
}

/**
 * ${description}
 */
export const use${name} = (options: Use${name}Options = {}): Use${name}Return => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  ${implementation || `// TODO: Implement hook logic`}

  useEffect(() => {
    // TODO: Add effect logic
  }, []);

  return {
    isLoading,
    error,
    // TODO: Return specific properties
  };
};
`;

  fs.writeFileSync(hookFile, hookContent);

  console.log(`✅ Generated Hook: use${name}`);
  console.log(`   📄 Hook: ${hookFile}`);
}

module.exports = {
  generateEventBus,
  generateStoreExtension,
  generateAPIHelper,
  generateHook
};