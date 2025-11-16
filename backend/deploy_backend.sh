#!/bin/bash
set -e

APP_USER="appUser1"

# Copy all appUser1 artifacts like private key and cert and TLS cert.
./scripts/copy_artifacts.sh $APP_USER

# Add private key as docker secret.
./scripts/add_docker_secret.sh $APP_USER

docker build -t backend-prd -f docker/prd.Dockerfile .
docker stack deploy -c docker/docker-compose.yml backend-prd
