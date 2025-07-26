import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TrelloClient } from '../trello-client/index.js';
import { TrelloHelpers } from '../helpers/trello-helpers.js';

/**
 * Registers all board-related MCP tools
 */
export function registerBoardTools(server: McpServer, trelloClient: TrelloClient, helpers: TrelloHelpers, shouldRegisterTool: (name: string, category: string) => boolean) {
    
    // Helper function to conditionally register tools
    const registerTool = (name: string, config: any, handler: (params: any) => Promise<any>) => {
        if (shouldRegisterTool(name, 'board')) {
            server.registerTool(name, config, handler);
        }
    };

    // Create Board
    registerTool(
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
    registerTool(
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
    registerTool(
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
    registerTool(
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
    registerTool(
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
    registerTool(
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
    registerTool(
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
    registerTool(
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
    registerTool(
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
    registerTool(
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
    registerTool(
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
    registerTool(
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
    registerTool(
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
    registerTool(
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
    registerTool(
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
    registerTool(
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

    // Find List by Name
    registerTool(
        "find-list-by-name",
        {
            title: "Liste nach Name suchen",
            description: "Sucht nach Listen auf einem Board anhand des Namens (unterstützt partielle Übereinstimmung).",
            inputSchema: {
                listName: z.string().min(1, "Listen-Name ist erforderlich"),
                boardId: z.string().min(1, "Board-ID ist erforderlich"),
                exactMatch: z.boolean().default(false).describe("Exakte Übereinstimmung des Namens (standardmäßig false für partielle Suche)"),
                includeCards: z.boolean().default(false).describe("Karten der gefundenen Listen mitladen"),
                includeArchived: z.boolean().default(false).describe("Archivierte Listen in Suche einbeziehen"),
                caseSensitive: z.boolean().default(false).describe("Groß-/Kleinschreibung beachten")
            }
        },
        async (params) => {
            console.error(`[find-list-by-name] Input:`, params);
            try {
                // Get all lists from board
                const allLists = await trelloClient.getBoardLists({
                    id: params.boardId,
                    filter: params.includeArchived ? 'all' : 'open'
                });

                // Filter lists by name
                let matchingLists = allLists.filter(list => {
                    const listNameToCheck = params.caseSensitive ? list.name : list.name.toLowerCase();
                    const searchName = params.caseSensitive ? params.listName : params.listName.toLowerCase();
                    
                    return params.exactMatch 
                        ? listNameToCheck === searchName
                        : listNameToCheck.includes(searchName);
                });

                if (matchingLists.length === 0) {
                    const availableListNames = allLists.map(l => l.name).join(', ');
                    throw new Error(`Keine Liste mit Namen '${params.listName}' gefunden. Verfügbare Listen: ${availableListNames}`);
                }

                // Optionally include cards for each matching list
                if (params.includeCards) {
                    const listsWithCards = await Promise.all(
                        matchingLists.map(async (list) => {
                            const cards = await trelloClient.getListCards(list.id);
                            return {
                                ...list,
                                cards: cards,
                                cardCount: cards.length
                            };
                        })
                    );
                    matchingLists = listsWithCards;
                }

                console.error(`[find-list-by-name] Found ${matchingLists.length} lists`);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            searchCriteria: {
                                listName: params.listName,
                                exactMatch: params.exactMatch,
                                caseSensitive: params.caseSensitive,
                                includeArchived: params.includeArchived,
                                includeCards: params.includeCards
                            },
                            results: matchingLists,
                            resultCount: matchingLists.length
                        }, null, 2)
                    }]
                };
            } catch (error) {
                console.error(`[find-list-by-name] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Suchen der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Find Card by Name
    registerTool(
        "find-card-by-name",
        {
            title: "Karte nach Name suchen",
            description: "Sucht nach Karten auf einem Board oder in einer Liste anhand des Namens (unterstützt partielle Übereinstimmung).",
            inputSchema: {
                cardName: z.string().min(1, "Karten-Name ist erforderlich"),
                boardId: z.string().optional().describe("Board-ID (erforderlich wenn listId nicht angegeben)"),
                listId: z.string().optional().describe("Listen-ID für Suche in spezifischer Liste"),
                exactMatch: z.boolean().default(false).describe("Exakte Übereinstimmung des Namens (standardmäßig false für partielle Suche)"),
                includeArchived: z.boolean().default(false).describe("Archivierte Karten in Suche einbeziehen"),
                caseSensitive: z.boolean().default(false).describe("Groß-/Kleinschreibung beachten"),
                includeDetails: z.boolean().default(false).describe("Detaillierte Karteninfos laden (Beschreibung, Labels, Mitglieder, etc.)"),
                filterByLabel: z.string().optional().describe("Nach Label-Namen filtern"),
                filterByMember: z.string().optional().describe("Nach Mitgliedername filtern"),
                filterByDueDate: z.enum(["overdue", "due_today", "due_week", "no_due_date"]).optional().describe("Nach Fälligkeitsdatum filtern")
            }
        },
        async (params) => {
            console.error(`[find-card-by-name] Input:`, params);
            try {
                if (!params.boardId && !params.listId) {
                    throw new Error("Entweder boardId oder listId muss angegeben werden");
                }

                let cards: any[] = [];

                // Get cards from board or list
                if (params.listId) {
                    cards = await trelloClient.getListCards(params.listId);
                } else if (params.boardId) {
                    const filter = params.includeArchived ? 'all' : 'visible';
                    cards = await trelloClient.getBoardCards({
                        id: params.boardId,
                        filter: filter
                    });
                }

                // Filter cards by name
                let matchingCards = cards.filter(card => {
                    const cardNameToCheck = params.caseSensitive ? card.name : card.name.toLowerCase();
                    const searchName = params.caseSensitive ? params.cardName : params.cardName.toLowerCase();
                    
                    return params.exactMatch 
                        ? cardNameToCheck === searchName
                        : cardNameToCheck.includes(searchName);
                });

                // Apply additional filters
                if (params.filterByLabel) {
                    matchingCards = matchingCards.filter(card => 
                        card.labels && card.labels.some((label: any) => 
                            label.name.toLowerCase().includes(params.filterByLabel!.toLowerCase())
                        )
                    );
                }

                if (params.filterByMember) {
                    matchingCards = matchingCards.filter(card => 
                        card.members && card.members.some((member: any) => 
                            member.fullName.toLowerCase().includes(params.filterByMember!.toLowerCase()) ||
                            member.username.toLowerCase().includes(params.filterByMember!.toLowerCase())
                        )
                    );
                }

                if (params.filterByDueDate) {
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

                    matchingCards = matchingCards.filter(card => {
                        if (!card.due) {
                            return params.filterByDueDate === "no_due_date";
                        }
                        
                        const dueDate = new Date(card.due);
                        switch (params.filterByDueDate) {
                            case "overdue":
                                return dueDate < today;
                            case "due_today":
                                return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
                            case "due_week":
                                return dueDate >= today && dueDate <= nextWeek;
                            case "no_due_date":
                                return false;
                            default:
                                return true;
                        }
                    });
                }

                if (matchingCards.length === 0) {
                    throw new Error(`Keine Karte mit Namen '${params.cardName}' gefunden`);
                }

                // Optionally load detailed card information
                if (params.includeDetails) {
                    const detailedCards = await Promise.all(
                        matchingCards.map(async (card) => {
                            const detailedCard = await trelloClient.getCard(card.id);
                            return detailedCard;
                        })
                    );
                    matchingCards = detailedCards;
                }

                console.error(`[find-card-by-name] Found ${matchingCards.length} cards`);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            searchCriteria: {
                                cardName: params.cardName,
                                exactMatch: params.exactMatch,
                                caseSensitive: params.caseSensitive,
                                includeArchived: params.includeArchived,
                                includeDetails: params.includeDetails,
                                filterByLabel: params.filterByLabel,
                                filterByMember: params.filterByMember,
                                filterByDueDate: params.filterByDueDate
                            },
                            results: matchingCards,
                            resultCount: matchingCards.length
                        }, null, 2)
                    }]
                };
            } catch (error) {
                console.error(`[find-card-by-name] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Suchen der Karte: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Quick Find Board (with fuzzy search)
    registerTool(
        "quick-find-board",
        {
            title: "Board schnell finden (Fuzzy Search)",
            description: "Findet Boards mit fortgeschrittenem Fuzzy-Matching und Ranking. Ideal für schnellen Zugriff ohne genaue Namenskenntnis.",
            inputSchema: {
                searchTerm: z.string().min(1, "Suchbegriff ist erforderlich"),
                maxResults: z.number().default(5).describe("Maximale Anzahl Ergebnisse (Standard: 5)"),
                includeDescription: z.boolean().default(false).describe("Board-Beschreibungen in Suche einbeziehen"),
                includeArchived: z.boolean().default(false).describe("Archivierte Boards in Suche einbeziehen"),
                matchThreshold: z.number().min(0).max(1).default(0.3).describe("Mindest-Ähnlichkeitsschwelle (0-1, Standard: 0.3)")
            }
        },
        async (params) => {
            console.error(`[quick-find-board] Input:`, params);
            try {
                const filter = params.includeArchived ? 'all' : 'open';
                const boards = await trelloClient.getBoards(filter, 'all');

                // Simple fuzzy matching algorithm
                const fuzzyMatch = (searchTerm: string, targetText: string): number => {
                    const search = searchTerm.toLowerCase();
                    const target = targetText.toLowerCase();
                    
                    // Exact match gets highest score
                    if (target === search) return 1.0;
                    
                    // Contains match gets high score
                    if (target.includes(search)) return 0.8;
                    
                    // Calculate character-based similarity
                    let matches = 0;
                    let searchIndex = 0;
                    
                    for (let i = 0; i < target.length && searchIndex < search.length; i++) {
                        if (target[i] === search[searchIndex]) {
                            matches++;
                            searchIndex++;
                        }
                    }
                    
                    return matches / search.length;
                };

                // Score and rank boards
                const scoredBoards = boards.map(board => {
                    let score = fuzzyMatch(params.searchTerm, board.name);
                    
                    // Also check description if requested
                    if (params.includeDescription && board.desc) {
                        const descScore = fuzzyMatch(params.searchTerm, board.desc);
                        score = Math.max(score, descScore * 0.7); // Description matches get slightly lower weight
                    }
                    
                    return { board, score };
                })
                .filter(item => item.score >= params.matchThreshold)
                .sort((a, b) => b.score - a.score)
                .slice(0, params.maxResults);

                if (scoredBoards.length === 0) {
                    throw new Error(`Keine Boards gefunden für Suchbegriff '${params.searchTerm}' (Schwellenwert: ${params.matchThreshold})`);
                }

                console.error(`[quick-find-board] Found ${scoredBoards.length} boards`);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            searchCriteria: {
                                searchTerm: params.searchTerm,
                                maxResults: params.maxResults,
                                includeDescription: params.includeDescription,
                                includeArchived: params.includeArchived,
                                matchThreshold: params.matchThreshold
                            },
                            results: scoredBoards.map(item => ({
                                ...item.board,
                                matchScore: Math.round(item.score * 100) / 100
                            })),
                            resultCount: scoredBoards.length
                        }, null, 2)
                    }]
                };
            } catch (error) {
                console.error(`[quick-find-board] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Suchen der Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Get Board Structure (Complete overview in one call)
    registerTool(
        "get-board-structure",
        {
            title: "Vollständige Board-Struktur abrufen",
            description: "Lädt komplette Board-Struktur mit Listen, Karten-Anzahlen und Statistiken in einem einzigen Aufruf.",
            inputSchema: {
                boardId: z.string().min(1, "Board-ID ist erforderlich"),
                includeCards: z.boolean().default(false).describe("Alle Karten-Details laden (langsamer, aber vollständig)"),
                includeMembers: z.boolean().default(true).describe("Board-Mitglieder laden"),
                includeLabels: z.boolean().default(true).describe("Board-Labels laden"),
                includeCustomFields: z.boolean().default(false).describe("Custom Fields laden"),
                cardLimit: z.number().default(50).describe("Maximale Anzahl Karten pro Liste (wenn includeCards = true)")
            }
        },
        async (params) => {
            console.error(`[get-board-structure] Input:`, params);
            try {
                // Parallel loading for better performance
                const promises: Promise<any>[] = [
                    trelloClient.getBoard(params.boardId),
                    trelloClient.getBoardLists({ id: params.boardId })
                ];

                if (params.includeMembers) {
                    promises.push(trelloClient.getBoardMembers(params.boardId));
                }
                if (params.includeLabels) {
                    promises.push(trelloClient.getBoardLabels(params.boardId));
                }
                if (params.includeCustomFields) {
                    promises.push(trelloClient.getBoardCustomFields(params.boardId));
                }

                const results = await Promise.all(promises);
                let resultIndex = 0;
                
                const board = results[resultIndex++];
                const lists = results[resultIndex++];
                const members = params.includeMembers ? results[resultIndex++] : [];
                const labels = params.includeLabels ? results[resultIndex++] : [];
                const customFields = params.includeCustomFields ? results[resultIndex++] : [];

                // Get cards for each list (either count or full details)
                const listsWithCards = await Promise.all(
                    lists.map(async (list: any) => {
                        if (params.includeCards) {
                            const cards = await trelloClient.getListCards(list.id);
                            return {
                                ...list,
                                cards: cards.slice(0, params.cardLimit),
                                cardCount: cards.length,
                                hasMoreCards: cards.length > params.cardLimit
                            };
                        } else {
                            const cards = await trelloClient.getListCards(list.id, 'id');
                            return {
                                ...list,
                                cardCount: cards.length
                            };
                        }
                    })
                );

                // Calculate statistics
                const totalCards = listsWithCards.reduce((sum, list) => sum + list.cardCount, 0);
                const stats = {
                    totalLists: lists.length,
                    totalCards: totalCards,
                    totalMembers: members.length,
                    totalLabels: labels.length,
                    averageCardsPerList: Math.round((totalCards / lists.length) * 100) / 100,
                    emptyLists: listsWithCards.filter(list => list.cardCount === 0).length
                };

                const result = {
                    board: {
                        ...board,
                        statistics: stats
                    },
                    lists: listsWithCards,
                    members: members,
                    labels: labels,
                    customFields: customFields,
                    metadata: {
                        loadedAt: new Date().toISOString(),
                        includeCards: params.includeCards,
                        cardLimit: params.cardLimit
                    }
                };

                console.error(`[get-board-structure] Loaded board with ${lists.length} lists and ${totalCards} cards`);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
                };
            } catch (error) {
                console.error(`[get-board-structure] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden der Board-Struktur: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // List Board Lists (Minimal)
    registerTool(
        "list-board-lists",
        {
            title: "Board-Listen auflisten (minimal)",
            description: "Lädt nur Namen und IDs der Listen eines Boards - spart Token.",
            inputSchema: {
                boardId: z.string().min(1, "Board-ID ist erforderlich")
            }
        },
        async (params) => {
            try {
                const lists = await trelloClient.getBoardLists({ id: params.boardId });
                const minimal = lists.map((list: any) => ({ id: list.id, name: list.name }));
                return {
                    content: [{ type: "text", text: JSON.stringify(minimal) }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // List Board Cards (Minimal)
    registerTool(
        "list-board-cards",
        {
            title: "Board-Karten auflisten (minimal)",
            description: "Lädt nur Namen, IDs und Listen-IDs aller Karten eines Boards - spart Token.",
            inputSchema: {
                boardId: z.string().min(1, "Board-ID ist erforderlich")
            }
        },
        async (params) => {
            try {
                const cards = await trelloClient.getBoardCards({ id: params.boardId });
                const minimal = cards.map((card: any) => ({ 
                    id: card.id, 
                    name: card.name, 
                    listId: card.idList 
                }));
                return {
                    content: [{ type: "text", text: JSON.stringify(minimal) }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );
}