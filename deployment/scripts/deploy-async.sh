#!/bin/bash

# Async deployment - starts the build and gives you the URL to monitor

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ID="finn-468109"

echo -e "${GREEN}🚀 Starting deployment to Google Cloud Run${NC}"
echo ""

# Set the project
gcloud config set project $PROJECT_ID

# Submit build in async mode
echo -e "${YELLOW}Submitting build to Cloud Build...${NC}"
BUILD_ID=$(gcloud builds submit --config cloudbuild.yaml --async --format="value(name)" | cut -d'/' -f6)

echo ""
echo -e "${GREEN}✅ Build submitted successfully!${NC}"
echo -e "${BLUE}Build ID: $BUILD_ID${NC}"
echo ""
echo -e "${YELLOW}📊 Monitor your build progress at:${NC}"
echo "https://console.cloud.google.com/cloud-build/builds/$BUILD_ID?project=$PROJECT_ID"
echo ""
echo -e "${YELLOW}⏱️  The build typically takes 5-10 minutes to complete.${NC}"
echo ""
echo "Once complete, your app will be available at:"
echo -e "${GREEN}https://budget-planner-finn-[hash]-uc.a.run.app${NC}"
echo ""
echo "You can also check the status with:"
echo -e "${BLUE}gcloud builds describe $BUILD_ID${NC}"