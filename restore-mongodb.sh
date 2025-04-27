#!/bin/bash

# MongoDB Restore Script for Band Sheets
# Restores a MongoDB backup from a specified backup file

# Check if backup file is provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_filename>"
    echo "Example: $0 backups/mongodb_backup_20250427_123456.gz"
    exit 1
fi

BACKUP_FILE=$1
CONTAINER_NAME="band-sheets-mongodb-prod"
DB_NAME="bandsheets"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file '$BACKUP_FILE' not found!"
    exit 1
fi

echo "Starting MongoDB restore from $BACKUP_FILE at $(date)"
echo "WARNING: This will overwrite the current database!"
echo "Press Ctrl+C within 10 seconds to cancel..."
sleep 10

# Restore the backup
echo "Restoring backup to $DB_NAME database in $CONTAINER_NAME container..."
gunzip -c "$BACKUP_FILE" | docker exec -i $CONTAINER_NAME mongorestore --drop --archive --db=$DB_NAME

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo "Restore completed successfully at $(date)"
else
    echo "Restore failed!"
    exit 1
fi
