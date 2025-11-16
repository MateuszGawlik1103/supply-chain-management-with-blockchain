#!/bin/bash
set -e

USER="$1"

docker secret rm key >/dev/null 2>&1 || true

docker secret create key "${PWD}/secrets/${USER}-key.pem"

docker secret create postgres_password "${PWD}/secrets/db_pass.txt"
