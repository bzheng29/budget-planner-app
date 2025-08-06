#!/bin/bash
# This script builds the app with environment variables for production

# Check if GEMINI_API_KEY is provided
if [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: GEMINI_API_KEY environment variable is not set"
  exit 1
fi

# Create .env.production file with the API key
echo "VITE_GEMINI_API_KEY=$GEMINI_API_KEY" > .env.production
echo "VITE_GEMINI_MODEL=gemini-2.5-pro" >> .env.production

# Build the application
npm run build

# Remove the .env.production file for security
rm .env.production