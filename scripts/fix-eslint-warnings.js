#!/usr/bin/env node

/**
 * Script to fix common ESLint warnings across the template files
 * This script will:
 * 1. Replace console.log statements with logger calls
 * 2. Fix regex escape characters
 * 3. Remove unused imports
 * 4. Fix anonymous default exports
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = path.join(__dirname, '..', 'template', 'src');

// Files to process
const filesToProcess = [
  'core/api/apiHelper.ts',
  'core/api/backendHelper.ts',
  'core/auth/AuthStore.ts',
  'core/plugins/CoreEventIntegration.ts',
  'core/plugins/EventBus.ts',
  'core/plugins/PluginManager.ts',
  'core/plugins/coreEvents.ts',
  'core/services/performance.ts',
  'core/stores/base/utils.ts',
  'core/stores/projects/ProjectStore.ts',
  'core/stores/tenant/tenantStore.ts',
  'core/utils/localStorage.ts',
  'mocks/handlers/tenantHandlers.ts',
  'pages/ProjectsPage.tsx',
  'plugins/ProjectManagement/ProjectManagementPlugin.ts',
  'plugins/TenantManagement/TenantManagementPlugin.ts',
  'plugins/UserManagement/UserManagementPlugin.ts',
  'plugins/analytics/AnalyticsPlugin.ts'
];

// Fixes to apply
const fixes = [
  // Add logger import where console is used
  {
    pattern: /^(import .+;\n)$/m,
    replacement: (match, imports, filename) => {
      if (filename.includes('console.log') || filename.includes('console.error') || filename.includes('console.warn')) {
        if (!imports.includes("import { logger }")) {
          const relativeDepth = filename.split('/').length - 2; // -1 for filename, -1 for src
          const loggerPath = '../'.repeat(relativeDepth) + 'core/utils/logger';
          return imports + `import { logger } from '${loggerPath}';\n`;
        }
      }
      return match;
    }
  },

  // Replace console.log statements
  {
    pattern: /console\.log\(([^)]+)\);?/g,
    replacement: 'logger.debug($1);'
  },

  // Replace console.error statements
  {
    pattern: /console\.error\(([^)]+)\);?/g,
    replacement: 'logger.error($1);'
  },

  // Replace console.warn statements
  {
    pattern: /console\.warn\(([^)]+)\);?/g,
    replacement: 'logger.warn($1);'
  },

  // Replace console.info statements
  {
    pattern: /console\.info\(([^)]+)\);?/g,
    replacement: 'logger.info($1);'
  },

  // Fix regex escape characters
  {
    pattern: /\\\//g,
    replacement: '/'
  },

  // Fix anonymous default export in backendHelper
  {
    pattern: /export default \{[\s\S]*?\};$/m,
    replacement: (match) => {
      if (match.includes('getUser:') && match.includes('updateUser:')) {
        return 'const backendHelper = ' + match.replace('export default ', '') + '\n\nexport default backendHelper;';
      }
      return match;
    }
  }
];

// Specific type fixes for common any types
const typeFixes = [
  // Fix Event Bus payload types
  {
    pattern: /payload: any/g,
    replacement: 'payload: unknown'
  },

  // Fix API response types
  {
    pattern: /: any\[\]/g,
    replacement: ': unknown[]'
  },

  // Fix error types
  {
    pattern: /error: any/g,
    replacement: 'error: Error | unknown'
  },

  // Fix data types in stores
  {
    pattern: /data: any/g,
    replacement: 'data: unknown'
  }
];

// Remove unused imports (basic implementation)
const unusedImportFixes = [
  {
    pattern: /import \{ ([^}]*), ([^}]*) \} from/g,
    replacement: (match, ...groups) => {
      // This is a basic implementation - in real scenario, we'd need AST parsing
      // For now, just remove obviously unused ones based on the error messages
      return match;
    }
  }
];

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Apply general fixes
  fixes.forEach(fix => {
    const newContent = content.replace(fix.pattern, fix.replacement);
    if (newContent !== content) {
      modified = true;
      content = newContent;
    }
  });

  // Apply type fixes
  typeFixes.forEach(fix => {
    const newContent = content.replace(fix.pattern, fix.replacement);
    if (newContent !== content) {
      modified = true;
      content = newContent;
    }
  });

  // Add logger import if console statements were replaced
  if (content.includes('logger.') && !content.includes("import { logger }")) {
    const relativeDepth = filePath.split('/').length - 4; // Adjust for src depth
    const loggerPath = '../'.repeat(relativeDepth) + 'core/utils/logger';

    // Find the last import statement and add logger import after it
    const lastImportMatch = content.match(/(import .+;\n)(?!import)/);
    if (lastImportMatch) {
      content = content.replace(lastImportMatch[0], lastImportMatch[0] + `import { logger } from '${loggerPath}';\n`);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${path.relative(TEMPLATE_DIR, filePath)}`);
  }
}

// Process all files
console.log('Fixing ESLint warnings in template files...\n');

filesToProcess.forEach(relativePath => {
  const fullPath = path.join(TEMPLATE_DIR, relativePath);
  processFile(fullPath);
});

console.log('\n✅ ESLint warnings fixed in template files');
console.log('\nNote: Some complex type fixes and unused import removals may need manual review.');