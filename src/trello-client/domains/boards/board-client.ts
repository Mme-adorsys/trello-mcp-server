import { BaseClient } from '../../core/base-client.js';
import { TrelloBoard, TrelloCard, TrelloList, TrelloMember } from '../../core/types.js';
import { 
  CreateBoardOptions, 
  GetBoardDetailedParams, 
  GetBoardActionsParams,
  UpdateBoardMyPrefsParams 
} from './board-types.js';

/**
 * Client for Trello Board operations
 * Handles all board-related functionality including CRUD operations,
 * member management, preferences, and board-specific queries
 */
export class BoardClient extends BaseClient {
  
  // =============================================================================
  // BASIC BOARD OPERATIONS
  // =============================================================================

  /**
   * Retrieves all boards for the authenticated user
   * @param filter - Filter for board status ('open', 'closed', or 'all')
   * @param fields - Comma-separated list of fields to return ('all' for all fields)
   * @returns Promise resolving to array of boards
   * @example
   * ```typescript
   * // Get all open boards
   * const boards = await boardClient.getBoards();
   * 
   * // Get closed boards with limited fields
   * const closedBoards = await boardClient.getBoards('closed', 'id,name');
   * ```
   */
  async getBoards(filter: 'open' | 'closed' | 'all' = 'open', fields: string = 'all'): Promise<TrelloBoard[]> {
    return this.request<TrelloBoard[]>(`/members/me/boards?filter=${filter}&fields=${fields}`);
  }

  /**
   * Retrieves a specific board by ID
   * @param boardId - The board ID to retrieve
   * @returns Promise resolving to the board details
   * @throws {Error} If board is not found or access is denied
   * @example
   * ```typescript
   * const board = await boardClient.getBoard('5f1b2c3d4e5f6a7b8c9d0e1f');
   * console.log(board.name); // Board name
   * ```
   */
  async getBoard(boardId: string): Promise<TrelloBoard> {
    return this.request<TrelloBoard>(`/boards/${boardId}`);
  }

  /**
   * Creates a new Trello board
   * @param options - Board creation options (name is required)
   * @returns Promise resolving to the created board
   * @throws {Error} If creation fails due to invalid options or API limits
   * @example
   * ```typescript
   * const board = await boardClient.createBoard({
   *   name: 'My Project Board',
   *   desc: 'Project management for Q4 goals',
   *   prefs_permissionLevel: 'private',
   *   defaultLists: true
   * });
   * ```
   */
  async createBoard(options: CreateBoardOptions): Promise<TrelloBoard> {
    return this.request<TrelloBoard>('/boards', 'POST', options, true);
  }

  /**
   * Updates a board's properties
   * @param params - Object containing board ID and properties to update
   * @returns Promise resolving to the updated board
   * @throws {Error} If board is not found or user lacks permission
   * @example
   * ```typescript
   * const updatedBoard = await boardClient.updateBoard({
   *   id: 'board-id',
   *   name: 'Updated Board Name',
   *   desc: 'Updated description'
   * });
   * ```
   */
  async updateBoard(params: { id: string; [key: string]: any }): Promise<TrelloBoard> {
    const { id, ...query } = params;
    return this.request<TrelloBoard>(`/boards/${id}`, 'PUT', query, true);
  }

  /**
   * Closes (archives) a board
   * @param boardId - The board ID to close
   * @returns Promise resolving to the updated board
   * @throws {Error} If board is not found or user lacks permission
   * @example
   * ```typescript
   * const closedBoard = await boardClient.closeBoard('5f1b2c3d4e5f6a7b8c9d0e1f');
   * console.log(closedBoard.closed); // true
   * ```
   */
  async closeBoard(boardId: string): Promise<TrelloBoard> {
    return this.request<TrelloBoard>(`/boards/${boardId}`, 'PUT', { closed: true });
  }

  /**
   * Permanently deletes a board
   * @param id - The board ID to delete
   * @returns Promise resolving when deletion is complete
   * @throws {Error} If board is not found or user lacks permission
   * @example
   * ```typescript
   * await boardClient.deleteBoard('5f1b2c3d4e5f6a7b8c9d0e1f');
   * ```
   */
  async deleteBoard(id: string): Promise<void> {
    await this.request(`/boards/${id}`, 'DELETE');
  }

  // =============================================================================
  // DETAILED BOARD QUERIES
  // =============================================================================

