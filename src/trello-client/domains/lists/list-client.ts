import { BaseClient } from '../../core/base-client.js';
import { TrelloList, TrelloCard } from '../../core/types.js';
import { 
  CreateListOptions, 
  UpdateListParams, 
  MoveAllCardsParams,
  UpdateListFieldParams 
} from './list-types.js';

/**
 * Client for Trello List operations
 * Handles all list-related functionality including CRUD operations,
 * positioning, archiving, and card management within lists
 */
export class ListClient extends BaseClient {
  
  // =============================================================================
  // BASIC LIST OPERATIONS
  // =============================================================================

  /**
   * Retrieves all lists for a specific board
   * @param boardId - The board ID to get lists from
   * @param cards - Whether to include cards in the response ('all' or 'none')
   * @param fields - Comma-separated list of fields to return (empty for all)
   * @returns Promise resolving to array of lists
   * @example
   * ```typescript
   * // Get all lists without cards
   * const lists = await listClient.getLists('5f1b2c3d4e5f6a7b8c9d0e1f');
   * 
   * // Get lists with cards included
   * const listsWithCards = await listClient.getLists('5f1b2c3d4e5f6a7b8c9d0e1f', 'all');
   * ```
   */
  async getLists(boardId: string, cards: 'all' | 'none' = 'none', fields: string = ''): Promise<TrelloList[]> {
    return this.request<TrelloList[]>(`/boards/${boardId}/lists?cards=${cards}&fields=${fields}`);
  }

  /**
   * Retrieves a specific list by ID
   * @param params - Object containing list ID and optional field filter
   * @returns Promise resolving to the list details
   * @throws {Error} If list is not found or access is denied
   * @example
   * ```typescript
   * const list = await listClient.getList({ id: '5f1b2c3d4e5f6a7b8c9d0e1f' });
   * console.log(list.name); // List name
   * ```
   */
  async getList(params: { id: string; fields?: string }): Promise<TrelloList> {
    const { id, ...query } = params;
    return this.request<TrelloList>(`/lists/${id}`, 'GET', query, true);
  }

  /**
   * Creates a new list on a board
   * @param params - Object containing list creation parameters
   * @returns Promise resolving to the created list
   * @throws {Error} If creation fails due to invalid parameters
   * @example
   * ```typescript
   * const newList = await listClient.createList({
   *   name: 'To Do',
   *   idBoard: '5f1b2c3d4e5f6a7b8c9d0e1f',
   *   pos: 'bottom'
   * });
   * ```
   */
  async createList(params: CreateListOptions): Promise<TrelloList> {
    return this.request<TrelloList>(`/lists`, 'POST', params, true);
  }

  /**
   * Updates a list's properties
   * @param params - Object containing list ID and properties to update
   * @returns Promise resolving to the updated list
   * @throws {Error} If list is not found or user lacks permission
   * @example
   * ```typescript
   * const updatedList = await listClient.updateList({
   *   id: '5f1b2c3d4e5f6a7b8c9d0e1f',
   *   name: 'Updated List Name',
   *   pos: 'top'
   * });
   * ```
   */
  async updateList(params: UpdateListParams): Promise<TrelloList> {
    const { id, ...query } = params;
    return this.request<TrelloList>(`/lists/${id}`, 'PUT', query, true);
  }

  /**
   * Closes (archives) a list
   * @param listId - The list ID to close
   * @returns Promise resolving to the updated list
   * @throws {Error} If list is not found or user lacks permission
   * @example
   * ```typescript
   * const closedList = await listClient.closeList('5f1b2c3d4e5f6a7b8c9d0e1f');
   * console.log(closedList.closed); // true
   * ```
   */
  async closeList(listId: string): Promise<TrelloList> {
    return this.request<TrelloList>(`/lists/${listId}`, 'PUT', { closed: true });
  }

  // =============================================================================
  // LIST MANAGEMENT OPERATIONS
  // =============================================================================

