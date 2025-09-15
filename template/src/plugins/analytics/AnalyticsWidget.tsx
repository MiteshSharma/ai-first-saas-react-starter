/**
 * @fileoverview Analytics Widget Component
 *
 * Standalone component for showing analytics data
 * This demonstrates how plugin components can be integrated
 */

import React from 'react';

export const AnalyticsWidget: React.FC = () => {
  const [stats, setStats] = React.useState({
    totalLogins: 0,
    tenantSwitches: 0,
    lastActivity: null as Date | null,
  });

  React.useEffect(() => {
    // Get analytics data from localStorage
    const loadStats = () => {
      const analyticsData = localStorage.getItem('analytics-plugin-data');
      if (analyticsData) {
        try {
          setStats(JSON.parse(analyticsData));
        } catch {
          // Ignore invalid data
        }
      }
    };

    loadStats();

    // Update stats every 2 seconds
    const interval = setInterval(loadStats, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      padding: '16px',
      border: '1px solid #d9d9d9',
      borderRadius: '6px',
      backgroundColor: '#fafafa',
      marginBottom: '16px'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#1890ff' }}>
        📊 Analytics Plugin
      </h4>
      <div style={{ fontSize: '14px' }}>
        <div>Total Logins: <strong>{stats.totalLogins}</strong></div>
        <div>Tenant Switches: <strong>{stats.tenantSwitches}</strong></div>
        <div>
          Last Activity: {stats.lastActivity ?
            new Date(stats.lastActivity).toLocaleTimeString() :
            'None'
          }
        </div>
      </div>
      <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
        🔌 Powered by Plugin System
      </div>
    </div>
  );
};

export default AnalyticsWidget;