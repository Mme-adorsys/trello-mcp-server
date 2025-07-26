import { TrelloConfig } from './core/config.js';
import { BoardClient } from './domains/boards/index.js';
import { ListClient } from './domains/lists/index.js';
import { CardClient, CardFeaturesClient } from './domains/cards/index.js';
import { MemberClient } from './domains/members/index.js';
import { OrganizationClient } from './domains/organizations/index.js';
import { LabelClient } from './domains/labels/index.js';
import { CustomFieldClient } from './domains/custom-fields/index.js';
import { AutomationClient } from './domains/automation/index.js';
import { PowerUpClient } from './domains/power-ups/index.js';

// Re-export types for backwards compatibility
export type { TrelloBoard, TrelloList, TrelloCard, TrelloMember, TrelloOrganization } from './core/types.js';
export type { TrelloConfig } from './core/config.js';
export type { CreateBoardOptions, GetBoardDetailedParams, GetBoardActionsParams, UpdateBoardMyPrefsParams } from './domains/boards/index.js';
export type { CreateListOptions, UpdateListParams, MoveAllCardsParams, UpdateListFieldParams } from './domains/lists/index.js';
export type { CreateCardOptions, UpdateChecklistParams } from './domains/cards/index.js';

/**
 * Comprehensive Trello API client with Domain-Driven Design architecture
 * 
 * This client composes all domain-specific clients to provide a unified interface
 * to the Trello API while maintaining clean separation of concerns.
 * 
 * Features:
 * - Domain-driven architecture with separate clients for each area
 * - Automatic retry with exponential backoff for failed requests
 * - Configurable timeouts and verbose logging
 * - Complete coverage of Trello API endpoints
 * - Type-safe TypeScript interfaces
 * - Backwards compatibility with existing code
 * 
 * @example
 * ```typescript
 * const client = new TrelloClient({
 *   apiKey: 'your-api-key',
 *   token: 'your-token',
 *   timeout: 30000,
 *   retries: 3,
 *   verboseLogging: true
 * });
 * 
 * // Board operations
 * const boards = await client.boards.getBoards();
 * const board = await client.boards.createBoard({ name: 'My Project' });
 * 
 * // List operations
 * const lists = await client.lists.getLists(board.id);
 * const list = await client.lists.createList({ name: 'Todo', idBoard: board.id });
 * 
 * // Card operations
 * const card = await client.cards.createCard({ idList: list.id, name: 'Task' });
 * await client.cardFeatures.addCommentToCard(card.id, 'Great work!');
 * ```
 */
export class TrelloClient {
  /** Board operations client */
  public readonly boards: BoardClient;
  /** List operations client */
  public readonly lists: ListClient;
  /** Basic card operations client */
  public readonly cards: CardClient;
  /** Advanced card features client (checklists, attachments, comments, etc.) */
  public readonly cardFeatures: CardFeaturesClient;
  /** Member operations client */
  public readonly members: MemberClient;
  /** Organization operations client */
  public readonly organizations: OrganizationClient;
  /** Label operations client */
  public readonly labels: LabelClient;
  /** Custom field operations client */
  public readonly customFields: CustomFieldClient;
  /** Automation operations client (webhooks, search, batch) */
  public readonly automation: AutomationClient;
  /** Power-up operations client */
  public readonly powerUps: PowerUpClient;

  /**
   * Creates a new TrelloClient instance
   * @param config - Configuration object containing API credentials and options
   * @throws {Error} If apiKey or token are missing
   */
  constructor(config: TrelloConfig) {
    // Initialize all domain clients with the same configuration
    this.boards = new BoardClient(config);
    this.lists = new ListClient(config);
    this.cards = new CardClient(config);
    this.cardFeatures = new CardFeaturesClient(config);
    this.members = new MemberClient(config);
    this.organizations = new OrganizationClient(config);
    this.labels = new LabelClient(config);
    this.customFields = new CustomFieldClient(config);
    this.automation = new AutomationClient(config);
    this.powerUps = new PowerUpClient(config);
  }

  // =============================================================================
  // BACKWARDS COMPATIBILITY METHODS
  // These delegate to the appropriate domain clients to maintain API compatibility
  // =============================================================================

  // Board methods
  async getBoards(filter?: 'open' | 'closed' | 'all', fields?: string) {
    return this.boards.getBoards(filter, fields);
  }

  async getBoard(boardId: string) {
    return this.boards.getBoard(boardId);
  }

  async createBoard(options: any) {
    return this.boards.createBoard(options);
  }

  async updateBoard(params: any) {
    return this.boards.updateBoard(params);
  }

  async closeBoard(boardId: string) {
    return this.boards.closeBoard(boardId);
  }

  async deleteBoard(id: string) {
    return this.boards.deleteBoard(id);
  }

