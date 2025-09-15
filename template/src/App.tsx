import React from 'react';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { routes } from './router';

// Import new plugin system (Plan 3)
import { eventBus, CORE_EVENTS, PluginManager } from './core/plugin-system';
import { createAuthContext } from './core/auth/AuthContext';

// Import layout system (Phase 3)
import { MainLayout } from './core/layout';

// Import plugins (they auto-register themselves)
import './plugins/test'; // Test plugin
import './plugins/tenant-management'; // Tenant management plugin

const AppRoutes: React.FC = () => {
  const routeElements = useRoutes(routes);
  return (
    <MainLayout>
      {routeElements}
    </MainLayout>
  );
};

// Plugin initialization component
const PluginProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pluginsInitialized, setPluginsInitialized] = React.useState(false);

  React.useEffect(() => {
    const initializePlugins = async () => {
      try {

        // Initialize plugin manager with auth context
        const authContext = createAuthContext();
        PluginManager.initialize(authContext);

        // Emit app init event
        eventBus.emit(CORE_EVENTS.APP_INITIALIZED, {
          timestamp: new Date(),
          version: '1.0.0'
        });

        // Plugins are already auto-registered via imports
        // No need for complex initialization

        setPluginsInitialized(true);
      } catch (error) {
        setPluginsInitialized(true); // Continue anyway
      }
    };

    initializePlugins();
  }, []);

  if (!pluginsInitialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div>🔌 Loading plugins...</div>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <PluginProvider>
        <AppRoutes />
      </PluginProvider>
    </BrowserRouter>
  );
};

export default App;