#!/bin/bash

echo "Checking what's using port 80..."
sudo lsof -i :80

echo "Checking what's using port 443..."
sudo lsof -i :443

echo "Checking all running Docker containers..."
docker ps

echo "Checking Docker container port mappings..."
docker ps -a | grep -E '80|443'
