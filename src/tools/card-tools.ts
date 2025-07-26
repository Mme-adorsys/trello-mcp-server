import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TrelloClient } from '../trello-client/index.js';
import { TrelloHelpers, HelperSchemas } from '../helpers/trello-helpers.js';

/**
 * Registers all card-related MCP tools
 */
export function registerCardTools(server: McpServer, trelloClient: TrelloClient, helpers: TrelloHelpers) {
    // Create Card
    server.registerTool(
        "create-card",
        {
            title: "Karte erstellen",
            description: "Erstellt eine neue Karte in einer Liste",
            inputSchema: {
                listId: z.string().min(1, "Listen ID ist erforderlich"),
                name: z.string().min(1, "Karten Name ist erforderlich"),
                description: z.string().optional(),
                dueDate: z.string().optional()
            }
        },
        async ({listId, name, description, dueDate}) => {
            console.error(`[create-card] Input:`, {listId, name, description, dueDate});
            try {
                const card = await trelloClient.createCard({idList: listId, name, desc: description, due: dueDate});
                console.error(`[create-card] Result:`, card);
                return {
                    content: [{
                        type: "text",
                        text: `Karte "${card.name}" erfolgreich erstellt!\nURL: ${card.shortUrl}`
                    }]
                };
            } catch (error) {
                console.error(`[create-card] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Erstellen der Karte: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Move Card
    server.registerTool(
        "move-card",
        {
            title: "Karte verschieben",
            description: "Verschiebt eine Karte in eine andere Liste",
            inputSchema: {
                cardId: z.string().min(1, "Karten ID ist erforderlich"),
                listId: z.string().min(1, "Ziel-Listen ID ist erforderlich"),
                position: z.number().optional()
            }
        },
        async ({cardId, listId, position}) => {
            try {
                const card = await trelloClient.moveCard(cardId, listId, position);
                return {
                    content: [{
                        type: "text",
                        text: `Karte "${card.name}" erfolgreich verschoben!`
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Verschieben der Karte: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Update Card
    server.registerTool(
        "update-card",
        {
            title: "Karte aktualisieren",
            description: "Aktualisiert eine Trello Karte",
            inputSchema: {
                cardId: z.string().min(1, "Karten ID ist erforderlich"),
                name: z.string().optional(),
                description: z.string().optional(),
                dueDate: z.string().optional()
            }
        },
        async ({cardId, name, description, dueDate}) => {
            try {
                const updates: any = {};
                if (name) updates.name = name;
                if (description) updates.desc = description;
                if (dueDate) updates.due = dueDate;

                const card = await trelloClient.updateCard(cardId, updates);
                return {
                    content: [{
                        type: "text",
                        text: `Karte "${card.name}" erfolgreich aktualisiert!`
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Aktualisieren der Karte: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Card Checklists
    server.registerTool(
        "get-card-checklists",
        {
            title: "Checklisten einer Karte abrufen",
            description: "Lädt alle Checklisten einer Trello-Karte.",
            inputSchema: {cardId: z.string().min(1, "Karten ID ist erforderlich")}
        },
        async ({cardId}) => {
            const checklists = await trelloClient.getCardChecklists(cardId);
            return {content: [{type: "text", text: JSON.stringify(checklists, null, 2)}]};
        }
    );

    server.registerTool(
        "add-checklist-to-card",
        {
            title: "Checkliste zu Karte hinzufügen",
            description: "Fügt einer Karte eine neue Checkliste hinzu.",
            inputSchema: {cardId: z.string().min(1), name: z.string().min(1)}
        },
        async ({cardId, name}) => {
            const checklist = await trelloClient.addChecklistToCard(cardId, name);
            return {content: [{type: "text", text: JSON.stringify(checklist, null, 2)}]};
        }
    );

    server.registerTool(
        "update-checklist",
        {
            title: "Checkliste aktualisieren",
            description: "Aktualisiert eine Checkliste (Name/Position).",
            inputSchema: {
                checklistId: z.string().min(1),
                name: z.string().optional(),
                pos: z.union([z.string(), z.number()]).optional()
            }
        },
        async ({checklistId, name, pos}) => {
            const updates: any = {};
            if (name) updates.name = name;
            if (pos !== undefined) updates.pos = pos;
            const checklist = await trelloClient.updateChecklist(checklistId, updates);
            return {content: [{type: "text", text: JSON.stringify(checklist, null, 2)}]};
        }
    );

    server.registerTool(
        "delete-checklist",
        {
            title: "Checkliste löschen",
            description: "Löscht eine Checkliste.",
            inputSchema: {checklistId: z.string().min(1)}
        },
        async ({checklistId}) => {
            await trelloClient.deleteChecklist(checklistId);
            return {content: [{type: "text", text: "Checkliste gelöscht."}]};
        }
    );

    // Card Attachments
    server.registerTool(
        "get-card-attachments",
        {
            title: "Anhänge einer Karte abrufen",
            description: "Lädt alle Anhänge einer Trello-Karte.",
            inputSchema: {cardId: z.string().min(1)}
        },
        async ({cardId}) => {
            const attachments = await trelloClient.getCardAttachments(cardId);
            return {content: [{type: "text", text: JSON.stringify(attachments, null, 2)}]};
        }
    );

    server.registerTool(
        "add-attachment-to-card",
        {
            title: "Anhang zu Karte hinzufügen",
            description: "Fügt einer Karte einen Anhang hinzu (nur URL).",
            inputSchema: {cardId: z.string().min(1), url: z.string().url(), name: z.string().optional()}
        },
        async ({cardId, url, name}) => {
            const attachment = await trelloClient.addAttachmentToCard(cardId, url, name);
            return {content: [{type: "text", text: JSON.stringify(attachment, null, 2)}]};
        }
    );

    server.registerTool(
        "delete-attachment",
        {
            title: "Anhang löschen",
            description: "Löscht einen Anhang von einer Karte.",
            inputSchema: {cardId: z.string().min(1), attachmentId: z.string().min(1)}
        },
        async ({cardId, attachmentId}) => {
            await trelloClient.deleteAttachment(cardId, attachmentId);
            return {content: [{type: "text", text: "Anhang gelöscht."}]};
        }
    );

    // Card Comments
    server.registerTool(
        "get-card-comments",
        {
            title: "Kommentare einer Karte abrufen",
            description: "Lädt alle Kommentare einer Trello-Karte.",
            inputSchema: {cardId: z.string().min(1)}
        },
        async ({cardId}) => {
            const comments = await trelloClient.getCardComments(cardId);
            return {content: [{type: "text", text: JSON.stringify(comments, null, 2)}]};
        }
    );

    server.registerTool(
        "add-comment-to-card",
        {
            title: "Kommentar zu Karte hinzufügen",
            description: "Fügt einer Karte einen Kommentar hinzu.",
            inputSchema: {cardId: z.string().min(1), text: z.string().min(1)}
        },
        async ({cardId, text}) => {
            const comment = await trelloClient.addCommentToCard(cardId, text);
            return {content: [{type: "text", text: JSON.stringify(comment, null, 2)}]};
        }
    );

    server.registerTool(
        "update-comment",
        {
            title: "Kommentar aktualisieren",
            description: "Aktualisiert einen Kommentar auf einer Karte.",
            inputSchema: {cardId: z.string().min(1), actionId: z.string().min(1), text: z.string().min(1)}
        },
        async ({cardId, actionId, text}) => {
            const comment = await trelloClient.updateComment(cardId, actionId, text);
            return {content: [{type: "text", text: JSON.stringify(comment, null, 2)}]};
        }
    );

    server.registerTool(
        "delete-comment",
        {
            title: "Kommentar löschen",
            description: "Löscht einen Kommentar von einer Karte.",
            inputSchema: {cardId: z.string().min(1), actionId: z.string().min(1)}
        },
        async ({cardId, actionId}) => {
            await trelloClient.deleteComment(cardId, actionId);
            return {content: [{type: "text", text: "Kommentar gelöscht."}]};
        }
    );

    // Card Custom Fields
    server.registerTool(
        "get-card-custom-fields",
        {
            title: "Custom Fields einer Karte abrufen",
            description: "Lädt alle Custom Field Werte einer Karte.",
            inputSchema: {cardId: z.string().min(1)}
        },
        async ({cardId}) => {
            const items = await trelloClient.getCardCustomFieldItems(cardId);
            return {content: [{type: "text", text: JSON.stringify(items, null, 2)}]};
        }
    );

    server.registerTool(
        "set-card-custom-field",
        {
            title: "Custom Field einer Karte setzen",
            description: "Setzt einen Wert für ein Custom Field einer Karte.",
            inputSchema: {cardId: z.string().min(1), fieldId: z.string().min(1), value: z.any()}
        },
        async ({cardId, fieldId, value}) => {
            let wrappedValue = value;
            if (typeof value === 'string') {
                wrappedValue = {text: value};
            }
            const result = await trelloClient.setCardCustomField(cardId, fieldId, wrappedValue);
            return {content: [{type: "text", text: JSON.stringify(result, null, 2)}]};
        }
    );

    // Card Labels
    server.registerTool(
        "get-card-labels",
        {
            title: "Labels einer Karte abrufen",
            description: "Lädt alle Labels einer Karte.",
            inputSchema: {cardId: z.string().min(1)}
        },
        async ({cardId}) => {
            const labels = await trelloClient.getCardLabels(cardId);
            return {content: [{type: "text", text: JSON.stringify(labels, null, 2)}]};
        }
    );

    server.registerTool(
        "add-label-to-card",
        {
            title: "Label zu Karte hinzufügen",
            description: "Fügt einer Karte ein Label hinzu.",
            inputSchema: {cardId: z.string().min(1), labelId: z.string().min(1)}
        },
        async ({cardId, labelId}) => {
            const result = await trelloClient.addLabelToCard(cardId, labelId);
            return {content: [{type: "text", text: JSON.stringify(result, null, 2)}]};
        }
    );

    server.registerTool(
        "remove-label-from-card",
        {
            title: "Label von Karte entfernen",
            description: "Entfernt ein Label von einer Karte.",
            inputSchema: {cardId: z.string().min(1), labelId: z.string().min(1)}
        },
        async ({cardId, labelId}) => {
            await trelloClient.removeLabelFromCard(cardId, labelId);
            return {content: [{type: "text", text: "Label entfernt."}]};
        }
    );

    server.registerTool(
        "create-label",
        {
            title: "Label erstellen",
            description: "Erstellt ein neues Label auf einem Board.",
            inputSchema: {boardId: z.string().min(1), name: z.string().min(1), color: z.string().min(1)}
        },
        async ({boardId, name, color}) => {
            const label = await trelloClient.createLabel(boardId, name, color);
            return {content: [{type: "text", text: JSON.stringify(label, null, 2)}]};
        }
    );

    server.registerTool(
        "delete-label",
        {
            title: "Label löschen",
            description: "Löscht ein Label.",
            inputSchema: {labelId: z.string().min(1)}
        },
        async ({labelId}) => {
            await trelloClient.deleteLabel(labelId);
            return {content: [{type: "text", text: "Label gelöscht."}]};
        }
    );

    // Card Members
    server.registerTool(
        "get-card-members",
        {
            title: "Mitglieder einer Karte abrufen",
            description: "Lädt alle Mitglieder einer Karte.",
            inputSchema: {cardId: z.string().min(1)}
        },
        async ({cardId}) => {
            const members = await trelloClient.getCardMembers(cardId);
            return {content: [{type: "text", text: JSON.stringify(members, null, 2)}]};
        }
    );

    server.registerTool(
        "add-member-to-card",
        {
            title: "Mitglied zu Karte hinzufügen",
            description: "Fügt einer Karte ein Mitglied hinzu.",
            inputSchema: {cardId: z.string().min(1), memberId: z.string().min(1)}
        },
        async ({cardId, memberId}) => {
            const result = await trelloClient.addMemberToCard(cardId, memberId);
            return {content: [{type: "text", text: JSON.stringify(result, null, 2)}]};
        }
    );

    server.registerTool(
        "remove-member-from-card",
        {
            title: "Mitglied von Karte entfernen",
            description: "Entfernt ein Mitglied von einer Karte.",
            inputSchema: {cardId: z.string().min(1), memberId: z.string().min(1)}
        },
        async ({cardId, memberId}) => {
            await trelloClient.removeMemberFromCard(cardId, memberId);
            return {content: [{type: "text", text: "Mitglied entfernt."}]};
        }
    );

    // Card Advanced Actions
    server.registerTool(
        "archive-card",
        {
            title: "Karte archivieren",
            description: "Archiviert eine Karte.",
            inputSchema: {cardId: z.string().min(1)}
        },
        async ({cardId}) => {
            const card = await trelloClient.archiveCard(cardId);
            return {content: [{type: "text", text: JSON.stringify(card, null, 2)}]};
        }
    );

    server.registerTool(
        "unarchive-card",
        {
            title: "Karte wiederherstellen",
            description: "Stellt eine archivierte Karte wieder her.",
            inputSchema: {cardId: z.string().min(1)}
        },
        async ({cardId}) => {
            const card = await trelloClient.unarchiveCard(cardId);
            return {content: [{type: "text", text: JSON.stringify(card, null, 2)}]};
        }
    );

    server.registerTool(
        "copy-card",
        {
            title: "Karte kopieren",
            description: "Kopiert eine Karte in eine andere Liste.",
            inputSchema: {cardId: z.string().min(1), listId: z.string().min(1), name: z.string().optional()}
        },
        async ({cardId, listId, name}) => {
            const card = await trelloClient.copyCard(cardId, listId, name);
            return {content: [{type: "text", text: JSON.stringify(card, null, 2)}]};
        }
    );

    server.registerTool(
        "subscribe-to-card",
        {
            title: "Karte abonnieren",
            description: "Abonniert oder deabonniert eine Karte.",
            inputSchema: {cardId: z.string().min(1), value: z.boolean()}
        },
        async ({cardId, value}) => {
            const card = await trelloClient.subscribeToCard(cardId, value);
            return {content: [{type: "text", text: JSON.stringify(card, null, 2)}]};
        }
    );

    server.registerTool(
        "vote-on-card",
        {
            title: "Karte bewerten (Daumen hoch/runter)",
            description: "Fügt eine Stimme hinzu oder entfernt sie von einer Karte.",
            inputSchema: {cardId: z.string().min(1), value: z.boolean()}
        },
        async ({cardId, value}) => {
            const result = await trelloClient.voteOnCard(cardId, value);
            return {content: [{type: "text", text: JSON.stringify(result, null, 2)}]};
        }
    );

    // Helper Tools for Cards
    server.registerTool(
        "get-card-by-name",
        {
            title: "Karte nach Name suchen",
            description: "Sucht Karten nach Namen in einem Board oder einer Liste.",
            inputSchema: HelperSchemas.getCardByName
        },
        async (params) => helpers.getCardByName(params.cardName, params.boardId, params.listId)
    );

    // Next Actions Helper Tools
    server.registerTool(
        "get-next-actions-card",
        {
            title: "Ersten Karte in 'next-actions' abrufen",
            description: "Findet das erste Board, dessen Name den Filtertext enthält, sucht die Liste 'next-actions', nimmt die erste Karte.",
            inputSchema: HelperSchemas.getNextActionsCard
        },
        async (params) => helpers.getNextActionsCard(params.boardNameFilter, params.projectFilter)
    );

    server.registerTool(
        "get-next-actions-prompt",
        {
            title: "Prompt-Feld der ersten Karte in 'next-actions' abrufen",
            description: "Findet das erste Board, dessen Name den Filtertext enthält, sucht die Liste 'next-actions', nimmt die erste Karte und gibt den Inhalt des Custom Fields 'Prompt' zurück.",
            inputSchema: HelperSchemas.getNextActionsPrompt
        },
        async (params) => helpers.getNextActionsPrompt(params.boardId, params.cardId)
    );

    // Bulk Create Cards
    server.registerTool(
        "bulk-create-cards",
        {
            title: "Mehrere Karten erstellen (Bulk)",
            description: "Erstellt mehrere Karten gleichzeitig mit optionalen Templates und Standardwerten.",
            inputSchema: {
                listId: z.string().min(1, "Listen-ID ist erforderlich"),
                cards: z.array(z.object({
                    name: z.string().min(1, "Karten-Name ist erforderlich"),
                    description: z.string().optional(),
                    dueDate: z.string().optional(),
                    position: z.union([z.string(), z.number()]).optional(),
                    labelIds: z.array(z.string()).optional(),
                    memberIds: z.array(z.string()).optional()
                })).min(1, "Mindestens eine Karte muss definiert werden"),
                applyDefaults: z.object({
                    description: z.string().optional(),
                    dueDate: z.string().optional(),
                    labelIds: z.array(z.string()).optional(),
                    memberIds: z.array(z.string()).optional()
                }).optional(),
                createChecklists: z.array(z.object({
                    name: z.string().min(1),
                    items: z.array(z.string()).optional()
                })).optional(),
                batchSize: z.number().default(10).describe("Anzahl Karten pro Batch (Standard: 10)")
            }
        },
        async (params) => {
            console.error(`[bulk-create-cards] Input:`, params);
            try {
                const results: any[] = [];
                const errors: any[] = [];
                
                // Process cards in batches to avoid overwhelming the API
                for (let i = 0; i < params.cards.length; i += params.batchSize) {
                    const batch = params.cards.slice(i, i + params.batchSize);
                    
                    const batchPromises = batch.map(async (cardData, index) => {
                        try {
                            // Merge card data with defaults
                            const cardOptions: any = {
                                idList: params.listId,
                                name: cardData.name,
                                desc: cardData.description || params.applyDefaults?.description,
                                due: cardData.dueDate || params.applyDefaults?.dueDate,
                                pos: cardData.position
                            };

                            // Add label IDs
                            const labelIds = [...(cardData.labelIds || []), ...(params.applyDefaults?.labelIds || [])];
                            if (labelIds.length > 0) {
                                cardOptions.idLabels = [...new Set(labelIds)].join(',');
                            }

                            // Add member IDs
                            const memberIds = [...(cardData.memberIds || []), ...(params.applyDefaults?.memberIds || [])];
                            if (memberIds.length > 0) {
                                cardOptions.idMembers = [...new Set(memberIds)].join(',');
                            }

                            const card = await trelloClient.createCard(cardOptions);

                            // Add checklists if specified
                            if (params.createChecklists && params.createChecklists.length > 0) {
                                for (const checklistTemplate of params.createChecklists) {
                                    const checklist = await trelloClient.addChecklistToCard(card.id, checklistTemplate.name);
                                    
                                    // Add checklist items if specified
                                    if (checklistTemplate.items && checklistTemplate.items.length > 0) {
                                        // Note: This would require additional API calls to add items to checklist
                                        // For now, we'll just create the checklist structure
                                    }
                                }
                            }

                            return {
                                success: true,
                                card: card,
                                originalIndex: i + index
                            };
                        } catch (error) {
                            return {
                                success: false,
                                error: error instanceof Error ? error.message : 'Unbekannter Fehler',
                                cardData: cardData,
                                originalIndex: i + index
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

                    // Small delay between batches to be nice to the API
                    if (i + params.batchSize < params.cards.length) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }

                console.error(`[bulk-create-cards] Created ${results.length} cards, ${errors.length} errors`);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            summary: {
                                requested: params.cards.length,
                                successful: results.length,
                                failed: errors.length,
                                batchSize: params.batchSize
                            },
                            createdCards: results.map(r => ({
                                id: r.card.id,
                                name: r.card.name,
                                shortUrl: r.card.shortUrl,
                                originalIndex: r.originalIndex
                            })),
                            errors: errors,
                            listId: params.listId
                        }, null, 2)
                    }]
                };
            } catch (error) {
                console.error(`[bulk-create-cards] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Erstellen der Karten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Bulk Move Cards
    server.registerTool(
        "bulk-move-cards",
        {
            title: "Mehrere Karten verschieben (Bulk)",
            description: "Verschiebt mehrere Karten basierend auf Filtern oder expliziten IDs zu einer neuen Liste.",
            inputSchema: {
                targetListId: z.string().min(1, "Ziel-Listen-ID ist erforderlich"),
                cardSelection: z.object({
                    cardIds: z.array(z.string()).optional(),
                    fromListId: z.string().optional(),
                    fromBoardId: z.string().optional(),
                    filters: z.object({
                        nameContains: z.string().optional(),
                        hasLabel: z.string().optional(),
                        assignedToMember: z.string().optional(),
                        dueDateStatus: z.enum(["overdue", "due_today", "due_week", "no_due_date"]).optional(),
                        isArchived: z.boolean().default(false),
                        maxAge: z.number().optional().describe("Maximales Alter in Tagen")
                    }).optional()
                }),
                positioning: z.object({
                    strategy: z.enum(["top", "bottom", "preserve_order"]).default("bottom"),
                    startPosition: z.number().optional()
                }).optional(),
                batchSize: z.number().default(20).describe("Anzahl Karten pro Batch (Standard: 20)")
            }
        },
        async (params) => {
            console.error(`[bulk-move-cards] Input:`, params);
            try {
                let cardsToMove: any[] = [];

                // Get cards based on selection criteria
                if (params.cardSelection.cardIds && params.cardSelection.cardIds.length > 0) {
                    // Move specific cards by ID
                    cardsToMove = await Promise.all(
                        params.cardSelection.cardIds.map(cardId => trelloClient.getCard(cardId))
                    );
                } else {
                    // Find cards based on filters
                    let allCards: any[] = [];

                    if (params.cardSelection.fromListId) {
                        allCards = await trelloClient.getListCards(params.cardSelection.fromListId);
                    } else if (params.cardSelection.fromBoardId) {
                        allCards = await trelloClient.getBoardCards({
                            id: params.cardSelection.fromBoardId,
                            filter: params.cardSelection.filters?.isArchived ? 'all' : 'visible'
                        });
                    } else {
                        throw new Error("Entweder cardIds, fromListId oder fromBoardId muss angegeben werden");
                    }

                    // Apply filters
                    if (params.cardSelection.filters) {
                        const filters = params.cardSelection.filters;
                        
                        cardsToMove = allCards.filter(card => {
                            // Name filter
                            if (filters.nameContains && !card.name.toLowerCase().includes(filters.nameContains.toLowerCase())) {
                                return false;
                            }

                            // Label filter
                            if (filters.hasLabel) {
                                const hasMatchingLabel = card.labels?.some((label: any) => 
                                    label.name.toLowerCase().includes(filters.hasLabel!.toLowerCase())
                                );
                                if (!hasMatchingLabel) return false;
                            }

                            // Member filter
                            if (filters.assignedToMember) {
                                const hasMatchingMember = card.members?.some((member: any) => 
                                    member.fullName.toLowerCase().includes(filters.assignedToMember!.toLowerCase()) ||
                                    member.username.toLowerCase().includes(filters.assignedToMember!.toLowerCase())
                                );
                                if (!hasMatchingMember) return false;
                            }

                            // Due date filter
                            if (filters.dueDateStatus) {
                                const now = new Date();
                                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

                                if (!card.due && filters.dueDateStatus !== "no_due_date") return false;
                                if (card.due) {
                                    const dueDate = new Date(card.due);
                                    switch (filters.dueDateStatus) {
                                        case "overdue":
                                            if (dueDate >= today) return false;
                                            break;
                                        case "due_today":
                                            if (dueDate < today || dueDate >= new Date(today.getTime() + 24 * 60 * 60 * 1000)) return false;
                                            break;
                                        case "due_week":
                                            if (dueDate < today || dueDate > nextWeek) return false;
                                            break;
                                        case "no_due_date":
                                            return false;
                                    }
                                }
                            }

                            // Age filter
                            if (filters.maxAge) {
                                const cardAge = (Date.now() - new Date(card.dateLastActivity).getTime()) / (1000 * 60 * 60 * 24);
                                if (cardAge > filters.maxAge) return false;
                            }

                            return true;
                        });
                    } else {
                        cardsToMove = allCards;
                    }
                }

                if (cardsToMove.length === 0) {
                    throw new Error("Keine Karten gefunden, die den Kriterien entsprechen");
                }

                // Move cards in batches
                const results: any[] = [];
                const errors: any[] = [];

                for (let i = 0; i < cardsToMove.length; i += params.batchSize) {
                    const batch = cardsToMove.slice(i, i + params.batchSize);
                    
                    const batchPromises = batch.map(async (card, batchIndex) => {
                        try {
                            let position: any = undefined;
                            
                            if (params.positioning?.strategy === "top") {
                                position = "top";
                            } else if (params.positioning?.strategy === "preserve_order") {
                                position = params.positioning.startPosition ? 
                                    params.positioning.startPosition + i + batchIndex : 
                                    undefined;
                            }

                            const movedCard = await trelloClient.moveCard(card.id, params.targetListId, position);
                            
                            return {
                                success: true,
                                card: movedCard,
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
                    if (i + params.batchSize < cardsToMove.length) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                }

                console.error(`[bulk-move-cards] Moved ${results.length} cards, ${errors.length} errors`);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            summary: {
                                found: cardsToMove.length,
                                successful: results.length,
                                failed: errors.length,
                                targetListId: params.targetListId
                            },
                            movedCards: results.map(r => ({
                                id: r.card.id,
                                name: r.card.name,
                                shortUrl: r.card.shortUrl,
                                fromList: r.originalCard.idList
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
                console.error(`[bulk-move-cards] Error:`, error);
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

    // Bulk Update Cards
    server.registerTool(
        "bulk-update-cards",
        {
            title: "Mehrere Karten aktualisieren (Bulk)",
            description: "Aktualisiert mehrere Karten gleichzeitig mit verschiedenen Operationen (Namen, Beschreibung, Labels, Mitglieder, etc.).",
            inputSchema: {
                cardSelection: z.object({
                    cardIds: z.array(z.string()).optional(),
                    fromListId: z.string().optional(),
                    fromBoardId: z.string().optional(),
                    filters: z.object({
                        nameContains: z.string().optional(),
                        hasLabel: z.string().optional(),
                        assignedToMember: z.string().optional(),
                        dueDateStatus: z.enum(["overdue", "due_today", "due_week", "no_due_date"]).optional(),
                        isArchived: z.boolean().default(false)
                    }).optional()
                }),
                updates: z.object({
                    name: z.object({
                        operation: z.enum(["set", "prefix", "suffix", "replace"]),
                        value: z.string(),
                        searchValue: z.string().optional().describe("Erforderlich für 'replace' Operation")
                    }).optional(),
                    description: z.object({
                        operation: z.enum(["set", "append", "prepend", "clear"]),
                        value: z.string().optional()
                    }).optional(),
                    dueDate: z.object({
                        operation: z.enum(["set", "clear", "add_days", "subtract_days"]),
                        value: z.string().optional(),
                        days: z.number().optional().describe("Erforderlich für add_days/subtract_days")
                    }).optional(),
                    labels: z.object({
                        operation: z.enum(["add", "remove", "set", "clear"]),
                        labelIds: z.array(z.string()).optional()
                    }).optional(),
                    members: z.object({
                        operation: z.enum(["add", "remove", "set", "clear"]),
                        memberIds: z.array(z.string()).optional()
                    }).optional(),
                    position: z.object({
                        operation: z.enum(["top", "bottom", "set"]),
                        value: z.number().optional()
                    }).optional(),
                    archive: z.boolean().optional(),
                    subscribe: z.boolean().optional()
                }),
                batchSize: z.number().default(15).describe("Anzahl Karten pro Batch (Standard: 15)")
            }
        },
        async (params) => {
            console.error(`[bulk-update-cards] Input:`, params);
            try {
                let cardsToUpdate: any[] = [];

                // Get cards based on selection criteria (similar to bulk-move-cards)
                if (params.cardSelection.cardIds && params.cardSelection.cardIds.length > 0) {
                    cardsToUpdate = await Promise.all(
                        params.cardSelection.cardIds.map(cardId => trelloClient.getCard(cardId))
                    );
                } else {
                    let allCards: any[] = [];

                    if (params.cardSelection.fromListId) {
                        allCards = await trelloClient.getListCards(params.cardSelection.fromListId);
                    } else if (params.cardSelection.fromBoardId) {
                        allCards = await trelloClient.getBoardCards({
                            id: params.cardSelection.fromBoardId,
                            filter: params.cardSelection.filters?.isArchived ? 'all' : 'visible'
                        });
                    } else {
                        throw new Error("Entweder cardIds, fromListId oder fromBoardId muss angegeben werden");
                    }

                    // Apply filters (same logic as bulk-move-cards)
                    if (params.cardSelection.filters) {
                        const filters = params.cardSelection.filters;
                        
                        cardsToUpdate = allCards.filter(card => {
                            if (filters.nameContains && !card.name.toLowerCase().includes(filters.nameContains.toLowerCase())) {
                                return false;
                            }
                            if (filters.hasLabel) {
                                const hasMatchingLabel = card.labels?.some((label: any) => 
                                    label.name.toLowerCase().includes(filters.hasLabel!.toLowerCase())
                                );
                                if (!hasMatchingLabel) return false;
                            }
                            if (filters.assignedToMember) {
                                const hasMatchingMember = card.members?.some((member: any) => 
                                    member.fullName.toLowerCase().includes(filters.assignedToMember!.toLowerCase()) ||
                                    member.username.toLowerCase().includes(filters.assignedToMember!.toLowerCase())
                                );
                                if (!hasMatchingMember) return false;
                            }
                            return true;
                        });
                    } else {
                        cardsToUpdate = allCards;
                    }
                }

                if (cardsToUpdate.length === 0) {
                    throw new Error("Keine Karten gefunden, die den Kriterien entsprechen");
                }

                // Update cards in batches
                const results: any[] = [];
                const errors: any[] = [];

                for (let i = 0; i < cardsToUpdate.length; i += params.batchSize) {
                    const batch = cardsToUpdate.slice(i, i + params.batchSize);
                    
                    const batchPromises = batch.map(async (card) => {
                        try {
                            const updateData: any = {};

                            // Process name updates
                            if (params.updates.name) {
                                const nameOp = params.updates.name;
                                switch (nameOp.operation) {
                                    case "set":
                                        updateData.name = nameOp.value;
                                        break;
                                    case "prefix":
                                        updateData.name = nameOp.value + card.name;
                                        break;
                                    case "suffix":
                                        updateData.name = card.name + nameOp.value;
                                        break;
                                    case "replace":
                                        if (nameOp.searchValue) {
                                            updateData.name = card.name.replace(new RegExp(nameOp.searchValue, 'g'), nameOp.value);
                                        }
                                        break;
                                }
                            }

                            // Process description updates
                            if (params.updates.description) {
                                const descOp = params.updates.description;
                                switch (descOp.operation) {
                                    case "set":
                                        updateData.desc = descOp.value || "";
                                        break;
                                    case "append":
                                        updateData.desc = (card.desc || "") + (descOp.value || "");
                                        break;
                                    case "prepend":
                                        updateData.desc = (descOp.value || "") + (card.desc || "");
                                        break;
                                    case "clear":
                                        updateData.desc = "";
                                        break;
                                }
                            }

                            // Process due date updates
                            if (params.updates.dueDate) {
                                const dueDateOp = params.updates.dueDate;
                                switch (dueDateOp.operation) {
                                    case "set":
                                        updateData.due = dueDateOp.value || null;
                                        break;
                                    case "clear":
                                        updateData.due = null;
                                        break;
                                    case "add_days":
                                        if (dueDateOp.days && card.due) {
                                            const currentDue = new Date(card.due);
                                            currentDue.setDate(currentDue.getDate() + dueDateOp.days);
                                            updateData.due = currentDue.toISOString();
                                        }
                                        break;
                                    case "subtract_days":
                                        if (dueDateOp.days && card.due) {
                                            const currentDue = new Date(card.due);
                                            currentDue.setDate(currentDue.getDate() - dueDateOp.days);
                                            updateData.due = currentDue.toISOString();
                                        }
                                        break;
                                }
                            }

                            // Process position updates
                            if (params.updates.position) {
                                const posOp = params.updates.position;
                                switch (posOp.operation) {
                                    case "top":
                                        updateData.pos = "top";
                                        break;
                                    case "bottom":
                                        updateData.pos = "bottom";
                                        break;
                                    case "set":
                                        updateData.pos = posOp.value;
                                        break;
                                }
                            }

                            // Process archive status
                            if (params.updates.archive !== undefined) {
                                updateData.closed = params.updates.archive;
                            }

                            // Process subscription status
                            if (params.updates.subscribe !== undefined) {
                                updateData.subscribed = params.updates.subscribe;
                            }

                            // Update the card
                            const updatedCard = await trelloClient.updateCard(card.id, updateData);

                            // Handle label operations separately (they require different API calls)
                            if (params.updates.labels) {
                                const labelOp = params.updates.labels;
                                switch (labelOp.operation) {
                                    case "add":
                                        if (labelOp.labelIds) {
                                            for (const labelId of labelOp.labelIds) {
                                                await trelloClient.addLabelToCard(card.id, labelId);
                                            }
                                        }
                                        break;
                                    case "remove":
                                        if (labelOp.labelIds) {
                                            for (const labelId of labelOp.labelIds) {
                                                await trelloClient.removeLabelFromCard(card.id, labelId);
                                            }
                                        }
                                        break;
                                    case "clear":
                                        const currentLabels = await trelloClient.getCardLabels(card.id);
                                        for (const label of currentLabels) {
                                            await trelloClient.removeLabelFromCard(card.id, label.id);
                                        }
                                        break;
                                    case "set":
                                        // Clear all labels first, then add new ones
                                        const existingLabels = await trelloClient.getCardLabels(card.id);
                                        for (const label of existingLabels) {
                                            await trelloClient.removeLabelFromCard(card.id, label.id);
                                        }
                                        if (labelOp.labelIds) {
                                            for (const labelId of labelOp.labelIds) {
                                                await trelloClient.addLabelToCard(card.id, labelId);
                                            }
                                        }
                                        break;
                                }
                            }

                            // Handle member operations separately
                            if (params.updates.members) {
                                const memberOp = params.updates.members;
                                switch (memberOp.operation) {
                                    case "add":
                                        if (memberOp.memberIds) {
                                            for (const memberId of memberOp.memberIds) {
                                                await trelloClient.addMemberToCard(card.id, memberId);
                                            }
                                        }
                                        break;
                                    case "remove":
                                        if (memberOp.memberIds) {
                                            for (const memberId of memberOp.memberIds) {
                                                await trelloClient.removeMemberFromCard(card.id, memberId);
                                            }
                                        }
                                        break;
                                    case "clear":
                                        const currentMembers = await trelloClient.getCardMembers(card.id);
                                        for (const member of currentMembers) {
                                            await trelloClient.removeMemberFromCard(card.id, member.id);
                                        }
                                        break;
                                    case "set":
                                        // Clear all members first, then add new ones
                                        const existingMembers = await trelloClient.getCardMembers(card.id);
                                        for (const member of existingMembers) {
                                            await trelloClient.removeMemberFromCard(card.id, member.id);
                                        }
                                        if (memberOp.memberIds) {
                                            for (const memberId of memberOp.memberIds) {
                                                await trelloClient.addMemberToCard(card.id, memberId);
                                            }
                                        }
                                        break;
                                }
                            }

                            return {
                                success: true,
                                card: updatedCard,
                                originalCard: card,
                                appliedUpdates: updateData
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
                    if (i + params.batchSize < cardsToUpdate.length) {
                        await new Promise(resolve => setTimeout(resolve, 400));
                    }
                }

                console.error(`[bulk-update-cards] Updated ${results.length} cards, ${errors.length} errors`);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            summary: {
                                found: cardsToUpdate.length,
                                successful: results.length,
                                failed: errors.length,
                                operations: Object.keys(params.updates)
                            },
                            updatedCards: results.map(r => ({
                                id: r.card.id,
                                name: r.card.name,
                                shortUrl: r.card.shortUrl,
                                appliedUpdates: r.appliedUpdates
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
                console.error(`[bulk-update-cards] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Aktualisieren der Karten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );
}