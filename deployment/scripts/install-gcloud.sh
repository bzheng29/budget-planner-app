#!/bin/bash

# Install Google Cloud SDK on macOS

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Installing Google Cloud SDK...${NC}"

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}Installing Homebrew first...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Google Cloud SDK via Homebrew
echo -e "${YELLOW}Installing gcloud via Homebrew...${NC}"
brew install --cask google-cloud-sdk

# Initialize gcloud
echo -e "${YELLOW}Initializing gcloud...${NC}"
gcloud init

echo -e "${GREEN}✅ Google Cloud SDK installed successfully!${NC}"
echo ""
echo "Now you can run: ./deploy-now.sh"