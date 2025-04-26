#!/bin/bash

# Revised setup script for Band Sheets multi-domain configuration
echo "Setting up Band Sheets with multiple domains..."

# Create required directories
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Check if ports 80 and 443 are in use
echo "Checking if ports 80 and 443 are already in use..."
PORT_80_PID=$(lsof -ti:80)
PORT_443_PID=$(lsof -ti:443)

if [ ! -z "$PORT_80_PID" ] || [ ! -z "$PORT_443_PID" ]; then
  echo "WARNING: Ports 80 and/or 443 are already in use."
  echo "This might be because you already have a web server running."
  echo ""
  echo "Options:"
  echo "1. If you already have Nginx running with SSL certificates, you can skip certificate acquisition."
  echo "2. If you need to obtain new certificates, you'll need to temporarily stop your web server."
  echo ""
  read -p "Do you want to continue without certificate acquisition? (y/n): " SKIP_CERTS
  
  if [[ "$SKIP_CERTS" == "y" ]]; then
    echo "Skipping certificate acquisition..."
  else
    echo "Please stop your web server and run this script again."
    exit 1
  fi
else
  SKIP_CERTS="n"
fi

# Create Docker network if it doesn't exist
echo "Creating Docker network..."
docker network create band-sheets-network-prod || true

if [[ "$SKIP_CERTS" == "n" ]]; then
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
fi

# Step 3: Update the Docker Compose file to use the correct API URL
echo "Updating Docker Compose configuration..."
sed -i 's|REACT_APP_API_URL=https://band-sheets.com/api|REACT_APP_API_URL=http://localhost:5050/api|g' docker-compose.prod.yml

# Step 4: Start the application stack
echo "Starting the Band Sheets application stack..."
docker-compose -f docker-compose.prod.yml up -d

echo "Setup complete! Your Band Sheets application is now running."
echo ""
echo "IMPORTANT: Since ports 80 and 443 are already in use on your server,"
echo "you need to configure your existing web server (likely Nginx) to proxy"
echo "requests to the Band Sheets containers:"
echo ""
echo "1. Frontend: localhost:80"
echo "2. Backend API: localhost:5050"
echo ""
echo "Your domains should now be configured to point to your existing web server:"
echo "- band-sheets.com"
echo "- muzjik.com"
echo "- bandut.com"
echo "- f-minor.com"
echo "- b-major.com"
echo "- g-minor.com"
echo "- lead-sheets.com"
echo "- putuni.com"
echo "- riddam.com"
