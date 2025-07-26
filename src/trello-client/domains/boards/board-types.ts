/**
 * Options for creating a new Trello board
 */
export interface CreateBoardOptions {
  /** Board name (required) */
  name: string;
  /** Board description */
  desc?: string;
  /** Whether to add default labels */
  defaultLabels?: boolean;
  /** Whether to add default lists */
  defaultLists?: boolean;
  /** Organization ID to create board under */
  idOrganization?: string;
  /** Board ID to copy from */
  idBoardSource?: string;
  /** What to keep when copying from source board */
  keepFromSource?: 'cards' | 'none';
  /** Power-ups to enable */
  powerUps?: 'all' | 'calendar' | 'cardAging' | 'recap' | 'voting';
  /** Board permission level */
  prefs_permissionLevel?: 'org' | 'private' | 'public';
  /** Voting permissions */
  prefs_voting?: 'disabled' | 'members' | 'observers' | 'org' | 'public';
  /** Comment permissions */
  prefs_comments?: 'disabled' | 'members' | 'observers' | 'org' | 'public';
  /** Invitation permissions */
  prefs_invitations?: 'admins' | 'members';
  /** Whether members can join themselves */
  prefs_selfJoin?: boolean;
  /** Whether to show card covers */
  prefs_cardCovers?: boolean;
  /** Background color or image */
  prefs_background?: string;
}

/**
 * Parameters for detailed board queries
 */
export interface GetBoardDetailedParams {
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
}

/**
 * Parameters for board actions query
 */
export interface GetBoardActionsParams {
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
}

/**
 * Parameters for updating board preferences
 */
export interface UpdateBoardMyPrefsParams {
  id: string;
  emailPosition?: string;
  idEmailList?: string;
  showSidebar?: boolean;
  showSidebarActivity?: boolean;
  showSidebarBoardActions?: boolean;
  showSidebarMembers?: boolean;
}