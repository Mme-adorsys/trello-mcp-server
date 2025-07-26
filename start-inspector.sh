#!/bin/bash

# Trello MCP Server with Inspector Startup Script
# This script loads environment variables from .env and starts the MCP inspector

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Trello MCP Server with Inspector...${NC}"

# Check if .env file exists
if [[ ! -f ".env" ]]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file with your Trello credentials.${NC}"
    echo -e "${YELLOW}You can copy .env.example to .env and fill in your values.${NC}"
    exit 1
fi

# Load environment variables from .env file
echo -e "${BLUE}📄 Loading environment variables from .env...${NC}"
set -a  # Automatically export all variables
source .env
set +a  # Stop automatically exporting

# Verify required environment variables
if [[ -z "$TRELLO_API_KEY" ]]; then
    echo -e "${RED}❌ Error: TRELLO_API_KEY not set in .env file${NC}"
    exit 1
fi

if [[ -z "$TRELLO_TOKEN" ]]; then
    echo -e "${RED}❌ Error: TRELLO_TOKEN not set in .env file${NC}"
    exit 1
fi

# Set default values for optional variables
export TRELLO_TIMEOUT=${TRELLO_TIMEOUT:-30000}
export TRELLO_RETRIES=${TRELLO_RETRIES:-3}
export TRELLO_VERBOSE_LOGGING=${TRELLO_VERBOSE_LOGGING:-false}

echo -e "${GREEN}✅ Environment variables loaded:${NC}"
echo -e "   TRELLO_API_KEY: ${TRELLO_API_KEY:0:10}...${TRELLO_API_KEY: -4}"
echo -e "   TRELLO_TOKEN: ${TRELLO_TOKEN:0:10}...${TRELLO_TOKEN: -4}"
echo -e "   TRELLO_TIMEOUT: $TRELLO_TIMEOUT ms"
echo -e "   TRELLO_RETRIES: $TRELLO_RETRIES"
echo -e "   TRELLO_VERBOSE_LOGGING: $TRELLO_VERBOSE_LOGGING"

# Build the project if needed
if [[ ! -f "build/index.js" ]] || [[ "src/index.ts" -nt "build/index.js" ]]; then
    echo -e "${YELLOW}🔨 Building project...${NC}"
    npm run build
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Build failed!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Build completed${NC}"
fi

# Check if inspector is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx not found. Please install Node.js${NC}"
    exit 1
fi

# Start the MCP inspector
echo -e "${GREEN}🔍 Starting MCP Inspector...${NC}"
echo -e "${BLUE}Inspector will be available at: http://localhost:5173${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Start the inspector with the built server
npx @modelcontextprotocol/inspector node build/index.js