  /**
   * Retrieves detailed board information with related entities
   * @param params - Parameters specifying what data to include
   * @returns Promise resolving to detailed board data
   * @example
   * ```typescript
   * const detailedBoard = await boardClient.getBoardDetailed({
   *   id: 'board-id',
   *   lists: 'open',
   *   cards: 'visible',
   *   members: 'all'
   * });
   * ```
   */
  async getBoardDetailed(params: GetBoardDetailedParams): Promise<TrelloBoard> {
    const { id, ...query } = params;
    return this.request<TrelloBoard>(`/boards/${id}`, 'GET', query, true);
  }

  /**
   * Retrieves a specific field from a board
   * @param params - Object containing board ID and field name
   * @returns Promise resolving to the field value
   * @example
   * ```typescript
   * const boardName = await boardClient.getBoardField({ id: 'board-id', field: 'name' });
   * ```
   */
  async getBoardField(params: { id: string; field: string }): Promise<any> {
    const { id, field } = params;
    return this.request(`/boards/${id}/${field}`, 'GET');
  }

  /**
   * Retrieves board actions (activity history)
   * @param params - Parameters for filtering actions
   * @returns Promise resolving to array of actions
   * @example
   * ```typescript
   * const recentActions = await boardClient.getBoardActions({
   *   boardId: 'board-id',
   *   limit: 10,
   *   filter: 'createCard,updateCard'
   * });
   * ```
   */
  async getBoardActions(params: GetBoardActionsParams): Promise<any[]> {
    const { boardId, ...query } = params;
    return this.request<any[]>(`/boards/${boardId}/actions`, 'GET', query, true);
  }

  // =============================================================================
  // BOARD CONTENT QUERIES
  // =============================================================================

  /**
   * Retrieves cards from a board
   * @param params - Object containing board ID and optional filter
   * @returns Promise resolving to array of cards
   * @example
   * ```typescript
   * const openCards = await boardClient.getBoardCards({ id: 'board-id', filter: 'open' });
   * ```
   */
  async getBoardCards(params: { id: string; filter?: string }): Promise<TrelloCard[]> {
    const { id, filter } = params;
    const endpoint = filter ? `/boards/${id}/cards/${filter}` : `/boards/${id}/cards`;
    return this.request<TrelloCard[]>(endpoint, 'GET');
  }

  /**
   * Retrieves lists from a board
   * @param params - Object containing board ID and optional filter
   * @returns Promise resolving to array of lists
   * @example
   * ```typescript
   * const openLists = await boardClient.getBoardLists({ id: 'board-id', filter: 'open' });
   * ```
   */
  async getBoardLists(params: { id: string; filter?: string }): Promise<TrelloList[]> {
    const { id, filter } = params;
    const endpoint = filter ? `/boards/${id}/lists/${filter}` : `/boards/${id}/lists`;
    return this.request<TrelloList[]>(endpoint, 'GET');
  }

  /**
   * Retrieves checklists from a board
   * @param id - The board ID
   * @returns Promise resolving to array of checklists
   * @example
   * ```typescript
   * const checklists = await boardClient.getBoardChecklists('board-id');
   * ```
   */
  async getBoardChecklists(id: string): Promise<any[]> {
    return this.request<any[]>(`/boards/${id}/checklists`, 'GET');
  }

  /**
   * Retrieves labels from a board
   * @param id - The board ID
   * @returns Promise resolving to array of labels
   * @example
   * ```typescript
   * const labels = await boardClient.getBoardLabels('board-id');
   * ```
   */
  async getBoardLabels(id: string): Promise<any[]> {
    return this.request<any[]>(`/boards/${id}/labels`, 'GET');
  }

  // =============================================================================
  // BOARD MEMBER MANAGEMENT
  // =============================================================================

  /**
   * Retrieves members of a board
   * @param boardId - The board ID
   * @returns Promise resolving to array of members
   * @example
   * ```typescript
   * const members = await boardClient.getBoardMembers('board-id');
   * ```
   */
  async getBoardMembers(boardId: string): Promise<TrelloMember[]> {
    return this.request<TrelloMember[]>(`/boards/${boardId}/members`);
  }

  /**
   * Adds a member to a board
   * @param params - Object containing board ID and member details
   * @returns Promise resolving to operation result
   * @example
   * ```typescript
   * await boardClient.addMemberToBoard({
   *   id: 'board-id',
   *   email: 'user@example.com',
   *   type: 'normal'
   * });
   * ```
   */
  async addMemberToBoard(params: { id: string; email: string; type?: string; fullName?: string }): Promise<any> {
    const { id, ...query } = params;
    return this.request(`/boards/${id}/members`, 'PUT', query, true);
  }

