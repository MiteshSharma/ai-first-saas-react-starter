import React from 'react';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { routes } from './router';
import { PluginManager } from './core/plugins/PluginManager';
import { eventBus } from './core/plugins/EventBus';
import { CoreEventIntegration } from './core/plugins/CoreEventIntegration';
import pluginManifest from './plugins/pluginRegistry';
import { SYSTEM_EVENTS } from './core/plugins/coreEvents';
import { useAuthStore } from './core/auth/AuthStore';
import { useTenantStore } from './core/stores/tenant/tenantStore';
import { logger } from './core/utils/logger';

const AppRoutes: React.FC = () => {
  const routeElements = useRoutes(routes);
  return <>{routeElements}</>;
};

// Plugin initialization component
const PluginProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pluginsInitialized, setPluginsInitialized] = React.useState(false);

  React.useEffect(() => {
    const initializePlugins = async () => {
      try {
        logger.info('Initializing plugin system...', 'App');

        // Emit app init event
        eventBus.emit(SYSTEM_EVENTS.APP_INIT, {}, 'App');

        // Initialize Core Event Integration
        logger.info('Setting up Core Event Integration...', 'App');
        const coreEventIntegration = new CoreEventIntegration(eventBus);

        // Get core store instances with proper typing
        const authStore = useAuthStore.getState();
        const tenantStore = useTenantStore.getState();

        // Add required methods to the stores
        const authStoreWithMethods = {
          ...authStore,
          subscribe: useAuthStore.subscribe,
          getState: useAuthStore.getState,
        };

        const tenantStoreWithMethods = {
          ...tenantStore,
          subscribe: useTenantStore.subscribe,
          getState: useTenantStore.getState,
        };

        // Initialize core event integration with stores
        coreEventIntegration.initialize({
          auth: authStoreWithMethods,
          tenant: tenantStoreWithMethods,
        });

        // Initialize plugin manager
        const pluginManager = PluginManager.getInstance(eventBus);

        // Load plugins from manifest
        for (const pluginConfig of pluginManifest.plugins) {
          if (pluginConfig.enabled && pluginConfig.autoLoad) {
            try {
              const plugin = new pluginConfig.pluginClass();
              await pluginManager.installPlugin(plugin);
              await pluginManager.activatePlugin(plugin.name);
            } catch (error) {
              logger.error(`Failed to load plugin ${pluginConfig.name}`, 'App', error);
            }
          }
        }

        // Emit app ready event
        eventBus.emit(SYSTEM_EVENTS.APP_READY, {}, 'App');

        setPluginsInitialized(true);
        logger.info('Plugin system initialized successfully', 'App');
      } catch (error) {
        logger.error('Failed to initialize plugin system', 'App', error);
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
