import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TrelloClient } from '../trello-client.js';
import { TrelloHelpers } from '../helpers/trello-helpers.js';

/**
 * Registers all board-related MCP tools
 */
export function registerBoardTools(server: McpServer, trelloClient: TrelloClient, helpers: TrelloHelpers) {
    // Create Board
    server.registerTool(
        "create-board",
        {
            title: "Board erstellen",
            description: "Erstellt ein neues Trello Board",
            inputSchema: {
                name: z.string().min(1, "Board Name ist erforderlich"),
                description: z.string().optional(),
                idOrganization: z.string().optional(),
                defaultLabels: z.boolean().optional(),
                defaultLists: z.boolean().optional(),
                idBoardSource: z.string().optional(),
                keepFromSource: z.enum(["cards", "none"]).optional(),
                powerUps: z.enum(["all", "calendar", "cardAging", "recap", "voting"]).optional(),
                prefs_permissionLevel: z.enum(["org", "private", "public"]).optional(),
                prefs_voting: z.enum(["disabled", "members", "observers", "org", "public"]).optional(),
                prefs_comments: z.enum(["disabled", "members", "observers", "org", "public"]).optional(),
                prefs_invitations: z.enum(["admins", "members"]).optional(),
                prefs_selfJoin: z.boolean().optional(),
                prefs_cardCovers: z.boolean().optional(),
                prefs_background: z.string().optional(),
            }
        },
        async (params) => {
            console.error(`[create-board] Input:`, params);
            try {
                const board = await trelloClient.createBoard({
                    name: params.name,
                    desc: params.description,
                    idOrganization: params.idOrganization,
                    defaultLabels: params.defaultLabels,
                    defaultLists: params.defaultLists,
                    idBoardSource: params.idBoardSource,
                    keepFromSource: params.keepFromSource,
                    powerUps: params.powerUps,
                    prefs_permissionLevel: params.prefs_permissionLevel,
                    prefs_voting: params.prefs_voting,
                    prefs_comments: params.prefs_comments,
                    prefs_invitations: params.prefs_invitations,
                    prefs_selfJoin: params.prefs_selfJoin,
                    prefs_cardCovers: params.prefs_cardCovers,
                    prefs_background: params.prefs_background,
                });
                console.error(`[create-board] Result:`, board);
                return {
                    content: [{
                        type: "text",
                        text: `Board "${board.name}" erfolgreich erstellt!\nURL: ${board.shortUrl}`
                    }]
                };
            } catch (error) {
                console.error(`[create-board] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Erstellen des Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Close Board
    server.registerTool(
        "close-board",
        {
            title: "Board schließen",
            description: "Schließt ein Trello Board",
            inputSchema: {
                boardId: z.string().min(1, "Board ID ist erforderlich")
            }
        },
        async ({boardId}) => {
            try {
                const board = await trelloClient.closeBoard(boardId);
                return {
                    content: [{
                        type: "text",
                        text: `Board "${board.name}" wurde geschlossen.`
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Schließen des Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Get All Boards
    server.registerTool(
        "boards",
        {
            title: "Alle Boards abrufen",
            description: "Lädt alle Boards des aktuellen Members (Users).",
            inputSchema: {}
        },
        async () => {
            console.error("Starte getBoards...");
            const boards = await trelloClient.getBoards();
            console.error("Boards geladen:", boards.length);
            return {content: [{type: "text", text: JSON.stringify(boards, null, 2)}]};
        }
    );

    // Get Board (Simple)
    server.registerTool(
        "get-board",
        {
            title: "Board abrufen (einfach)",
            description: "Lädt ein Board nur anhand der ID (ohne Zusatzparameter).",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[get-board] Input:`, params);
            try {
                const board = await trelloClient.getBoard(params.id);
                console.error(`[get-board] Result:`, board);
                return {
                    content: [{type: "text", text: JSON.stringify(board, null, 2)}]
                };
            } catch (error) {
                console.error(`[get-board] Error:`, error);
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

    // Find Board by Name
    server.registerTool(
        "find-board-by-name",
        {
            title: "Finde ein Board anhand eines Namens",
            description: "Lädt ein Board nur anhand des Name (ohne Zusatzparameter).",
            inputSchema: {
                name: z.string().min(1, "Board-Name ist erforderlich"),
            }
        },
        async (params) => helpers.findBoardByName(params.name)
    );

    // Get Board Detailed
    server.registerTool(
        "get-board-detailed",
        {
            title: "Board (detailliert) abrufen",
            description: "Lädt ein Board mit allen Parametern.",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
                actions: z.string().optional(),
                boardStars: z.string().optional(),
                cards: z.string().optional(),
                card_pluginData: z.boolean().optional(),
                checklists: z.string().optional(),
                customFields: z.boolean().optional(),
                fields: z.string().optional(),
                labels: z.string().optional(),
                lists: z.string().optional(),
                members: z.string().optional(),
                memberships: z.string().optional(),
                pluginData: z.boolean().optional(),
                organization: z.boolean().optional(),
                organization_pluginData: z.boolean().optional(),
                myPrefs: z.boolean().optional(),
                tags: z.boolean().optional(),
            }
        },
        async (params) => {
            console.error(`[get-board-detailed] Input:`, params);
            try {
                const board = await trelloClient.getBoardDetailed(params);
                console.error(`[get-board-detailed] Result:`, board);
                return {
                    content: [{type: "text", text: JSON.stringify(board, null, 2)}]
                };
            } catch (error) {
                console.error(`[get-board-detailed] Error:`, error);
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

    // Update Board
    server.registerTool(
        "update-board",
        {
            title: "Board aktualisieren",
            description: "Aktualisiert ein Board mit beliebigen Feldern.",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
                updates: z.record(z.any())
            }
        },
        async (params) => {
            console.error(`[update-board] Input:`, params);
            try {
                const board = await trelloClient.updateBoard({id: params.id, ...params.updates});
                console.error(`[update-board] Result:`, board);
                return {
                    content: [{type: "text", text: JSON.stringify(board, null, 2)}]
                };
            } catch (error) {
                console.error(`[update-board] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Aktualisieren des Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Delete Board
    server.registerTool(
        "delete-board",
        {
            title: "Board löschen",
            description: "Löscht ein Board.",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[delete-board] Input:`, params);
            try {
                await trelloClient.deleteBoard(params.id);
                console.error(`[delete-board] Result: Board deleted`);
                return {
                    content: [{type: "text", text: `Board gelöscht.`}]
                };
            } catch (error) {
                console.error(`[delete-board] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Löschen des Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Get Board Field
    server.registerTool(
        "get-board-field",
        {
            title: "Einzelnes Board-Feld abrufen",
            description: "Lädt ein einzelnes Feld eines Boards.",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
                field: z.string().min(1, "Feldname ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[get-board-field] Input:`, params);
            try {
                const value = await trelloClient.getBoardField(params);
                console.error(`[get-board-field] Result:`, value);
                return {
                    content: [{type: "text", text: JSON.stringify(value, null, 2)}]
                };
            } catch (error) {
                console.error(`[get-board-field] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden des Feldes: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Get Board Actions
    server.registerTool(
        "get-board-actions",
        {
            title: "Board-Aktionen abrufen",
            description: "Lädt alle Aktionen eines Boards.",
            inputSchema: {
                boardId: z.string().min(1, "Board-ID ist erforderlich"),
                fields: z.string().optional(),
                filter: z.string().optional(),
                format: z.string().optional(),
                idModels: z.string().optional(),
                limit: z.number().optional(),
                member: z.boolean().optional(),
                member_fields: z.string().optional(),
                memberCreator: z.boolean().optional(),
                memberCreator_fields: z.string().optional(),
                page: z.number().optional(),
                reactions: z.boolean().optional(),
                before: z.string().optional(),
                since: z.string().optional(),
            }
        },
        async (params) => {
            console.error(`[get-board-actions] Input:`, params);
            try {
                const actions = await trelloClient.getBoardActions(params);
                console.error(`[get-board-actions] Result:`, actions);
                return {
                    content: [{type: "text", text: JSON.stringify(actions, null, 2)}]
                };
            } catch (error) {
                console.error(`[get-board-actions] Error:`, error);
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

    // Get Board Cards
    server.registerTool(
        "get-board-cards",
        {
            title: "Board-Karten abrufen",
            description: "Lädt alle Karten eines Boards (optional mit Filter).",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
                filter: z.string().optional(),
            }
        },
        async (params) => {
            console.error(`[get-board-cards] Input:`, params);
            try {
                const cards = await trelloClient.getBoardCards(params);
                console.error(`[get-board-cards] Result:`, cards);
                return {
                    content: [{type: "text", text: JSON.stringify(cards, null, 2)}]
                };
            } catch (error) {
                console.error(`[get-board-cards] Error:`, error);
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

    // Get Board Lists
    server.registerTool(
        "get-board-lists",
        {
            title: "Board-Listen abrufen",
            description: "Lädt alle Listen eines Boards (optional mit Filter).",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
                filter: z.string().optional(),
            }
        },
        async (params) => {
            console.error(`[get-board-lists] Input:`, params);
            try {
                const lists = await trelloClient.getBoardLists(params);
                console.error(`[get-board-lists] Result:`, lists);
                return {
                    content: [{type: "text", text: JSON.stringify(lists, null, 2)}]
                };
            } catch (error) {
                console.error(`[get-board-lists] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden der Listen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Get Board Members
    server.registerTool(
        "get-board-members",
        {
            title: "Board-Mitglieder abrufen",
            description: "Lädt alle Mitglieder eines Boards.",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[get-board-members] Input:`, params);
            try {
                const members = await trelloClient.getBoardMembers(params.id);
                console.error(`[get-board-members] Result:`, members);
                return {
                    content: [{type: "text", text: JSON.stringify(members, null, 2)}]
                };
            } catch (error) {
                console.error(`[get-board-members] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden der Mitglieder: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Get Board Checklists
    server.registerTool(
        "get-board-checklists",
        {
            title: "Board-Checklisten abrufen",
            description: "Lädt alle Checklisten eines Boards.",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[get-board-checklists] Input:`, params);
            try {
                const checklists = await trelloClient.getBoardChecklists(params.id);
                console.error(`[get-board-checklists] Result:`, checklists);
                return {
                    content: [{type: "text", text: JSON.stringify(checklists, null, 2)}]
                };
            } catch (error) {
                console.error(`[get-board-checklists] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden der Checklisten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Get Board Labels
    server.registerTool(
        "get-board-labels",
        {
            title: "Board-Labels abrufen",
            description: "Lädt alle Labels eines Boards.",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[get-board-labels] Input:`, params);
            try {
                const labels = await trelloClient.getBoardLabels(params.id);
                console.error(`[get-board-labels] Result:`, labels);
                return {
                    content: [{type: "text", text: JSON.stringify(labels, null, 2)}]
                };
            } catch (error) {
                console.error(`[get-board-labels] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden der Labels: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Board Overview Helper
    server.registerTool(
        "get-board-overview",
        {
            title: "Board-Übersicht abrufen",
            description: "Lädt eine vollständige Übersicht eines Boards mit Listen und Kartenzählungen.",
            inputSchema: {
                boardId: z.string().min(1, "Board-ID ist erforderlich")
            }
        },
        async (params) => helpers.getBoardOverview(params.boardId)
    );
}