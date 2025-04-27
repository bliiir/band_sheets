#!/bin/bash

# Setup script for MongoDB backup cron job
echo "Setting up automated MongoDB backups..."

# Make backup scripts executable
chmod +x backup-mongodb.sh
chmod +x restore-mongodb.sh

# Create backups directory
mkdir -p backups

# Create a temporary crontab file
TEMP_CRONTAB=$(mktemp)

# Add the backup job to run daily at 3:00 AM
echo "# MongoDB backup for Band Sheets - runs daily at 3:00 AM" > $TEMP_CRONTAB
echo "0 3 * * * cd /home/ec2-user/band_sheets && ./backup-mongodb.sh >> backups/backup.log 2>&1" >> $TEMP_CRONTAB

# Display the new cron job
echo "Adding the following cron job:"
cat $TEMP_CRONTAB

# Install the new cron job
echo "Installing cron job..."
crontab $TEMP_CRONTAB

# Clean up
rm $TEMP_CRONTAB

echo "Cron job installed successfully!"
echo "Backups will run daily at 3:00 AM and be stored in the 'backups' directory."
echo "You can check the backup log at 'backups/backup.log'"
echo ""
echo "To manually run a backup, use: ./backup-mongodb.sh"
echo "To restore from a backup, use: ./restore-mongodb.sh <backup_file>"
