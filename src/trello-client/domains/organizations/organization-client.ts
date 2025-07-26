import { BaseClient } from '../../core/base-client.js';
import { TrelloBoard, TrelloOrganization } from '../../core/types.js';

/**
 * Client for Trello Organization operations
 */
export class OrganizationClient extends BaseClient {
  
  /**
   * Retrieves boards for an organization
   * @param params - Object containing organization ID and query parameters
   * @returns Promise resolving to array of boards
   */
  async getOrganizationBoards(params: {
    id: string;
    fields?: string;
    filter?: string;
    lists?: string;
    list_fields?: string;
    members?: string;
    member_fields?: string;
  }): Promise<TrelloBoard[]> {
    const { id, ...query } = params;
    return this.request<TrelloBoard[]>(`/organizations/${id}/boards`, 'GET', query, true);
  }

  /**
   * Invites a user to an organization
   * @param orgId - The organization ID
   * @param email - The user's email
   * @param fullName - The user's full name (optional)
   * @param type - The membership type (optional)
   * @returns Promise resolving to invitation result
   */
  async inviteToOrganization(orgId: string, email: string, fullName?: string, type?: string): Promise<any> {
    return this.request<any>(`/organizations/${orgId}/members`, 'PUT', { email, fullName, type });
  }
}