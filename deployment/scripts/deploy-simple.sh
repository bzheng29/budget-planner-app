#!/bin/bash

# Simple deployment using the existing cloudbuild.yaml

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_ID="finn-468109"
GEMINI_API_KEY="AIzaSyCZ16kAe0oOUGfiPaZe8C6fjXAdyWbtQk8"

echo -e "${GREEN}🚀 Deploying Budget Planner to Google Cloud Run${NC}"
echo "Project: $PROJECT_ID"
echo ""

# Set the project
echo -e "${YELLOW}Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Submit build using Cloud Build with just the API key substitution
echo -e "${YELLOW}Building and deploying with Cloud Build...${NC}"
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_GEMINI_API_KEY=$GEMINI_API_KEY

# Get the service URL
echo -e "${YELLOW}Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe budget-planner-finn --region us-central1 --format 'value(status.url)' 2>/dev/null || echo "Service not found yet")

if [ "$SERVICE_URL" != "Service not found yet" ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment Complete!${NC}"
    echo -e "${GREEN}🌐 Your app is live at: $SERVICE_URL${NC}"
else
    echo ""
    echo -e "${YELLOW}⏳ Deployment is in progress. Check the Cloud Console for status.${NC}"
    echo "Visit: https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"
fi

echo ""
echo -e "${YELLOW}📝 Features deployed:${NC}"
echo "  • Currency in CNY (¥)"
echo "  • Financial benchmarks for beginners" 
echo "  • AI-powered budget recommendations"
echo ""