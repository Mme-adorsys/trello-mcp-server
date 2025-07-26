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
}