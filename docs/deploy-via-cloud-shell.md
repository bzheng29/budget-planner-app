# Deploy via Google Cloud Shell (No Local Setup Required!)

This method uses Google's Cloud Shell, which has everything pre-installed.

## Step 1: Prepare Your Code

First, let me create a zip file of your project:

```bash
cd /Users/davidwang/budget-planner-app
zip -r budget-planner-finn.zip . -x "node_modules/*" ".git/*" "*.log" ".env"
```

## Step 2: Open Cloud Shell

1. Go to: https://console.cloud.google.com/cloudshell/editor?project=finn-468109
2. Wait for Cloud Shell to start (it's a free Linux VM in your browser)

## Step 3: Upload Your Project

1. In Cloud Shell, click the three dots menu (⋮) in the top right
2. Click "Upload file"
3. Upload the `budget-planner-finn.zip` file

## Step 4: Deploy Commands

Copy and paste these commands into Cloud Shell:

```bash
# Unzip your project
unzip budget-planner-finn.zip -d budget-planner-app
cd budget-planner-app

# Set project (should already be set)
gcloud config set project finn-468109

# Enable APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Build and deploy using Cloud Build
gcloud builds submit --config=cloudbuild.yaml

# Or use the direct deployment script
chmod +x deploy-now.sh
./deploy-now.sh
```

## Step 5: Get Your URL

After deployment completes, you'll see:
```
Service URL: https://budget-planner-finn-xxxxx-uc.a.run.app
```

That's your live app!

## Alternative: Use Cloud Build Directly

You can also trigger a build directly from Cloud Console:

1. Go to: https://console.cloud.google.com/cloud-build/triggers?project=finn-468109
2. Click "Create Trigger"
3. Source: Upload your code as a zip
4. Configuration: Use cloudbuild.yaml
5. Click "Run Trigger"

## Why This Works

- Cloud Shell has gcloud, docker, and everything pre-installed
- It's free and runs in your browser
- No local setup required
- Direct access to your GCP project