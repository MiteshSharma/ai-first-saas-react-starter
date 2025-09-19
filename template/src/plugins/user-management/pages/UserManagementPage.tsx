/**
 * @fileoverview User Management Page
 *
 * Main interface for user management including user list, invitations, and actions
 */

import React, { useEffect, useState } from 'react';
import { useUserManagementStore } from '../stores/userManagementStore';

const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');

  // Get all needed data and actions from store
  const {
    users,
    invitations,
    usersLoading,
    invitationsLoading,
    showInviteModal,
    fetchUsers,
    fetchInvitations,
    setShowInviteModal
  } = useUserManagementStore();

  useEffect(() => {
    // Fetch initial data
    fetchUsers();
    fetchInvitations('tenant-1'); // This should come from tenant context
  }, [fetchUsers, fetchInvitations]);

  const handleInviteUsers = () => {
    setShowInviteModal(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage team members and invitations</p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'users'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'invitations'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Invitations ({invitations.length})
          </button>
        </div>

        <button
          onClick={handleInviteUsers}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          Invite Users
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'users' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Team Members</h2>
            {usersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {user.profile.avatar ? (
                        <img
                          src={user.profile.avatar}
                          alt={user.profile.displayName}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-600 font-medium">
                            {user.profile.firstName?.[0]}{user.profile.lastName?.[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{user.profile.displayName}</h3>
                        <p className="text-gray-600 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                      <span className="text-sm text-gray-600">{user.tenantRole}</span>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No users found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Pending Invitations</h2>
            {invitationsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading invitations...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{invitation.email}</h3>
                      <p className="text-gray-600 text-sm">
                        Invited as {invitation.tenantRole} •
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        invitation.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invitation.status}
                      </span>
                      {invitation.status === 'pending' && (
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Resend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {invitations.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No pending invitations</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal Placeholder */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Invite Users</h2>
            <p className="text-gray-600 mb-4">Invite modal will be implemented here</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Send Invites
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;