import { BaseClient } from '../../core/base-client.js';
import { TrelloMember, TrelloOrganization } from '../../core/types.js';

/**
 * Client for Trello Member operations
 * Handles member queries and organization relationships
 */
export class MemberClient extends BaseClient {
  
  /**
   * Retrieves members of a board
   * @param boardId - The board ID
   * @returns Promise resolving to array of members
   */
  async getBoardMembers(boardId: string): Promise<TrelloMember[]> {
    return this.request<TrelloMember[]>(`/boards/${boardId}/members`);
  }

  /**
   * Removes a member from a board
   * @param boardId - The board ID
   * @param memberId - The member ID to remove
   * @returns Promise resolving when removal is complete
   */
  async removeMemberFromBoard(boardId: string, memberId: string): Promise<void> {
    await this.request(`/boards/${boardId}/members/${memberId}`, 'DELETE');
  }

  /**
   * Retrieves organizations for the authenticated user
   * @returns Promise resolving to array of organizations
   */
  async getOrganizations(): Promise<TrelloOrganization[]> {
    return this.request<TrelloOrganization[]>(`/members/me/organizations`);
  }

  /**
   * Retrieves organizations for a specific member
   * @param params - Object containing member ID and query parameters
   * @returns Promise resolving to array of organizations
   */
  async getMemberOrganizations(params: {
    id: string;
    filter?: 'all' | 'members' | 'none' | 'public';
    fields?: string;
    paid_account?: boolean;
  }): Promise<TrelloOrganization[]> {
    const { id, ...query } = params;
    return this.request<TrelloOrganization[]>(`/members/${id}/organizations`, 'GET', query, true);
  }
}