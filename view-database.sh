#!/bin/bash

# Script to view MongoDB database contents in the Docker container

echo "Connecting to MongoDB container..."
echo "You'll be connected to the MongoDB shell."
echo ""
echo "Useful commands:"
echo "- show dbs                     # List all databases"
echo "- use bandsheets               # Switch to the bandsheets database"
echo "- show collections             # List all collections in the current database"
echo "- db.users.find()              # Show all users"
echo "- db.users.find().pretty()     # Show all users in a formatted way"
echo "- db.sheets.find().pretty()    # Show all sheets in a formatted way"
echo "- exit                         # Exit the MongoDB shell"
echo ""

# Connect to the MongoDB container and start the MongoDB shell
docker exec -it band-sheets-mongodb mongosh
