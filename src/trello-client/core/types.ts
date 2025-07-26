/**
 * Represents a Trello board
 */
export interface TrelloBoard {
  /** Unique board identifier */
  id: string;
  /** Board name */
  name: string;
  /** Board description */
  desc: string;
  /** Whether the board is closed/archived */
  closed: boolean;
  /** Full board URL */
  url: string;
  /** Short board URL */
  shortUrl: string;
}

/**
 * Represents a Trello list
 */
export interface TrelloList {
  /** Unique list identifier */
  id: string;
  /** List name */
  name: string;
  /** Whether the list is archived */
  closed: boolean;
  /** Position of the list on the board */
  pos: number;
  /** ID of the board this list belongs to */
  idBoard: string;
}

/**
 * Represents a Trello card
 */
export interface TrelloCard {
  /** Unique card identifier */
  id: string;
  /** Card name/title */
  name: string;
  /** Card description */
  desc: string;
  /** Whether the card is archived */
  closed: boolean;
  /** ID of the list this card belongs to */
  idList: string;
  /** ID of the board this card belongs to */
  idBoard: string;
  /** Full card URL */
  url: string;
  /** Short card URL */
  shortUrl: string;
  /** Position of the card in the list */
  pos: number;
  /** Due date (ISO string) or null */
  due: string | null;
  /** Array of labels attached to the card */
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

/**
 * Represents a Trello member/user
 */
export interface TrelloMember {
  /** Unique member identifier */
  id: string;
  /** Member username */
  username: string;
  /** Member's full name */
  fullName: string;
  /** Member's email (optional) */
  email?: string;
}

/**
 * Represents a Trello organization
 */
export interface TrelloOrganization {
  /** Unique organization identifier */
  id: string;
  /** Organization display name */
  displayName: string;
  /** Organization short name */
  name: string;
  /** Organization description */
  desc: string;
}

/**
 * Helper function to convert options object to URL query parameters
 * @param options - Object with key-value pairs to convert
 * @returns URL-encoded query string
 */
export function toQueryParams(options: Record<string, any>): string {
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