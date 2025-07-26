import { BaseClient } from '../../core/base-client.js';

/**
 * Client for Trello Automation features (webhooks, search, batch)
 */
export class AutomationClient extends BaseClient {
  
  // =============================================================================
  // WEBHOOK MANAGEMENT
  // =============================================================================

  /**
   * Retrieves all webhooks for the authenticated user
   * @returns Promise resolving to array of webhooks
   */
  async getWebhooks(): Promise<any[]> {
    return this.request<any[]>(`/webhooks`, 'GET');
  }

  /**
   * Creates a new webhook
   * @param callbackURL - The URL to call when events occur
   * @param idModel - The model ID to watch
   * @param description - Optional description
   * @returns Promise resolving to the created webhook
   */
  async createWebhook(callbackURL: string, idModel: string, description?: string): Promise<any> {
    return this.request<any>(`/webhooks`, 'POST', { callbackURL, idModel, description });
  }

  /**
   * Updates a webhook
   * @param webhookId - The webhook ID
   * @param updates - Properties to update
   * @returns Promise resolving to the updated webhook
   */
  async updateWebhook(webhookId: string, updates: { callbackURL?: string; description?: string; idModel?: string }): Promise<any> {
    return this.request<any>(`/webhooks/${webhookId}`, 'PUT', updates);
  }

  /**
   * Deletes a webhook
   * @param webhookId - The webhook ID
   * @returns Promise resolving when deletion is complete
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.request(`/webhooks/${webhookId}`, 'DELETE');
  }

  // =============================================================================
  // SEARCH
  // =============================================================================

  /**
   * Searches Trello for content
   * @param query - The search query
   * @param modelTypes - Optional array of model types to search
   * @param idBoards - Optional array of board IDs to limit search
   * @param idOrganizations - Optional array of organization IDs to limit search
   * @returns Promise resolving to search results
   */
  async search(query: string, modelTypes?: string[], idBoards?: string[], idOrganizations?: string[]): Promise<any> {
    const params: any = { query };
    if (modelTypes) params.modelTypes = modelTypes.join(',');
    if (idBoards) params.idBoards = idBoards.join(',');
    if (idOrganizations) params.idOrganizations = idOrganizations.join(',');
    return this.request<any>(`/search`, 'GET', params, true);
  }

  /**
   * Performs batch API requests
   * @param urls - Array of API endpoint URLs to call
   * @returns Promise resolving to array of results
   */
  async batch(urls: string[]): Promise<any[]> {
    return this.request<any[]>(`/batch`, 'GET', { urls: urls.join(',') }, true);
  }

  // =============================================================================
  // INVITATIONS
  // =============================================================================

  /**
   * Invites a user to a board
   * @param boardId - The board ID
   * @param email - The user's email
   * @param fullName - The user's full name (optional)
   * @param type - The membership type (optional)
   * @returns Promise resolving to invitation result
   */
  async inviteToBoard(boardId: string, email: string, fullName?: string, type?: string): Promise<any> {
    return this.request<any>(`/boards/${boardId}/members`, 'PUT', { email, fullName, type });
  }
}