  async getBoardDetailed(params: any) {
    return this.boards.getBoardDetailed(params);
  }

  async getBoardField(params: any) {
    return this.boards.getBoardField(params);
  }

  async getBoardActions(params: any) {
    return this.boards.getBoardActions(params);
  }

  async getBoardCards(params: any) {
    return this.boards.getBoardCards(params);
  }

  async getBoardLists(params: any) {
    return this.boards.getBoardLists(params);
  }

  async getBoardChecklists(id: string) {
    return this.boards.getBoardChecklists(id);
  }

  async getBoardLabels(id: string) {
    return this.boards.getBoardLabels(id);
  }

  async getBoardMembers(boardId: string) {
    return this.boards.getBoardMembers(boardId);
  }

  async addMemberToBoard(params: any) {
    return this.boards.addMemberToBoard(params);
  }

  async updateBoardMember(params: any) {
    return this.boards.updateBoardMember(params);
  }

  async removeBoardMember(params: any) {
    return this.boards.removeBoardMember(params);
  }

  async generateBoardCalendarKey(id: string) {
    return this.boards.generateBoardCalendarKey(id);
  }

  async generateBoardEmailKey(id: string) {
    return this.boards.generateBoardEmailKey(id);
  }

  async markBoardAsViewed(id: string) {
    return this.boards.markBoardAsViewed(id);
  }

  async updateBoardMyPrefs(params: any) {
    return this.boards.updateBoardMyPrefs(params);
  }

  // List methods
  async getLists(boardId: string, cards?: 'all' | 'none', fields?: string) {
    return this.lists.getLists(boardId, cards, fields);
  }

  async getList(params: any) {
    return this.lists.getList(params);
  }

  async createList(params: any) {
    return this.lists.createList(params);
  }

  async updateList(params: any) {
    return this.lists.updateList(params);
  }

  async closeList(listId: string) {
    return this.lists.closeList(listId);
  }

  async archiveAllCardsInList(id: string) {
    return this.lists.archiveAllCardsInList(id);
  }

  async moveAllCardsInList(params: any) {
    return this.lists.moveAllCardsInList(params);
  }

  async setListClosed(params: any) {
    return this.lists.setListClosed(params);
  }

  async moveListToBoard(params: any) {
    return this.lists.moveListToBoard(params);
  }

  async updateListField(params: any) {
    return this.lists.updateListField(params);
  }

  async getListActions(params: any) {
    return this.lists.getListActions(params);
  }

  async getListBoard(params: any) {
    return this.lists.getListBoard(params);
  }

  async getListCards(id: string, fields?: string) {
    return this.lists.getListCards(id, fields);
  }

  // Card methods
  async getCards(boardId: string) {
    return this.cards.getCards(boardId);
  }

  async getCard(cardId: string) {
    return this.cards.getCard(cardId);
  }

  async createCard(options: any) {
    return this.cards.createCard(options);
  }

  async updateCard(cardId: string, updates: any) {
    return this.cards.updateCard(cardId, updates);
  }

  async moveCard(cardId: string, listId: string, pos?: number) {
    return this.cards.moveCard(cardId, listId, pos);
  }

  async deleteCard(cardId: string) {
    return this.cards.deleteCard(cardId);
  }

  async archiveCard(cardId: string) {
    return this.cards.archiveCard(cardId);
  }

  async unarchiveCard(cardId: string) {
    return this.cards.unarchiveCard(cardId);
  }

  async copyCard(cardId: string, listId: string, name?: string) {
    return this.cards.copyCard(cardId, listId, name);
  }

  async subscribeToCard(cardId: string, value: boolean) {
    return this.cards.subscribeToCard(cardId, value);
  }

  async voteOnCard(cardId: string, value: boolean) {
    return this.cards.voteOnCard(cardId, value);
  }

  // Card features methods
  async getCardChecklists(cardId: string) {
    return this.cardFeatures.getCardChecklists(cardId);
  }

  async addChecklistToCard(cardId: string, name: string) {
    return this.cardFeatures.addChecklistToCard(cardId, name);
  }

  async updateChecklist(checklistId: string, updates: any) {
    return this.cardFeatures.updateChecklist(checklistId, updates);
  }

  async deleteChecklist(checklistId: string) {
    return this.cardFeatures.deleteChecklist(checklistId);
  }

  async getCardAttachments(cardId: string) {
    return this.cardFeatures.getCardAttachments(cardId);
  }

  async addAttachmentToCard(cardId: string, url: string, name?: string) {
    return this.cardFeatures.addAttachmentToCard(cardId, url, name);
  }

  async deleteAttachment(cardId: string, attachmentId: string) {
    return this.cardFeatures.deleteAttachment(cardId, attachmentId);
  }

  async getCardComments(cardId: string) {
    return this.cardFeatures.getCardComments(cardId);
  }