  /**
   * Updates a board member's role
   * @param params - Object containing board ID, member ID, and new role
   * @returns Promise resolving to operation result
   * @example
   * ```typescript
   * await boardClient.updateBoardMember({
   *   id: 'board-id',
   *   idMember: 'member-id',
   *   type: 'admin'
   * });
   * ```
   */
  async updateBoardMember(params: { id: string; idMember: string; type?: string }): Promise<any> {
    const { id, idMember, ...query } = params;
    return this.request(`/boards/${id}/members/${idMember}`, 'PUT', query, true);
  }

  /**
   * Removes a member from a board
   * @param params - Object containing board ID and member ID
   * @returns Promise resolving when removal is complete
   * @example
   * ```typescript
   * await boardClient.removeBoardMember({ id: 'board-id', idMember: 'member-id' });
   * ```
   */
  async removeBoardMember(params: { id: string; idMember: string }): Promise<void> {
    const { id, idMember } = params;
    await this.request(`/boards/${id}/members/${idMember}`, 'DELETE');
  }

  // =============================================================================
  // BOARD UTILITIES
  // =============================================================================

  /**
   * Generates a new calendar key for the board
   * @param id - The board ID
   * @returns Promise resolving to the new calendar key
   * @example
   * ```typescript
   * const calendarKey = await boardClient.generateBoardCalendarKey('board-id');
   * ```
   */
  async generateBoardCalendarKey(id: string): Promise<any> {
    return this.request(`/boards/${id}/calendarKey/generate`, 'POST');
  }

  /**
   * Generates a new email key for the board
   * @param id - The board ID
   * @returns Promise resolving to the new email key
   * @example
   * ```typescript
   * const emailKey = await boardClient.generateBoardEmailKey('board-id');
   * ```
   */
  async generateBoardEmailKey(id: string): Promise<any> {
    return this.request(`/boards/${id}/emailKey/generate`, 'POST');
  }

  /**
   * Marks a board as viewed by the current user
   * @param id - The board ID
   * @returns Promise resolving to operation result
   * @example
   * ```typescript
   * await boardClient.markBoardAsViewed('board-id');
   * ```
   */
  async markBoardAsViewed(id: string): Promise<any> {
    return this.request(`/boards/${id}/markedAsViewed`, 'POST');
  }

  /**
   * Updates user preferences for a specific board
   * @param params - Object containing board ID and preferences to update
   * @returns Promise resolving to the updated preferences
   * @example
   * ```typescript
   * await boardClient.updateBoardMyPrefs({
   *   id: 'board-id',
   *   showSidebar: true,
   *   showSidebarActivity: false
   * });
   * ```
   */
  async updateBoardMyPrefs(params: UpdateBoardMyPrefsParams): Promise<any> {
    const { id, ...prefs } = params;
    const results: any = {};
    
    // Update each preference individually as they have separate endpoints
    if (prefs.emailPosition !== undefined) {
      results.emailPosition = await this.request(`/boards/${id}/myPrefs/emailPosition`, 'PUT', { value: prefs.emailPosition }, true);
    }
    if (prefs.idEmailList !== undefined) {
      results.idEmailList = await this.request(`/boards/${id}/myPrefs/idEmailList`, 'PUT', { value: prefs.idEmailList }, true);
    }
    if (prefs.showSidebar !== undefined) {
      results.showSidebar = await this.request(`/boards/${id}/myPrefs/showSidebar`, 'PUT', { value: prefs.showSidebar }, true);
    }
    if (prefs.showSidebarActivity !== undefined) {
      results.showSidebarActivity = await this.request(`/boards/${id}/myPrefs/showSidebarActivity`, 'PUT', { value: prefs.showSidebarActivity }, true);
    }
    if (prefs.showSidebarBoardActions !== undefined) {
      results.showSidebarBoardActions = await this.request(`/boards/${id}/myPrefs/showSidebarBoardActions`, 'PUT', { value: prefs.showSidebarBoardActions }, true);
    }
    if (prefs.showSidebarMembers !== undefined) {
      results.showSidebarMembers = await this.request(`/boards/${id}/myPrefs/showSidebarMembers`, 'PUT', { value: prefs.showSidebarMembers }, true);
    }
    
    return results;
  }
}