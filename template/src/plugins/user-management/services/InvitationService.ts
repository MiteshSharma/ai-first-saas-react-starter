/**
 * @fileoverview Invitation Service
 *
 * Service layer for invitation-related API operations
 */

import UserManagementBackendHelper from '../api/backendHelper';
import {
  Invitation,
  SendInvitationRequest,
  InvitationListResponse,
} from '../types';
import { AUDIT_PLUGIN_EVENTS, AUDIT_ACTIONS } from '../../../events';

declare global {
  interface Window {
    eventBus?: {
      emit: (event: string, data: any) => void;
    };
  }
}

/**
 * Invitation management service
 * Handles all invitation-related operations including sending, managing, and accepting invitations
 */
export class InvitationService {
  /**
   * Send invitations to multiple users
   *
   * @param data - Invitation data including emails, tenant ID, and roles
   * @returns Promise<Invitation[]> - Array of created invitations
   */
  async sendInvitation(data: SendInvitationRequest): Promise<Invitation[]> {
    try {
      const invitations = await UserManagementBackendHelper.sendInvitations(data);

      // Log audit event for invitation sending
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit(AUDIT_PLUGIN_EVENTS.AUDIT_EVENT, {
          action: AUDIT_ACTIONS.INVITATION_SENT,
          actorId: 'current-user', // This should come from auth context
          tenantId: data.tenantId,
          meta: {
            emails: data.emails,
            orgRole: data.orgRole,
            workspaceRoles: data.workspaceRoles,
            invitationIds: invitations.map(inv => inv.id),
          }
        });
      }

      return invitations;
    } catch (error) {
      throw new Error('Failed to send invitations. Please try again.');
    }
  }

  /**
   * Get all invitations for a tenant
   *
   * @param tenantId - ID of the tenant to get invitations for
   * @returns Promise<InvitationListResponse> - List of invitations with metadata
   */
  async listInvitations(tenantId: string): Promise<InvitationListResponse> {
    try {
      return await UserManagementBackendHelper.getInvitations(tenantId);
    } catch (error) {
      throw new Error('Failed to fetch invitations. Please try again.');
    }
  }

  /**
   * Cancel a pending invitation
   *
   * @param invitationId - ID of the invitation to cancel
   * @returns Promise<void>
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    try {
      await UserManagementBackendHelper.cancelInvitation(invitationId);

      // Log audit event for invitation cancellation
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit(AUDIT_PLUGIN_EVENTS.AUDIT_EVENT, {
          action: AUDIT_ACTIONS.INVITATION_CANCELLED,
          actorId: 'current-user', // This should come from auth context
          meta: {
            invitationId,
          }
        });
      }
    } catch (error) {
      throw new Error('Failed to cancel invitation. Please try again.');
    }
  }

  /**
   * Resend a pending invitation
   *
   * @param invitationId - ID of the invitation to resend
   * @returns Promise<void>
   */
  async resendInvitation(invitationId: string): Promise<void> {
    try {
      await UserManagementBackendHelper.resendInvitation(invitationId);

      // Log audit event for invitation resending
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit(AUDIT_PLUGIN_EVENTS.AUDIT_EVENT, {
          action: AUDIT_ACTIONS.INVITATION_RESENT,
          actorId: 'current-user', // This should come from auth context
          meta: {
            invitationId,
          }
        });
      }
    } catch (error) {
      throw new Error('Failed to resend invitation. Please try again.');
    }
  }

  /**
   * Accept an invitation using invitation token
   *
   * @param token - Invitation token from email link
   * @returns Promise<void>
   */
  async acceptInvitation(token: string): Promise<void> {
    try {
      await UserManagementBackendHelper.acceptInvitation(token);

      // Log audit event for invitation acceptance
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit(AUDIT_PLUGIN_EVENTS.AUDIT_EVENT, {
          action: AUDIT_ACTIONS.INVITATION_ACCEPTED,
          actorId: 'current-user', // This should come from auth context
          meta: {
            token,
          }
        });
      }
    } catch (error) {
      throw new Error('Failed to accept invitation. Please try again.');
    }
  }

  /**
   * Validate invitation token
   *
   * @param token - Invitation token to validate
   * @returns Promise<boolean> - Whether the token is valid
   */
  async validateInvitationToken(token: string): Promise<boolean> {
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll assume the token is valid if it's not empty
      return !!(token && token.length > 0);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get invitation details by token (for invitation preview)
   *
   * @param token - Invitation token
   * @returns Promise<Invitation | null> - Invitation details or null if not found
   */
  async getInvitationByToken(token: string): Promise<Invitation | null> {
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate by finding in our mock data
      if (!token) {
        throw new Error('Token is required');
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Bulk cancel multiple invitations
   *
   * @param invitationIds - Array of invitation IDs to cancel
   * @returns Promise<void>
   */
  async bulkCancelInvitations(invitationIds: string[]): Promise<void> {
    try {
      await Promise.all(invitationIds.map(id => this.cancelInvitation(id)));
    } catch (error) {
      throw new Error('Failed to cancel invitations. Please try again.');
    }
  }

  /**
   * Bulk resend multiple invitations
   *
   * @param invitationIds - Array of invitation IDs to resend
   * @returns Promise<void>
   */
  async bulkResendInvitations(invitationIds: string[]): Promise<void> {
    try {
      await Promise.all(invitationIds.map(id => this.resendInvitation(id)));
    } catch (error) {
      throw new Error('Failed to resend invitations. Please try again.');
    }
  }

  /**
   * Get invitation statistics for a tenant
   *
   * @param tenantId - Tenant ID to get stats for
   * @returns Promise<object> - Invitation statistics
   */
  async getInvitationStats(tenantId: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    expired: number;
    cancelled: number;
  }> {
    try {
      const response = await this.listInvitations(tenantId);
      const invitations = response.invitations;

      return {
        total: invitations.length,
        pending: invitations.filter(inv => inv.status === 'pending').length,
        accepted: invitations.filter(inv => inv.status === 'accepted').length,
        expired: invitations.filter(inv => inv.status === 'expired').length,
        cancelled: invitations.filter(inv => inv.status === 'cancelled').length,
      };
    } catch (error) {
      throw new Error('Failed to get invitation statistics. Please try again.');
    }
  }
}

// Export singleton instance
const invitationService = new InvitationService();
export default invitationService;