import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { TrelloClient } from '../trello-client/index.js';

/**
 * Registers all MCP resources for the Trello server
 */
export function registerTrelloResources(server: McpServer, trelloClient: TrelloClient) {
    // Coding Guidelines Resource
    server.registerResource(
        "coding-guidelines",
        "trello://coding-guidelines",
        {
            title: "Coding Guidelines",
            description: "Standard coding guidelines and best practices for the project",
            mimeType: "text/plain"
        },
        async (uri: URL, extra: RequestHandlerExtra<any, any>) => {
            const guidelines = `# Coding Guidelines

## General Principles
- Write clean, readable, and maintainable code
- Follow the principle of least surprise
- Use descriptive names for variables, functions, and classes
- Keep functions small and focused on a single responsibility

## TypeScript/JavaScript Standards
- Use TypeScript for type safety
- Prefer const over let, avoid var
- Use arrow functions for callbacks and short functions
- Always handle errors appropriately with try-catch blocks
- Use async/await instead of promises when possible

## Code Organization
- Group related functionality together
- Use meaningful file and directory names
- Keep imports organized (external first, then internal)
- Export only what needs to be used elsewhere

## Documentation
- Write JSDoc comments for public APIs
- Include examples in documentation when helpful
- Keep README files up to date
- Document complex business logic with inline comments

## Testing
- Write unit tests for all business logic
- Use descriptive test names that explain what is being tested
- Test both happy path and error cases
- Maintain good test coverage

## Git Practices
- Write clear, descriptive commit messages
- Make small, focused commits
- Use branches for features and bug fixes
- Review code before merging

## Error Handling
- Always handle errors gracefully
- Provide meaningful error messages to users
- Log errors with sufficient context for debugging
- Use appropriate error types and status codes

## Performance
- Avoid unnecessary computations in loops
- Cache expensive operations when appropriate
- Use pagination for large data sets
- Optimize database queries

## Security
- Never expose sensitive information in logs
- Validate all user inputs
- Use secure authentication and authorization
- Keep dependencies up to date`;

            return {
                contents: [{
                    uri: uri.href,
                    text: guidelines,
                    mimeType: "text/plain"
                }]
            };
        }
    );

    // Boards Resource
    server.registerResource(
        "boards",
        "trello://boards",
        {
            title: "Meine Trello Boards",
            description: "Liste aller verfügbaren Trello Boards",
            mimeType: "application/json"
        },
        async (uri: URL, extra: RequestHandlerExtra<any, any>) => {
            try {
                const boards = await trelloClient.getBoards();
                return {
                    contents: [{
                        uri: uri.href,
                        text: JSON.stringify(boards, null, 2),
                        mimeType: "application/json"
                    }]
                };
            } catch (error) {
                return {
                    contents: [{
                        uri: uri.href,
                        text: `Fehler beim Laden der Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
                        mimeType: "text/plain"
                    }]
                };
            }
        }
    );

    // Board Details Resource
    server.registerResource(
        "board-details",
        new ResourceTemplate("trello://boards/{boardId}", {list: undefined}),
        {
            title: "Board Details",
            description: "Details eines spezifischen Trello Boards",
            mimeType: "application/json"
        },
        async (uri: URL, variables: Variables, extra: RequestHandlerExtra<any, any>) => {
            const {boardId} = variables;
            try {
                const [board, lists, cards, members] = await Promise.all([
                    trelloClient.getBoard(boardId as string),
                    trelloClient.getLists(boardId as string),
                    trelloClient.getCards(boardId as string),
                    trelloClient.getBoardMembers(boardId as string)
                ]);
                const boardData = {
                    board,
                    lists,
                    cards,
                    members,
                    summary: {
                        totalLists: lists.length,
                        totalCards: cards.length,
                        totalMembers: members.length,
                        openCards: cards.filter(card => !card.closed).length,
                        closedCards: cards.filter(card => card.closed).length
                    }
                };
                return {
                    contents: [{
                        uri: uri.href,
                        text: JSON.stringify(boardData, null, 2),
                        mimeType: "application/json"
                    }]
                };
            } catch (error) {
                return {
                    contents: [{
                        uri: uri.href,
                        text: `Fehler beim Laden der Board Details: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
                        mimeType: "text/plain"
                    }]
                };
            }
        }
    );

    // Cards Resource
    server.registerResource(
        "board-cards",
        new ResourceTemplate("trello://boards/{boardId}/cards", {list: undefined}),
        {
            title: "Board Karten",
            description: "Alle Karten eines Trello Boards",
            mimeType: "application/json"
        },
        async (uri: URL, variables: Variables, extra: RequestHandlerExtra<any, any>) => {
            const {boardId} = variables;
            try {
                const cards = await trelloClient.getCards(boardId as string);
                return {
                    contents: [{
                        uri: uri.href,
                        text: JSON.stringify(cards, null, 2),
                        mimeType: "application/json"
                    }]
                };
            } catch (error) {
                return {
                    contents: [{
                        uri: uri.href,
                        text: `Fehler beim Laden der Karten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
                        mimeType: "text/plain"
                    }]
                };
            }
        }
    );
}