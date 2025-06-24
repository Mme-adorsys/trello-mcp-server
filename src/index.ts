#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TrelloClient } from "./trello-client.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

// Umgebungsvariablen validieren
const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;

if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
  console.error("Bitte setze TRELLO_API_KEY und TRELLO_TOKEN Umgebungsvariablen");
  process.exit(1);
}

// Trello client initialisieren
const trelloClient = new TrelloClient({
  apiKey: TRELLO_API_KEY,
  token: TRELLO_TOKEN,
});

// MCP Server erstellen
const server = new McpServer({
  name: "trello-mcp-server",
  version: "1.0.0"
});

// TOOLS - Model-controlled actions
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


// Board Management Tools
server.registerTool(
  "create-board",
  {
    title: "Board erstellen",
    description: "Erstellt ein neues Trello Board",
    inputSchema: {
      name: z.string().min(1, "Board Name ist erforderlich"),
      description: z.string().optional(),
      idOrganization: z.string().optional(), // Workspace/Organization ID
      defaultLabels: z.boolean().optional(),
      defaultLists: z.boolean().optional(),
      idBoardSource: z.string().optional(),
      keepFromSource: z.enum(["cards", "none"]).optional(),
      powerUps: z.enum(["all", "calendar", "cardAging", "recap", "voting"]).optional(),
      prefs_permissionLevel: z.enum(["org", "private", "public"]).optional(),
      prefs_voting: z.enum(["disabled", "members", "observers", "org", "public"]).optional(),
      prefs_comments: z.enum(["disabled", "members", "observers", "org", "public"]).optional(),
      prefs_invitations: z.enum(["admins", "members"]).optional(),
      prefs_selfJoin: z.boolean().optional(),
      prefs_cardCovers: z.boolean().optional(),
      prefs_background: z.string().optional(),
    }
  },
  async (params) => {
    console.error(`[create-board] Input:`, params);
    try {
      // Map UI/handler params to Trello API params
      const board = await trelloClient.createBoard({
        name: params.name,
        desc: params.description,
        idOrganization: params.idOrganization,
        defaultLabels: params.defaultLabels,
        defaultLists: params.defaultLists,
        idBoardSource: params.idBoardSource,
        keepFromSource: params.keepFromSource,
        powerUps: params.powerUps,
        prefs_permissionLevel: params.prefs_permissionLevel,
        prefs_voting: params.prefs_voting,
        prefs_comments: params.prefs_comments,
        prefs_invitations: params.prefs_invitations,
        prefs_selfJoin: params.prefs_selfJoin,
        prefs_cardCovers: params.prefs_cardCovers,
        prefs_background: params.prefs_background,
      });
      console.error(`[create-board] Result:`, board);
      return {
        content: [{
          type: "text",
          text: `Board \"${board.name}\" erfolgreich erstellt!\nURL: ${board.shortUrl}`
        }]
      };
    } catch (error) {
      console.error(`[create-board] Error:`, error);
      return {
        content: [{
          type: "text",
          text: `Fehler beim Erstellen des Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "close-board",
  {
    title: "Board schließen",
    description: "Schließt ein Trello Board",
    inputSchema: {
      boardId: z.string().min(1, "Board ID ist erforderlich")
    }
  },
  async ({ boardId }) => {
    try {
      const board = await trelloClient.closeBoard(boardId);
      return {
        content: [{
          type: "text",
          text: `Board "${board.name}" wurde geschlossen.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Fehler beim Schließen des Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
        }],
        isError: true
      };
    }
  }
);

