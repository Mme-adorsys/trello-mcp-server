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
  async getBoards(): Promise<TrelloBoard[]> {
    return this.request<TrelloBoard[]>('/members/me/boards');
  }

  async getBoard(boardId: string): Promise<TrelloBoard> {
    return this.request<TrelloBoard>(`/boards/${boardId}`);
  }

  async createBoard(options: CreateBoardOptions): Promise<TrelloBoard> {
    return this.request<TrelloBoard>('/boards', 'POST', options, true);
  }

  async updateBoard(boardId: string, updates: Partial<TrelloBoard>): Promise<TrelloBoard> {
    return this.request<TrelloBoard>(`/boards/${boardId}`, 'PUT', updates);
  }

  async closeBoard(boardId: string): Promise<TrelloBoard> {
    return this.request<TrelloBoard>(`/boards/${boardId}`, 'PUT', { closed: true });
  }

  // List Management
  async getLists(boardId: string): Promise<TrelloList[]> {
    return this.request<TrelloList[]>(`/boards/${boardId}/lists`);
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
  
    async getListCards(params: { id: string }): Promise<TrelloCard[]> {
      const { id } = params;
      return this.request<TrelloCard[]>(`/lists/${id}/cards`, 'GET');
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

  async addMemberToBoard(boardId: string, email: string): Promise<TrelloMember> {
    return this.request<TrelloMember>(`/boards/${boardId}/members`, 'PUT', { email });
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
}