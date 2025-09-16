/**
 * @fileoverview Layout system exports
 */

export { MainLayout, ProtectedLayout, PublicLayout } from './MainLayout';
export { Header } from './Header';
export { Sidebar } from './Sidebar';
export { LayoutProvider, useLayout } from './LayoutContext';
export * from './types';

// Re-export for convenience
export type {
  MenuItem,
  SidebarWidget,
  HeaderWidget,
  LayoutContext,
  LayoutConfig,
  BreadcrumbItem,
  PageHeader
} from './types';