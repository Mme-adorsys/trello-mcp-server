import { BaseClient } from '../../core/base-client.js';

/**
 * Client for Trello Label operations
 */
export class LabelClient extends BaseClient {
  
  /**
   * Creates a new label on a board
   * @param boardId - The board ID
   * @param name - The label name
   * @param color - The label color
   * @returns Promise resolving to the created label
   */
  async createLabel(boardId: string, name: string, color: string): Promise<any> {
    return this.request<any>(`/labels`, 'POST', { idBoard: boardId, name, color });
  }

  /**
   * Deletes a label
   * @param labelId - The label ID
   * @returns Promise resolving when deletion is complete
   */
  async deleteLabel(labelId: string): Promise<void> {
    await this.request(`/labels/${labelId}`, 'DELETE');
  }
}