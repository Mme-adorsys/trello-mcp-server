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

// --- Advanced Card Tools ---

// Card Checklists
server.registerTool(
  "get-card-checklists",
  {
    title: "Checklisten einer Karte abrufen",
    description: "Lädt alle Checklisten einer Trello-Karte.",
    inputSchema: { cardId: z.string().min(1, "Karten ID ist erforderlich") }
  },
  async ({ cardId }) => {
    const checklists = await trelloClient.getCardChecklists(cardId);
    return { content: [{ type: "text", text: JSON.stringify(checklists, null, 2) }] };
  }
);
server.registerTool(
  "add-checklist-to-card",
  {
    title: "Checkliste zu Karte hinzufügen",
    description: "Fügt einer Karte eine neue Checkliste hinzu.",
    inputSchema: { cardId: z.string().min(1), name: z.string().min(1) }
  },
  async ({ cardId, name }) => {
    const checklist = await trelloClient.addChecklistToCard(cardId, name);
    return { content: [{ type: "text", text: JSON.stringify(checklist, null, 2) }] };
  }
);
server.registerTool(
  "update-checklist",
  {
    title: "Checkliste aktualisieren",
    description: "Aktualisiert eine Checkliste (Name/Position).",
    inputSchema: { checklistId: z.string().min(1), name: z.string().optional(), pos: z.union([z.string(), z.number()]).optional() }
  },
  async ({ checklistId, name, pos }) => {
    const updates: any = {};
    if (name) updates.name = name;
    if (pos !== undefined) updates.pos = pos;
    const checklist = await trelloClient.updateChecklist(checklistId, updates);
    return { content: [{ type: "text", text: JSON.stringify(checklist, null, 2) }] };
  }
);
server.registerTool(
  "delete-checklist",
  {
    title: "Checkliste löschen",
    description: "Löscht eine Checkliste.",
    inputSchema: { checklistId: z.string().min(1) }
  },
  async ({ checklistId }) => {
    await trelloClient.deleteChecklist(checklistId);
    return { content: [{ type: "text", text: "Checkliste gelöscht." }] };
  }
);

// Card Attachments
server.registerTool(
  "get-card-attachments",
  {
    title: "Anhänge einer Karte abrufen",
    description: "Lädt alle Anhänge einer Trello-Karte.",
    inputSchema: { cardId: z.string().min(1) }
  },
  async ({ cardId }) => {
    const attachments = await trelloClient.getCardAttachments(cardId);
    return { content: [{ type: "text", text: JSON.stringify(attachments, null, 2) }] };
  }
);
server.registerTool(
  "add-attachment-to-card",
  {
    title: "Anhang zu Karte hinzufügen",
    description: "Fügt einer Karte einen Anhang hinzu (nur URL).",
    inputSchema: { cardId: z.string().min(1), url: z.string().url(), name: z.string().optional() }
  },
  async ({ cardId, url, name }) => {
    const attachment = await trelloClient.addAttachmentToCard(cardId, url, name);
    return { content: [{ type: "text", text: JSON.stringify(attachment, null, 2) }] };
  }
);
server.registerTool(
  "delete-attachment",
  {
    title: "Anhang löschen",
    description: "Löscht einen Anhang von einer Karte.",
    inputSchema: { cardId: z.string().min(1), attachmentId: z.string().min(1) }
  },
  async ({ cardId, attachmentId }) => {
    await trelloClient.deleteAttachment(cardId, attachmentId);
    return { content: [{ type: "text", text: "Anhang gelöscht." }] };
  }
);

