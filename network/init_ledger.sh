#!/bin/bash
set -e  # Stop on any error

echo "=== Setting invoke alias ==="
invoke() {
  peer chaincode invoke -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
    -C mychannel -n coffee \
    --peerAddresses localhost:7051 --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE_ORG1 \
    --peerAddresses localhost:9051 --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE_ORG2 \
    --peerAddresses localhost:6051 --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE_ORG3 \
    -c "$1"
}

##############################################
echo "=== STEP 1: ORG3 places coffee order ==="
##############################################

source ./lifecycle_org3_setup.sh Admin

invoke '{
  "Args": [
    "placeOrder",
    "ORDER1",
    "Arabica",
    "Arabica from select crops, known for its delicate acidity and clean, sweet finish. These beans are of consistent quality, ideal for specialty coffees.",
    "100",
    "ORG3",
    "2025-11-10"
  ]
}'

sleep 2
###################################################
echo "=== STEP 2: ORG1 creates batch for ORDER1 ==="
###################################################

source ./lifecycle_org1_setup.sh Admin

invoke '{
  "Args": [
    "createBatch",
    "O1_Batch1",
    "Brazil",
    "ORDER1",
    "100",
    "ORG1"
  ]
}'

sleep 2

################################################
echo "=== STEP 3: ORG2 ships the batch O1_Batch1 ==="
################################################

source ./lifecycle_org2_setup.sh Admin

invoke '{
  "Args": [
    "shipBatch",
    "O1_Batch1",
    "ORG2",
    "Container ship"
  ]
}'

sleep 2

echo "=== Updating temperature & humidity ==="

invoke '{
  "Args": [
    "updateTemperatureAndHumidity",
    "O1_Batch1",
    "16",
    "55"
  ]
}'

sleep 2

invoke '{
  "Args": [
    "updateTemperatureAndHumidity",
    "O1_Batch1",
    "11",
    "60"
  ]
}'

sleep 2
###################################################
echo "=== STEP 4: ORG3 delivers batch to warehouse ==="
###################################################

source ./lifecycle_org3_setup.sh Admin

invoke '{
  "Args": [
    "deliverBatch",
    "O1_Batch1",
    "ORG3",
    "Warsaw-Warehouse-12A",
    "OK – good quality, no defects",
    "1kg vacuum bag",
    "medium",
    "Arabica Supremo"
  ]
}'

echo "=== ALL STEPS COMPLETED — ARABICA FLOW SUCCESSFUL ==="

sleep 2
# ROBUSTA

#########################################################
echo "=== STEP 1: ORG3 places Robusta coffee order ==="
#########################################################

source ./lifecycle_org3_setup.sh Admin

invoke '{
  "Args": [
    "placeOrder",
    "ORDER2",
    "Robusta",
    "High-quality Robusta beans known for their strong, bold flavor with a slightly nutty aftertaste. Excellent for espresso blends due to higher caffeine content and thicker crema.",
    "250",
    "ORG3",
    "2025-12-01"
  ]
}'
sleep 2
#############################################################
echo "=== STEP 2: ORG1 creates batch for Robusta ORDER2 ==="
#############################################################

source ./lifecycle_org1_setup.sh Admin

invoke '{
  "Args": [
    "createBatch",
    "O2_Batch1",
    "Vietnam",
    "ORDER2",
    "250",
    "ORG1"
  ]
}'
sleep 2
#########################################################
echo "=== STEP 3: ORG2 ships the batch O2_Batch1 ==="
#########################################################

source ./lifecycle_org2_setup.sh Admin

invoke '{
  "Args": [
    "shipBatch",
    "O2_Batch1",
    "ORG2",
    "Refrigerated cargo truck"
  ]
}'
sleep 2
echo "=== Updating transport temperature & humidity ==="

invoke '{
  "Args": [
    "updateTemperatureAndHumidity",
    "O2_Batch1",
    "22",
    "57"
  ]
}'

sleep 2

invoke '{
  "Args": [
    "updateTemperatureAndHumidity",
    "O2_Batch1",
    "23",
    "60"
  ]
}'

sleep 2
#############################################################
echo "=== STEP 4: ORG3 delivers Robusta batch to warehouse ==="
#############################################################

source ./lifecycle_org3_setup.sh Admin

invoke '{
  "Args": [
    "deliverBatch",
    "O2_Batch1",
    "ORG3",
    "Gdansk-Port-Storage-7B",
    "Quality verified – beans intact, moisture level normal",
    "500g sealed bag",
    "dark",
    "Robusta Premium"
  ]
}'

echo "=== ALL STEPS COMPLETED — ROBUSTA FLOW SUCCESSFUL ==="
