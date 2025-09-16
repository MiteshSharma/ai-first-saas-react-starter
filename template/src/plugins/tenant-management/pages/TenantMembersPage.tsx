/**
 * @fileoverview Tenant Members Page
 *
 * Page component for managing tenant members and invitations
 */

import React from 'react';
import { useTenantStore } from '../stores/tenantStore';
import { TenantRole, TENANT_ROLES } from '../types';

interface TenantMembersPageProps {
  className?: string;
}

/**
 * Tenant Members Page Component
 */
export const TenantMembersPage: React.FC<TenantMembersPageProps> = ({
  className = ''
}) => {
  const {
    currentTenant,
    tenantUsers,
    pendingInvitations,
    loadTenantUsers,
    inviteUser,
    removeUser,
    updateUserRole,
    loading,
    error
  } = useTenantStore();

  const [showInviteForm, setShowInviteForm] = React.useState(false);
  const [inviteData, setInviteData] = React.useState({
    email: '',
    role: TENANT_ROLES.MEMBER as TenantRole
  });

  React.useEffect(() => {
    if (currentTenant) {
      loadTenantUsers(currentTenant.id);
    }
  }, [currentTenant, loadTenantUsers]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentTenant) return;

    try {
      await inviteUser(currentTenant.id, inviteData.email, inviteData.role);
      setInviteData({ email: '', role: TENANT_ROLES.MEMBER });
      setShowInviteForm(false);
    } catch (error) {
      // Failed to invite user
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!currentTenant || !window.confirm('Are you sure you want to remove this user?')) return;

    try {
      await removeUser(currentTenant.id, userId);
    } catch (error) {
      // Failed to remove user
    }
  };

  const handleRoleChange = async (userId: string, newRole: TenantRole) => {
    if (!currentTenant) return;

    try {
      await updateUserRole(currentTenant.id, userId, newRole);
    } catch (error) {
      // Failed to update user role
    }
  };

  if (!currentTenant) {
    return (
      <div className={`tenant-members-page ${className}`}>
        <div className="no-tenant">
          <h2>No Tenant Selected</h2>
          <p>Please select a tenant to manage members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`tenant-members-page ${className}`}>
      <div className="page-header">
        <h1>Tenant Members</h1>
        <p>Manage members for {currentTenant.name}</p>
        <button
          onClick={() => setShowInviteForm(true)}
          className="primary-button"
        >
          Invite Member
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Invite New Member</h2>
            <form onSubmit={handleInviteSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={inviteData.role}
                  onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value as TenantRole }))}
                >
                  <option value={TENANT_ROLES.MEMBER}>Member</option>
                  <option value={TENANT_ROLES.ADMIN}>Admin</option>
                  <option value={TENANT_ROLES.GUEST}>Guest</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="primary-button"
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Current Members */}
      <div className="members-section">
        <h2>Current Members</h2>
        {loading ? (
          <div className="loading">Loading members...</div>
        ) : tenantUsers.length === 0 ? (
          <div className="no-members">
            <p>No members found.</p>
          </div>
        ) : (
          <div className="members-list">
            {tenantUsers.map((member) => (
              <div key={member.id} className="member-card">
                <div className="member-info">
                  <h3>{member.userId}</h3>
                  <p>Role: {member.role}</p>
                  <p>Joined: {new Date(member.joinedAt).toLocaleDateString()}</p>
                </div>

                <div className="member-actions">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value as TenantRole)}
                    disabled={member.role === TENANT_ROLES.OWNER}
                  >
                    <option value={TENANT_ROLES.GUEST}>Guest</option>
                    <option value={TENANT_ROLES.MEMBER}>Member</option>
                    <option value={TENANT_ROLES.ADMIN}>Admin</option>
                    <option value={TENANT_ROLES.OWNER}>Owner</option>
                  </select>

                  {member.role !== TENANT_ROLES.OWNER && (
                    <button
                      onClick={() => handleRemoveUser(member.userId)}
                      className="danger-button"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="invitations-section">
          <h2>Pending Invitations</h2>
          <div className="invitations-list">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="invitation-card">
                <div className="invitation-info">
                  <h3>{invitation.email}</h3>
                  <p>Role: {invitation.role}</p>
                  <p>Invited: {new Date(invitation.createdAt).toLocaleDateString()}</p>
                  <p>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</p>
                </div>

                <div className="invitation-actions">
                  <span className={`status ${invitation.status}`}>
                    {invitation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantMembersPage;