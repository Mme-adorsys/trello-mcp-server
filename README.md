# Trello MCP Server

A Model Context Protocol (MCP) server for seamless integration with Trello. Enables AI applications and automation tools to manage Trello boards, lists, cards, members, and advanced workflows.

## Features

### Model-Controlled Tools

- **Board Management:** Create, update, close, and delete boards. Manage board members, invitations, and power-ups.
- **List Management:** Create, update, move, and archive lists.
- **Card Management:** Create, update, move, copy, archive/unarchive, and delete cards.
- **Advanced Card Features:** Manage checklists, attachments, comments, custom fields, labels, and card members.
- **Automation:** Webhook management, batch API, search, and advanced board/org invitations.
- **Power-Ups:** List, enable, and disable board power-ups.

### Application-Controlled Resources

- **Boards:** List all available Trello boards.
- **Board Details:** Detailed information about a specific board, including lists, cards, and members.
- **Board Cards:** All cards of a board.

### User-Controlled Prompts

- **Board Analysis:** Analyze a board and get actionable insights.
- **Sprint Planning:** Get help with sprint planning on a Trello board.

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd trello-mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Trello API credentials:**
   - Go to https://trello.com/app-key
   - Copy your API Key and generate a Token
   - Create a `.env` file (or set environment variables):
     ```
     TRELLO_API_KEY=your_api_key
     TRELLO_TOKEN=your_token
     ```

4. **Build the server:**
   ```bash
   npm run build
   ```

## Usage

### Standalone

```bash
npm start
```

### With Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/absolute/path/to/trello-mcp/build/index.js"],
      "env": {
        "TRELLO_API_KEY": "your_api_key",
        "TRELLO_TOKEN": "your_token"
      }
    }
  }
}
```

## Examples

### Create a Board

```
Create a new Trello board named "My Project" with the description "Project management board"
```

### Create a Card

```
Create a new card "Implement new feature" in the list with ID "list123" with the description "Details about the implementation"
```

### Analyze a Board

```
Analyze my board with the ID "board456" and give me an overview of the current status
```

### Enable a Power-Up

```
Enable the "calendar" Power-Up on the board with ID "board789"
```

## Development

```bash
# Development mode with auto-reload
npm run watch

# In another terminal
npm start
```

## API Reference

- See the [Trello API Documentation](https://developer.atlassian.com/cloud/trello/rest/api-group-actions/) for details on available actions.
- This MCP server exposes most Trello API endpoints as tools, including advanced features for automation and workflow management.

## Advanced Features

- **Full Trello Integration:** Boards, lists, cards, members, labels, checklists, attachments, comments, custom fields, power-ups, webhooks, and more.
- **Type-safe API:** All tool inputs are validated with Zod.
- **Comprehensive Error Handling:** Clear error messages for all operations.
- **Modular Structure:** Easy to extend with new tools and resources.
- **Ready for AI Automation:** Designed for use with Claude Desktop and other AI agents.

## License

MIT
