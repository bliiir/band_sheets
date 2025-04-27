#!/bin/bash

# MongoDB Backup Script for Band Sheets
# Creates a backup of the MongoDB database and optionally uploads it to AWS S3

# Configuration
BACKUP_DIR="/home/ec2-user/band_sheets/backups"
CONTAINER_NAME="band-sheets-mongodb-prod"
DB_NAME="bandsheets"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="mongodb_backup_${TIMESTAMP}.gz"
RETENTION_DAYS=7  # How many days to keep local backups

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting MongoDB backup at $(date)"

# Create the backup using mongodump inside the container and compress it
echo "Creating backup of $DB_NAME database from $CONTAINER_NAME container..."
docker exec $CONTAINER_NAME sh -c "mongodump --db=$DB_NAME --archive" | gzip > "$BACKUP_DIR/$BACKUP_FILENAME"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_DIR/$BACKUP_FILENAME"
    echo "Backup size: $(du -h $BACKUP_DIR/$BACKUP_FILENAME | cut -f1)"
    
    # Optional: Upload to AWS S3
    # Uncomment and configure these lines to enable S3 uploads
    # S3_BUCKET="your-s3-bucket-name"
    # echo "Uploading backup to S3..."
    # aws s3 cp "$BACKUP_DIR/$BACKUP_FILENAME" "s3://$S3_BUCKET/mongodb-backups/"
    
    # Clean up old backups (keep only the last RETENTION_DAYS days)
    echo "Cleaning up backups older than $RETENTION_DAYS days..."
    find $BACKUP_DIR -name "mongodb_backup_*.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    echo "Backup process completed at $(date)"
else
    echo "Backup failed!"
    exit 1
fi
