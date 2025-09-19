/**
 * @fileoverview Invite Users Modal Component
 *
 * Modal for inviting multiple users with role assignment
 */

import React from 'react';

interface InviteUsersModalProps {
  onClose: () => void;
}

export const InviteUsersModal: React.FC<InviteUsersModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Invite Users</h2>
        <p className="text-gray-600 mb-4">Invite modal implementation coming soon...</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Send Invites
          </button>
        </div>
      </div>
    </div>
  );
};