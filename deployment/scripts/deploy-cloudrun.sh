#!/bin/bash

# Direct deployment using Cloud Build (no local Docker required)

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

echo -e "${GREEN}🚀 Deploying Budget Planner to Google Cloud Run${NC}"
echo "This will use Cloud Build - no local Docker required!"
echo ""

# Set the project
echo -e "${YELLOW}Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Check if we're authenticated
echo -e "${YELLOW}Checking authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}Not authenticated. Running gcloud auth login...${NC}"
    gcloud auth login
fi

# Submit build using Cloud Build
echo -e "${YELLOW}Building and deploying with Cloud Build...${NC}"
echo "This will build your Docker image in the cloud and deploy it directly."
echo ""

gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_SERVICE_NAME=$SERVICE_NAME,_REGION=$REGION,_GEMINI_API_KEY=AIzaSyCZ16kAe0oOUGfiPaZe8C6fjXAdyWbtQk8

# Get the service URL
echo -e "${YELLOW}Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}🌐 Your app is live at: $SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}📝 Features:${NC}"
echo "  • Currency in CNY (¥)"
echo "  • Financial benchmarks for beginners"
echo "  • AI-powered budget recommendations"
echo ""
echo "Share this URL with anyone who needs help creating a budget!"