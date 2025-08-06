# Deploying Budget Planner with Finn to Google Cloud Platform

This guide walks you through deploying the Budget Planner app to GCP using Cloud Run.

## Prerequisites

1. Google Cloud account with billing enabled
2. `gcloud` CLI installed and configured
3. Docker installed locally (for testing)

## Setup Steps

### 1. Create a GCP Project

```bash
# Create new project
gcloud projects create budget-planner-finn --name="Budget Planner with Finn"

# Set as current project
gcloud config set project budget-planner-finn

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Store API Key Securely

```bash
# Create secret for Gemini API key
echo -n "${VITE_GEMINI_API_KEY}" | gcloud secrets create gemini-api-key --data-file=-

# Grant Cloud Build access to the secret
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:YOUR_PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy with Cloud Build

#### Option A: Using Cloud Build Triggers (Recommended)

1. Connect your GitHub repository:
```bash
gcloud builds connections create github budget-planner-repo --region=us-central1
```

2. Create a trigger:
```bash
gcloud builds triggers create github \
  --repo-name=budget-planner-app \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions=_GEMINI_API_KEY="$(gcloud secrets versions access latest --secret=gemini-api-key)"
```

#### Option B: Manual Deployment

```bash
# Submit build with substitution
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_GEMINI_API_KEY="$(gcloud secrets versions access latest --secret=gemini-api-key)"
```

### 4. Configure Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service=budget-planner-finn \
  --domain=budget.yourdomain.com \
  --region=us-central1
```

## Local Testing

Test the Docker build locally:

```bash
# Build with your API key
docker build --build-arg GEMINI_API_KEY="your-key-here" -t budget-planner .

# Run locally
docker run -p 8080:8080 budget-planner

# Visit http://localhost:8080
```

## Environment Variables

The app uses these environment variables:
- `VITE_GEMINI_API_KEY`: Your Gemini API key (required)
- `VITE_GEMINI_MODEL`: Model name (defaults to gemini-2.5-pro)

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   Cloud Build   │────▶│  Container   │────▶│  Cloud Run  │
│                 │     │   Registry   │     │             │
└─────────────────┘     └──────────────┘     └─────────────┘
                                                     │
                                                     ▼
                                              ┌─────────────┐
                                              │   Users     │
                                              └─────────────┘
```

## Monitoring

View logs:
```bash
gcloud run services logs read budget-planner-finn --region=us-central1
```

View metrics in Cloud Console:
- Go to Cloud Run > budget-planner-finn > Metrics

## Cost Optimization

1. **Cloud Run**: Pay only for requests (scale to zero)
2. **Caching**: Static assets cached for 1 year
3. **CDN**: Consider Cloud CDN for global distribution

## Security Best Practices

1. ✅ API key stored in Secret Manager
2. ✅ HTTPS enforced by Cloud Run
3. ✅ Security headers in nginx config
4. ✅ No secrets in container image

## Troubleshooting

### Build fails
```bash
# Check Cloud Build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

### Service not accessible
```bash
# Check service status
gcloud run services describe budget-planner-finn --region=us-central1
```

### Update API key
```bash
# Update secret
echo -n "new-api-key" | gcloud secrets versions add gemini-api-key --data-file=-

# Redeploy
gcloud builds submit --config=cloudbuild.yaml
```