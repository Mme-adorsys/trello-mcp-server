import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers all MCP prompts for the Trello server
 */
export function registerTrelloPrompts(server: McpServer) {
    server.registerPrompt(
        "setup-project",
        {
            title: "Setup the project guidelines",
            description: "Load the resource coding-guidelines and add them to the Claude.md",
        },
        () => ({
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: `ToDo: Load the resource 'coding-guidelines' and add them to the Claude.md.`
                }
            }]
        })
    );

    server.registerPrompt(
        "implementTask",
        {
            title: "Implement the Task",
            description: "Take the next task from the list next-actions and implement it",
        },
        () => ({
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: `
                    Pre-Implementation: 
            1. from trello get-next-actions-card with boardFilterName=DATEV and move it to the list 'In Progress'
            2. for this card get-next-actions-prompt
            3. analyse the prompt, make a todo list with a plan to implement the task according to prompt
             
            Implementation:
            5. implement the tasks from the prompt
                - follow strict the requirements and rules in the prompt
                - ensure documentation and testing tasks have been done
                - ensure the acceptance criterias are matched with test cases
            
            Post-Implementation: 
            5. when finished with the implementation compile the project and ensure it is compiling
            6. When finished update the memory in the Claude.md file. This step is mandatory! 
            7. After compiling and testing make a commit with a detailed commit message
            8. Move the trello card to done
            `
                }
            }]
        })
    );

    server.registerPrompt(
        "plan-milestone",
        {
            title: "Plan the next milestone",
            description: "Take the next milestone and plan the tasks for it.",
        },
        () => ({
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: `
                        Now please plan and create the tasks for the next milestone: 
                        - Remember to follow the gtd-board-guide.md
                        - Plan the tasks and think about what kind of task it is
                        - Follow the prompt guidelines described in the claude_code_prompt_guidelines.md for the custom prompts for each card.
                        - Add the necessary labels to each card
                        - Create the trello cards with labels, prompts in the custom field Prompt `
                }
            }]
        })
    );

    server.registerPrompt(
        "board-analysis",
        {
            title: "Board Analyse",
            description: "Analysiert ein Trello Board und gibt Einblicke",
            argsSchema: {
                boardId: z.string().min(1, "Board ID ist erforderlich")
            }
        },
        ({boardId}) => ({
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
        ({boardId, sprintGoal}) => ({
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
}