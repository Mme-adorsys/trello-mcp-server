import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TrelloClient } from '../trello-client.js';

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
}