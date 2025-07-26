import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TrelloClient } from '../trello-client/index.js';

/**
 * Registers core utility MCP tools (search, batch operations, bulk actions)
 */
export function registerUtilityTools(server: McpServer, trelloClient: TrelloClient, shouldRegisterTool: (name: string, category: string) => boolean) {

    // Helper function to conditionally register tools
    const registerTool = (name: string, config: any, handler: (params: any) => Promise<any>) => {
        if (shouldRegisterTool(name, 'utility')) {
            server.registerTool(name, config, handler);
        }
    };

    // Environment Variables
    registerTool(
        "show-env",
        {
            title: "Show Env",
            description: "Shows selected environment variables",
            inputSchema: {}
        },
        async () => {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        TRELLO_API_KEY: process.env.TRELLO_API_KEY,
                        TRELLO_TOKEN: process.env.TRELLO_TOKEN
                    })
                }]
            };
        }
    );

    // Search
    registerTool(
        "search-trello",
        {
            title: "Trello durchsuchen",
            description: "Durchsucht Trello nach Karten, Boards, Mitgliedern, etc.",
            inputSchema: {
                query: z.string().min(1),
                modelTypes: z.array(z.string()).optional(),
                idBoards: z.array(z.string()).optional(),
                idOrganizations: z.array(z.string()).optional()
            }
        },
        async ({query, modelTypes, idBoards, idOrganizations}) => {
            const result = await trelloClient.search(query, modelTypes, idBoards, idOrganizations);
            return {content: [{type: "text", text: JSON.stringify(result, null, 2)}]};
        }
    );

    // Batch API
    registerTool(
        "batch-trello",
        {
            title: "Batch-API aufrufen",
            description: "Führt mehrere Trello-API-Aufrufe in einem Batch aus.",
            inputSchema: {urls: z.array(z.string().min(1)).min(1)}
        },
        async ({urls}) => {
            const result = await trelloClient.batch(urls);
            return {content: [{type: "text", text: JSON.stringify(result, null, 2)}]};
        }
    );

    // Bulk Archive Cards
    registerTool(
        "bulk-archive-cards",
        {
            title: "Mehrere Karten archivieren (Bulk)",
            description: "Archiviert mehrere Karten basierend auf verschiedenen Kriterien wie Alter, Status oder Filter.",
            inputSchema: {
                cardSelection: z.object({
                    cardIds: z.array(z.string()).optional(),
                    fromListId: z.string().optional(),
                    fromBoardId: z.string().optional(),
                    criteria: z.object({
                        olderThanDays: z.number().optional().describe("Karten älter als X Tage archivieren"),
                        completedBefore: z.string().optional().describe("Karten abgeschlossen vor Datum (ISO string)"),
                        withoutActivity: z.number().optional().describe("Karten ohne Aktivität seit X Tagen"),
                        nameContains: z.string().optional(),
                        hasLabel: z.string().optional(),
                        inListNamed: z.string().optional().describe("Karten in Listen mit diesem Namen"),
                        duePassed: z.boolean().optional().describe("Überfällige Karten archivieren"),
                        withoutMembers: z.boolean().optional().describe("Karten ohne zugewiesene Mitglieder")
                    }).optional()
                }),
                safetyLimits: z.object({
                    maxCards: z.number().default(50).describe("Maximale Anzahl zu archivierender Karten"),
                    confirmationRequired: z.boolean().default(true).describe("Bestätigung vor Archivierung erforderlich")
                }).optional(),
                batchSize: z.number().default(10).describe("Anzahl Karten pro Batch")
            }
        },
        async (params) => {
            console.error(`[bulk-archive-cards] Input:`, params);
            try {
                let cardsToArchive: any[] = [];

                // Get cards based on selection criteria
                if (params.cardSelection.cardIds && params.cardSelection.cardIds.length > 0) {
                    cardsToArchive = await Promise.all(
                        params.cardSelection.cardIds.map((cardId: any) => trelloClient.getCard(cardId))
                    );
                } else {
                    let allCards: any[] = [];

                    if (params.cardSelection.fromListId) {
                        allCards = await trelloClient.getListCards(params.cardSelection.fromListId);
                    } else if (params.cardSelection.fromBoardId) {
                        allCards = await trelloClient.getBoardCards({
                            id: params.cardSelection.fromBoardId,
                            filter: 'visible'
                        });
                    } else {
                        throw new Error("Entweder cardIds, fromListId oder fromBoardId muss angegeben werden");
                    }

                    // Apply criteria filters
                    if (params.cardSelection.criteria) {
                        const criteria = params.cardSelection.criteria;
                        const now = new Date();

                        cardsToArchive = allCards.filter(card => {
                            // Age-based criteria
                            if (criteria.olderThanDays) {
                                const cardAge = (now.getTime() - new Date(card.dateLastActivity).getTime()) / (1000 * 60 * 60 * 24);
                                if (cardAge < criteria.olderThanDays) return false;
                            }

                            // Activity-based criteria
                            if (criteria.withoutActivity) {
                                const daysSinceActivity = (now.getTime() - new Date(card.dateLastActivity).getTime()) / (1000 * 60 * 60 * 24);
                                if (daysSinceActivity < criteria.withoutActivity) return false;
                            }

                            // Due date criteria
                            if (criteria.duePassed && card.due) {
                                const dueDate = new Date(card.due);
                                if (dueDate >= now) return false;
                            }

                            // Completion criteria
                            if (criteria.completedBefore) {
                                const completedBeforeDate = new Date(criteria.completedBefore);
                                if (!card.due || new Date(card.due) > completedBeforeDate) return false;
                            }

                            // Name criteria
                            if (criteria.nameContains && !card.name.toLowerCase().includes(criteria.nameContains.toLowerCase())) {
                                return false;
                            }

                            // Label criteria
                            if (criteria.hasLabel) {
                                const hasMatchingLabel = card.labels?.some((label: any) =>
                                    label.name.toLowerCase().includes(criteria.hasLabel!.toLowerCase())
                                );
                                if (!hasMatchingLabel) return false;
                            }

                            // Member criteria
                            if (criteria.withoutMembers && card.members && card.members.length > 0) {
                                return false;
                            }

                            return true;
                        });

                        // List name criteria (requires additional API call)
                        if (criteria.inListNamed && params.cardSelection.fromBoardId) {
                            const lists = await trelloClient.getBoardLists({ id: params.cardSelection.fromBoardId });
                            const targetLists = lists.filter((list: any) =>
                                list.name.toLowerCase().includes(criteria.inListNamed!.toLowerCase())
                            );
                            const targetListIds = targetLists.map((list: any) => list.id);
                            cardsToArchive = cardsToArchive.filter(card => targetListIds.includes(card.idList));
                        }
                    } else {
                        cardsToArchive = allCards;
                    }
                }

                // Apply safety limits
                const maxCards = params.safetyLimits?.maxCards || 50;
                if (cardsToArchive.length > maxCards) {
                    cardsToArchive = cardsToArchive.slice(0, maxCards);
                }

                if (cardsToArchive.length === 0) {
                    throw new Error("Keine Karten gefunden, die den Kriterien entsprechen");
                }

                // Confirmation check (in practice, this would need user interaction)
                const requiresConfirmation = params.safetyLimits?.confirmationRequired !== false;
                if (requiresConfirmation && cardsToArchive.length > 10) {
                    console.warn(`[bulk-archive-cards] Archivierung von ${cardsToArchive.length} Karten - Bestätigung empfohlen`);
                }

                // Archive cards in batches
                const results: any[] = [];
                const errors: any[] = [];

                for (let i = 0; i < cardsToArchive.length; i += params.batchSize) {
                    const batch = cardsToArchive.slice(i, i + params.batchSize);

                    const batchPromises = batch.map(async (card) => {
                        try {
                            const archivedCard = await trelloClient.archiveCard(card.id);
                            return {
                                success: true,
                                card: archivedCard,
                                originalCard: card
                            };
                        } catch (error) {
                            return {
                                success: false,
                                error: error instanceof Error ? error.message : 'Unbekannter Fehler',
                                originalCard: card
                            };
                        }
                    });

                    const batchResults = await Promise.all(batchPromises);

                    batchResults.forEach(result => {
                        if (result.success) {
                            results.push(result);
                        } else {
                            errors.push(result);
                        }
                    });

                    // Small delay between batches
                    if (i + params.batchSize < cardsToArchive.length) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                }

                console.error(`[bulk-archive-cards] Archived ${results.length} cards, ${errors.length} errors`);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            summary: {
                                found: cardsToArchive.length,
                                successful: results.length,
                                failed: errors.length,
                                criteria: params.cardSelection.criteria || {},
                                safetyLimitApplied: cardsToArchive.length >= maxCards
                            },
                            archivedCards: results.map(r => ({
                                id: r.card.id,
                                name: r.card.name,
                                listId: r.originalCard.idList,
                                lastActivity: r.originalCard.dateLastActivity
                            })),
                            errors: errors.map(e => ({
                                cardId: e.originalCard.id,
                                cardName: e.originalCard.name,
                                error: e.error
                            }))
                        }, null, 2)
                    }]
                };
            } catch (error) {
                console.error(`[bulk-archive-cards] Error:`, error);
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

    // Organize Cards by Due Date
    registerTool(
        "organize-cards-by-due-date",
        {
            title: "Karten nach Fälligkeitsdatum organisieren",
            description: "Organisiert Karten automatisch in Listen basierend auf ihren Fälligkeitsdaten (überfällig, heute, diese Woche, später).",
            inputSchema: {
                boardId: z.string().min(1, "Board-ID ist erforderlich"),
                targetLists: z.object({
                    overdue: z.string().optional().describe("Listen-ID für überfällige Karten"),
                    today: z.string().optional().describe("Listen-ID für heute fällige Karten"),
                    thisWeek: z.string().optional().describe("Listen-ID für diese Woche fällige Karten"),
                    later: z.string().optional().describe("Listen-ID für später fällige Karten"),
                    noDueDate: z.string().optional().describe("Listen-ID für Karten ohne Fälligkeitsdatum")
                }),
                sourceFilters: z.object({
                    excludeListIds: z.array(z.string()).optional().describe("Listen-IDs die ausgeschlossen werden sollen"),
                    onlyListIds: z.array(z.string()).optional().describe("Nur Karten aus diesen Listen verschieben"),
                    excludeLabels: z.array(z.string()).optional().describe("Karten mit diesen Labels ausschließen")
                }).optional(),
                options: z.object({
                    preservePosition: z.boolean().default(false).describe("Position in Zielliste beibehalten"),
                    dryRun: z.boolean().default(false).describe("Nur anzeigen was passieren würde, ohne zu verschieben")
                }).optional()
            }
        },
        async (params) => {
            console.error(`[organize-cards-by-due-date] Input:`, params);
            try {
                // Get all cards from the board
                const allCards = await trelloClient.getBoardCards({
                    id: params.boardId,
                    filter: 'visible'
                });

                // Apply source filters
                let cardsToOrganize = allCards;

                if (params.sourceFilters?.excludeListIds) {
                    cardsToOrganize = cardsToOrganize.filter(card =>
                        !params.sourceFilters!.excludeListIds!.includes(card.idList)
                    );
                }

                if (params.sourceFilters?.onlyListIds) {
                    cardsToOrganize = cardsToOrganize.filter(card =>
                        params.sourceFilters!.onlyListIds!.includes(card.idList)
                    );
                }

                if (params.sourceFilters?.excludeLabels) {
                    cardsToOrganize = cardsToOrganize.filter(card => {
                        const cardLabelNames = card.labels?.map((label: any) => label.name.toLowerCase()) || [];
                        return !params.sourceFilters!.excludeLabels!.some((excludeLabel: any) =>
                            cardLabelNames.includes(excludeLabel.toLowerCase())
                        );
                    });
                }

                // Categorize cards by due date
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000);
                const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

                const categorizedCards = {
                    overdue: [] as any[],
                    today: [] as any[],
                    thisWeek: [] as any[],
                    later: [] as any[],
                    noDueDate: [] as any[]
                };

                cardsToOrganize.forEach(card => {
                    if (!card.due) {
                        categorizedCards.noDueDate.push(card);
                    } else {
                        const dueDate = new Date(card.due);

                        if (dueDate < today) {
                            categorizedCards.overdue.push(card);
                        } else if (dueDate >= today && dueDate < endOfToday) {
                            categorizedCards.today.push(card);
                        } else if (dueDate >= endOfToday && dueDate <= endOfWeek) {
                            categorizedCards.thisWeek.push(card);
                        } else {
                            categorizedCards.later.push(card);
                        }
                    }
                });

                // Plan moves
                const plannedMoves: any[] = [];

                if (params.targetLists.overdue && categorizedCards.overdue.length > 0) {
                    categorizedCards.overdue.forEach(card => {
                        if (card.idList !== params.targetLists.overdue) {
                            plannedMoves.push({
                                card,
                                targetListId: params.targetLists.overdue,
                                category: 'overdue',
                                reason: `Überfällig seit ${Math.ceil((now.getTime() - new Date(card.due).getTime()) / (1000 * 60 * 60 * 24))} Tagen`
                            });
                        }
                    });
                }

                if (params.targetLists.today && categorizedCards.today.length > 0) {
                    categorizedCards.today.forEach(card => {
                        if (card.idList !== params.targetLists.today) {
                            plannedMoves.push({
                                card,
                                targetListId: params.targetLists.today,
                                category: 'today',
                                reason: 'Heute fällig'
                            });
                        }
                    });
                }

                if (params.targetLists.thisWeek && categorizedCards.thisWeek.length > 0) {
                    categorizedCards.thisWeek.forEach(card => {
                        if (card.idList !== params.targetLists.thisWeek) {
                            plannedMoves.push({
                                card,
                                targetListId: params.targetLists.thisWeek,
                                category: 'thisWeek',
                                reason: 'Diese Woche fällig'
                            });
                        }
                    });
                }

                if (params.targetLists.later && categorizedCards.later.length > 0) {
                    categorizedCards.later.forEach(card => {
                        if (card.idList !== params.targetLists.later) {
                            plannedMoves.push({
                                card,
                                targetListId: params.targetLists.later,
                                category: 'later',
                                reason: 'Später fällig'
                            });
                        }
                    });
                }

                if (params.targetLists.noDueDate && categorizedCards.noDueDate.length > 0) {
                    categorizedCards.noDueDate.forEach(card => {
                        if (card.idList !== params.targetLists.noDueDate) {
                            plannedMoves.push({
                                card,
                                targetListId: params.targetLists.noDueDate,
                                category: 'noDueDate',
                                reason: 'Kein Fälligkeitsdatum'
                            });
                        }
                    });
                }

                // Execute moves if not dry run
                const results: any[] = [];
                const errors: any[] = [];

                if (!params.options?.dryRun && plannedMoves.length > 0) {
                    for (const move of plannedMoves) {
                        try {
                            const position = params.options?.preservePosition ? move.card.pos : undefined;
                            const movedCard = await trelloClient.moveCard(
                                move.card.id,
                                move.targetListId,
                                position
                            );

                            results.push({
                                success: true,
                                card: movedCard,
                                originalCard: move.card,
                                category: move.category,
                                reason: move.reason
                            });
                        } catch (error) {
                            errors.push({
                                success: false,
                                error: error instanceof Error ? error.message : 'Unbekannter Fehler',
                                originalCard: move.card,
                                category: move.category
                            });
                        }
                    }
                }

                console.error(`[organize-cards-by-due-date] Planned ${plannedMoves.length} moves, executed ${results.length}`);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            summary: {
                                totalCards: cardsToOrganize.length,
                                plannedMoves: plannedMoves.length,
                                actualMoves: results.length,
                                errors: errors.length,
                                dryRun: params.options?.dryRun || false
                            },
                            categorization: {
                                overdue: categorizedCards.overdue.length,
                                today: categorizedCards.today.length,
                                thisWeek: categorizedCards.thisWeek.length,
                                later: categorizedCards.later.length,
                                noDueDate: categorizedCards.noDueDate.length
                            },
                            plannedMoves: plannedMoves.map(move => ({
                                cardId: move.card.id,
                                cardName: move.card.name,
                                fromListId: move.card.idList,
                                toListId: move.targetListId,
                                category: move.category,
                                reason: move.reason,
                                dueDate: move.card.due
                            })),
                            executedMoves: results.map(r => ({
                                cardId: r.card.id,
                                cardName: r.card.name,
                                category: r.category,
                                reason: r.reason
                            })),
                            errors: errors
                        }, null, 2)
                    }]
                };
            } catch (error) {
                console.error(`[organize-cards-by-due-date] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Organisieren der Karten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );
}