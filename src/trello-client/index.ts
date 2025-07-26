// Main exports
export { TrelloClient } from './trello-client.js';

// Core types and config
export type { TrelloConfig } from './core/config.js';
export type { TrelloBoard, TrelloList, TrelloCard, TrelloMember, TrelloOrganization } from './core/types.js';

// Domain clients (for advanced usage)
export { BoardClient } from './domains/boards/index.js';
export { ListClient } from './domains/lists/index.js';
export { CardClient, CardFeaturesClient } from './domains/cards/index.js';
export { MemberClient } from './domains/members/index.js';
export { OrganizationClient } from './domains/organizations/index.js';
export { LabelClient } from './domains/labels/index.js';
export { CustomFieldClient } from './domains/custom-fields/index.js';
export { AutomationClient } from './domains/automation/index.js';
export { PowerUpClient } from './domains/power-ups/index.js';

// Domain-specific types
export type { 
  CreateBoardOptions, 
  GetBoardDetailedParams, 
  GetBoardActionsParams,
  UpdateBoardMyPrefsParams 
} from './domains/boards/index.js';

export type { 
  CreateListOptions, 
  UpdateListParams, 
  MoveAllCardsParams,
  UpdateListFieldParams 
} from './domains/lists/index.js';

export type { 
  CreateCardOptions,
  UpdateChecklistParams 
} from './domains/cards/index.js';