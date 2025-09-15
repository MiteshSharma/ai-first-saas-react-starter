/**
 * @fileoverview Layout Context for plugin system integration
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MenuItem, SidebarWidget, HeaderWidget, LayoutContext as ILayoutContext } from './types';

interface LayoutProviderProps {
  children: React.ReactNode;
}

interface LayoutState {
  menuItems: MenuItem[];
  sidebarWidgets: SidebarWidget[];
  headerWidgets: HeaderWidget[];
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
}

// Create context
const LayoutContext = createContext<ILayoutContext | null>(null);

/**
 * Layout Provider component that manages layout state and plugin registrations
 */
export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [state, setState] = useState<LayoutState>({
    menuItems: [],
    sidebarWidgets: [],
    headerWidgets: [],
    sidebarCollapsed: false,
    theme: 'light'
  });

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark';
    const savedCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';

    setState(prev => ({
      ...prev,
      theme: savedTheme || 'light',
      sidebarCollapsed: savedCollapsed
    }));
  }, []);

  // Register menu item
  const registerMenuItem = useCallback((item: MenuItem) => {
    setState(prev => ({
      ...prev,
      menuItems: [...prev.menuItems, item].sort((a, b) => (a.order || 0) - (b.order || 0))
    }));

    // Return cleanup function
    return () => {
      setState(prev => ({
        ...prev,
        menuItems: prev.menuItems.filter(i => i.id !== item.id)
      }));
    };
  }, []);

  // Unregister menu item
  const unregisterMenuItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      menuItems: prev.menuItems.filter(item => item.id !== id)
    }));
  }, []);

  // Register sidebar widget
  const registerSidebarWidget = useCallback((widget: SidebarWidget) => {
    setState(prev => ({
      ...prev,
      sidebarWidgets: [...prev.sidebarWidgets, widget].sort((a, b) => (a.order || 0) - (b.order || 0))
    }));

    // Return cleanup function
    return () => {
      setState(prev => ({
        ...prev,
        sidebarWidgets: prev.sidebarWidgets.filter(w => w.id !== widget.id)
      }));
    };
  }, []);

  // Register header widget
  const registerHeaderWidget = useCallback((widget: HeaderWidget) => {
    setState(prev => ({
      ...prev,
      headerWidgets: [...prev.headerWidgets, widget].sort((a, b) => (a.order || 0) - (b.order || 0))
    }));

    // Return cleanup function
    return () => {
      setState(prev => ({
        ...prev,
        headerWidgets: prev.headerWidgets.filter(w => w.id !== widget.id)
      }));
    };
  }, []);

  // Set sidebar collapsed state
  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState(prev => ({ ...prev, sidebarCollapsed: collapsed }));
    localStorage.setItem('sidebar-collapsed', collapsed.toString());
  }, []);

  // Set theme
  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setState(prev => ({ ...prev, theme }));
    localStorage.setItem('app-theme', theme);
  }, []);

  const contextValue: ILayoutContext = {
    registerMenuItem,
    unregisterMenuItem,
    registerSidebarWidget,
    registerHeaderWidget,
    sidebarCollapsed: state.sidebarCollapsed,
    setSidebarCollapsed,
    theme: state.theme,
    setTheme
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

/**
 * Hook to use layout context
 */
export const useLayout = (): ILayoutContext => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

/**
 * Hook to get layout state (for layout components)
 */
export const useLayoutState = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutState must be used within a LayoutProvider');
  }

  // Access internal state through context
  return {
    menuItems: [], // Will be populated by accessing the provider state
    sidebarWidgets: [], // Will be populated by accessing the provider state
    headerWidgets: [], // Will be populated by accessing the provider state
    sidebarCollapsed: context.sidebarCollapsed,
    theme: context.theme
  };
};

export default LayoutContext;