// Card Comments
server.registerTool(
  "get-card-comments",
  {
    title: "Kommentare einer Karte abrufen",
    description: "Lädt alle Kommentare einer Trello-Karte.",
    inputSchema: { cardId: z.string().min(1) }
  },
  async ({ cardId }) => {
    const comments = await trelloClient.getCardComments(cardId);
    return { content: [{ type: "text", text: JSON.stringify(comments, null, 2) }] };
  }
);
server.registerTool(
  "add-comment-to-card",
  {
    title: "Kommentar zu Karte hinzufügen",
    description: "Fügt einer Karte einen Kommentar hinzu.",
    inputSchema: { cardId: z.string().min(1), text: z.string().min(1) }
  },
  async ({ cardId, text }) => {
    const comment = await trelloClient.addCommentToCard(cardId, text);
    return { content: [{ type: "text", text: JSON.stringify(comment, null, 2) }] };
  }
);
server.registerTool(
  "update-comment",
  {
    title: "Kommentar aktualisieren",
    description: "Aktualisiert einen Kommentar auf einer Karte.",
    inputSchema: { cardId: z.string().min(1), actionId: z.string().min(1), text: z.string().min(1) }
  },
  async ({ cardId, actionId, text }) => {
    const comment = await trelloClient.updateComment(cardId, actionId, text);
    return { content: [{ type: "text", text: JSON.stringify(comment, null, 2) }] };
  }
);
server.registerTool(
  "delete-comment",
  {
    title: "Kommentar löschen",
    description: "Löscht einen Kommentar von einer Karte.",
    inputSchema: { cardId: z.string().min(1), actionId: z.string().min(1) }
  },
  async ({ cardId, actionId }) => {
    await trelloClient.deleteComment(cardId, actionId);
    return { content: [{ type: "text", text: "Kommentar gelöscht." }] };
  }
);

