import { BaseClient } from '../../core/base-client.js';

/**
 * Client for Trello Custom Field operations
 */
export class CustomFieldClient extends BaseClient {
  
  /**
   * Retrieves custom fields for a board
   * @param boardId - The board ID
   * @returns Promise resolving to array of custom fields
   */
  async getBoardCustomFields(boardId: string): Promise<any[]> {
    return this.request<any[]>(`/boards/${boardId}/customFields`, 'GET');
  }

  /**
   * Creates a new custom field
   * @param params - Custom field creation parameters
   * @returns Promise resolving to the created custom field
   */
  async createCustomField(params: {
    idModel: string;
    modelType: 'board';
    name: string;
    type: 'checkbox' | 'list' | 'number' | 'text' | 'date';
    options?: string;
    pos: string | number;
    display_cardFront?: boolean;
  }): Promise<any> {
    return this.request<any>(`/customFields`, 'POST', params);
  }

  /**
   * Retrieves a custom field by ID
   * @param customFieldId - The custom field ID
   * @returns Promise resolving to the custom field
   */
  async getCustomField(customFieldId: string): Promise<any> {
    return this.request<any>(`/customFields/${customFieldId}`, 'GET');
  }

  /**
   * Updates a custom field
   * @param customFieldId - The custom field ID
   * @param params - Properties to update
   * @returns Promise resolving to the updated custom field
   */
  async updateCustomField(customFieldId: string, params: {
    name?: string;
    pos?: string | number;
    'display/cardFront'?: boolean;
  }): Promise<any> {
    return this.request<any>(`/customFields/${customFieldId}`, 'PUT', params);
  }

  /**
   * Deletes a custom field
   * @param customFieldId - The custom field ID
   * @returns Promise resolving when deletion is complete
   */
  async deleteCustomField(customFieldId: string): Promise<void> {
    await this.request(`/customFields/${customFieldId}`, 'DELETE');
  }

  /**
   * Retrieves options for a custom field
   * @param customFieldId - The custom field ID
   * @returns Promise resolving to array of options
   */
  async getCustomFieldOptions(customFieldId: string): Promise<any[]> {
    return this.request<any[]>(`/customFields/${customFieldId}/options`, 'GET');
  }

  /**
   * Adds an option to a custom field
   * @param customFieldId - The custom field ID
   * @returns Promise resolving to the created option
   */
  async addCustomFieldOption(customFieldId: string): Promise<any> {
    return this.request<any>(`/customFields/${customFieldId}/options`, 'POST');
  }

  /**
   * Retrieves a specific custom field option
   * @param customFieldId - The custom field ID
   * @param optionId - The option ID
   * @returns Promise resolving to the option
   */
  async getCustomFieldOption(customFieldId: string, optionId: string): Promise<any> {
    return this.request<any>(`/customFields/${customFieldId}/options/${optionId}`, 'GET');
  }

  /**
   * Deletes a custom field option
   * @param customFieldId - The custom field ID
   * @param optionId - The option ID
   * @returns Promise resolving when deletion is complete
   */
  async deleteCustomFieldOption(customFieldId: string, optionId: string): Promise<void> {
    await this.request(`/customFields/${customFieldId}/options/${optionId}`, 'DELETE');
  }
}