#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TrelloClient } from "./trello-client/index.js";
import { TrelloHelpers } from "./helpers/trello-helpers.js";
import { registerTrelloResources } from "./resources/trello-resources.js";
import { registerTrelloPrompts } from "./prompts/trello-prompts.js";
import { registerBoardTools } from "./tools/board-tools.js";
import { registerCardTools } from "./tools/card-tools.js";
import { registerListTools } from "./tools/list-tools.js";
import { registerUtilityTools } from "./tools/utility-tools.js";
import { registerMemberTools } from "./tools/member-tools.js";
import { registerIntegrationTools } from "./tools/integration-tools.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Tool activation/deactivation configuration
const DISABLED_TOOLS = process.env.TRELLO_TOOLS_DISABLED 
    ? process.env.TRELLO_TOOLS_DISABLED.split(',').map(t => t.trim().toLowerCase())
    : [];

const DISABLED_CATEGORIES = {
    board: process.env.TRELLO_TOOLS_BOARD_ENABLED === 'false',
    card: process.env.TRELLO_TOOLS_CARD_ENABLED === 'false',  
    list: process.env.TRELLO_TOOLS_LIST_ENABLED === 'false',
    utility: process.env.TRELLO_TOOLS_UTILITY_ENABLED === 'false',
    member: process.env.TRELLO_TOOLS_MEMBER_ENABLED === 'false',
    integration: process.env.TRELLO_TOOLS_INTEGRATION_ENABLED === 'false'
};

/**
 * Checks if a tool should be registered based on environment variables
 * @param toolName - Name of the tool to check
 * @param category - Category of the tool (board, card, list, utility, member, integration)
 * @returns true if tool should be registered, false otherwise
 */
function shouldRegisterTool(toolName: string, category: string): boolean {
    // Check if entire category is disabled
    if (DISABLED_CATEGORIES[category as keyof typeof DISABLED_CATEGORIES]) {
        return false;
    }
    
    // Check if specific tool is disabled
    if (DISABLED_TOOLS.includes(toolName.toLowerCase())) {
        return false;
    }
    
    return true;
}

// Validate environment variables
const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;

if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
    console.error("Bitte setze TRELLO_API_KEY und TRELLO_TOKEN Umgebungsvariablen");
    process.exit(1);
}

// Initialize Trello client
const trelloClient = new TrelloClient({
    apiKey: TRELLO_API_KEY,
    token: TRELLO_TOKEN,
    timeout: parseInt(process.env.TRELLO_TIMEOUT || '30000'),
    retries: parseInt(process.env.TRELLO_RETRIES || '3'),
    verboseLogging: process.env.TRELLO_VERBOSE_LOGGING === 'true',
});

// Initialize helpers
const helpers = new TrelloHelpers(trelloClient);

// Create MCP Server
const server = new McpServer({
    name: "trello-mcp-server",
    version: "1.0.0"
});

// Register all resources
registerTrelloResources(server, trelloClient);

// Register all prompts
registerTrelloPrompts(server);

// Register all tools by category (with conditional registration)
registerBoardTools(server, trelloClient, helpers, shouldRegisterTool);
registerCardTools(server, trelloClient, helpers, shouldRegisterTool);
registerListTools(server, trelloClient, helpers, shouldRegisterTool);
registerUtilityTools(server, trelloClient, shouldRegisterTool);
registerMemberTools(server, trelloClient, shouldRegisterTool);
registerIntegrationTools(server, trelloClient, shouldRegisterTool);

// Start server
async function main() {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Trello MCP Server läuft auf stdio");
    } catch (error) {
        console.error("Fehler beim Starten des Servers:", error);
        process.exit(1);
    }
}

main().catch(error => {
    console.error("Fataler Fehler:", error);
    process.exit(1);
});