#!/bin/bash
set -e

./scripts/destroy_app_stack.sh

cd network

./network.sh down

docker network rm fabric_test
