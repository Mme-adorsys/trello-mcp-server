/**
 * Options for creating a new Trello list
 */
export interface CreateListOptions {
  /** List name (required) */
  name: string;
  /** Board ID to create list on (required) */
  idBoard: string;
  /** List ID to copy from */
  idListSource?: string;
  /** Position on the board (number or 'top'/'bottom') */
  pos?: string | number;
}

/**
 * Parameters for updating a list
 */
export interface UpdateListParams {
  id: string;
  name?: string;
  closed?: boolean;
  idBoard?: string;
  pos?: string | number;
  subscribed?: boolean;
}

/**
 * Parameters for moving all cards from one list to another
 */
export interface MoveAllCardsParams {
  id: string;
  idBoard: string;
  idList: string;
}

/**
 * Parameters for updating specific list fields
 */
export interface UpdateListFieldParams {
  id: string;
  field: 'name' | 'pos' | 'subscribed';
  value: string | number | boolean;
}