  /**
   * Archives all cards in a list
   * @param id - The list ID
   * @returns Promise resolving to operation result
   * @example
   * ```typescript
   * await listClient.archiveAllCardsInList('5f1b2c3d4e5f6a7b8c9d0e1f');
   * ```
   */
  async archiveAllCardsInList(id: string): Promise<any> {
    return this.request(`/lists/${id}/archiveAllCards`, 'POST');
  }

  /**
   * Moves all cards from one list to another
   * @param params - Object containing source list ID and destination board/list
   * @returns Promise resolving to operation result
   * @example
   * ```typescript
   * await listClient.moveAllCardsInList({
   *   id: 'source-list-id',
   *   idBoard: 'board-id',
   *   idList: 'destination-list-id'
   * });
   * ```
   */
  async moveAllCardsInList(params: MoveAllCardsParams): Promise<any> {
    const { id, ...query } = params;
    return this.request(`/lists/${id}/moveAllCards`, 'POST', query, true);
  }

  /**
   * Sets the closed state of a list
   * @param params - Object containing list ID and closed state
   * @returns Promise resolving to the updated list
   * @example
   * ```typescript
   * // Archive a list
   * await listClient.setListClosed({ id: 'list-id', value: true });
   * ```
   */
  async setListClosed(params: { id: string; value: boolean }): Promise<TrelloList> {
    const { id, ...query } = params;
    return this.request<TrelloList>(`/lists/${id}/closed`, 'PUT', query, true);
  }

  /**
   * Moves a list to a different board
   * @param params - Object containing list ID and destination board ID
   * @returns Promise resolving to the updated list
   * @example
   * ```typescript
   * const movedList = await listClient.moveListToBoard({
   *   id: 'list-id',
   *   value: 'destination-board-id'
   * });
   * ```
   */
  async moveListToBoard(params: { id: string; value: string }): Promise<TrelloList> {
    const { id, ...query } = params;
    return this.request<TrelloList>(`/lists/${id}/idBoard`, 'PUT', query, true);
  }

  /**
   * Updates a specific field of a list
   * @param params - Object containing list ID, field name, and new value
   * @returns Promise resolving to the updated list
   * @example
   * ```typescript
   * // Update list name
   * await listClient.updateListField({
   *   id: 'list-id',
   *   field: 'name',
   *   value: 'New List Name'
   * });
   * ```
   */
  async updateListField(params: UpdateListFieldParams): Promise<TrelloList> {
    const { id, field, ...query } = params;
    return this.request<TrelloList>(`/lists/${id}/${field}`, 'PUT', query, true);
  }

  // =============================================================================
  // LIST CONTENT AND RELATIONSHIPS
  // =============================================================================

  /**
   * Retrieves cards from a specific list
   * @param id - The list ID
   * @param fields - Comma-separated list of fields to return ('all' for all fields)
   * @returns Promise resolving to array of cards
   * @example
   * ```typescript
   * const cards = await listClient.getListCards('list-id');
   * ```
   */
  async getListCards(id: string, fields: string = 'all'): Promise<TrelloCard[]> {
    return this.request<TrelloCard[]>(`/lists/${id}/cards?fields=${fields}`, 'GET');
  }

  /**
   * Retrieves actions (activity history) for a list
   * @param params - Object containing list ID and optional filter
   * @returns Promise resolving to array of actions
   * @example
   * ```typescript
   * const actions = await listClient.getListActions({
   *   id: 'list-id',
   *   filter: 'createCard,updateCard'
   * });
   * ```
   */
  async getListActions(params: { id: string; filter?: string }): Promise<any[]> {
    const { id, ...query } = params;
    return this.request<any[]>(`/lists/${id}/actions`, 'GET', query, true);
  }

  /**
   * Retrieves the board that contains this list
   * @param params - Object containing list ID and optional field filter
   * @returns Promise resolving to the board
   * @example
   * ```typescript
   * const board = await listClient.getListBoard({ id: 'list-id' });
   * ```
   */
  async getListBoard(params: { id: string; fields?: string }): Promise<any> {
    const { id, ...query } = params;
    return this.request<any>(`/lists/${id}/board`, 'GET', query, true);
  }
}