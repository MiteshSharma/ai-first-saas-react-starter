/**
 * @fileoverview User Management Page
 *
 * Main interface for user management including user list and actions
 */

import React, { useEffect } from 'react';
import { useUserManagementStore } from '../stores/userManagementStore';

const UserManagementPage: React.FC = () => {
  // Get all needed data and actions from store
  const {
    users,
    usersLoading,
    fetchUsers,
  } = useUserManagementStore();

  useEffect(() => {
    // Fetch initial data
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage team members</p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Team Members ({users.length})</h2>
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
      </div>
    </div>
  );
};

export default UserManagementPage;