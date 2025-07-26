import { BaseClient } from '../../core/base-client.js';
import { TrelloCard } from '../../core/types.js';
import { CreateCardOptions } from './card-types.js';

/**
 * Client for basic Trello Card operations
 * Handles core card functionality including CRUD operations, moving, and basic management
 */
export class CardClient extends BaseClient {
  
  // =============================================================================
  // BASIC CARD OPERATIONS
  // =============================================================================

  /**
   * Retrieves all cards for a specific board
   * @param boardId - The board ID to get cards from
   * @returns Promise resolving to array of cards
   * @example
   * ```typescript
   * const cards = await cardClient.getCards('5f1b2c3d4e5f6a7b8c9d0e1f');
   * console.log(`Found ${cards.length} cards`);
   * ```
   */
  async getCards(boardId: string): Promise<TrelloCard[]> {
    return this.request<TrelloCard[]>(`/boards/${boardId}/cards`);
  }

  /**
   * Retrieves a specific card by ID
   * @param cardId - The card ID to retrieve
   * @returns Promise resolving to the card details
   * @throws {Error} If card is not found or access is denied
   * @example
   * ```typescript
   * const card = await cardClient.getCard('5f1b2c3d4e5f6a7b8c9d0e1f');
   * console.log(card.name); // Card name
   * ```
   */
  async getCard(cardId: string): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}`);
  }

  /**
   * Creates a new card in a list
   * @param options - Card creation options (idList is required)
   * @returns Promise resolving to the created card
   * @throws {Error} If creation fails due to invalid options
   * @example
   * ```typescript
   * const card = await cardClient.createCard({
   *   idList: '5f1b2c3d4e5f6a7b8c9d0e1f',
   *   name: 'New Task',
   *   desc: 'Task description',
   *   due: '2024-12-31T23:59:59.000Z'
   * });
   * ```
   */
  async createCard(options: CreateCardOptions): Promise<TrelloCard> {
    return this.request<TrelloCard>('/cards', 'POST', options, true);
  }

  /**
   * Updates a card's properties
   * @param cardId - The card ID to update
   * @param updates - Partial card object with properties to update
   * @returns Promise resolving to the updated card
   * @throws {Error} If card is not found or user lacks permission
   * @example
   * ```typescript
   * const updatedCard = await cardClient.updateCard('card-id', {
   *   name: 'Updated Task Name',
   *   desc: 'Updated description'
   * });
   * ```
   */
  async updateCard(cardId: string, updates: Partial<TrelloCard>): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}`, 'PUT', updates);
  }

  /**
   * Moves a card to a different list
   * @param cardId - The card ID to move
   * @param listId - The destination list ID
   * @param pos - Optional position in the new list (number or 'top'/'bottom')
   * @returns Promise resolving to the updated card
   * @throws {Error} If card or list is not found or user lacks permission
   * @example
   * ```typescript
   * // Move card to top of another list
   * const movedCard = await cardClient.moveCard('card-id', 'new-list-id', 'top');
   * ```
   */
  async moveCard(cardId: string, listId: string, pos?: number): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}`, 'PUT', { idList: listId, pos });
  }

  /**
   * Permanently deletes a card
   * @param cardId - The card ID to delete
   * @returns Promise resolving when deletion is complete
   * @throws {Error} If card is not found or user lacks permission
   * @example
   * ```typescript
   * await cardClient.deleteCard('5f1b2c3d4e5f6a7b8c9d0e1f');
   * ```
   */
  async deleteCard(cardId: string): Promise<void> {
    await this.request(`/cards/${cardId}`, 'DELETE');
  }

  // =============================================================================
  // CARD STATE MANAGEMENT
  // =============================================================================

  /**
   * Archives a card
   * @param cardId - The card ID to archive
   * @returns Promise resolving to the updated card
   * @throws {Error} If card is not found or user lacks permission
   * @example
   * ```typescript
   * const archivedCard = await cardClient.archiveCard('card-id');
   * console.log(archivedCard.closed); // true
   * ```
   */
  async archiveCard(cardId: string): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}`, 'PUT', { closed: true });
  }

  /**
   * Unarchives a card
   * @param cardId - The card ID to unarchive
   * @returns Promise resolving to the updated card
   * @throws {Error} If card is not found or user lacks permission
   * @example
   * ```typescript
   * const unarchivedCard = await cardClient.unarchiveCard('card-id');
   * console.log(unarchivedCard.closed); // false
   * ```
   */
  async unarchiveCard(cardId: string): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}`, 'PUT', { closed: false });
  }

  /**
   * Creates a copy of a card
   * @param cardId - The source card ID to copy
   * @param listId - The destination list ID
   * @param name - Optional name for the new card (defaults to original name)
   * @returns Promise resolving to the created card
   * @throws {Error} If source card or destination list is not found
   * @example
   * ```typescript
   * const copiedCard = await cardClient.copyCard('source-card-id', 'dest-list-id', 'Copy of Task');
   * ```
   */
  async copyCard(cardId: string, listId: string, name?: string): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards`, 'POST', { idCardSource: cardId, idList: listId, name });
  }

  /**
   * Subscribes or unsubscribes from card notifications
   * @param cardId - The card ID
   * @param value - Whether to subscribe (true) or unsubscribe (false)
   * @returns Promise resolving to the updated card
   * @example
   * ```typescript
   * await cardClient.subscribeToCard('card-id', true); // Subscribe
   * await cardClient.subscribeToCard('card-id', false); // Unsubscribe
   * ```
   */
  async subscribeToCard(cardId: string, value: boolean): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}/subscribed`, 'PUT', { value });
  }

  /**
   * Votes on a card (if voting power-up is enabled)
   * @param cardId - The card ID
   * @param value - Whether to add vote (true) or remove vote (false)
   * @returns Promise resolving to operation result
   * @example
   * ```typescript
   * await cardClient.voteOnCard('card-id', true); // Add vote
   * await cardClient.voteOnCard('card-id', false); // Remove vote
   * ```
   */
  async voteOnCard(cardId: string, value: boolean): Promise<any> {
    return this.request<any>(`/cards/${cardId}/membersVoted`, value ? 'POST' : 'DELETE');
  }
}