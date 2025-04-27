#!/bin/bash

# Script to make all existing sheets public by default
echo "Making all existing sheets public by default..."

# Create scripts directory in the container if it doesn't exist
echo "Creating scripts directory in the container..."
docker exec band-sheets-backend-prod mkdir -p /app/scripts

# Copy the migration script to the backend container
echo "Copying migration script to the backend container..."
docker cp ./band-sheets-backend/scripts/make-sheets-public.js band-sheets-backend-prod:/app/scripts/

# Run the migration script inside the container
echo "Running migration script..."
docker exec band-sheets-backend-prod node /app/scripts/make-sheets-public.js

echo "Migration complete!"
echo "All sheets should now be publicly readable by default."
echo "New sheets will also be created as public by default."
echo ""
echo "Note: In the future, you can implement a feature for paying users to make sheets private."
