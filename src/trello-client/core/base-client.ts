import fetch from 'node-fetch';
import { TrelloConfig } from './config.js';
import { toQueryParams } from './types.js';

/**
 * Base HTTP client for Trello API with sophisticated retry logic and error handling
 * 
 * Features:
 * - Automatic retry with exponential backoff for failed requests
 * - Configurable timeouts with AbortController
 * - Sophisticated error classification (4xx vs 5xx errors)
 * - Verbose logging for debugging
 * - Type-safe request methods
 */
export class BaseClient {
  private config: TrelloConfig;
  private baseUrl = 'https://api.trello.com/1';
  private readonly timeout: number;
  private readonly retries: number;
  private readonly verboseLogging: boolean;

  /**
   * Creates a new BaseClient instance
   * @param config - Configuration object containing API credentials and options
   * @throws {Error} Implicitly throws if apiKey or token are missing
   */
  constructor(config: TrelloConfig) {
    this.config = config;
    this.timeout = config.timeout || parseInt(process.env.TRELLO_TIMEOUT || '30000');
    this.retries = config.retries || parseInt(process.env.TRELLO_RETRIES || '3');
    this.verboseLogging = config.verboseLogging ?? (process.env.TRELLO_VERBOSE_LOGGING === 'true');
  }

  /**
   * Makes an HTTP request to the Trello API with automatic retry logic
   * @param endpoint - API endpoint path (e.g., '/boards')
   * @param method - HTTP method
   * @param bodyOrParams - Request body (for POST/PUT) or query parameters
   * @param asQueryParams - Whether to treat bodyOrParams as query parameters
   * @returns Promise resolving to the parsed response
   * @throws {Error} On request failure after all retries exhausted
   */
  protected async request<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', bodyOrParams?: any, asQueryParams = false): Promise<T> {
    return this.requestWithRetry(endpoint, method, bodyOrParams, asQueryParams, this.retries);
  }

  /**
   * Core request method with sophisticated retry logic and error handling
   * 
   * Retry Strategy:
   * - Retries 5xx server errors and network errors with exponential backoff
   * - Does NOT retry 4xx client errors (bad request, unauthorized, etc.)
   * - Uses AbortController for request timeouts
   * - Logs slow requests (>5 seconds) for performance monitoring
   * 
   * @param endpoint - API endpoint path
   * @param method - HTTP method
   * @param bodyOrParams - Request data
   * @param asQueryParams - Whether to encode data as query parameters
   * @param retriesLeft - Number of retries remaining
   * @returns Promise resolving to the parsed API response
   * @throws {Error} On request failure after all retries exhausted
   */
  private async requestWithRetry<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', bodyOrParams?: any, asQueryParams = false, retriesLeft = 0): Promise<T> {
    const startTime = Date.now();
    let url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('key', this.config.apiKey);
    url.searchParams.append('token', this.config.token);
    
    // Setup AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    let fetchOptions: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
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
    
    // Conditional logging
    if (this.verboseLogging) {
      console.error(`[TrelloClient] ${method} ${url.toString()}`);
      if (bodyOrParams) {
        console.error(`[TrelloClient] Params/Body:`, JSON.stringify(bodyOrParams));
      }
    }
    
    try {
      const response = await fetch(url.toString(), fetchOptions);
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      
      // Log slow requests
      if (duration > 5000) {
        console.error(`[TrelloClient] Slow request: ${method} ${endpoint} took ${duration}ms`);
      }
      
      let responseBody: any = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
      
      if (this.verboseLogging) {
        console.error(`[TrelloClient] Response Status: ${response.status} (${duration}ms)`);
        // Only log response body if it's small enough to avoid memory issues
        if (JSON.stringify(responseBody).length < 10000) {
          console.error(`[TrelloClient] Response Body:`, responseBody);
        } else {
          console.error(`[TrelloClient] Response Body: [Large response omitted - ${JSON.stringify(responseBody).length} chars]`);
        }
      }
      
      if (!response.ok) {
        const errorMessage = `Trello API error: ${response.status} ${response.statusText} - ${JSON.stringify(responseBody)}`;
        
        // Don't retry 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(errorMessage);
        }
        
        // Retry 5xx errors if retries are available
        if (retriesLeft > 0) {
          const delay = Math.min(1000 * Math.pow(2, this.retries - retriesLeft), 5000); // Exponential backoff with max 5s
          console.error(`[TrelloClient] Server error ${response.status}, retrying in ${delay}ms... (${retriesLeft} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.requestWithRetry(endpoint, method, bodyOrParams, asQueryParams, retriesLeft - 1);
        }
        
        throw new Error(errorMessage);
      }
      
      return responseBody as T;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      
      // Handle AbortError (timeout)
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${duration}ms: ${method} ${endpoint}`);
        
        if (retriesLeft > 0) {
          const delay = Math.min(1000 * Math.pow(2, this.retries - retriesLeft), 5000);
          console.error(`[TrelloClient] Timeout error, retrying in ${delay}ms... (${retriesLeft} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.requestWithRetry(endpoint, method, bodyOrParams, asQueryParams, retriesLeft - 1);
        }
        
        throw timeoutError;
      }
      
      // Handle network errors
      if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        if (retriesLeft > 0) {
          const delay = Math.min(1000 * Math.pow(2, this.retries - retriesLeft), 5000);
          console.error(`[TrelloClient] Network error ${error.code}, retrying in ${delay}ms... (${retriesLeft} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.requestWithRetry(endpoint, method, bodyOrParams, asQueryParams, retriesLeft - 1);
        }
      }
      
      throw error;
    }
  }
}