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

#### Tool Management
Tools can be selectively disabled using environment variables:
- `TRELLO_TOOLS_DISABLED=create-card,delete-card` - Disable specific tools (comma-separated)
- `TRELLO_TOOLS_BOARD_ENABLED=false` - Disable all board-related tools
- `TRELLO_TOOLS_CARD_ENABLED=false` - Disable all card-related tools  
- `TRELLO_TOOLS_LIST_ENABLED=false` - Disable all list-related tools
- `TRELLO_TOOLS_UTILITY_ENABLED=false` - Disable all utility tools
- `TRELLO_TOOLS_MEMBER_ENABLED=false` - Disable all member and organization tools
- `TRELLO_TOOLS_INTEGRATION_ENABLED=false` - Disable all integration tools (webhooks, power-ups, custom fields)

## Code Architecture

### MCP Server Structure
This is a Model Context Protocol (MCP) server that provides AI agents with access to Trello's API. The server is organized into distinct functional modules:

**Core Components:**
- `src/index.ts` - Server entry point, initializes MCP server and registers all modules
- `src/trello-client/` - Domain-Driven Design (DDD) architecture for Trello API client
  - `trello-client.ts` - Main client facade that composes all domain clients
  - `core/base-client.ts` - Base HTTP client with retry logic, timeouts, and error handling
  - `core/config.ts` - Configuration types and validation
  - `core/types.ts` - Core Trello API types and utilities
  - `domains/` - Domain-specific clients organized by business capability
- `src/helpers/trello-helpers.ts` - Common utility functions for complex Trello operations

**MCP Integration Modules:**
- `src/resources/` - MCP resources (read-only data): boards list, board details, board cards
- `src/prompts/` - MCP prompts: board analysis, sprint planning assistance
- `src/tools/` - MCP tools (actions) organized by domain:
  - `board-tools.ts` - Board CRUD, board preferences, finding tools
  - `card-tools.ts` - Card operations, checklists, attachments, comments, bulk operations
  - `list-tools.ts` - List management and operations
  - `utility-tools.ts` - Core utilities (search, batch API, bulk archive, organization)
  - `member-tools.ts` - Member management, organizations, invitations, board utilities
  - `integration-tools.ts` - Webhooks, power-ups, custom fields management

### Domain-Driven Design Architecture

The Trello client follows Domain-Driven Design principles with clear separation of concerns:

**Core Layer:**
- `BaseClient` - Foundation HTTP client with retry logic and error handling
- `TrelloConfig` - Configuration management and validation
- `TrelloTypes` - Core domain types shared across all domains

**Domain Layer:**
- `boards/` - Board management (CRUD, members, preferences, power-ups)
- `lists/` - List operations (creation, archiving, moving cards)
- `cards/` - Basic card operations (CRUD, positioning, archiving)
- `cards/card-features.ts` - Advanced card features (checklists, attachments, comments)
- `members/` - Member and organization management
- `labels/` - Label creation and management
- `custom-fields/` - Custom field operations
- `automation/` - Webhooks, search, and batch operations
- `power-ups/` - Power-up management

**Facade Pattern:**
- `TrelloClient` - Main client that composes all domain clients and provides backwards compatibility

### Key Architecture Patterns
- **Domain-Driven Design**: Business logic organized by domain boundaries
- **Facade Pattern**: Single entry point with composed domain clients
- **Conditional Tool Registration**: Tools can be selectively enabled/disabled via environment variables
- **Modular Registration**: Each module registers its MCP components (resources/prompts/tools) with the server
- **Comprehensive Error Handling**: All API calls wrapped with try-catch, structured error responses
- **Type Safety**: Zod schemas validate all tool inputs, TypeScript interfaces for API responses
- **Environment Configuration**: Configurable timeouts, retries, and logging via environment variables
- **Backwards Compatibility**: All existing method signatures preserved through delegation

### API Coverage
The client implements nearly the complete Trello REST API including advanced features like custom fields, webhooks, power-ups, and batch operations. Tools are organized by functional domain rather than API endpoint structure.

### Development Notes
- The codebase contains German language strings in user-facing messages and descriptions
- All tools return structured JSON responses with error handling
- The BaseClient includes sophisticated retry logic with exponential backoff for reliability
- Each domain client extends BaseClient and focuses on a specific business capability
- The main TrelloClient provides backwards compatibility by delegating to domain clients
- Domain clients can be used independently for focused operations
- MCP inspector integration allows interactive testing of all server capabilities