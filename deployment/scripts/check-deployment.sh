#!/bin/bash

# Check deployment status

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_ID="finn-468109"
SERVICE_NAME="budget-planner-finn"
REGION="us-central1"

echo -e "${YELLOW}Checking deployment status...${NC}"
echo ""

# Check latest build
echo "Latest build status:"
gcloud builds list --limit=1 --format="table(id,status,createTime.date())"
echo ""

# Check Cloud Run service
echo "Checking Cloud Run service..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)' 2>/dev/null)

if [ -n "$SERVICE_URL" ]; then
    echo -e "${GREEN}✅ Service is deployed!${NC}"
    echo -e "${GREEN}🌐 Your app is live at: $SERVICE_URL${NC}"
    echo ""
    echo "Testing the URL..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL)
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ App is responding successfully!${NC}"
    else
        echo -e "${RED}❌ App returned HTTP status: $HTTP_STATUS${NC}"
    fi
else
    echo -e "${YELLOW}⏳ Service not found yet. The deployment might still be in progress.${NC}"
    echo ""
    echo "Check the Cloud Build logs at:"
    echo "https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"
fi