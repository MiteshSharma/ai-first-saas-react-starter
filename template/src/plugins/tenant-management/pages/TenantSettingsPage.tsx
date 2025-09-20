/**
 * @fileoverview Tenant Settings Page
 *
 * Page component for managing tenant settings and configuration
 */

import React from 'react';
import { useTenantStore } from '../stores/tenantStore';
import { TenantSettings, UpdateTenantPayload } from '../types';

interface TenantSettingsPageProps {
  className?: string;
}

/**
 * Tenant Settings Page Component
 */
export const TenantSettingsPage: React.FC<TenantSettingsPageProps> = ({
  className = ''
}) => {
  const {
    currentTenant,
    updateTenant,
    loading,
    error
  } = useTenantStore();

  const [formData, setFormData] = React.useState<UpdateTenantPayload>({
    name: currentTenant?.name || '',
    settings: currentTenant?.settings
  });

  React.useEffect(() => {
    if (currentTenant) {
      setFormData({
        name: currentTenant.name,
        settings: currentTenant.settings
      });
    }
  }, [currentTenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentTenant) return;

    try {
      await updateTenant(currentTenant.id, formData);
      // Success feedback could be handled by the store or a notification system
    } catch (error) {
      // Failed to update tenant
    }
  };

  const handleSettingsChange = (key: keyof TenantSettings, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  };

  if (!currentTenant) {
    return (
      <div className={`tenant-settings-page ${className}`}>
        <div className="no-tenant">
          <h2>No Tenant Selected</h2>
          <p>Please select a tenant to manage settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`tenant-settings-page ${className}`}>
      <div className="page-header">
        <h1>Tenant Settings</h1>
        <p>Manage settings for {currentTenant.name}</p>
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="tenant-settings-form">
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label htmlFor="name">Tenant Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

        </div>

        <div className="form-section">
          <h2>Regional Settings</h2>

          <div className="form-group">
            <label htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              value={formData.settings?.timezone || 'UTC'}
              onChange={(e) => handleSettingsChange('timezone', e.target.value)}
            >
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="PST">Pacific Time</option>
              <option value="GMT">Greenwich Mean Time</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={formData.settings?.currency || 'USD'}
              onChange={(e) => handleSettingsChange('currency', e.target.value)}
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              value={formData.settings?.language || 'en'}
              onChange={(e) => handleSettingsChange('language', e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>Branding</h2>

          <div className="form-group">
            <label htmlFor="primaryColor">Primary Color</label>
            <input
              type="color"
              id="primaryColor"
              value={formData.settings?.branding?.primaryColor || '#1890ff'}
              onChange={(e) => handleSettingsChange('branding', {
                ...formData.settings?.branding,
                primaryColor: e.target.value
              })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="secondaryColor">Secondary Color</label>
            <input
              type="color"
              id="secondaryColor"
              value={formData.settings?.branding?.secondaryColor || '#52c41a'}
              onChange={(e) => handleSettingsChange('branding', {
                ...formData.settings?.branding,
                secondaryColor: e.target.value
              })}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="primary-button"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TenantSettingsPage;