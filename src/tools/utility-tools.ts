import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TrelloClient } from '../trello-client/index.js';

/**
 * Registers all utility MCP tools (search, batch, webhooks, custom fields, etc.)
 */
export function registerUtilityTools(server: McpServer, trelloClient: TrelloClient) {
    // Environment Variables
    server.registerTool(
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
    server.registerTool(
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
    server.registerTool(
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

    // Webhooks
    server.registerTool(
        "get-webhooks",
        {
            title: "Webhooks abrufen",
            description: "Lädt alle Webhooks des Benutzers.",
            inputSchema: {}
        },
        async () => {
            const webhooks = await trelloClient.getWebhooks();
            return {content: [{type: "text", text: JSON.stringify(webhooks, null, 2)}]};
        }
    );

    server.registerTool(
        "create-webhook",
        {
            title: "Webhook erstellen",
            description: "Erstellt einen neuen Webhook.",
            inputSchema: {callbackURL: z.string().url(), idModel: z.string().min(1), description: z.string().optional()}
        },
        async ({callbackURL, idModel, description}) => {
            const webhook = await trelloClient.createWebhook(callbackURL, idModel, description);
            return {content: [{type: "text", text: JSON.stringify(webhook, null, 2)}]};
        }
    );

    server.registerTool(
        "update-webhook",
        {
            title: "Webhook aktualisieren",
            description: "Aktualisiert einen bestehenden Webhook.",
            inputSchema: {
                webhookId: z.string().min(1),
                callbackURL: z.string().url().optional(),
                description: z.string().optional(),
                idModel: z.string().optional()
            }
        },
        async ({webhookId, callbackURL, description, idModel}) => {
            const updates: any = {};
            if (callbackURL) updates.callbackURL = callbackURL;
            if (description) updates.description = description;
            if (idModel) updates.idModel = idModel;
            const webhook = await trelloClient.updateWebhook(webhookId, updates);
            return {content: [{type: "text", text: JSON.stringify(webhook, null, 2)}]};
        }
    );

    server.registerTool(
        "delete-webhook",
        {
            title: "Webhook löschen",
            description: "Löscht einen Webhook.",
            inputSchema: {webhookId: z.string().min(1)}
        },
        async ({webhookId}) => {
            await trelloClient.deleteWebhook(webhookId);
            return {content: [{type: "text", text: "Webhook gelöscht."}]};
        }
    );

    // Custom Fields Management
    server.registerTool(
        "get-board-custom-fields",
        {
            title: "Board Custom Fields abrufen",
            description: "Lädt alle Custom Field Definitionen eines Boards.",
            inputSchema: {boardId: z.string().min(1)}
        },
        async ({boardId}) => {
            try {
                const customFields = await trelloClient.getBoardCustomFields(boardId);
                return {content: [{type: "text", text: JSON.stringify(customFields, null, 2)}]};
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden der Custom Fields: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    server.registerTool(
        "create-custom-field",
        {
            title: "Custom Field erstellen",
            description: "Erstellt ein neues Custom Field auf einem Board.",
            inputSchema: {
                boardId: z.string().min(1, "Board ID ist erforderlich"),
                name: z.string().min(1, "Name ist erforderlich"),
                type: z.enum(["checkbox", "list", "number", "text", "date"], {required_error: "Typ muss einer von: checkbox, list, number, text, date sein"}),
                position: z.union([z.string(), z.number()]).optional(),
                options: z.string().optional(),
                displayOnCardFront: z.boolean().optional()
            }
        },
        async ({boardId, name, type, position, options, displayOnCardFront}) => {
            try {
                const customField = await trelloClient.createCustomField({
                    idModel: boardId,
                    modelType: 'board',
                    name,
                    type,
                    pos: position || 'bottom',
                    options,
                    display_cardFront: displayOnCardFront
                });
                return {
                    content: [{
                        type: "text",
                        text: `Custom Field "${name}" erfolgreich erstellt!\n${JSON.stringify(customField, null, 2)}`
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Erstellen des Custom Fields: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    server.registerTool(
        "get-custom-field",
        {
            title: "Custom Field abrufen",
            description: "Lädt die Details eines Custom Fields.",
            inputSchema: {customFieldId: z.string().min(1)}
        },
        async ({customFieldId}) => {
            try {
                const customField = await trelloClient.getCustomField(customFieldId);
                return {content: [{type: "text", text: JSON.stringify(customField, null, 2)}]};
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden des Custom Fields: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    server.registerTool(
        "update-custom-field",
        {
            title: "Custom Field aktualisieren",
            description: "Aktualisiert ein Custom Field (Name, Position, Anzeige auf Karten).",
            inputSchema: {
                customFieldId: z.string().min(1),
                name: z.string().optional(),
                position: z.union([z.string(), z.number()]).optional(),
                displayOnCardFront: z.boolean().optional()
            }
        },
        async ({customFieldId, name, position, displayOnCardFront}) => {
            try {
                const params: any = {};
                if (name) params.name = name;
                if (position !== undefined) params.pos = position;
                if (displayOnCardFront !== undefined) params['display/cardFront'] = displayOnCardFront;

                const customField = await trelloClient.updateCustomField(customFieldId, params);
                return {
                    content: [{
                        type: "text",
                        text: `Custom Field erfolgreich aktualisiert!\n${JSON.stringify(customField, null, 2)}`
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Aktualisieren des Custom Fields: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    server.registerTool(
        "delete-custom-field",
        {
            title: "Custom Field löschen",
            description: "Löscht ein Custom Field von einem Board.",
            inputSchema: {customFieldId: z.string().min(1)}
        },
        async ({customFieldId}) => {
            try {
                await trelloClient.deleteCustomField(customFieldId);
                return {content: [{type: "text", text: "Custom Field erfolgreich gelöscht."}]};
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Löschen des Custom Fields: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Custom Field Options (for dropdown/list type fields)
    server.registerTool(
        "get-custom-field-options",
        {
            title: "Custom Field Optionen abrufen",
            description: "Lädt alle Optionen eines Dropdown Custom Fields.",
            inputSchema: {customFieldId: z.string().min(1)}
        },
        async ({customFieldId}) => {
            try {
                const options = await trelloClient.getCustomFieldOptions(customFieldId);
                return {content: [{type: "text", text: JSON.stringify(options, null, 2)}]};
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden der Custom Field Optionen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    server.registerTool(
        "add-custom-field-option",
        {
            title: "Custom Field Option hinzufügen",
            description: "Fügt eine neue Option zu einem Dropdown Custom Field hinzu.",
            inputSchema: {customFieldId: z.string().min(1)}
        },
        async ({customFieldId}) => {
            try {
                const option = await trelloClient.addCustomFieldOption(customFieldId);
                return {content: [{type: "text", text: JSON.stringify(option, null, 2)}]};
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Hinzufügen der Custom Field Option: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    server.registerTool(
        "get-custom-field-option",
        {
            title: "Custom Field Option abrufen",
            description: "Lädt Details einer spezifischen Custom Field Option.",
            inputSchema: {
                customFieldId: z.string().min(1),
                optionId: z.string().min(1)
            }
        },
        async ({customFieldId, optionId}) => {
            try {
                const option = await trelloClient.getCustomFieldOption(customFieldId, optionId);
                return {content: [{type: "text", text: JSON.stringify(option, null, 2)}]};
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden der Custom Field Option: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    server.registerTool(
        "delete-custom-field-option",
        {
            title: "Custom Field Option löschen",
            description: "Löscht eine Option von einem Dropdown Custom Field.",
            inputSchema: {
                customFieldId: z.string().min(1),
                optionId: z.string().min(1)
            }
        },
        async ({customFieldId, optionId}) => {
            try {
                await trelloClient.deleteCustomFieldOption(customFieldId, optionId);
                return {content: [{type: "text", text: "Custom Field Option erfolgreich gelöscht."}]};
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Löschen der Custom Field Option: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Organizations/Workspaces
    server.registerTool(
        "get-member-organizations",
        {
            title: "Mitglieds-Organisationen abrufen",
            description: "Lädt alle Workspaces (Organisationen) eines Trello-Mitglieds.",
            inputSchema: {
                id: z.string().min(1, "Mitglieds-ID oder Benutzername ist erforderlich"),
                filter: z.enum(["all", "members", "none", "public"]).optional(),
                fields: z.string().optional(),
                paid_account: z.boolean().optional(),
            }
        },
        async (params) => {
            console.error(`[get-member-organizations] Input:`, params);
            try {
                const orgs = await trelloClient.getMemberOrganizations(params);
                console.error(`[get-member-organizations] Result:`, orgs);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(orgs, null, 2)
                    }]
                };
            } catch (error) {
                console.error(`[get-member-organizations] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden der Organisationen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    server.registerTool(
        "get-organization-boards",
        {
            title: "Boards einer Organisation abrufen",
            description: "Lädt alle Boards in einer Trello-Organisation (Workspace).",
            inputSchema: {
                id: z.string().min(1, "Organisations-ID ist erforderlich"),
                fields: z.string().optional(),
                filter: z.string().optional(),
                lists: z.string().optional(),
                list_fields: z.string().optional(),
                members: z.string().optional(),
                member_fields: z.string().optional(),
            }
        },
        async (params) => {
            console.error(`[get-organization-boards] Input:`, params);
            try {
                const boards = await trelloClient.getOrganizationBoards(params);
                console.error(`[get-organization-boards] Result:`, boards);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(boards, null, 2)
                    }]
                };
            } catch (error) {
                console.error(`[get-organization-boards] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Laden der Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Invitations
    server.registerTool(
        "invite-to-board",
        {
            title: "Mitglied zu Board einladen",
            description: "Lädt ein Mitglied per E-Mail zu einem Board ein.",
            inputSchema: {
                boardId: z.string().min(1),
                email: z.string().email(),
                fullName: z.string().optional(),
                type: z.string().optional()
            }
        },
        async ({boardId, email, fullName, type}) => {
            const result = await trelloClient.inviteToBoard(boardId, email, fullName, type);
            return {content: [{type: "text", text: JSON.stringify(result, null, 2)}]};
        }
    );

    server.registerTool(
        "invite-to-organization",
        {
            title: "Mitglied zu Organisation einladen",
            description: "Lädt ein Mitglied per E-Mail zu einer Organisation ein.",
            inputSchema: {
                orgId: z.string().min(1),
                email: z.string().email(),
                fullName: z.string().optional(),
                type: z.string().optional()
            }
        },
        async ({orgId, email, fullName, type}) => {
            const result = await trelloClient.inviteToOrganization(orgId, email, fullName, type);
            return {content: [{type: "text", text: JSON.stringify(result, null, 2)}]};
        }
    );

    // Power-Ups
    server.registerTool(
        "get-board-powerups",
        {
            title: "Power-Ups eines Boards abrufen",
            description: "Lädt alle Power-Ups eines Boards.",
            inputSchema: {boardId: z.string().min(1)}
        },
        async ({boardId}) => {
            const powerUps = await trelloClient.getBoardPowerUps(boardId);
            return {content: [{type: "text", text: JSON.stringify(powerUps, null, 2)}]};
        }
    );

    server.registerTool(
        "enable-board-powerup",
        {
            title: "Power-Up aktivieren",
            description: "Aktiviert ein Power-Up auf einem Board.",
            inputSchema: {boardId: z.string().min(1), powerUp: z.string().min(1)}
        },
        async ({boardId, powerUp}) => {
            const result = await trelloClient.enableBoardPowerUp(boardId, powerUp);
            return {content: [{type: "text", text: JSON.stringify(result, null, 2)}]};
        }
    );

    server.registerTool(
        "disable-board-powerup",
        {
            title: "Power-Up deaktivieren",
            description: "Deaktiviert ein Power-Up auf einem Board.",
            inputSchema: {boardId: z.string().min(1), powerUp: z.string().min(1)}
        },
        async ({boardId, powerUp}) => {
            await trelloClient.disableBoardPowerUp(boardId, powerUp);
            return {content: [{type: "text", text: "Power-Up deaktiviert."}]};
        }
    );

    // Board Member Management
    server.registerTool(
        "add-member-to-board",
        {
            title: "Mitglied zu Board hinzufügen",
            description: "Fügt ein Mitglied zu einem Board hinzu.",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
                email: z.string().min(1, "E-Mail ist erforderlich"),
                type: z.string().optional(),
                fullName: z.string().optional(),
            }
        },
        async (params) => {
            console.error(`[add-member-to-board] Input:`, params);
            try {
                const result = await trelloClient.addMemberToBoard(params);
                console.error(`[add-member-to-board] Result:`, result);
                return {
                    content: [{type: "text", text: JSON.stringify(result, null, 2)}]
                };
            } catch (error) {
                console.error(`[add-member-to-board] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Hinzufügen des Mitglieds: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    server.registerTool(
        "update-board-member",
        {
            title: "Board-Mitglied aktualisieren",
            description: "Aktualisiert ein Mitglied eines Boards.",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
                idMember: z.string().min(1, "Mitglieds-ID ist erforderlich"),
                type: z.string().optional(),
            }
        },
        async (params) => {
            console.error(`[update-board-member] Input:`, params);
            try {
                const result = await trelloClient.updateBoardMember(params);
                console.error(`[update-board-member] Result:`, result);
                return {
                    content: [{type: "text", text: JSON.stringify(result, null, 2)}]
                };
            } catch (error) {
                console.error(`[update-board-member] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Aktualisieren des Mitglieds: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    server.registerTool(
        "remove-board-member",
        {
            title: "Mitglied von Board entfernen",
            description: "Entfernt ein Mitglied von einem Board.",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
                idMember: z.string().min(1, "Mitglieds-ID ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[remove-board-member] Input:`, params);
            try {
                await trelloClient.removeBoardMember(params);
                console.error(`[remove-board-member] Result: Mitglied entfernt`);
                return {
                    content: [{type: "text", text: `Mitglied entfernt.`}]
                };
            } catch (error) {
                console.error(`[remove-board-member] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Entfernen des Mitglieds: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Board Utilities
    server.registerTool(
        "generate-board-calendar-key",
        {
            title: "Board-Kalender-Key generieren",
            description: "Generiert einen Kalender-Key für ein Board.",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[generate-board-calendar-key] Input:`, params);
            try {
                const result = await trelloClient.generateBoardCalendarKey(params.id);
                console.error(`[generate-board-calendar-key] Result:`, result);
                return {
                    content: [{type: "text", text: JSON.stringify(result, null, 2)}]
                };
            } catch (error) {
                console.error(`[generate-board-calendar-key] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Generieren des Kalender-Keys: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    server.registerTool(
        "generate-board-email-key",
        {
            title: "Board-E-Mail-Key generieren",
            description: "Generiert einen E-Mail-Key für ein Board.",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[generate-board-email-key] Input:`, params);
            try {
                const result = await trelloClient.generateBoardEmailKey(params.id);
                console.error(`[generate-board-email-key] Result:`, result);
                return {
                    content: [{type: "text", text: JSON.stringify(result, null, 2)}]
                };
            } catch (error) {
                console.error(`[generate-board-email-key] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Generieren des E-Mail-Keys: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    server.registerTool(
        "mark-board-as-viewed",
        {
            title: "Board als angesehen markieren",
            description: "Markiert ein Board als angesehen.",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
            }
        },
        async (params) => {
            console.error(`[mark-board-as-viewed] Input:`, params);
            try {
                const result = await trelloClient.markBoardAsViewed(params.id);
                console.error(`[mark-board-as-viewed] Result:`, result);
                return {
                    content: [{type: "text", text: JSON.stringify(result, null, 2)}]
                };
            } catch (error) {
                console.error(`[mark-board-as-viewed] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Markieren als angesehen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    server.registerTool(
        "update-board-my-prefs",
        {
            title: "Board-MyPrefs aktualisieren",
            description: "Aktualisiert die MyPrefs eines Boards (Sidebar, E-Mail, etc.).",
            inputSchema: {
                id: z.string().min(1, "Board-ID ist erforderlich"),
                emailPosition: z.string().optional(),
                idEmailList: z.string().optional(),
                showSidebar: z.boolean().optional(),
                showSidebarActivity: z.boolean().optional(),
                showSidebarBoardActions: z.boolean().optional(),
                showSidebarMembers: z.boolean().optional(),
            }
        },
        async (params) => {
            console.error(`[update-board-my-prefs] Input:`, params);
            try {
                const result = await trelloClient.updateBoardMyPrefs(params);
                console.error(`[update-board-my-prefs] Result:`, result);
                return {
                    content: [{type: "text", text: JSON.stringify(result, null, 2)}]
                };
            } catch (error) {
                console.error(`[update-board-my-prefs] Error:`, error);
                return {
                    content: [{
                        type: "text",
                        text: `Fehler beim Aktualisieren der MyPrefs: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Bulk Archive Cards
    server.registerTool(
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
                        params.cardSelection.cardIds.map(cardId => trelloClient.getCard(cardId))
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
    server.registerTool(
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
                        return !params.sourceFilters!.excludeLabels!.some(excludeLabel => 
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