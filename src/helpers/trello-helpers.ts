import { TrelloClient } from '../trello-client/index.js';
import { z } from 'zod';

export interface ToolResponse {
    [x: string]: unknown;
    content: Array<{
        type: "text";
        text: string;
    }>;
    isError?: boolean;
}

/**
 * Helper functions for common Trello operations
 */
export class TrelloHelpers {
    constructor(private trelloClient: TrelloClient) {}

    /**
     * Gets the first card from the 'next-actions' list on a board matching the filter
     */
    async getNextActionsCard(boardNameFilter: string, projectFilter?: string): Promise<ToolResponse> {
        try {
            // 1. Find board
            const boards = await this.trelloClient.getBoards('open', 'id,name');
            const board = boards.find(b => b.name.toLowerCase().includes(boardNameFilter.toLowerCase()));
            if (!board) throw new Error(`Kein Board mit Name, der '${boardNameFilter}' enthält, gefunden.`);

            // 2. Find 'next-actions' list
            const lists = await this.trelloClient.getLists(board.id, 'none', 'id,name');
            const list = lists.find(l => l.name.toLowerCase().includes('next actions'));
            if (!list) throw new Error(`Keine Liste 'next-actions' auf Board '${board.name}' gefunden.`);

            // 3. Get first card in list
            const cards = await this.trelloClient.getListCards(list.id, 'id,name');
            const filteredCards = cards.filter(c => c.name.toLowerCase().includes(projectFilter?.toLowerCase() ?? ''));
            if (!filteredCards.length) {
                console.error(`[get-next-actions-card] Keine Karten in Liste 'next-actions' auf Board '${board.name}' gefunden.`);
                throw new Error(`Keine Karten in Liste 'next-actions' auf Board '${board.name}' gefunden.`);
            }

            const id = cards[0].id;
            console.error(`[get-next-actions-card] ID: ${id}`);
            const card = await this.trelloClient.getCard(id);

            return { content: [{ type: "text", text: JSON.stringify(card, null, 2) }] };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Fehler beim Abrufen der Next Actions Karte: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                }],
                isError: true
            };
        }
    }

    /**
     * Gets the prompt field from a card's custom fields
     */
    async getNextActionsPrompt(boardId: string, cardId: string): Promise<ToolResponse> {
        try {
            // Get custom field definitions for board
            const customFields = await this.trelloClient.getBoardCustomFields(boardId);
            const promptField = customFields.find(f => f.name === 'Prompt');
            if (!promptField) throw new Error(`Custom Field 'Prompt' auf Board '${boardId}' nicht gefunden.`);

            // Get custom field items for card
            const fieldItems = await this.trelloClient.getCardCustomFieldItems(cardId);
            const promptItem = fieldItems.find(item => item.idCustomField === promptField.id);
            if (!promptItem || !promptItem.value || typeof promptItem.value.text !== 'string') {
                throw new Error(`Kein Wert für Custom Field 'Prompt' auf der ersten Karte in 'next-actions' gefunden.`);
            }

            return { content: [{ type: "text", text: promptItem.value.text }] };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Fehler beim Abrufen des Prompts: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                }],
                isError: true
            };
        }
    }

    /**
     * Finds a board by name (exact match)
     */
    async findBoardByName(name: string): Promise<ToolResponse> {
        try {
            const boards = await this.trelloClient.getBoards("open");
            const trelloBoards = boards.filter(value => value.name === name);

            if (!trelloBoards || trelloBoards.length === 0) {
                console.log(`Board mit dem Namen nicht gefunden, es sind nur folgende Boards verfügbar:`, boards.map(value => value.name));
                throw new Error(`Board mit Namen '${name}' nicht gefunden`);
            }

            const board = trelloBoards[0];
            return { content: [{ type: "text", text: JSON.stringify(board, null, 2) }] };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Fehler beim Laden des Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                }],
                isError: true
            };
        }
    }

    /**
     * Gets a card by name within a specific board or list
     */
    async getCardByName(cardName: string, boardId?: string, listId?: string): Promise<ToolResponse> {
        try {
            let cards: any[] = [];

            if (listId) {
                // Search within specific list
                cards = await this.trelloClient.getListCards(listId);
            } else if (boardId) {
                // Search within specific board
                cards = await this.trelloClient.getBoardCards({ id: boardId });
            } else {
                throw new Error('Either boardId or listId must be provided');
            }

            const matchingCards = cards.filter(card => 
                card.name.toLowerCase().includes(cardName.toLowerCase())
            );

            if (matchingCards.length === 0) {
                throw new Error(`Keine Karte mit Namen '${cardName}' gefunden`);
            }

            return { content: [{ type: "text", text: JSON.stringify(matchingCards, null, 2) }] };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Fehler beim Suchen der Karte: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                }],
                isError: true
            };
        }
    }

    /**
     * Gets a list by name within a specific board
     */
    async getListByName(listName: string, boardId: string): Promise<ToolResponse> {
        try {
            const lists = await this.trelloClient.getBoardLists({ id: boardId });
            const matchingLists = lists.filter(list => 
                list.name.toLowerCase().includes(listName.toLowerCase())
            );

            if (matchingLists.length === 0) {
                throw new Error(`Keine Liste mit Namen '${listName}' gefunden`);
            }

            return { content: [{ type: "text", text: JSON.stringify(matchingLists, null, 2) }] };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Fehler beim Suchen der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                }],
                isError: true
            };
        }
    }

    /**
     * Gets board overview with lists and card counts
     */
    async getBoardOverview(boardId: string): Promise<ToolResponse> {
        try {
            const [board, lists, cards, members] = await Promise.all([
                this.trelloClient.getBoard(boardId),
                this.trelloClient.getLists(boardId),
                this.trelloClient.getCards(boardId),
                this.trelloClient.getBoardMembers(boardId)
            ]);

            const boardData = {
                board,
                lists: lists.map(list => ({
                    ...list,
                    cardCount: cards.filter(card => card.idList === list.id).length
                })),
                summary: {
                    totalLists: lists.length,
                    totalCards: cards.length,
                    totalMembers: members.length,
                    openCards: cards.filter(card => !card.closed).length,
                    closedCards: cards.filter(card => card.closed).length
                }
            };

            return { content: [{ type: "text", text: JSON.stringify(boardData, null, 2) }] };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Fehler beim Laden der Board-Übersicht: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                }],
                isError: true
            };
        }
    }
}

// Input schemas for the helper functions
export const HelperSchemas = {
    getNextActionsCard: {
        boardNameFilter: z.string().min(1, "Filtertext für Board-Name ist erforderlich"),
        projectFilter: z.string().optional()
    },
    getNextActionsPrompt: {
        boardId: z.string(),
        cardId: z.string()
    },
    findBoardByName: {
        name: z.string().min(1, "Board-Name ist erforderlich")
    },
    getCardByName: {
        cardName: z.string().min(1, "Karten-Name ist erforderlich"),
        boardId: z.string().optional(),
        listId: z.string().optional()
    },
    getListByName: {
        listName: z.string().min(1, "Listen-Name ist erforderlich"),
        boardId: z.string().min(1, "Board-ID ist erforderlich")
    },
    getBoardOverview: {
        boardId: z.string().min(1, "Board-ID ist erforderlich")
    }
};