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
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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

// Register all tools by category
registerBoardTools(server, trelloClient, helpers);
registerCardTools(server, trelloClient, helpers);
registerListTools(server, trelloClient, helpers);
registerUtilityTools(server, trelloClient);

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