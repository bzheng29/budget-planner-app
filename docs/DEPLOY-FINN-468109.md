# Deploy Budget Planner to finn-468109

## Quick Deploy (One Command!)

```bash
./deploy-now.sh
```

That's it! Your app will be live in about 2-3 minutes.

## Prerequisites Check

Make sure you have:
1. ✅ Docker Desktop running
2. ✅ gcloud CLI installed
3. ✅ Logged into gcloud: `gcloud auth login`

## Manual Steps (if needed)

### 1. First Time Setup
```bash
# Set project
gcloud config set project finn-468109

# Enable APIs (only needed once)
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Configure Docker
gcloud auth configure-docker
```

### 2. Deploy
```bash
# Build
docker build --build-arg GEMINI_API_KEY="AIzaSyCZ16kAe0oOUGfiPaZe8C6fjXAdyWbtQk8" -t gcr.io/finn-468109/budget-planner-finn:latest .

# Push
docker push gcr.io/finn-468109/budget-planner-finn:latest

# Deploy
gcloud run deploy budget-planner-finn \
    --image gcr.io/finn-468109/budget-planner-finn:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080
```

## Your App URLs

Once deployed, your app will be available at:
- **Primary**: `https://budget-planner-finn-[hash]-uc.a.run.app`
- **Custom Domain**: You can add your own domain later

## Monitor Your App

```bash
# View logs
gcloud run services logs read budget-planner-finn --region us-central1

# Check status
gcloud run services describe budget-planner-finn --region us-central1

# See metrics in console
open https://console.cloud.google.com/run/detail/us-central1/budget-planner-finn/metrics?project=finn-468109
```

## Update the App

After making changes:
```bash
./deploy-now.sh
```

## Costs for finn-468109

Estimated monthly costs:
- **Cloud Run**: $0 (free tier: 2M requests/month)
- **Container Registry**: ~$0.02
- **Bandwidth**: $0 (free tier: 1GB/month)
- **Total**: Under $1/month for light usage

## Troubleshooting

### "Permission denied" error
```bash
gcloud auth login
gcloud config set project finn-468109
```

### "APIs not enabled" error
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
```

### Docker not authorized
```bash
gcloud auth configure-docker
```

## Next Steps

1. 🌐 Add a custom domain
2. 📊 Set up monitoring alerts
3. 🔒 Consider adding authentication
4. 🚀 Set up CI/CD with GitHub

## Support

- Cloud Run Dashboard: https://console.cloud.google.com/run?project=finn-468109
- Logs: https://console.cloud.google.com/logs?project=finn-468109