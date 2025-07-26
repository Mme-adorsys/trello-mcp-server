import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TrelloClient } from '../trello-client/index.js';

/**
 * Registers all integration-related MCP tools (webhooks, power-ups, custom fields)
 */
export function registerIntegrationTools(server: McpServer, trelloClient: TrelloClient, shouldRegisterTool: (name: string, category: string) => boolean) {

    // Helper function to conditionally register tools
    const registerTool = (name: string, config: any, handler: (params: any) => Promise<any>) => {
        if (shouldRegisterTool(name, 'integration')) {
            server.registerTool(name, config, handler);
        }
    };

    // Webhooks
    registerTool(
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

    registerTool(
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

    registerTool(
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

    registerTool(
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

    // Power-Ups
    registerTool(
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

    registerTool(
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

    registerTool(
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

    // Custom Fields Management
    registerTool(
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

    registerTool(
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

    registerTool(
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

    registerTool(
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

    registerTool(
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
    registerTool(
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

    registerTool(
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

    registerTool(
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

    registerTool(
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
}