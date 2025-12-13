#!/bin/bash
set -e

USER="$1"

docker secret rm key >/dev/null 2>&1 || true

docker secret rm postgres_password >/dev/null 2>&1 || true

docker secret create key "${PWD}/backend/secrets/${USER}-key.pem"

docker secret create postgres_password "${PWD}/backend/secrets/db_pass.txt"
