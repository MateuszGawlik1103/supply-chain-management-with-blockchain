#!/bin/bash
set -e

ROOT_DIR="${PWD}"
echo "$ROOT_DIR"

docker network create -d overlay --attachable fabric_test >/dev/null 2>&1 || true

cd ${ROOT_DIR}/network

./network.sh up createChannel -c mychannel -ca -s couchdb
./network.sh deployCC -ccn coffee -ccp ../chaincode-coffee -ccl typescript

cd ${ROOT_DIR}/backend

./deploy_backend.sh
