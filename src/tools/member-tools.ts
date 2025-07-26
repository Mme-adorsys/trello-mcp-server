import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TrelloClient } from '../trello-client/index.js';

/**
 * Registers all member and organization-related MCP tools
 */
export function registerMemberTools(server: McpServer, trelloClient: TrelloClient, shouldRegisterTool: (name: string, category: string) => boolean) {

    // Helper function to conditionally register tools
    const registerTool = (name: string, config: any, handler: (params: any) => Promise<any>) => {
        if (shouldRegisterTool(name, 'member')) {
            server.registerTool(name, config, handler);
        }
    };

    // Organizations/Workspaces
    registerTool(
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

    registerTool(
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
    registerTool(
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

    registerTool(
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

    // Board Member Management
    registerTool(
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

    registerTool(
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

    registerTool(
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

    // Board Utilities (Member-related)
    registerTool(
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

    registerTool(
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

    registerTool(
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

    registerTool(
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