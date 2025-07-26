#!/bin/bash

# Trello MCP Server Wrapper für Claude Desktop
# This script loads .env variables and starts the MCP server

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the script directory
cd "$SCRIPT_DIR"

# Load environment variables from .env file
if [[ -f ".env" ]]; then
    set -a  # Automatically export all variables
    source .env
    set +a  # Stop automatically exporting
fi

# Set default values if not set
export TRELLO_TIMEOUT=${TRELLO_TIMEOUT:-30000}
export TRELLO_RETRIES=${TRELLO_RETRIES:-3}
export TRELLO_VERBOSE_LOGGING=${TRELLO_VERBOSE_LOGGING:-false}

# Start the MCP server
exec node build/index.js