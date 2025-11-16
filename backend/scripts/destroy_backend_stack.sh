#!/bin/bash
set -e

echo "Removing backend stack..."
docker stack rm backend-prd

echo "Removing backend secrets..."
docker secret rm key >/dev/null 2>&1 || true
docker secret rm postgres_password >/dev/null 2>&1 || true
