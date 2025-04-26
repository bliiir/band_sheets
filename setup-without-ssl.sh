#!/bin/bash

# Setup script for Band Sheets without SSL (for initial deployment)
echo "Setting up Band Sheets without SSL certificates..."

# Stop any existing containers
echo "Stopping any existing containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.nginx.yml down

# Find and kill any process using ports 80 and 443
echo "Checking for processes using ports 80 and 443..."
sudo lsof -ti:80 | xargs -r sudo kill -9
sudo lsof -ti:443 | xargs -r sudo kill -9

# Create Docker network if it doesn't exist
echo "Creating Docker network..."
docker network create band-sheets-network-prod || true

# Modify docker-compose.prod.yml to expose the backend directly
echo "Updating Docker Compose configuration..."
sed -i 's/REACT_APP_API_URL=http:\/\/backend:5000\/api/REACT_APP_API_URL=http:\/\/44.211.77.173:5050\/api/g' docker-compose.prod.yml

# Start just the application stack without Nginx
echo "Starting the Band Sheets application stack..."
docker-compose -f docker-compose.prod.yml up -d

echo "Setup complete! Your Band Sheets application is now running."
echo ""
echo "Your application is accessible at:"
echo "- Frontend: http://44.211.77.173"
echo "- API: http://44.211.77.173:5050"
echo ""
echo "IMPORTANT: Once your DNS records have fully propagated (can take 24-48 hours),"
echo "you can run the SSL setup script to configure HTTPS."
echo ""
echo "To check DNS propagation, run: nslookup band-sheets.com"
echo "It should return your server IP: 44.211.77.173"
