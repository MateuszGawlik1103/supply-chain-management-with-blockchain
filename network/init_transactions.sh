#!/bin/bash
set -e

# === Validate input argument ===
if [ -z "$1" ]; then
    echo "Usage: $0 <order_number>"
    exit 1
fi

NUMBER="$1"
ORDER_ID="ORDER${NUMBER}"
BATCH_ID="O${NUMBER}_Batch1"

echo "=== Initializing transactions for ${ORDER_ID} and ${BATCH_ID} ==="

# === Define the invoke function ===
invoke() {
    peer chaincode invoke -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls "$CORE_PEER_TLS_ENABLED" --cafile "$ORDERER_CA" \
        -C mychannel -n coffee \
        --peerAddresses localhost:7051 --tlsRootCertFiles "$CORE_PEER_TLS_ROOTCERT_FILE_ORG1" \
        --peerAddresses localhost:9051 --tlsRootCertFiles "$CORE_PEER_TLS_ROOTCERT_FILE_ORG2" \
        --peerAddresses localhost:6051 --tlsRootCertFiles "$CORE_PEER_TLS_ROOTCERT_FILE_ORG3" "$@"
}

# === ORG1: Place order and create batch ===
source ./lifecycle_org1_setup.sh

invoke -c "{
    \"Args\": [
        \"placeOrder\",
        \"${ORDER_ID}\",
        \"Arabica\",
        \"100\",
        \"ORG3\",
        \"2025-11-10\"
    ]
}"

sleep 2

invoke -c "{
    \"Args\": [
        \"createBatch\",
        \"${BATCH_ID}\",
        \"${ORDER_ID}\",
        \"100\",
        \"ORG1\"
    ]
}"
sleep 2

# === ORG2: Ship batch and update temperature/humidity ===
source ./lifecycle_org2_setup.sh

invoke -c "{
    \"Args\": [
        \"shipBatch\",
        \"${BATCH_ID}\",
        \"ORG2\"
    ]
}"

sleep 2

invoke -c "{
    \"Args\": [
        \"updateTemperatureAndHumidity\",
        \"${BATCH_ID}\",
        \"30\",
        \"10\"
    ]
}"

sleep 2

# === ORG3: Deliver batch ===
source ./lifecycle_org3_setup.sh

invoke -c "{
    \"Args\": [
        \"deliverBatch\",
        \"${BATCH_ID}\",
        \"ORG3\"
    ]
}"

sleep 2

# === Queries and history ===
echo "=== Querying order ==="
invoke -c "{
    \"Args\": [
        \"queryOrder\",
        \"${ORDER_ID}\"
    ]
}" 2>&1 | grep -oP '(?<=payload:").*(?=")' | sed 's/\\"/"/g' | jq '.'


echo "=== Querying batch ==="
invoke -c "{
    \"Args\": [
        \"queryBatch\",
        \"${BATCH_ID}\"
    ]
}" 2>&1 | grep -oP '(?<=payload:").*(?=")' | sed 's/\\"/"/g' | jq '.'

echo "=== Fetching batch history ==="
invoke -c "{
    \"Args\": [
        \"getBatchHistory\",
        \"${BATCH_ID}\"
    ]
}" 2>&1 | grep -oP '(?<=payload:").*(?=")' | sed 's/\\"/"/g' | jq '.'

echo "=== Fetching order history ==="
invoke -c "{
    \"Args\": [
        \"getOrderHistory\",
        \"${ORDER_ID}\"
    ]
}" 2>&1 | grep -oP '(?<=payload:").*(?=")' | sed 's/\\"/"/g' | jq '.'

echo "=== All transactions completed successfully ==="
