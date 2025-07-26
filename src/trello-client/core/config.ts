/**
 * Configuration options for the TrelloClient
 */
export interface TrelloConfig {
  /** Trello API key (get from https://trello.com/app-key) */
  apiKey: string;
  /** Trello token (generate from API key page) */
  token: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retry attempts for failed requests (default: 3) */
  retries?: number;
  /** Enable detailed logging of requests and responses (default: false) */
  verboseLogging?: boolean;
}