#!/bin/bash

# Quick deployment script for Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID}"
SERVICE_NAME="budget-planner-finn"
REGION="${GCP_REGION:-us-central1}"
GEMINI_API_KEY="${GEMINI_API_KEY}"

# Check required environment variables
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: GCP_PROJECT_ID environment variable is not set${NC}"
    echo "Please run: export GCP_PROJECT_ID=your-project-id"
    exit 1
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}Error: GEMINI_API_KEY environment variable is not set${NC}"
    echo "Please run: export GEMINI_API_KEY=your-api-key"
    exit 1
fi

echo -e "${GREEN}Starting deployment to Google Cloud Run...${NC}"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Set the project
echo -e "${YELLOW}Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Build the container
echo -e "${YELLOW}Building Docker image...${NC}"
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME:$(date +%Y%m%d-%H%M%S)"
docker build --build-arg GEMINI_API_KEY="$GEMINI_API_KEY" -t $IMAGE_TAG .

# Push to Container Registry
echo -e "${YELLOW}Pushing image to Container Registry...${NC}"
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

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo -e "${GREEN}Deployment successful!${NC}"
echo -e "Your app is now live at: ${GREEN}$SERVICE_URL${NC}"
echo ""
echo "To update the deployment, simply run this script again."
echo "To delete the service, run: gcloud run services delete $SERVICE_NAME --region $REGION"