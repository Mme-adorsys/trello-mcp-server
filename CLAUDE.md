# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Run
- `npm run build` - Compiles TypeScript to JavaScript in build/ directory
- `npm run watch` - Continuous TypeScript compilation with watch mode
- `npm start` - Runs the compiled MCP server
- `npm run dev` - Builds and starts the server in one command

### MCP Server Testing
- `./start-mcp.sh` - Starts the MCP server with environment variables from .env
- `./start-inspector.sh` - Starts the MCP inspector at http://localhost:5173 for interactive testing

### Configuration
The server requires TRELLO_API_KEY and TRELLO_TOKEN environment variables. Use a .env file or the shell scripts which handle environment loading automatically.

## Code Architecture

### MCP Server Structure
This is a Model Context Protocol (MCP) server that provides AI agents with access to Trello's API. The server is organized into distinct functional modules:

**Core Components:**
- `src/index.ts` - Server entry point, initializes MCP server and registers all modules
- `src/trello-client.ts` - HTTP client wrapper for Trello REST API with retry logic, timeouts, and comprehensive error handling
- `src/helpers/trello-helpers.ts` - Common utility functions for complex Trello operations

**MCP Integration Modules:**
- `src/resources/` - MCP resources (read-only data): boards list, board details, board cards
- `src/prompts/` - MCP prompts: board analysis, sprint planning assistance
- `src/tools/` - MCP tools (actions) organized by domain:
  - `board-tools.ts` - Board CRUD, member management, power-ups
  - `card-tools.ts` - Card operations, checklists, attachments, comments
  - `list-tools.ts` - List management and operations
  - `utility-tools.ts` - Search, webhooks, batch operations

### Key Architecture Patterns
- **Modular Registration**: Each module registers its MCP components (resources/prompts/tools) with the server
- **Comprehensive Error Handling**: All API calls wrapped with try-catch, structured error responses
- **Type Safety**: Zod schemas validate all tool inputs, TypeScript interfaces for API responses
- **Environment Configuration**: Configurable timeouts, retries, and logging via environment variables

### API Coverage
The client implements nearly the complete Trello REST API including advanced features like custom fields, webhooks, power-ups, and batch operations. Tools are organized by functional domain rather than API endpoint structure.

### Development Notes
- The codebase contains German language strings in user-facing messages and descriptions
- All tools return structured JSON responses with error handling
- The TrelloClient includes sophisticated retry logic with exponential backoff for reliability
- MCP inspector integration allows interactive testing of all server capabilities