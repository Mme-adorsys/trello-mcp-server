import { BaseClient } from '../../core/base-client.js';

/**
 * Client for Trello Power-Up operations
 */
export class PowerUpClient extends BaseClient {
  
  /**
   * Retrieves power-ups enabled on a board
   * @param boardId - The board ID
   * @returns Promise resolving to array of power-ups
   */
  async getBoardPowerUps(boardId: string): Promise<any[]> {
    return this.request<any[]>(`/boards/${boardId}/powerUps`, 'GET');
  }

  /**
   * Enables a power-up on a board
   * @param boardId - The board ID
   * @param powerUp - The power-up name to enable
   * @returns Promise resolving to operation result
   */
  async enableBoardPowerUp(boardId: string, powerUp: string): Promise<any> {
    return this.request<any>(`/boards/${boardId}/powerUps`, 'POST', { value: powerUp });
  }

  /**
   * Disables a power-up on a board
   * @param boardId - The board ID
   * @param powerUp - The power-up name to disable
   * @returns Promise resolving when power-up is disabled
   */
  async disableBoardPowerUp(boardId: string, powerUp: string): Promise<void> {
    await this.request(`/boards/${boardId}/powerUps/${powerUp}`, 'DELETE');
  }
}