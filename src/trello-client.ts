import fetch from 'node-fetch';

interface TrelloConfig {
  apiKey: string;
  token: string;
}

interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  url: string;
  shortUrl: string;
}

interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
  idBoard: string;
}

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  idList: string;
  idBoard: string;
  url: string;
  shortUrl: string;
  pos: number;
  due: string | null;
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

interface TrelloMember {
  id: string;
  username: string;
  fullName: string;
  email?: string;
}

// Add options interfaces for full OpenAPI support
export interface CreateBoardOptions {
  name: string;
  desc?: string;
  defaultLabels?: boolean;
  defaultLists?: boolean;
  idOrganization?: string;
  idBoardSource?: string;
  keepFromSource?: 'cards' | 'none';
  powerUps?: 'all' | 'calendar' | 'cardAging' | 'recap' | 'voting';
  prefs_permissionLevel?: 'org' | 'private' | 'public';
  prefs_voting?: 'disabled' | 'members' | 'observers' | 'org' | 'public';
  prefs_comments?: 'disabled' | 'members' | 'observers' | 'org' | 'public';
  prefs_invitations?: 'admins' | 'members';
  prefs_selfJoin?: boolean;
  prefs_cardCovers?: boolean;
  prefs_background?: string;
  // Add more as needed from the spec
}

export interface CreateListOptions {
  name: string;
  idBoard: string;
  idListSource?: string;
  pos?: string | number;
}

export interface CreateCardOptions {
  idList: string;
  name?: string;
  desc?: string;
  pos?: string | number;
  due?: string;
  start?: string | null;
  dueComplete?: boolean;
  idMembers?: string[];
  idLabels?: string[];
  urlSource?: string;
  fileSource?: string;
  mimeType?: string;
  idCardSource?: string;
  keepFromSource?: string;
  address?: string;
  locationName?: string;
  // Add more as needed from the spec
}

export interface TrelloOrganization {
  id: string;
  displayName: string;
  name: string;
  desc: string;
}

// Helper to convert options to query params
function toQueryParams(options: Record<string, any>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      params.append(key, value.join(','));
    } else {
      params.append(key, String(value));
    }
  }
  return params.toString();
}

export class TrelloClient {
  private config: TrelloConfig;
  private baseUrl = 'https://api.trello.com/1';

  constructor(config: TrelloConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', bodyOrParams?: any, asQueryParams = false): Promise<T> {
    let url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('key', this.config.apiKey);
    url.searchParams.append('token', this.config.token);
    let fetchOptions: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (bodyOrParams) {
      if (asQueryParams) {
        const query = toQueryParams(bodyOrParams);
        for (const [k, v] of new URLSearchParams(query)) {
          url.searchParams.append(k, v);
        }
      } else if (method !== 'GET') {
        fetchOptions.body = JSON.stringify(bodyOrParams);
      }
    }
    // Detailed logging
    console.error(`[TrelloClient] ${method} ${url.toString()}`);
    if (bodyOrParams) {
      console.error(`[TrelloClient] Params/Body:`, JSON.stringify(bodyOrParams));
    }
    const response = await fetch(url.toString(), fetchOptions);
    let responseBody: any = null;
    try {
      responseBody = await response.clone().json();
    } catch (e) {
      responseBody = await response.clone().text();
    }
    console.error(`[TrelloClient] Response Status: ${response.status}`);
    console.error(`[TrelloClient] Response Body:`, responseBody);
    if (!response.ok) {
      throw new Error(`Trello API error: ${response.status} ${response.statusText} - ${JSON.stringify(responseBody)}`);
    }
    return responseBody as T;
  }

  // Board Management
  async getBoards(filter: 'open' | 'closed' | 'all' = 'open', fields: string = 'all'): Promise<TrelloBoard[]> {
    return this.request<TrelloBoard[]>(`/members/me/boards?filter=${filter}&fields=${fields}`);
  }

  async getBoard(boardId: string): Promise<TrelloBoard> {
    return this.request<TrelloBoard>(`/boards/${boardId}`);
  }

