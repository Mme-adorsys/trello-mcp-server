/**
 * Options for creating a new Trello card
 */
export interface CreateCardOptions {
  /** List ID to create card in (required) */
  idList: string;
  /** Card name/title */
  name?: string;
  /** Card description */
  desc?: string;
  /** Position in the list (number or 'top'/'bottom') */
  pos?: string | number;
  /** Due date (ISO string) */
  due?: string;
  /** Start date (ISO string) */
  start?: string | null;
  /** Whether the due date is complete */
  dueComplete?: boolean;
  /** Array of member IDs to assign */
  idMembers?: string[];
  /** Array of label IDs to attach */
  idLabels?: string[];
  /** URL to attach as link */
  urlSource?: string;
  /** File source for attachment */
  fileSource?: string;
  /** MIME type for file attachment */
  mimeType?: string;
  /** Card ID to copy from */
  idCardSource?: string;
  /** What to keep when copying from source card */
  keepFromSource?: string;
  /** Address for location */
  address?: string;
  /** Location name */
  locationName?: string;
}

/**
 * Parameters for updating a checklist
 */
export interface UpdateChecklistParams {
  name?: string;
  pos?: string | number;
}