#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// Register Handlebars helpers
Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

Handlebars.registerHelper('toUpperCase', function(str) {
  return str.toUpperCase().replace(/([a-z])([A-Z])/g, '$1_$2');
});

/**
 * Generate API endpoints for urlHelper and backendHelper
 * @param {Object} options - Endpoint generation options
 */
async function generateEndpoints(options) {
  const {
    domain,
    entityName = domain.replace('Service', ''),
    description = `API endpoints for ${entityName} operations`,
    hasAuth = true,
    hasTenant = false,
    hasWorkspace = false,
    endpoints = []
  } = options;

  const entityLower = entityName.toLowerCase();
  const entityPlural = `${entityLower}s`;
  
  // Default CRUD endpoints if none provided
  const defaultEndpoints = [
    { name: `get${entityName}List`, method: 'GET', path: `/${entityPlural}`, description: `Get all ${entityPlural}` },
    { name: `get${entityName}`, method: 'GET', path: `/${entityPlural}/{id}`, description: `Get a single ${entityLower} by ID` },
    { name: `create${entityName}`, method: 'POST', path: `/${entityPlural}`, description: `Create a new ${entityLower}` },
    { name: `update${entityName}`, method: 'PUT', path: `/${entityPlural}/{id}`, description: `Update a ${entityLower}` },
    { name: `delete${entityName}`, method: 'DELETE', path: `/${entityPlural}/{id}`, description: `Delete a ${entityLower}` }
  ];

  const finalEndpoints = endpoints.length > 0 ? endpoints : defaultEndpoints;

  // Add workspace/tenant prefixes if needed
  const processedEndpoints = finalEndpoints.map(endpoint => {
    let fullPath = endpoint.path;
    
    if (hasWorkspace && !endpoint.path.includes('workspace')) {
      fullPath = `/workspaces/{workspace-id}${endpoint.path}`;
    }
    
    if (hasTenant && !endpoint.path.includes('tenant')) {
      fullPath = `/tenants/{tenant-id}${fullPath}`;
    }

    return {
      ...endpoint,
      fullPath,
      hasParams: endpoint.path.includes('{'),
      params: extractParams(fullPath)
    };
  });

  // Template data
  const templateData = {
    domain,
    entityName,
    entityLower,
    entityPlural,
    description,
    hasAuth,
    hasTenant,
    hasWorkspace,
    endpoints: processedEndpoints,
    timestamp: new Date().toISOString()
  };

  // Update urlHelper.ts
  await updateUrlHelper(templateData);
  
  // Update backendHelper.ts
  await updateBackendHelper(templateData);

  console.log(`✅ Generated endpoints for: ${entityName}`);
  console.log(`📁 Updated files:`);
  console.log(`   - src/helpers/urlHelper.ts`);
  console.log(`   - src/helpers/backendHelper.ts`);
  console.log(`📝 Endpoints added:`);
  processedEndpoints.forEach(ep => {
    console.log(`   - ${ep.method} ${ep.fullPath} (${ep.name})`);
  });
}

function extractParams(path) {
  const matches = path.match(/{([^}]+)}/g);
  return matches ? matches.map(match => match.slice(1, -1)) : [];
}

