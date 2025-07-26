import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TrelloClient } from '../trello-client.js';
import { TrelloHelpers, HelperSchemas } from '../helpers/trello-helpers.js';

/**
 * Registers all list-related MCP tools
 */
export function registerListTools(server: McpServer, trelloClient: TrelloClient, helpers: TrelloHelpers) {
    // Create List
    server.registerTool(
        "create-list",
        {
            title: "Liste erstellen",
            description: "Erstellt eine neue Liste auf einem Board",
            inputSchema: {
                boardId: z.string().min(1, "Board ID ist erforderlich"),
                name: z.string().min(1, "Listen Name ist erforderlich"),
                position: z.number().optional()
            }
        },
        async ({boardId, name, position}) => {
            console.error(`[create-list] Input:`, {boardId, name, position});
            try {
                const list = await trelloClient.createList({name, idBoard: boardId, pos: position});
                console.error(`[create-list] Result:`, list);
                return {
                    content: [{
                        type: "text",
                        text: `Liste "${list.name}" erfolgreich erstellt!`
                    }]
                };
            } catch (error) {
                console.error(`[create-list] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Erstellen der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Get List
    server.registerTool(
        "get-list",
        {
            title: "Liste abrufen",
            description: "Lädt eine Trello-Liste.",
            inputSchema: {
                id: z.string().min(1, "Listen-ID ist erforderlich"),
                fields: z.string().optional(),
            }
        },
        async (params) => {
            console.error(`[get-list] Input:`, params);
            try {
                const list = await trelloClient.getList(params);
                console.error(`[get-list] Result:`, list);
                return {
                    content: [{type: "text", text: JSON.stringify(list, null, 2)}]
                };
            } catch (error) {
                console.error(`[get-list] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Update List (Full)
    server.registerTool(
        "update-list-full",
        {
            title: "Liste aktualisieren (alle Felder)",
            description: "Aktualisiert eine Trello-Liste mit allen unterstützten Feldern.",
            inputSchema: {
                id: z.string().min(1, "Listen-ID ist erforderlich"),
                name: z.string().optional(),
                closed: z.boolean().optional(),
                idBoard: z.string().optional(),
                pos: z.union([z.string(), z.number()]).optional(),
                subscribed: z.boolean().optional(),
            }
        },
        async (params) => {
            console.error(`[update-list-full] Input:`, params);
            try {
                const list = await trelloClient.updateList(params);
                console.error(`[update-list-full] Result:`, list);
                return {
                    content: [{type: "text", text: JSON.stringify(list, null, 2)}]
                };
            } catch (error) {
                console.error(`[update-list-full] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Aktualisieren der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Create List (Full)
    server.registerTool(
        "create-list-full",
        {
            title: "Liste erstellen (alle Felder)",
            description: "Erstellt eine neue Trello-Liste mit allen unterstützten Feldern.",
            inputSchema: {
                name: z.string().min(1, "Listen-Name ist erforderlich"),
                idBoard: z.string().min(1, "Board-ID ist erforderlich"),
                idListSource: z.string().optional(),
                pos: z.union([z.string(), z.number()]).optional(),
            }
        },
        async (params) => {
            console.error(`[create-list-full] Input:`, params);
            try {
                const list = await trelloClient.createList(params);
                console.error(`[create-list-full] Result:`, list);
                return {
                    content: [{type: "text", text: JSON.stringify(list, null, 2)}]
                };
            } catch (error) {
                console.error(`[create-list-full] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Erstellen der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Archive All Cards in List
    server.registerTool(
        "archive-all-cards-in-list",
        {
            title: "Alle Karten in Liste archivieren",
            description: "Archiviert alle Karten in einer Trello-Liste.",
            inputSchema: {
                id: z.string().min(1, "Listen-ID ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[archive-all-cards-in-list] Input:`, params);
            try {
                const result = await trelloClient.archiveAllCardsInList(params.id);
                console.error(`[archive-all-cards-in-list] Result:`, result);
                return {
                    content: [{type: "text", text: JSON.stringify(result, null, 2)}]
                };
            } catch (error) {
                console.error(`[archive-all-cards-in-list] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Archivieren der Karten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Move All Cards in List
    server.registerTool(
        "move-all-cards-in-list",
        {
            title: "Alle Karten in Liste verschieben",
            description: "Verschiebt alle Karten in einer Trello-Liste zu einer anderen Liste/Board.",
            inputSchema: {
                id: z.string().min(1, "Listen-ID ist erforderlich"),
                idBoard: z.string().min(1, "Ziel-Board-ID ist erforderlich"),
                idList: z.string().min(1, "Ziel-Listen-ID ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[move-all-cards-in-list] Input:`, params);
            try {
                const result = await trelloClient.moveAllCardsInList(params);
                console.error(`[move-all-cards-in-list] Result:`, result);
                return {
                    content: [{type: "text", text: JSON.stringify(result, null, 2)}]
                };
            } catch (error) {
                console.error(`[move-all-cards-in-list] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Verschieben der Karten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Set List Closed (Archive/Unarchive)
    server.registerTool(
        "set-list-closed",
        {
            title: "Liste archivieren/reaktivieren",
            description: "Archiviert oder reaktiviert eine Trello-Liste.",
            inputSchema: {
                id: z.string().min(1, "Listen-ID ist erforderlich"),
                value: z.boolean(),
            }
        },
        async (params) => {
            console.error(`[set-list-closed] Input:`, params);
            try {
                const list = await trelloClient.setListClosed(params);
                console.error(`[set-list-closed] Result:`, list);
                return {
                    content: [{type: "text", text: JSON.stringify(list, null, 2)}]
                };
            } catch (error) {
                console.error(`[set-list-closed] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Archivieren/Reaktivieren der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Move List to Board
    server.registerTool(
        "move-list-to-board",
        {
            title: "Liste zu anderem Board verschieben",
            description: "Verschiebt eine Trello-Liste zu einem anderen Board.",
            inputSchema: {
                id: z.string().min(1, "Listen-ID ist erforderlich"),
                value: z.string().min(1, "Ziel-Board-ID ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[move-list-to-board] Input:`, params);
            try {
                const list = await trelloClient.moveListToBoard(params);
                console.error(`[move-list-to-board] Result:`, list);
                return {
                    content: [{type: "text", text: JSON.stringify(list, null, 2)}]
                };
            } catch (error) {
                console.error(`[move-list-to-board] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Verschieben der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Update List Field
    server.registerTool(
        "update-list-field",
        {
            title: "Feld einer Liste aktualisieren",
            description: "Aktualisiert ein einzelnes Feld einer Trello-Liste.",
            inputSchema: {
                id: z.string().min(1, "Listen-ID ist erforderlich"),
                field: z.enum(["name", "pos", "subscribed"]),
                value: z.union([z.string(), z.number(), z.boolean()]),
            }
        },
        async (params) => {
            console.error(`[update-list-field] Input:`, params);
            try {
                const list = await trelloClient.updateListField(params);
                console.error(`[update-list-field] Result:`, list);
                return {
                    content: [{type: "text", text: JSON.stringify(list, null, 2)}]
                };
            } catch (error) {
                console.error(`[update-list-field] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Aktualisieren des Feldes: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Get List Actions
    server.registerTool(
        "get-list-actions",
        {
            title: "Aktionen einer Liste abrufen",
            description: "Lädt alle Aktionen einer Trello-Liste.",
            inputSchema: {
                id: z.string().min(1, "Listen-ID ist erforderlich"),
                filter: z.string().optional(),
            }
        },
        async (params) => {
            console.error(`[get-list-actions] Input:`, params);
            try {
                const actions = await trelloClient.getListActions(params);
                console.error(`[get-list-actions] Result:`, actions);
                return {
                    content: [{type: "text", text: JSON.stringify(actions, null, 2)}]
                };
            } catch (error) {
                console.error(`[get-list-actions] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden der Aktionen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Get List Board
    server.registerTool(
        "get-list-board",
        {
            title: "Board einer Liste abrufen",
            description: "Lädt das Board, zu dem eine Trello-Liste gehört.",
            inputSchema: {
                id: z.string().min(1, "Listen-ID ist erforderlich"),
                fields: z.string().optional(),
            }
        },
        async (params) => {
            console.error(`[get-list-board] Input:`, params);
            try {
                const board = await trelloClient.getListBoard(params);
                console.error(`[get-list-board] Result:`, board);
                return {
                    content: [{type: "text", text: JSON.stringify(board, null, 2)}]
                };
            } catch (error) {
                console.error(`[get-list-board] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden des Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Get List Cards
    server.registerTool(
        "get-list-cards",
        {
            title: "Karten einer Liste abrufen",
            description: "Lädt alle Karten in einer Trello-Liste.",
            inputSchema: {
                id: z.string().min(1, "Listen-ID ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[get-list-cards] Input:`, params);
            try {
                const cards = await trelloClient.getListCards(params.id);
                console.error(`[get-list-cards] Result:`, cards);
                return {
                    content: [{type: "text", text: JSON.stringify(cards, null, 2)}]
                };
            } catch (error) {
                console.error(`[get-list-cards] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden der Karten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Helper Tool for Lists
    server.registerTool(
        "get-list-by-name",
        {
            title: "Liste nach Name suchen",
            description: "Sucht Listen nach Namen in einem Board.",
            inputSchema: HelperSchemas.getListByName
        },
        async (params) => helpers.getListByName(params.listName, params.boardId)
    );
}