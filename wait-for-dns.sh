#!/bin/bash

# Script to check DNS propagation for Band Sheets domains
echo "Checking DNS propagation for Band Sheets domains..."

DOMAINS=(
  "band-sheets.com"
  "www.band-sheets.com"
  "muzjik.com"
  "www.muzjik.com"
  "bandut.com"
  "www.bandut.com"
  "f-minor.com"
  "www.f-minor.com"
  "b-major.com"
  "www.b-major.com"
  "g-minor.com"
  "www.g-minor.com"
  "lead-sheets.com"
  "www.lead-sheets.com"
  "putuni.com"
  "www.putuni.com"
  "riddam.com"
  "www.riddam.com"
)

SERVER_IP="35.157.195.167"
PROPAGATED=0
NOT_PROPAGATED=0

for domain in "${DOMAINS[@]}"; do
  echo -n "Checking $domain... "
  
  # Use dig to get the IP address for the domain
  RESOLVED_IP=$(dig +short $domain)
  
  if [ "$RESOLVED_IP" == "$SERVER_IP" ]; then
    echo "PROPAGATED ✓"
    PROPAGATED=$((PROPAGATED+1))
  else
    echo "NOT PROPAGATED ✗ (resolved to: $RESOLVED_IP)"
    NOT_PROPAGATED=$((NOT_PROPAGATED+1))
  fi
done

echo ""
echo "Summary:"
echo "- $PROPAGATED domains have propagated correctly"
echo "- $NOT_PROPAGATED domains have not propagated yet"
echo ""

if [ $NOT_PROPAGATED -gt 0 ]; then
  echo "Some domains have not propagated yet. DNS propagation can take 24-48 hours."
  echo "Run this script again later to check the status."
  echo ""
  echo "Once all domains have propagated, you can run the SSL setup script:"
  echo "  ./setup-ssl-after-dns.sh"
else
  echo "All domains have propagated correctly! You can now run the SSL setup script:"
  echo "  ./setup-ssl-after-dns.sh"
fi
