#!/bin/bash
set -e

./backend/scripts/destroy_backend_stack.sh

cd network

./network.sh down
