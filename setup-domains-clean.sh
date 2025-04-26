#!/bin/bash

# Clean setup script for Band Sheets multi-domain configuration
echo "Setting up Band Sheets with multiple domains..."

# Stop any existing containers
echo "Stopping any existing containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.nginx.yml down
docker ps -q | xargs -r docker stop
docker ps -aq | xargs -r docker rm

# Create required directories
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Create Docker network if it doesn't exist
echo "Creating Docker network..."
docker network create band-sheets-network-prod || true

# Step 1: Start nginx container temporarily for certificate acquisition
echo "Starting temporary Nginx container for SSL certificate acquisition..."
docker-compose -f docker-compose.nginx.yml up -d nginx

# Step 2: Get SSL certificates for all domains
echo "Obtaining SSL certificates for all domains..."
docker run --rm -it \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  --network band-sheets-network-prod \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d band-sheets.com -d www.band-sheets.com \
  -d muzjik.com -d www.muzjik.com \
  -d bandut.com -d www.bandut.com \
  -d f-minor.com -d www.f-minor.com \
  -d b-major.com -d www.b-major.com \
  -d g-minor.com -d www.g-minor.com \
  -d lead-sheets.com -d www.lead-sheets.com \
  -d putuni.com -d www.putuni.com \
  -d riddam.com -d www.riddam.com

# Stop the temporary Nginx container
echo "Stopping temporary Nginx container..."
docker-compose -f docker-compose.nginx.yml down

# Step 3: Start the complete stack
echo "Starting the complete Band Sheets application stack..."
docker-compose -f docker-compose.prod.yml -f docker-compose.nginx.yml up -d

echo "Setup complete! Your Band Sheets application is now accessible at:"
echo "- https://band-sheets.com"
echo "- https://muzjik.com"
echo "- https://bandut.com"
echo "- https://f-minor.com"
echo "- https://b-major.com"
echo "- https://g-minor.com"
echo "- https://lead-sheets.com"
echo "- https://putuni.com"
echo "- https://riddam.com"
