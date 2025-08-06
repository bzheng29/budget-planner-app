#!/bin/bash

# One-click deployment script for finn-468109

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROJECT_ID="finn-468109"
SERVICE_NAME="budget-planner-finn"
REGION="us-central1"
GEMINI_API_KEY="${VITE_GEMINI_API_KEY:-}" # Set via environment variable

echo -e "${GREEN}🚀 Deploying Budget Planner with Finn to GCP${NC}"
echo "Project: $PROJECT_ID"
echo ""

# Set the project
echo -e "${YELLOW}Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Configure Docker for GCR
echo -e "${YELLOW}Configuring Docker...${NC}"
gcloud auth configure-docker

# Build the container
echo -e "${YELLOW}Building Docker image...${NC}"
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"
docker build --build-arg GEMINI_API_KEY="$GEMINI_API_KEY" -t $IMAGE_TAG .

# Push to Container Registry
echo -e "${YELLOW}Pushing to Container Registry...${NC}"
docker push $IMAGE_TAG

# Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_TAG \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 100 \
    --min-instances 0

# Get the URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}🌐 Your app is live at: $SERVICE_URL${NC}"
echo ""
echo "Share this URL with anyone to use your Budget Planner!"