  async createBoard(options: CreateBoardOptions): Promise<TrelloBoard> {
    return this.request<TrelloBoard>('/boards', 'POST', options, true);
  }

  async closeBoard(boardId: string): Promise<TrelloBoard> {
    return this.request<TrelloBoard>(`/boards/${boardId}`, 'PUT', { closed: true });
  }

  // List Management
  async getLists(boardId: string, cards: 'all' | 'none' = 'none', fields: string = ''): Promise<TrelloList[]> {
    return this.request<TrelloList[]>(`/boards/${boardId}/lists?cards=${cards}&fields=${fields}`);
  }

  async closeList(listId: string): Promise<TrelloList> {
    return this.request<TrelloList>(`/lists/${listId}`, 'PUT', { closed: true });
  }

  // LISTS API
  async getList(params: { id: string; fields?: string }): Promise<TrelloList> {
    const { id, ...query } = params;
    return this.request<TrelloList>(`/lists/${id}`, 'GET', query, true);
  }

  async updateList(params: { id: string; name?: string; closed?: boolean; idBoard?: string; pos?: string | number; subscribed?: boolean }): Promise<TrelloList> {
    const { id, ...query } = params;
    return this.request<TrelloList>(`/lists/${id}`, 'PUT', query, true);
  }

  async createList(params: { name: string; idBoard: string; idListSource?: string; pos?: string | number }): Promise<TrelloList> {
    return this.request<TrelloList>(`/lists`, 'POST', params, true);
  }

  async archiveAllCardsInList(id: string): Promise<any> {
    return this.request(`/lists/${id}/archiveAllCards`, 'POST');
  }

  async moveAllCardsInList(params: { id: string; idBoard: string; idList: string }): Promise<any> {
    const { id, ...query } = params;
    return this.request(`/lists/${id}/moveAllCards`, 'POST', query, true);
  }

  async setListClosed(params: { id: string; value: boolean }): Promise<TrelloList> {
    const { id, ...query } = params;
    return this.request<TrelloList>(`/lists/${id}/closed`, 'PUT', query, true);
  }

  async moveListToBoard(params: { id: string; value: string }): Promise<TrelloList> {
    const { id, ...query } = params;
    return this.request<TrelloList>(`/lists/${id}/idBoard`, 'PUT', query, true);
  }

  async updateListField(params: { id: string; field: 'name' | 'pos' | 'subscribed'; value: string | number | boolean }): Promise<TrelloList> {
    const { id, field, ...query } = params;
    return this.request<TrelloList>(`/lists/${id}/${field}`, 'PUT', query, true);
  }

  async getListActions(params: { id: string; filter?: string }): Promise<any[]> {
    const { id, ...query } = params;
    return this.request<any[]>(`/lists/${id}/actions`, 'GET', query, true);
  }

  async getListBoard(params: { id: string; fields?: string }): Promise<any> {
    const { id, ...query } = params;
    return this.request<any>(`/lists/${id}/board`, 'GET', query, true);
  }

  async getListCards(id: string, fields: string = 'all' ): Promise<TrelloCard[]> {
    return this.request<TrelloCard[]>(`/lists/${id}/cards?fields=${fields}`, 'GET');
  }

  // Card Management
  async getCards(boardId: string): Promise<TrelloCard[]> {
    return this.request<TrelloCard[]>(`/boards/${boardId}/cards`);
  }