async function updateUrlHelper(templateData) {
  const urlHelperPath = path.join(process.cwd(), 'src/helpers/urlHelper.ts');
  
  if (!fs.existsSync(urlHelperPath)) {
    console.warn('⚠️  urlHelper.ts not found, creating...');
    await createUrlHelper();
  }

  let content = fs.readFileSync(urlHelperPath, 'utf8');
  
  // Generate new URL exports
  const urlExports = templateData.endpoints.map(endpoint => {
    const constName = endpoint.name.toUpperCase().replace(/([a-z])([A-Z])/g, '$1_$2');
    return `export const ${constName} = '${endpoint.fullPath}';`;
  }).join('\n');

  // Add new exports at the end of the file, before any utility functions
  const newSection = `\n// ==========================================\n// ${templateData.entityName.toUpperCase()} ENDPOINTS\n// ==========================================\n\n${urlExports}\n`;
  
  // Find where to insert - before any functions or at the end
  const functionMatch = content.search(/export function|export const.*=.*\(/);
  
  if (functionMatch !== -1) {
    // Insert before functions
    const updatedContent = content.substring(0, functionMatch) + newSection + '\n' + content.substring(functionMatch);
    fs.writeFileSync(urlHelperPath, updatedContent);
  } else {
    // Append at the end
    fs.writeFileSync(urlHelperPath, content + newSection);
  }
}

async function updateBackendHelper(templateData) {
  const backendHelperPath = path.join(process.cwd(), 'src/helpers/backendHelper.ts');
  
  if (!fs.existsSync(backendHelperPath)) {
    console.warn('⚠️  backendHelper.ts not found, creating...');
    await createBackendHelper();
  }

  // Generate backend helper functions
  const template = fs.readFileSync(
    path.join(__dirname, 'templates/endpoint/backendHelper.ts.hbs'),
    'utf8'
  );
  const compiledTemplate = Handlebars.compile(template, { noEscape: true });
  const newFunctions = compiledTemplate(templateData);

  // Read existing content
  let content = fs.readFileSync(backendHelperPath, 'utf8');
  
  // Add imports for new URL constants
  const newConstants = templateData.endpoints.map(endpoint => {
    const constName = endpoint.name.toUpperCase().replace(/([a-z])([A-Z])/g, '$1_$2');
    return constName;
  });
  
  // Update imports - find the import from urlHelper and add new constants
  const urlImportMatch = content.match(/import.*from ['"]\.\/urlHelper['"];?/);
  if (urlImportMatch) {
    const importLine = urlImportMatch[0];
    // Check if it's already importing with * as URLS
    if (!importLine.includes('* as') && !importLine.includes('URLS')) {
      // Add the new constants to the import
      const currentImports = importLine.match(/import\s*{([^}]+)}/);
      if (currentImports) {
        const existingImports = currentImports[1].trim();
        const updatedImports = `${existingImports},\n  ${newConstants.join(',\n  ')}`;
        const newImportLine = importLine.replace(/import\s*{[^}]+}/, `import {\n  ${updatedImports}\n}`);
        content = content.replace(importLine, newImportLine);
      }
    }
  }
  
  // Add new functions at the end of the file
  content += '\n\n' + newFunctions;

  fs.writeFileSync(backendHelperPath, content);
}

async function createUrlHelper() {
  const template = `/**
 * @fileoverview URL patterns for API endpoints
 * Generated by AI-First SaaS CLI
 */

export const URL_PATTERNS = {
  // Authentication endpoints
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
};

/**
 * Expand URL pattern with parameters
 */
export function expandUrl(pattern: string, params: Record<string, string | number>): string {
  let url = pattern;
  
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(\`{\${key}}\`, String(value));
  }
  
  return url;
}
`;

  const urlHelperPath = path.join(process.cwd(), 'src/helpers/urlHelper.ts');
  fs.writeFileSync(urlHelperPath, template);
}

async function createBackendHelper() {
  const template = `/**
 * @fileoverview Typed API wrappers for backend communication
 * Generated by AI-First SaaS CLI
 */

import apiHelper from './apiHelper';
import { expandUrl, URL_PATTERNS } from './urlHelper';

// Base response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  authToken: string;
  refreshToken?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

// Authentication API functions
export async function postUserLogin(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
  return apiHelper.post(URL_PATTERNS.LOGIN, credentials);
}

export async function postUserRegister(userData: any): Promise<ApiResponse<AuthResponse>> {
  return apiHelper.post(URL_PATTERNS.REGISTER, userData);
}

export async function putRefreshAccessToken(data: { refreshToken: string }): Promise<ApiResponse<AuthResponse>> {
  return apiHelper.put(URL_PATTERNS.REFRESH_TOKEN, data);
}

export async function deleteUserSignOut(): Promise<ApiResponse<void>> {
  return apiHelper.delete(URL_PATTERNS.LOGOUT);
}
`;

  const backendHelperPath = path.join(process.cwd(), 'src/helpers/backendHelper.ts');
  fs.writeFileSync(backendHelperPath, template);
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const domain = args[0];
  
  if (!domain) {
    console.error('❌ Domain name is required');
    console.log('Usage: node endpoint-generator.js <DomainName>');
    console.log('Example: node endpoint-generator.js UserService');
    process.exit(1);
  }

  generateEndpoints({
    domain,
    description: `API endpoints for ${domain.replace('Service', '')} operations`,
    hasAuth: true,
    hasTenant: false,
    hasWorkspace: false
  }).catch(console.error);
}

module.exports = { generateEndpoints };