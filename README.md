# Trello MCP Server

Ein Model Context Protocol (MCP) Server für die Integration mit Trello. Ermöglicht es AI-Anwendungen, Trello Boards, Listen und Karten zu verwalten.

## Features

### Tools (Model-controlled)
- **Board Management**: Erstellen, aktualisieren und schließen von Boards
- **Listen Management**: Erstellen und verwalten von Listen
- **Karten Management**: Erstellen, aktualisieren, verschieben und löschen von Karten
- **Member Management**: Board-Mitglieder verwalten

### Resources (Application-controlled)
- **Boards**: Liste aller verfügbaren Trello Boards
- **Board Details**: Detaillierte Informationen zu einem spezifischen Board
- **Board Cards**: Alle Karten eines Boards

### Prompts (User-controlled)
- **Board Analyse**: Analysiert ein Board und gibt Einblicke
- **Sprint Planung**: Hilft bei der Sprint-Planung

## Installation

1. **Projekt klonen/herunterladen:**
```bash
git clone <repository-url>
cd trello-mcp-server
```

2. **Dependencies installieren:**
```bash
npm install
```

3. **Trello API Credentials einrichten:**
   - Gehen Sie zu https://trello.com/app-key
   - Kopieren Sie Ihren API Key
   - Generieren Sie einen Token
   - Erstellen Sie eine `.env` Datei:

```bash
cp .env.example .env
# Bearbeiten Sie .env mit Ihren Credentials
```

4. **Server bauen:**
```bash
npm run build
```

## Nutzung

### Standalone
```bash
npm start
```

### Mit Claude Desktop

Fügen Sie dies zu Ihrer `claude_desktop_config.json` hinzu:

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/absolute/path/to/trello-mcp-server/build/index.js"],
      "env": {
        "TRELLO_API_KEY": "your_api_key",
        "TRELLO_TOKEN": "your_token"
      }
    }
  }
}
```

## Beispiele

### Board erstellen
```
Erstelle ein neues Trello Board mit dem Namen "Mein Projekt" und der Beschreibung "Projektmanagement Board"
```

### Karte erstellen
```
Erstelle eine neue Karte "Neue Feature implementieren" in der Liste mit ID "list123" mit der Beschreibung "Details zur Implementierung"
```

### Board analysieren
```
Analysiere mein Board mit der ID "board456" und gib mir eine Übersicht über den aktuellen Status
```

## Entwicklung

```bash
# Development mode mit auto-reload
npm run watch

# In einem anderen Terminal
npm start
```

## API Referenz

Siehe die [Trello API Documentation](https://developer.atlassian.com/cloud/trello/rest/api-group-actions/) für Details zu den verfügbaren Aktionen.


## Entwicklung

```bash
# Development mode mit auto-reload
npm run watch

# In einem anderen Terminal
npm start
```

## API Referenz

Siehe die [Trello API Documentation](https://developer.atlassian.com/cloud/trello/rest/api-group-actions/) für Details zu den verfügbaren Aktionen.

MIT```

## Build-Skripte und Installation

Installieren Sie die Dependencies:

```bash
npm install
```

Erstellen Sie eine `.env` Datei basierend auf dem `.env.example`:

```bash
cp .env.example .env
# Bearbeiten Sie die .env Datei mit Ihren Trello API Credentials
```

Bauen Sie das Projekt:

```bash
npm run build
```

## Trello API Setup

1. Gehen Sie zu https://trello.com/app-key
2. Kopieren Sie Ihren API Key
3. Klicken Sie auf "Token" um einen Token zu generieren
4. Fügen Sie beide Werte in Ihre `.env` Datei ein

## Testen des Servers

Sie können den Server testen mit:

```bash
npm start
```

Oder für die Integration mit Claude Desktop, fügen Sie die Konfiguration zu Ihrer `claude_desktop_config.json` hinzu.

Dieser Trello MCP Server bietet:

- **Vollständige Trello Integration** mit allen wichtigen Funktionen
- **Typsichere API** mit Zod Validierung
- **Umfassende Fehlerbehandlung**
- **Modulare Struktur** für einfache Erweiterung
- **Deutsche Lokalisierung** für bessere UX
- **Praktische Prompts** für häufige Trello-Workflows

Der Server ist ready-to-use und kann sofort mit Trello-Accounts verwendet werden!