  async addCommentToCard(cardId: string, text: string) {
    return this.cardFeatures.addCommentToCard(cardId, text);
  }

  async updateComment(cardId: string, actionId: string, text: string) {
    return this.cardFeatures.updateComment(cardId, actionId, text);
  }

  async deleteComment(cardId: string, actionId: string) {
    return this.cardFeatures.deleteComment(cardId, actionId);
  }

  async getCardCustomFieldItems(cardId: string) {
    return this.cardFeatures.getCardCustomFieldItems(cardId);
  }

  async setCardCustomField(cardId: string, fieldId: string, value: any) {
    return this.cardFeatures.setCardCustomField(cardId, fieldId, value);
  }

  async getCardLabels(cardId: string) {
    return this.cardFeatures.getCardLabels(cardId);
  }

  async addLabelToCard(cardId: string, labelId: string) {
    return this.cardFeatures.addLabelToCard(cardId, labelId);
  }

  async removeLabelFromCard(cardId: string, labelId: string) {
    return this.cardFeatures.removeLabelFromCard(cardId, labelId);
  }

  async getCardMembers(cardId: string) {
    return this.cardFeatures.getCardMembers(cardId);
  }

  async addMemberToCard(cardId: string, memberId: string) {
    return this.cardFeatures.addMemberToCard(cardId, memberId);
  }

  async removeMemberFromCard(cardId: string, memberId: string) {
    return this.cardFeatures.removeMemberFromCard(cardId, memberId);
  }

  // Member methods
  async removeMemberFromBoard(boardId: string, memberId: string) {
    return this.members.removeMemberFromBoard(boardId, memberId);
  }

  async getOrganizations() {
    return this.members.getOrganizations();
  }

  async getMemberOrganizations(params: any) {
    return this.members.getMemberOrganizations(params);
  }

  // Organization methods
  async getOrganizationBoards(params: any) {
    return this.organizations.getOrganizationBoards(params);
  }

  async inviteToOrganization(orgId: string, email: string, fullName?: string, type?: string) {
    return this.organizations.inviteToOrganization(orgId, email, fullName, type);
  }

  // Label methods
  async createLabel(boardId: string, name: string, color: string) {
    return this.labels.createLabel(boardId, name, color);
  }

  async deleteLabel(labelId: string) {
    return this.labels.deleteLabel(labelId);
  }

  // Custom field methods
  async getBoardCustomFields(boardId: string) {
    return this.customFields.getBoardCustomFields(boardId);
  }

  async createCustomField(params: any) {
    return this.customFields.createCustomField(params);
  }

  async getCustomField(customFieldId: string) {
    return this.customFields.getCustomField(customFieldId);
  }

  async updateCustomField(customFieldId: string, params: any) {
    return this.customFields.updateCustomField(customFieldId, params);
  }

  async deleteCustomField(customFieldId: string) {
    return this.customFields.deleteCustomField(customFieldId);
  }

  async getCustomFieldOptions(customFieldId: string) {
    return this.customFields.getCustomFieldOptions(customFieldId);
  }

  async addCustomFieldOption(customFieldId: string) {
    return this.customFields.addCustomFieldOption(customFieldId);
  }

  async getCustomFieldOption(customFieldId: string, optionId: string) {
    return this.customFields.getCustomFieldOption(customFieldId, optionId);
  }

  async deleteCustomFieldOption(customFieldId: string, optionId: string) {
    return this.customFields.deleteCustomFieldOption(customFieldId, optionId);
  }

  // Automation methods
  async getWebhooks() {
    return this.automation.getWebhooks();
  }

  async createWebhook(callbackURL: string, idModel: string, description?: string) {
    return this.automation.createWebhook(callbackURL, idModel, description);
  }

  async updateWebhook(webhookId: string, updates: any) {
    return this.automation.updateWebhook(webhookId, updates);
  }

  async deleteWebhook(webhookId: string) {
    return this.automation.deleteWebhook(webhookId);
  }

  async search(query: string, modelTypes?: string[], idBoards?: string[], idOrganizations?: string[]) {
    return this.automation.search(query, modelTypes, idBoards, idOrganizations);
  }

  async batch(urls: string[]) {
    return this.automation.batch(urls);
  }

  async inviteToBoard(boardId: string, email: string, fullName?: string, type?: string) {
    return this.automation.inviteToBoard(boardId, email, fullName, type);
  }

  // Power-up methods
  async getBoardPowerUps(boardId: string) {
    return this.powerUps.getBoardPowerUps(boardId);
  }

  async enableBoardPowerUp(boardId: string, powerUp: string) {
    return this.powerUps.enableBoardPowerUp(boardId, powerUp);
  }

  async disableBoardPowerUp(boardId: string, powerUp: string) {
    return this.powerUps.disableBoardPowerUp(boardId, powerUp);
  }
}