// List Management Tools
server.registerTool(
  "create-list",
  {
    title: "Liste erstellen",
    description: "Erstellt eine neue Liste auf einem Board",
    inputSchema: {
      boardId: z.string().min(1, "Board ID ist erforderlich"),
      name: z.string().min(1, "Listen Name ist erforderlich"),
      position: z.number().optional()
    }
  },
  async ({ boardId, name, position }) => {
    console.error(`[create-list] Input:`, { boardId, name, position });
    try {
      const list = await trelloClient.createList({ name, idBoard: boardId, pos: position });
      console.error(`[create-list] Result:`, list);
      return {
        content: [{
          type: "text",
          text: `Liste "${list.name}" erfolgreich erstellt!`
        }]
      };
    } catch (error) {
      console.error(`[create-list] Error:`, error);
      return {
        content: [{
          type: "text",
          text: `Fehler beim Erstellen der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
        }],
        isError: true
      };
    }
  }
);

// Card Management Tools
server.registerTool(
  "create-card",
  {
    title: "Karte erstellen",
    description: "Erstellt eine neue Karte in einer Liste",
    inputSchema: {
      listId: z.string().min(1, "Listen ID ist erforderlich"),
      name: z.string().min(1, "Karten Name ist erforderlich"),
      description: z.string().optional(),
      dueDate: z.string().optional()
    }
  },
  async ({ listId, name, description, dueDate }) => {
    console.error(`[create-card] Input:`, { listId, name, description, dueDate });
    try {
      const card = await trelloClient.createCard({ idList: listId, name, desc: description, due: dueDate });
      console.error(`[create-card] Result:`, card);
      return {
        content: [{
          type: "text",
          text: `Karte "${card.name}" erfolgreich erstellt!\nURL: ${card.shortUrl}`
        }]
      };
    } catch (error) {
      console.error(`[create-card] Error:`, error);
      return {
        content: [{
          type: "text",
          text: `Fehler beim Erstellen der Karte: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "move-card",
  {
    title: "Karte verschieben",
    description: "Verschiebt eine Karte in eine andere Liste",
    inputSchema: {
      cardId: z.string().min(1, "Karten ID ist erforderlich"),
      listId: z.string().min(1, "Ziel-Listen ID ist erforderlich"),
      position: z.number().optional()
    }
  },
  async ({ cardId, listId, position }) => {
    try {
      const card = await trelloClient.moveCard(cardId, listId, position);
      return {
        content: [{
          type: "text",
          text: `Karte "${card.name}" erfolgreich verschoben!`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Fehler beim Verschieben der Karte: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "update-card",
  {
    title: "Karte aktualisieren",
    description: "Aktualisiert eine Trello Karte",
    inputSchema: {
      cardId: z.string().min(1, "Karten ID ist erforderlich"),
      name: z.string().optional(),
      description: z.string().optional(),
      dueDate: z.string().optional()
    }
  },
  async ({ cardId, name, description, dueDate }) => {
    try {
      const updates: any = {};
      if (name) updates.name = name;
      if (description) updates.desc = description;
      if (dueDate) updates.due = dueDate;

      const card = await trelloClient.updateCard(cardId, updates);
      return {
        content: [{
          type: "text",
          text: `Karte "${card.name}" erfolgreich aktualisiert!`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Fehler beim Aktualisieren der Karte: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
        }],
        isError: true
      };
    }
  }
);

// RESOURCES - Application-controlled data

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
  new ResourceTemplate("trello://boards/{boardId}", { list: undefined }),
  {
    title: "Board Details",
    description: "Details eines spezifischen Trello Boards",
    mimeType: "application/json"
  },
  async (uri: URL, variables: Variables, extra: RequestHandlerExtra<any, any>) => {
    const { boardId } = variables;
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
  new ResourceTemplate("trello://boards/{boardId}/cards", { list: undefined }),
  {
    title: "Board Karten",
    description: "Alle Karten eines Trello Boards",
    mimeType: "application/json"
  },
  async (uri: URL, variables: Variables, extra: RequestHandlerExtra<any, any>) => {
    const { boardId } = variables;
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

// PROMPTS - User-controlled templates

server.registerPrompt(
  "board-analysis",
  {
    title: "Board Analyse",
    description: "Analysiert ein Trello Board und gibt Einblicke",
    argsSchema: {
      boardId: z.string().min(1, "Board ID ist erforderlich")
    }
  },
  ({ boardId }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Bitte analysiere das Trello Board mit der ID ${boardId}. Schaue dir die Board-Details an und gib mir eine Zusammenfassung über:
1. Die Struktur des Boards (Listen und Karten)
2. Den Arbeitsfortschritt
3. Mögliche Verbesserungen
4. Überfällige Aufgaben (falls vorhanden)

Verwende die Resource trello://boards/${boardId} für die Analyse.`
      }
    }]
  })
);

server.registerPrompt(
  "sprint-planning",
  {
    title: "Sprint Planung",
    description: "Hilft bei der Sprint-Planung auf einem Trello Board",
    argsSchema: {
      boardId: z.string().min(1, "Board ID ist erforderlich"),
      sprintGoal: z.string().min(1, "Sprint-Ziel ist erforderlich")
    }
  },
  ({ boardId, sprintGoal }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Hilf mir bei der Sprint-Planung für das Board ${boardId}.

Sprint-Ziel: ${sprintGoal}

Bitte:
1. Analysiere die aktuellen Karten im Board
2. Schlage vor, welche Karten für diesen Sprint geeignet sind
3. Empfehle eine Struktur für Sprint-Listen (z.B. Backlog, In Progress, Review, Done)
4. Gib Tipps für ein effektives Sprint-Management

Verwende die Board-Details von trello://boards/${boardId} für die Analyse.`
      }
    }]
  })
);

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

server.registerTool(
  "get-list",
  {
    title: "Liste abrufen",
    description: "Lädt eine Trello-Liste.",
    inputSchema: {
      id: z.string().min(1, "Listen-ID ist erforderlich"),
      fields: z.string().optional(),
    }
  },
  async (params) => {
    console.error(`[get-list] Input:`, params);
    try {
      const list = await trelloClient.getList(params);
      console.error(`[get-list] Result:`, list);
      return {
        content: [{ type: "text", text: JSON.stringify(list, null, 2) }]
      };
    } catch (error) {
      console.error(`[get-list] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Laden der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "update-list-full",
  {
    title: "Liste aktualisieren (alle Felder)",
    description: "Aktualisiert eine Trello-Liste mit allen unterstützten Feldern.",
    inputSchema: {
      id: z.string().min(1, "Listen-ID ist erforderlich"),
      name: z.string().optional(),
      closed: z.boolean().optional(),
      idBoard: z.string().optional(),
      pos: z.union([z.string(), z.number()]).optional(),
      subscribed: z.boolean().optional(),
    }
  },
  async (params) => {
    console.error(`[update-list-full] Input:`, params);
    try {
      const list = await trelloClient.updateList(params);
      console.error(`[update-list-full] Result:`, list);
      return {
        content: [{ type: "text", text: JSON.stringify(list, null, 2) }]
      };
    } catch (error) {
      console.error(`[update-list-full] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Aktualisieren der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "create-list-full",
  {
    title: "Liste erstellen (alle Felder)",
    description: "Erstellt eine neue Trello-Liste mit allen unterstützten Feldern.",
    inputSchema: {
      name: z.string().min(1, "Listen-Name ist erforderlich"),
      idBoard: z.string().min(1, "Board-ID ist erforderlich"),
      idListSource: z.string().optional(),
      pos: z.union([z.string(), z.number()]).optional(),
    }
  },
  async (params) => {
    console.error(`[create-list-full] Input:`, params);
    try {
      const list = await trelloClient.createList(params);
      console.error(`[create-list-full] Result:`, list);
      return {
        content: [{ type: "text", text: JSON.stringify(list, null, 2) }]
      };
    } catch (error) {
      console.error(`[create-list-full] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Erstellen der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "archive-all-cards-in-list",
  {
    title: "Alle Karten in Liste archivieren",
    description: "Archiviert alle Karten in einer Trello-Liste.",
    inputSchema: {
      id: z.string().min(1, "Listen-ID ist erforderlich"),
    }
  },
  async (params) => {
    console.error(`[archive-all-cards-in-list] Input:`, params);
    try {
      const result = await trelloClient.archiveAllCardsInList(params.id);
      console.error(`[archive-all-cards-in-list] Result:`, result);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      console.error(`[archive-all-cards-in-list] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Archivieren der Karten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "move-all-cards-in-list",
  {
    title: "Alle Karten in Liste verschieben",
    description: "Verschiebt alle Karten in einer Trello-Liste zu einer anderen Liste/Board.",
    inputSchema: {
      id: z.string().min(1, "Listen-ID ist erforderlich"),
      idBoard: z.string().min(1, "Ziel-Board-ID ist erforderlich"),
      idList: z.string().min(1, "Ziel-Listen-ID ist erforderlich"),
    }
  },
  async (params) => {
    console.error(`[move-all-cards-in-list] Input:`, params);
    try {
      const result = await trelloClient.moveAllCardsInList(params);
      console.error(`[move-all-cards-in-list] Result:`, result);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      console.error(`[move-all-cards-in-list] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Verschieben der Karten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "set-list-closed",
  {
    title: "Liste archivieren/reaktivieren",
    description: "Archiviert oder reaktiviert eine Trello-Liste.",
    inputSchema: {
      id: z.string().min(1, "Listen-ID ist erforderlich"),
      value: z.boolean(),
    }
  },
  async (params) => {
    console.error(`[set-list-closed] Input:`, params);
    try {
      const list = await trelloClient.setListClosed(params);
      console.error(`[set-list-closed] Result:`, list);
      return {
        content: [{ type: "text", text: JSON.stringify(list, null, 2) }]
      };
    } catch (error) {
      console.error(`[set-list-closed] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Archivieren/Reaktivieren der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "move-list-to-board",
  {
    title: "Liste zu anderem Board verschieben",
    description: "Verschiebt eine Trello-Liste zu einem anderen Board.",
    inputSchema: {
      id: z.string().min(1, "Listen-ID ist erforderlich"),
      value: z.string().min(1, "Ziel-Board-ID ist erforderlich"),
    }
  },
  async (params) => {
    console.error(`[move-list-to-board] Input:`, params);
    try {
      const list = await trelloClient.moveListToBoard(params);
      console.error(`[move-list-to-board] Result:`, list);
      return {
        content: [{ type: "text", text: JSON.stringify(list, null, 2) }]
      };
    } catch (error) {
      console.error(`[move-list-to-board] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Verschieben der Liste: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "update-list-field",
  {
    title: "Feld einer Liste aktualisieren",
    description: "Aktualisiert ein einzelnes Feld einer Trello-Liste.",
    inputSchema: {
      id: z.string().min(1, "Listen-ID ist erforderlich"),
      field: z.enum(["name", "pos", "subscribed"]),
      value: z.union([z.string(), z.number(), z.boolean()]),
    }
  },
  async (params) => {
    console.error(`[update-list-field] Input:`, params);
    try {
      const list = await trelloClient.updateListField(params);
      console.error(`[update-list-field] Result:`, list);
      return {
        content: [{ type: "text", text: JSON.stringify(list, null, 2) }]
      };
    } catch (error) {
      console.error(`[update-list-field] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Aktualisieren des Feldes: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get-list-actions",
  {
    title: "Aktionen einer Liste abrufen",
    description: "Lädt alle Aktionen einer Trello-Liste.",
    inputSchema: {
      id: z.string().min(1, "Listen-ID ist erforderlich"),
      filter: z.string().optional(),
    }
  },
  async (params) => {
    console.error(`[get-list-actions] Input:`, params);
    try {
      const actions = await trelloClient.getListActions(params);
      console.error(`[get-list-actions] Result:`, actions);
      return {
        content: [{ type: "text", text: JSON.stringify(actions, null, 2) }]
      };
    } catch (error) {
      console.error(`[get-list-actions] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Laden der Aktionen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get-list-board",
  {
    title: "Board einer Liste abrufen",
    description: "Lädt das Board, zu dem eine Trello-Liste gehört.",
    inputSchema: {
      id: z.string().min(1, "Listen-ID ist erforderlich"),
      fields: z.string().optional(),
    }
  },
  async (params) => {
    console.error(`[get-list-board] Input:`, params);
    try {
      const board = await trelloClient.getListBoard(params);
      console.error(`[get-list-board] Result:`, board);
      return {
        content: [{ type: "text", text: JSON.stringify(board, null, 2) }]
      };
    } catch (error) {
      console.error(`[get-list-board] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Laden des Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get-list-cards",
  {
    title: "Karten einer Liste abrufen",
    description: "Lädt alle Karten in einer Trello-Liste.",
    inputSchema: {
      id: z.string().min(1, "Listen-ID ist erforderlich"),
    }
  },
  async (params) => {
    console.error(`[get-list-cards] Input:`, params);
    try {
      const cards = await trelloClient.getListCards(params);
      console.error(`[get-list-cards] Result:`, cards);
      return {
        content: [{ type: "text", text: JSON.stringify(cards, null, 2) }]
      };
    } catch (error) {
      console.error(`[get-list-cards] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Laden der Karten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

// Server starten
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