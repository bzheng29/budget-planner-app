#!/bin/bash

# Deployment script for Google Cloud Shell
# This script builds and deploys the app directly from Cloud Shell

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_ID="finn-468109"
SERVICE_NAME="budget-planner-finn"
REGION="us-central1"
GEMINI_API_KEY="AIzaSyCZ16kAe0oOUGfiPaZe8C6fjXAdyWbtQk8"

echo -e "${GREEN}🚀 Deploying Budget Planner with Finn from Cloud Shell${NC}"
echo "Project: $PROJECT_ID"
echo ""

# Check if we're in Cloud Shell
if [ "$CLOUD_SHELL" != "true" ]; then
    echo -e "${RED}⚠️  This script is designed to run in Google Cloud Shell${NC}"
    echo "Please open Cloud Shell at: https://console.cloud.google.com/cloudshell"
    exit 1
fi

# Set the project
echo -e "${YELLOW}Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

# Submit build using Cloud Build
echo -e "${YELLOW}Building with Cloud Build...${NC}"
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_SERVICE_NAME=$SERVICE_NAME,_REGION=$REGION,_GEMINI_API_KEY=$GEMINI_API_KEY

# Get the service URL
echo -e "${YELLOW}Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}🌐 Your app is live at: $SERVICE_URL${NC}"
echo ""
echo "Share this URL with anyone to use your Budget Planner!"
echo ""
echo -e "${YELLOW}📝 Note: The app uses CNY (¥) currency and includes financial guidance for beginners!${NC}"