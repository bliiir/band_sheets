#!/bin/bash

# Script to rebuild and restart just the frontend container
echo "Rebuilding and restarting the frontend container..."

# Stop the frontend container
echo "Stopping the frontend container..."
docker stop band-sheets-frontend-prod
docker rm band-sheets-frontend-prod

# Rebuild the frontend image
echo "Rebuilding the frontend image..."
docker-compose -f docker-compose.prod.yml build frontend

# Start the frontend container
echo "Starting the frontend container..."
docker-compose -f docker-compose.prod.yml up -d frontend

echo "Frontend rebuild complete! The updated application should now be accessible."