// Card Custom Fields
server.registerTool(
  "get-card-custom-fields",
  {
    title: "Custom Fields einer Karte abrufen",
    description: "Lädt alle Custom Field Werte einer Karte.",
    inputSchema: { cardId: z.string().min(1) }
  },
  async ({ cardId }) => {
    const items = await trelloClient.getCardCustomFieldItems(cardId);
    return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
  }
);
server.registerTool(
  "set-card-custom-field",
  {
    title: "Custom Field einer Karte setzen",
    description: "Setzt einen Wert für ein Custom Field einer Karte.",
    inputSchema: { cardId: z.string().min(1), fieldId: z.string().min(1), value: z.any() }
  },
  async ({ cardId, fieldId, value }) => {
    const result = await trelloClient.setCardCustomField(cardId, fieldId, value);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Card Labels
server.registerTool(
  "get-card-labels",
  {
    title: "Labels einer Karte abrufen",
    description: "Lädt alle Labels einer Karte.",
    inputSchema: { cardId: z.string().min(1) }
  },
  async ({ cardId }) => {
    const labels = await trelloClient.getCardLabels(cardId);
    return { content: [{ type: "text", text: JSON.stringify(labels, null, 2) }] };
  }
);
server.registerTool(
  "add-label-to-card",
  {
    title: "Label zu Karte hinzufügen",
    description: "Fügt einer Karte ein Label hinzu.",
    inputSchema: { cardId: z.string().min(1), labelId: z.string().min(1) }
  },
  async ({ cardId, labelId }) => {
    const result = await trelloClient.addLabelToCard(cardId, labelId);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);
server.registerTool(
  "remove-label-from-card",
  {
    title: "Label von Karte entfernen",
    description: "Entfernt ein Label von einer Karte.",
    inputSchema: { cardId: z.string().min(1), labelId: z.string().min(1) }
  },
  async ({ cardId, labelId }) => {
    await trelloClient.removeLabelFromCard(cardId, labelId);
    return { content: [{ type: "text", text: "Label entfernt." }] };
  }
);
server.registerTool(
  "create-label",
  {
    title: "Label erstellen",
    description: "Erstellt ein neues Label auf einem Board.",
    inputSchema: { boardId: z.string().min(1), name: z.string().min(1), color: z.string().min(1) }
  },
  async ({ boardId, name, color }) => {
    const label = await trelloClient.createLabel(boardId, name, color);
    return { content: [{ type: "text", text: JSON.stringify(label, null, 2) }] };
  }
);
server.registerTool(
  "delete-label",
  {
    title: "Label löschen",
    description: "Löscht ein Label.",
    inputSchema: { labelId: z.string().min(1) }
  },
  async ({ labelId }) => {
    await trelloClient.deleteLabel(labelId);
    return { content: [{ type: "text", text: "Label gelöscht." }] };
  }
);

// Card Members
server.registerTool(
  "get-card-members",
  {
    title: "Mitglieder einer Karte abrufen",
    description: "Lädt alle Mitglieder einer Karte.",
    inputSchema: { cardId: z.string().min(1) }
  },
  async ({ cardId }) => {
    const members = await trelloClient.getCardMembers(cardId);
    return { content: [{ type: "text", text: JSON.stringify(members, null, 2) }] };
  }
);
server.registerTool(
  "add-member-to-card",
  {
    title: "Mitglied zu Karte hinzufügen",
    description: "Fügt einer Karte ein Mitglied hinzu.",
    inputSchema: { cardId: z.string().min(1), memberId: z.string().min(1) }
  },
  async ({ cardId, memberId }) => {
    const result = await trelloClient.addMemberToCard(cardId, memberId);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);
server.registerTool(
  "remove-member-from-card",
  {
    title: "Mitglied von Karte entfernen",
    description: "Entfernt ein Mitglied von einer Karte.",
    inputSchema: { cardId: z.string().min(1), memberId: z.string().min(1) }
  },
  async ({ cardId, memberId }) => {
    await trelloClient.removeMemberFromCard(cardId, memberId);
    return { content: [{ type: "text", text: "Mitglied entfernt." }] };
  }
);

// Card Advanced Actions
server.registerTool(
  "archive-card",
  {
    title: "Karte archivieren",
    description: "Archiviert eine Karte.",
    inputSchema: { cardId: z.string().min(1) }
  },
  async ({ cardId }) => {
    const card = await trelloClient.archiveCard(cardId);
    return { content: [{ type: "text", text: JSON.stringify(card, null, 2) }] };
  }
);
server.registerTool(
  "unarchive-card",
  {
    title: "Karte wiederherstellen",
    description: "Stellt eine archivierte Karte wieder her.",
    inputSchema: { cardId: z.string().min(1) }
  },
  async ({ cardId }) => {
    const card = await trelloClient.unarchiveCard(cardId);
    return { content: [{ type: "text", text: JSON.stringify(card, null, 2) }] };
  }
);
server.registerTool(
  "copy-card",
  {
    title: "Karte kopieren",
    description: "Kopiert eine Karte in eine andere Liste.",
    inputSchema: { cardId: z.string().min(1), listId: z.string().min(1), name: z.string().optional() }
  },
  async ({ cardId, listId, name }) => {
    const card = await trelloClient.copyCard(cardId, listId, name);
    return { content: [{ type: "text", text: JSON.stringify(card, null, 2) }] };
  }
);
server.registerTool(
  "subscribe-to-card",
  {
    title: "Karte abonnieren",
    description: "Abonniert oder deabonniert eine Karte.",
    inputSchema: { cardId: z.string().min(1), value: z.boolean() }
  },
  async ({ cardId, value }) => {
    const card = await trelloClient.subscribeToCard(cardId, value);
    return { content: [{ type: "text", text: JSON.stringify(card, null, 2) }] };
  }
);
server.registerTool(
  "vote-on-card",
  {
    title: "Karte bewerten (Daumen hoch/runter)",
    description: "Fügt eine Stimme hinzu oder entfernt sie von einer Karte.",
    inputSchema: { cardId: z.string().min(1), value: z.boolean() }
  },
  async ({ cardId, value }) => {
    const result = await trelloClient.voteOnCard(cardId, value);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// --- Board/Org Automation Tools ---

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
    return { content: [{ type: "text", text: JSON.stringify(webhooks, null, 2) }] };
  }
);
server.registerTool(
  "create-webhook",
  {
    title: "Webhook erstellen",
    description: "Erstellt einen neuen Webhook.",
    inputSchema: { callbackURL: z.string().url(), idModel: z.string().min(1), description: z.string().optional() }
  },
  async ({ callbackURL, idModel, description }) => {
    const webhook = await trelloClient.createWebhook(callbackURL, idModel, description);
    return { content: [{ type: "text", text: JSON.stringify(webhook, null, 2) }] };
  }
);
server.registerTool(
  "update-webhook",
  {
    title: "Webhook aktualisieren",
    description: "Aktualisiert einen bestehenden Webhook.",
    inputSchema: { webhookId: z.string().min(1), callbackURL: z.string().url().optional(), description: z.string().optional(), idModel: z.string().optional() }
  },
  async ({ webhookId, callbackURL, description, idModel }) => {
    const updates: any = {};
    if (callbackURL) updates.callbackURL = callbackURL;
    if (description) updates.description = description;
    if (idModel) updates.idModel = idModel;
    const webhook = await trelloClient.updateWebhook(webhookId, updates);
    return { content: [{ type: "text", text: JSON.stringify(webhook, null, 2) }] };
  }
);
server.registerTool(
  "delete-webhook",
  {
    title: "Webhook löschen",
    description: "Löscht einen Webhook.",
    inputSchema: { webhookId: z.string().min(1) }
  },
  async ({ webhookId }) => {
    await trelloClient.deleteWebhook(webhookId);
    return { content: [{ type: "text", text: "Webhook gelöscht." }] };
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
  async ({ query, modelTypes, idBoards, idOrganizations }) => {
    const result = await trelloClient.search(query, modelTypes, idBoards, idOrganizations);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Batch API
server.registerTool(
  "batch-trello",
  {
    title: "Batch-API aufrufen",
    description: "Führt mehrere Trello-API-Aufrufe in einem Batch aus.",
    inputSchema: { urls: z.array(z.string().min(1)).min(1) }
  },
  async ({ urls }) => {
    const result = await trelloClient.batch(urls);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Board/Org Invitations
server.registerTool(
  "invite-to-board",
  {
    title: "Mitglied zu Board einladen",
    description: "Lädt ein Mitglied per E-Mail zu einem Board ein.",
    inputSchema: { boardId: z.string().min(1), email: z.string().email(), fullName: z.string().optional(), type: z.string().optional() }
  },
  async ({ boardId, email, fullName, type }) => {
    const result = await trelloClient.inviteToBoard(boardId, email, fullName, type);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);
server.registerTool(
  "invite-to-organization",
  {
    title: "Mitglied zu Organisation einladen",
    description: "Lädt ein Mitglied per E-Mail zu einer Organisation ein.",
    inputSchema: { orgId: z.string().min(1), email: z.string().email(), fullName: z.string().optional(), type: z.string().optional() }
  },
  async ({ orgId, email, fullName, type }) => {
    const result = await trelloClient.inviteToOrganization(orgId, email, fullName, type);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Power-Ups
server.registerTool(
  "get-board-powerups",
  {
    title: "Power-Ups eines Boards abrufen",
    description: "Lädt alle Power-Ups eines Boards.",
    inputSchema: { boardId: z.string().min(1) }
  },
  async ({ boardId }) => {
    const powerUps = await trelloClient.getBoardPowerUps(boardId);
    return { content: [{ type: "text", text: JSON.stringify(powerUps, null, 2) }] };
  }
);
server.registerTool(
  "enable-board-powerup",
  {
    title: "Power-Up aktivieren",
    description: "Aktiviert ein Power-Up auf einem Board.",
    inputSchema: { boardId: z.string().min(1), powerUp: z.string().min(1) }
  },
  async ({ boardId, powerUp }) => {
    const result = await trelloClient.enableBoardPowerUp(boardId, powerUp);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);
server.registerTool(
  "disable-board-powerup",
  {
    title: "Power-Up deaktivieren",
    description: "Deaktiviert ein Power-Up auf einem Board.",
    inputSchema: { boardId: z.string().min(1), powerUp: z.string().min(1) }
  },
  async ({ boardId, powerUp }) => {
    await trelloClient.disableBoardPowerUp(boardId, powerUp);
    return { content: [{ type: "text", text: "Power-Up deaktiviert." }] };
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

server.registerTool(
  "get-board-detailed",
  {
    title: "Board (detailliert) abrufen",
    description: "Lädt ein Board mit allen Parametern.",
    inputSchema: {
      id: z.string().min(1, "Board-ID ist erforderlich"),
      actions: z.string().optional(),
      boardStars: z.string().optional(),
      cards: z.string().optional(),
      card_pluginData: z.boolean().optional(),
      checklists: z.string().optional(),
      customFields: z.boolean().optional(),
      fields: z.string().optional(),
      labels: z.string().optional(),
      lists: z.string().optional(),
      members: z.string().optional(),
      memberships: z.string().optional(),
      pluginData: z.boolean().optional(),
      organization: z.boolean().optional(),
      organization_pluginData: z.boolean().optional(),
      myPrefs: z.boolean().optional(),
      tags: z.boolean().optional(),
    }
  },
  async (params) => {
    console.error(`[get-board-detailed] Input:`, params);
    try {
      const board = await trelloClient.getBoardDetailed(params);
      console.error(`[get-board-detailed] Result:`, board);
      return {
        content: [{ type: "text", text: JSON.stringify(board, null, 2) }]
      };
    } catch (error) {
      console.error(`[get-board-detailed] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Laden des Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "update-board",
  {
    title: "Board aktualisieren",
    description: "Aktualisiert ein Board mit beliebigen Feldern.",
    inputSchema: {
      id: z.string().min(1, "Board-ID ist erforderlich"),
      // alle weiteren Felder optional, dynamisch
      // z.B. name, desc, closed, etc.
      // Für maximale Flexibilität als Record
      updates: z.record(z.any())
    }
  },
  async (params) => {
    console.error(`[update-board] Input:`, params);
    try {
      const board = await trelloClient.updateBoard({ id: params.id, ...params.updates });
      console.error(`[update-board] Result:`, board);
      return {
        content: [{ type: "text", text: JSON.stringify(board, null, 2) }]
      };
    } catch (error) {
      console.error(`[update-board] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Aktualisieren des Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "delete-board",
  {
    title: "Board löschen",
    description: "Löscht ein Board.",
    inputSchema: {
      id: z.string().min(1, "Board-ID ist erforderlich"),
    }
  },
  async (params) => {
    console.error(`[delete-board] Input:`, params);
    try {
      await trelloClient.deleteBoard(params.id);
      console.error(`[delete-board] Result: Board deleted`);
      return {
        content: [{ type: "text", text: `Board gelöscht.` }]
      };
    } catch (error) {
      console.error(`[delete-board] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Löschen des Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get-board-field",
  {
    title: "Einzelnes Board-Feld abrufen",
    description: "Lädt ein einzelnes Feld eines Boards.",
    inputSchema: {
      id: z.string().min(1, "Board-ID ist erforderlich"),
      field: z.string().min(1, "Feldname ist erforderlich"),
    }
  },
  async (params) => {
    console.error(`[get-board-field] Input:`, params);
    try {
      const value = await trelloClient.getBoardField(params);
      console.error(`[get-board-field] Result:`, value);
      return {
        content: [{ type: "text", text: JSON.stringify(value, null, 2) }]
      };
    } catch (error) {
      console.error(`[get-board-field] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Laden des Feldes: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get-board-actions",
  {
    title: "Board-Aktionen abrufen",
    description: "Lädt alle Aktionen eines Boards.",
    inputSchema: {
      boardId: z.string().min(1, "Board-ID ist erforderlich"),
      fields: z.string().optional(),
      filter: z.string().optional(),
      format: z.string().optional(),
      idModels: z.string().optional(),
      limit: z.number().optional(),
      member: z.boolean().optional(),
      member_fields: z.string().optional(),
      memberCreator: z.boolean().optional(),
      memberCreator_fields: z.string().optional(),
      page: z.number().optional(),
      reactions: z.boolean().optional(),
      before: z.string().optional(),
      since: z.string().optional(),
    }
  },
  async (params) => {
    console.error(`[get-board-actions] Input:`, params);
    try {
      const actions = await trelloClient.getBoardActions(params);
      console.error(`[get-board-actions] Result:`, actions);
      return {
        content: [{ type: "text", text: JSON.stringify(actions, null, 2) }]
      };
    } catch (error) {
      console.error(`[get-board-actions] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Laden der Aktionen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get-board-cards",
  {
    title: "Board-Karten abrufen",
    description: "Lädt alle Karten eines Boards (optional mit Filter).",
    inputSchema: {
      id: z.string().min(1, "Board-ID ist erforderlich"),
      filter: z.string().optional(),
    }
  },
  async (params) => {
    console.error(`[get-board-cards] Input:`, params);
    try {
      const cards = await trelloClient.getBoardCards(params);
      console.error(`[get-board-cards] Result:`, cards);
      return {
        content: [{ type: "text", text: JSON.stringify(cards, null, 2) }]
      };
    } catch (error) {
      console.error(`[get-board-cards] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Laden der Karten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get-board-lists",
  {
    title: "Board-Listen abrufen",
    description: "Lädt alle Listen eines Boards (optional mit Filter).",
    inputSchema: {
      id: z.string().min(1, "Board-ID ist erforderlich"),
      filter: z.string().optional(),
    }
  },
  async (params) => {
    console.error(`[get-board-lists] Input:`, params);
    try {
      const lists = await trelloClient.getBoardLists(params);
      console.error(`[get-board-lists] Result:`, lists);
      return {
        content: [{ type: "text", text: JSON.stringify(lists, null, 2) }]
      };
    } catch (error) {
      console.error(`[get-board-lists] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Laden der Listen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get-board-members",
  {
    title: "Board-Mitglieder abrufen",
    description: "Lädt alle Mitglieder eines Boards.",
    inputSchema: {
      id: z.string().min(1, "Board-ID ist erforderlich"),
    }
  },
  async (params) => {
    console.error(`[get-board-members] Input:`, params);
    try {
      const members = await trelloClient.getBoardMembers(params.id);
      console.error(`[get-board-members] Result:`, members);
      return {
        content: [{ type: "text", text: JSON.stringify(members, null, 2) }]
      };
    } catch (error) {
      console.error(`[get-board-members] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Laden der Mitglieder: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get-board-checklists",
  {
    title: "Board-Checklisten abrufen",
    description: "Lädt alle Checklisten eines Boards.",
    inputSchema: {
      id: z.string().min(1, "Board-ID ist erforderlich"),
    }
  },
  async (params) => {
    console.error(`[get-board-checklists] Input:`, params);
    try {
      const checklists = await trelloClient.getBoardChecklists(params.id);
      console.error(`[get-board-checklists] Result:`, checklists);
      return {
        content: [{ type: "text", text: JSON.stringify(checklists, null, 2) }]
      };
    } catch (error) {
      console.error(`[get-board-checklists] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Laden der Checklisten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get-board-labels",
  {
    title: "Board-Labels abrufen",
    description: "Lädt alle Labels eines Boards.",
    inputSchema: {
      id: z.string().min(1, "Board-ID ist erforderlich"),
    }
  },
  async (params) => {
    console.error(`[get-board-labels] Input:`, params);
    try {
      const labels = await trelloClient.getBoardLabels(params.id);
      console.error(`[get-board-labels] Result:`, labels);
      return {
        content: [{ type: "text", text: JSON.stringify(labels, null, 2) }]
      };
    } catch (error) {
      console.error(`[get-board-labels] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Laden der Labels: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

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
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      console.error(`[add-member-to-board] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Hinzufügen des Mitglieds: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
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
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      console.error(`[update-board-member] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Aktualisieren des Mitglieds: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
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
        content: [{ type: "text", text: `Mitglied entfernt.` }]
      };
    } catch (error) {
      console.error(`[remove-board-member] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Entfernen des Mitglieds: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

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
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      console.error(`[generate-board-calendar-key] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Generieren des Kalender-Keys: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
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
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      console.error(`[generate-board-email-key] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Generieren des E-Mail-Keys: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
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
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      console.error(`[mark-board-as-viewed] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Markieren als angesehen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
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
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      console.error(`[update-board-my-prefs] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Aktualisieren der MyPrefs: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get-board",
  {
    title: "Board abrufen (einfach)",
    description: "Lädt ein Board nur anhand der ID (ohne Zusatzparameter).",
    inputSchema: {
      id: z.string().min(1, "Board-ID ist erforderlich"),
    }
  },
  async (params) => {
    console.error(`[get-board] Input:`, params);
    try {
      const board = await trelloClient.getBoard(params.id);
      console.error(`[get-board] Result:`, board);
      return {
        content: [{ type: "text", text: JSON.stringify(board, null, 2) }]
      };
    } catch (error) {
      console.error(`[get-board] Error:`, error);
      return {
        content: [{ type: "text", text: `Fehler beim Laden des Boards: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }],
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