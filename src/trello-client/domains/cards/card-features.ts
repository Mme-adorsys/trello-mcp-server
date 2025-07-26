import { BaseClient } from '../../core/base-client.js';
import { UpdateChecklistParams } from './card-types.js';

/**
 * Client for advanced Trello Card features
 * Handles checklists, attachments, comments, labels, members, and custom fields
 */
export class CardFeaturesClient extends BaseClient {
  
  // =============================================================================
  // CHECKLIST MANAGEMENT
  // =============================================================================

  /**
   * Retrieves all checklists for a card
   * @param cardId - The card ID
   * @returns Promise resolving to array of checklists
   * @example
   * ```typescript
   * const checklists = await cardFeaturesClient.getCardChecklists('card-id');
   * ```
   */
  async getCardChecklists(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/checklists`, 'GET');
  }

  /**
   * Adds a new checklist to a card
   * @param cardId - The card ID
   * @param name - The checklist name
   * @returns Promise resolving to the created checklist
   * @example
   * ```typescript
   * const checklist = await cardFeaturesClient.addChecklistToCard('card-id', 'Todo Items');
   * ```
   */
  async addChecklistToCard(cardId: string, name: string): Promise<any> {
    return this.request<any>(`/cards/${cardId}/checklists`, 'POST', { name });
  }

  /**
   * Updates a checklist
   * @param checklistId - The checklist ID
   * @param updates - Properties to update
   * @returns Promise resolving to the updated checklist
   * @example
   * ```typescript
   * const updatedChecklist = await cardFeaturesClient.updateChecklist('checklist-id', {
   *   name: 'Updated Checklist Name',
   *   pos: 'top'
   * });
   * ```
   */
  async updateChecklist(checklistId: string, updates: UpdateChecklistParams): Promise<any> {
    return this.request<any>(`/checklists/${checklistId}`, 'PUT', updates);
  }

  /**
   * Deletes a checklist
   * @param checklistId - The checklist ID
   * @returns Promise resolving when deletion is complete
   * @example
   * ```typescript
   * await cardFeaturesClient.deleteChecklist('checklist-id');
   * ```
   */
  async deleteChecklist(checklistId: string): Promise<void> {
    await this.request(`/checklists/${checklistId}`, 'DELETE');
  }

  // =============================================================================
  // ATTACHMENT MANAGEMENT
  // =============================================================================

  /**
   * Retrieves all attachments for a card
   * @param cardId - The card ID
   * @returns Promise resolving to array of attachments
   * @example
   * ```typescript
   * const attachments = await cardFeaturesClient.getCardAttachments('card-id');
   * ```
   */
  async getCardAttachments(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/attachments`, 'GET');
  }

  /**
   * Adds an attachment to a card
   * @param cardId - The card ID
   * @param url - The URL to attach
   * @param name - Optional name for the attachment
   * @returns Promise resolving to the created attachment
   * @example
   * ```typescript
   * const attachment = await cardFeaturesClient.addAttachmentToCard(
   *   'card-id', 
   *   'https://example.com/document.pdf',
   *   'Project Requirements'
   * );
   * ```
   */
  async addAttachmentToCard(cardId: string, url: string, name?: string): Promise<any> {
    return this.request<any>(`/cards/${cardId}/attachments`, 'POST', { url, name });
  }

  /**
   * Deletes an attachment from a card
   * @param cardId - The card ID
   * @param attachmentId - The attachment ID
   * @returns Promise resolving when deletion is complete
   * @example
   * ```typescript
   * await cardFeaturesClient.deleteAttachment('card-id', 'attachment-id');
   * ```
   */
  async deleteAttachment(cardId: string, attachmentId: string): Promise<void> {
    await this.request(`/cards/${cardId}/attachments/${attachmentId}`, 'DELETE');
  }

  // =============================================================================
  // COMMENT MANAGEMENT
  // =============================================================================

  /**
   * Retrieves all comments for a card
   * @param cardId - The card ID
   * @returns Promise resolving to array of comments
   * @example
   * ```typescript
   * const comments = await cardFeaturesClient.getCardComments('card-id');
   * ```
   */
  async getCardComments(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/actions`, 'GET', { filter: 'commentCard' }, true);
  }

  /**
   * Adds a comment to a card
   * @param cardId - The card ID
   * @param text - The comment text
   * @returns Promise resolving to the created comment
   * @example
   * ```typescript
   * const comment = await cardFeaturesClient.addCommentToCard('card-id', 'This looks good!');
   * ```
   */
  async addCommentToCard(cardId: string, text: string): Promise<any> {
    return this.request<any>(`/cards/${cardId}/actions/comments`, 'POST', { text });
  }

  /**
   * Updates a comment on a card
   * @param cardId - The card ID
   * @param actionId - The comment action ID
   * @param text - The new comment text
   * @returns Promise resolving to the updated comment
   * @example
   * ```typescript
   * const updatedComment = await cardFeaturesClient.updateComment('card-id', 'action-id', 'Updated comment');
   * ```
   */
  async updateComment(cardId: string, actionId: string, text: string): Promise<any> {
    return this.request<any>(`/cards/${cardId}/actions/${actionId}/comments`, 'PUT', { text });
  }

  /**
   * Deletes a comment from a card
   * @param cardId - The card ID
   * @param actionId - The comment action ID
   * @returns Promise resolving when deletion is complete
   * @example
   * ```typescript
   * await cardFeaturesClient.deleteComment('card-id', 'action-id');
   * ```
   */
  async deleteComment(cardId: string, actionId: string): Promise<void> {
    await this.request(`/cards/${cardId}/actions/${actionId}/comments`, 'DELETE');
  }

  // =============================================================================
  // CUSTOM FIELD MANAGEMENT
  // =============================================================================

  /**
   * Retrieves custom field values for a card
   * @param cardId - The card ID
   * @returns Promise resolving to array of custom field items
   * @example
   * ```typescript
   * const customFields = await cardFeaturesClient.getCardCustomFieldItems('card-id');
   * ```
   */
  async getCardCustomFieldItems(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/customFieldItems`, 'GET');
  }

  /**
   * Sets a custom field value on a card
   * @param cardId - The card ID
   * @param fieldId - The custom field ID
   * @param value - The field value
   * @returns Promise resolving to the updated field
   * @example
   * ```typescript
   * await cardFeaturesClient.setCardCustomField('card-id', 'field-id', 'High Priority');
   * ```
   */
  async setCardCustomField(cardId: string, fieldId: string, value: any): Promise<any> {
    return this.request<any>(`/cards/${cardId}/customField/${fieldId}/item`, 'PUT', { value });
  }

  // =============================================================================
  // LABEL MANAGEMENT
  // =============================================================================

  /**
   * Retrieves labels attached to a card
   * @param cardId - The card ID
   * @returns Promise resolving to array of labels
   * @example
   * ```typescript
   * const labels = await cardFeaturesClient.getCardLabels('card-id');
   * ```
   */
  async getCardLabels(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/labels`, 'GET');
  }

  /**
   * Adds a label to a card
   * @param cardId - The card ID
   * @param labelId - The label ID
   * @returns Promise resolving to operation result
   * @example
   * ```typescript
   * await cardFeaturesClient.addLabelToCard('card-id', 'label-id');
   * ```
   */
  async addLabelToCard(cardId: string, labelId: string): Promise<any> {
    return this.request<any>(`/cards/${cardId}/idLabels`, 'POST', { value: labelId });
  }

  /**
   * Removes a label from a card
   * @param cardId - The card ID
   * @param labelId - The label ID
   * @returns Promise resolving when removal is complete
   * @example
   * ```typescript
   * await cardFeaturesClient.removeLabelFromCard('card-id', 'label-id');
   * ```
   */
  async removeLabelFromCard(cardId: string, labelId: string): Promise<void> {
    await this.request(`/cards/${cardId}/idLabels/${labelId}`, 'DELETE');
  }

  // =============================================================================
  // MEMBER MANAGEMENT
  // =============================================================================

  /**
   * Retrieves members assigned to a card
   * @param cardId - The card ID
   * @returns Promise resolving to array of members
   * @example
   * ```typescript
   * const members = await cardFeaturesClient.getCardMembers('card-id');
   * ```
   */
  async getCardMembers(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/members`, 'GET');
  }

  /**
   * Assigns a member to a card
   * @param cardId - The card ID
   * @param memberId - The member ID
   * @returns Promise resolving to operation result
   * @example
   * ```typescript
   * await cardFeaturesClient.addMemberToCard('card-id', 'member-id');
   * ```
   */
  async addMemberToCard(cardId: string, memberId: string): Promise<any> {
    return this.request<any>(`/cards/${cardId}/idMembers`, 'POST', { value: memberId });
  }

  /**
   * Removes a member from a card
   * @param cardId - The card ID
   * @param memberId - The member ID
   * @returns Promise resolving when removal is complete
   * @example
   * ```typescript
   * await cardFeaturesClient.removeMemberFromCard('card-id', 'member-id');
   * ```
   */
  async removeMemberFromCard(cardId: string, memberId: string): Promise<void> {
    await this.request(`/cards/${cardId}/idMembers/${memberId}`, 'DELETE');
  }
}