  async getCard(cardId: string): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}`);
  }

  async createCard(options: CreateCardOptions): Promise<TrelloCard> {
    return this.request<TrelloCard>('/cards', 'POST', options, true);
  }

  async updateCard(cardId: string, updates: Partial<TrelloCard>): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}`, 'PUT', updates);
  }

  async moveCard(cardId: string, listId: string, pos?: number): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}`, 'PUT', { idList: listId, pos });
  }

  async deleteCard(cardId: string): Promise<void> {
    await this.request(`/cards/${cardId}`, 'DELETE');
  }

  // Member Management
  async getBoardMembers(boardId: string): Promise<TrelloMember[]> {
    return this.request<TrelloMember[]>(`/boards/${boardId}/members`);
  }

  async removeMemberFromBoard(boardId: string, memberId: string): Promise<void> {
    await this.request(`/boards/${boardId}/members/${memberId}`, 'DELETE');
  }

  async getOrganizations(): Promise<TrelloOrganization[]> {
    return this.request<TrelloOrganization[]>(`/members/me/organizations`);
  }

  async getMemberOrganizations(params: {
    id: string;
    filter?: 'all' | 'members' | 'none' | 'public';
    fields?: string;
    paid_account?: boolean;
  }): Promise<TrelloOrganization[]> {
    const { id, ...query } = params;
    return this.request<TrelloOrganization[]>(`/members/${id}/organizations`, 'GET', query, true);
  }

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

  // BOARDS API - Comprehensive methods
  async getBoardDetailed(params: {
    id: string;
    actions?: string;
    boardStars?: string;
    cards?: string;
    card_pluginData?: boolean;
    checklists?: string;
    customFields?: boolean;
    fields?: string;
    labels?: string;
    lists?: string;
    members?: string;
    memberships?: string;
    pluginData?: boolean;
    organization?: boolean;
    organization_pluginData?: boolean;
    myPrefs?: boolean;
    tags?: boolean;
  }): Promise<TrelloBoard> {
    const { id, ...query } = params;
    return this.request<TrelloBoard>(`/boards/${id}`, 'GET', query, true);
  }

  async updateBoard(params: { id: string; [key: string]: any }): Promise<TrelloBoard> {
    const { id, ...query } = params;
    return this.request<TrelloBoard>(`/boards/${id}`, 'PUT', query, true);
  }

  async deleteBoard(id: string): Promise<void> {
    await this.request(`/boards/${id}`, 'DELETE');
  }

  async getBoardField(params: { id: string; field: string }): Promise<any> {
    const { id, field } = params;
    return this.request(`/boards/${id}/${field}`, 'GET');
  }

  async getBoardActions(params: {
    boardId: string;
    fields?: string;
    filter?: string;
    format?: string;
    idModels?: string;
    limit?: number;
    member?: boolean;
    member_fields?: string;
    memberCreator?: boolean;
    memberCreator_fields?: string;
    page?: number;
    reactions?: boolean;
    before?: string;
    since?: string;
  }): Promise<any[]> {
    const { boardId, ...query } = params;
    return this.request<any[]>(`/boards/${boardId}/actions`, 'GET', query, true);
  }

  async getBoardCards(params: { id: string; filter?: string }): Promise<TrelloCard[]> {
    const { id, filter } = params;
    const endpoint = filter ? `/boards/${id}/cards/${filter}` : `/boards/${id}/cards`;
    return this.request<TrelloCard[]>(endpoint, 'GET');
  }

  async getBoardLists(params: { id: string; filter?: string }): Promise<TrelloList[]> {
    const { id, filter } = params;
    const endpoint = filter ? `/boards/${id}/lists/${filter}` : `/boards/${id}/lists`;
    return this.request<TrelloList[]>(endpoint, 'GET');
  }

  async getBoardChecklists(id: string): Promise<any[]> {
    return this.request<any[]>(`/boards/${id}/checklists`, 'GET');
  }

  async getBoardLabels(id: string): Promise<any[]> {
    return this.request<any[]>(`/boards/${id}/labels`, 'GET');
  }

  async addMemberToBoard(params: { id: string; email: string; type?: string; fullName?: string }): Promise<any> {
    const { id, ...query } = params;
    return this.request(`/boards/${id}/members`, 'PUT', query, true);
  }

  async updateBoardMember(params: { id: string; idMember: string; type?: string }): Promise<any> {
    const { id, idMember, ...query } = params;
    return this.request(`/boards/${id}/members/${idMember}`, 'PUT', query, true);
  }

  async removeBoardMember(params: { id: string; idMember: string }): Promise<void> {
    const { id, idMember } = params;
    await this.request(`/boards/${id}/members/${idMember}`, 'DELETE');
  }

  async generateBoardCalendarKey(id: string): Promise<any> {
    return this.request(`/boards/${id}/calendarKey/generate`, 'POST');
  }

  async generateBoardEmailKey(id: string): Promise<any> {
    return this.request(`/boards/${id}/emailKey/generate`, 'POST');
  }

  async markBoardAsViewed(id: string): Promise<any> {
    return this.request(`/boards/${id}/markedAsViewed`, 'POST');
  }

  async updateBoardMyPrefs(params: {
    id: string;
    emailPosition?: string;
    idEmailList?: string;
    showSidebar?: boolean;
    showSidebarActivity?: boolean;
    showSidebarBoardActions?: boolean;
    showSidebarMembers?: boolean;
  }): Promise<any> {
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

  // --- Advanced Card Features ---

  // Checklists
  async getCardChecklists(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/checklists`, 'GET');
  }
  async addChecklistToCard(cardId: string, name: string): Promise<any> {
    return this.request<any>(`/cards/${cardId}/checklists`, 'POST', { name });
  }
  async updateChecklist(checklistId: string, updates: { name?: string; pos?: string | number }): Promise<any> {
    return this.request<any>(`/checklists/${checklistId}`, 'PUT', updates);
  }
  async deleteChecklist(checklistId: string): Promise<void> {
    await this.request(`/checklists/${checklistId}`, 'DELETE');
  }

  // Attachments
  async getCardAttachments(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/attachments`, 'GET');
  }
  async addAttachmentToCard(cardId: string, url: string, name?: string): Promise<any> {
    return this.request<any>(`/cards/${cardId}/attachments`, 'POST', { url, name });
  }
  async deleteAttachment(cardId: string, attachmentId: string): Promise<void> {
    await this.request(`/cards/${cardId}/attachments/${attachmentId}`, 'DELETE');
  }

  // Comments (Actions)
  async getCardComments(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/actions`, 'GET', { filter: 'commentCard' }, true);
  }
  async addCommentToCard(cardId: string, text: string): Promise<any> {
    return this.request<any>(`/cards/${cardId}/actions/comments`, 'POST', { text });
  }
  async updateComment(cardId: string, actionId: string, text: string): Promise<any> {
    return this.request<any>(`/cards/${cardId}/actions/${actionId}/comments`, 'PUT', { text });
  }
  async deleteComment(cardId: string, actionId: string): Promise<void> {
    await this.request(`/cards/${cardId}/actions/${actionId}/comments`, 'DELETE');
  }

  // Custom Fields
  async getCardCustomFieldItems(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/customFieldItems`, 'GET');
  }
  
  async setCardCustomField(cardId: string, fieldId: string, value: any): Promise<any> {
    return this.request<any>(`/cards/${cardId}/customField/${fieldId}/item`, 'PUT', { value });
  }

  // Labels
  async getCardLabels(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/labels`, 'GET');
  }
  async addLabelToCard(cardId: string, labelId: string): Promise<any> {
    return this.request<any>(`/cards/${cardId}/idLabels`, 'POST', { value: labelId });
  }
  async removeLabelFromCard(cardId: string, labelId: string): Promise<void> {
    await this.request(`/cards/${cardId}/idLabels/${labelId}`, 'DELETE');
  }
  async createLabel(boardId: string, name: string, color: string): Promise<any> {
    return this.request<any>(`/labels`, 'POST', { idBoard: boardId, name, color });
  }
  async deleteLabel(labelId: string): Promise<void> {
    await this.request(`/labels/${labelId}`, 'DELETE');
  }

  // Card Members
  async getCardMembers(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/members`, 'GET');
  }
  async addMemberToCard(cardId: string, memberId: string): Promise<any> {
    return this.request<any>(`/cards/${cardId}/idMembers`, 'POST', { value: memberId });
  }
  async removeMemberFromCard(cardId: string, memberId: string): Promise<void> {
    await this.request(`/cards/${cardId}/idMembers/${memberId}`, 'DELETE');
  }

  // Card Advanced Actions
  async archiveCard(cardId: string): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}`, 'PUT', { closed: true });
  }
  async unarchiveCard(cardId: string): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}`, 'PUT', { closed: false });
  }
  async copyCard(cardId: string, listId: string, name?: string): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards`, 'POST', { idCardSource: cardId, idList: listId, name });
  }
  async subscribeToCard(cardId: string, value: boolean): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}/subscribed`, 'PUT', { value });
  }
  async voteOnCard(cardId: string, value: boolean): Promise<any> {
    return this.request<any>(`/cards/${cardId}/membersVoted`, value ? 'POST' : 'DELETE');
  }

  // NEW: Missing CustomFields methods
  async getBoardCustomFields(boardId: string): Promise<any[]> {
    return this.request<any[]>(`/boards/${boardId}/customFields`, 'GET');
  }

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

  async getCustomField(customFieldId: string): Promise<any> {
    return this.request<any>(`/customFields/${customFieldId}`, 'GET');
  }

  async updateCustomField(customFieldId: string, params: {
    name?: string;
    pos?: string | number;
    'display/cardFront'?: boolean;
  }): Promise<any> {
    return this.request<any>(`/customFields/${customFieldId}`, 'PUT', params);
  }

  async deleteCustomField(customFieldId: string): Promise<void> {
    await this.request(`/customFields/${customFieldId}`, 'DELETE');
  }

  async getCustomFieldOptions(customFieldId: string): Promise<any[]> {
    return this.request<any[]>(`/customFields/${customFieldId}/options`, 'GET');
  }

  async addCustomFieldOption(customFieldId: string): Promise<any> {
    return this.request<any>(`/customFields/${customFieldId}/options`, 'POST');
  }

  async getCustomFieldOption(customFieldId: string, optionId: string): Promise<any> {
    return this.request<any>(`/customFields/${customFieldId}/options/${optionId}`, 'GET');
  }

  async deleteCustomFieldOption(customFieldId: string, optionId: string): Promise<void> {
    await this.request(`/customFields/${customFieldId}/options/${optionId}`, 'DELETE');
  }

  // --- Board/Org Automation Features ---

  // Webhooks
  async getWebhooks(): Promise<any[]> {
    return this.request<any[]>(`/webhooks`, 'GET');
  }
  async createWebhook(callbackURL: string, idModel: string, description?: string): Promise<any> {
    return this.request<any>(`/webhooks`, 'POST', { callbackURL, idModel, description });
  }
  async updateWebhook(webhookId: string, updates: { callbackURL?: string; description?: string; idModel?: string }): Promise<any> {
    return this.request<any>(`/webhooks/${webhookId}`, 'PUT', updates);
  }
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.request(`/webhooks/${webhookId}`, 'DELETE');
  }

  // Search
  async search(query: string, modelTypes?: string[], idBoards?: string[], idOrganizations?: string[]): Promise<any> {
    const params: any = { query };
    if (modelTypes) params.modelTypes = modelTypes.join(',');
    if (idBoards) params.idBoards = idBoards.join(',');
    if (idOrganizations) params.idOrganizations = idOrganizations.join(',');
    return this.request<any>(`/search`, 'GET', params, true);
  }

  // Batch API
  async batch(urls: string[]): Promise<any[]> {
    return this.request<any[]>(`/batch`, 'GET', { urls: urls.join(',') }, true);
  }

  // Board/Org Invitations
  async inviteToBoard(boardId: string, email: string, fullName?: string, type?: string): Promise<any> {
    return this.request<any>(`/boards/${boardId}/members`, 'PUT', { email, fullName, type });
  }
  async inviteToOrganization(orgId: string, email: string, fullName?: string, type?: string): Promise<any> {
    return this.request<any>(`/organizations/${orgId}/members`, 'PUT', { email, fullName, type });
  }

  // Power-Ups
  async getBoardPowerUps(boardId: string): Promise<any[]> {
    return this.request<any[]>(`/boards/${boardId}/powerUps`, 'GET');
  }
  async enableBoardPowerUp(boardId: string, powerUp: string): Promise<any> {
    return this.request<any>(`/boards/${boardId}/powerUps`, 'POST', { value: powerUp });
  }
  async disableBoardPowerUp(boardId: string, powerUp: string): Promise<void> {
    await this.request(`/boards/${boardId}/powerUps/${powerUp}`, 'DELETE');
  }
}