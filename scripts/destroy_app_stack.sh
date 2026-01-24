#!/bin/bash
set -e

STACK="supply-chain-prd"
VOLUME="supply-chain-prd_postgres_data"

echo "Removing stack: $STACK"
docker stack rm "$STACK"

echo "Waiting for stack to fully shut down..."
while docker stack ls | grep -q "$STACK"; do
    echo "Stack still shutting down..."
    sleep 1
done
echo "Stack removed."

echo "Removing secrets..."
docker secret rm key >/dev/null 2>&1 || true
docker secret rm postgres_password >/dev/null 2>&1 || true

echo "Waiting for services to disappear..."
while docker container ls | grep -q "${STACK}_"; do
    echo "Services still stopping..."
    sleep 1
done
echo "All services removed."

echo "Removing volume..."
docker volume rm "$VOLUME" || echo "Volume not found or already removed."

echo "Done."
