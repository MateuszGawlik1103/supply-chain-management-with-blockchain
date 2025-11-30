#!/bin/bash
set -e

ROOT_DIR="${PWD}"

APP_USER="appUser1"

# Copy all appUser1 artifacts like private key and cert and TLS cert.
"${ROOT_DIR}/backend/scripts/copy_artifacts.sh" $APP_USER

# Add private key as docker secret.
"${ROOT_DIR}/backend/scripts/add_docker_secret.sh" $APP_USER

docker build -t backend-prd -f "${ROOT_DIR}/backend/docker/prd.Dockerfile" ./backend
docker build -t frontend-prd -f "${ROOT_DIR}/frontend/docker/prd.Dockerfile" ./frontend
docker stack deploy -c "${ROOT_DIR}/docker-compose.yml" supply-chain-prd
