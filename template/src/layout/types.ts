/**
 * @fileoverview Layout system types and interfaces for plugin-based architecture
 */

import React from 'react';

// Navigation menu item interface
export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  onClick?: () => void;
  children?: MenuItem[];
  badge?: string | number;
  disabled?: boolean;
  group?: string;
  order?: number;
}

// Sidebar widget interface
export interface SidebarWidget {
  id: string;
  component: React.ComponentType;
  position: 'top' | 'bottom';
  order?: number;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
}

// Header widget interface
export interface HeaderWidget {
  id: string;
  component: React.ComponentType;
  position: 'left' | 'center' | 'right';
  order?: number;
}

// Layout context interface for plugins
export interface LayoutContext {
  // Navigation registration
  registerMenuItem: (item: MenuItem) => () => void;
  unregisterMenuItem: (id: string) => void;

  // Widget registration
  registerSidebarWidget: (widget: SidebarWidget) => () => void;
  registerHeaderWidget: (widget: HeaderWidget) => () => void;

  // Layout state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

// Layout configuration
export interface LayoutConfig {
  showSidebar?: boolean;
  showHeader?: boolean;
  sidebarCollapsible?: boolean;
  headerFixed?: boolean;
  maxContentWidth?: number;
}

// Breadcrumb interface
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

// Page header interface
export interface PageHeader {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode[];
}