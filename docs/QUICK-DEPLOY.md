# Quick Deployment Guide

## Option 1: Deploy from Your Local Machine

Since you're on your local Mac, try:

```bash
cd /Users/davidwang/budget-planner-app
./deploy-now.sh
```

If you get "gcloud: command not found", you'll need to either install gcloud or use Option 2.

## Option 2: Deploy from Google Cloud Shell

1. **First, create a zip file of your project:**
```bash
cd /Users/davidwang/budget-planner-app
zip -r budget-planner-deploy.zip . -x "node_modules/*" -x ".git/*" -x "dist/*"
```

2. **Open Google Cloud Shell:**
   - Go to https://console.cloud.google.com
   - Click the Cloud Shell icon (>_) in the top right

3. **Upload your project:**
   - In Cloud Shell, click the three dots menu (⋮)
   - Select "Upload file"
   - Upload the `budget-planner-deploy.zip` file

4. **Extract and deploy:**
```bash
# In Cloud Shell:
unzip budget-planner-deploy.zip -d budget-planner-app
cd budget-planner-app
chmod +x deploy-from-cloud-shell.sh
./deploy-from-cloud-shell.sh
```

## Option 3: Direct Cloud Build Submit

If you have gcloud installed locally but the script isn't working:

```bash
cd /Users/davidwang/budget-planner-app

# Set project
gcloud config set project finn-468109

# Enable APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

# Submit build
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=budget-planner-finn,_REGION=us-central1,_GEMINI_API_KEY=${VITE_GEMINI_API_KEY}
```

After deployment completes, you'll get a URL where your app is live!