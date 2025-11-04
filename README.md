# To launch a network

```
wsl
```

```
./network.sh up createChannel -c mychannel -ca -s couchdb
```

To execute all of the following steps in one command:
```
./network.sh deployCC -ccn coffee -ccp ../chaincode-coffee -ccl typescript
```
To change version:
```
./network.sh deployCC -ccn coffee -ccp ../chaincode-coffee -ccl typescript -ccv 2.0
```

To check if joined:
```
docker exec peer0.org1.example.com peer channel list
```


# Chaincode lifecycle

## Step 1: packaging
```
source ./lifecycle_setup_org1.sh 
```
```
peer lifecycle chaincode package Carshowroom.tar.gz --path ../chaincode/Carshowroom/lib/build/install/lib --lang java --label Carshowroom_1
```

## Step 2: installation (on every node)
After installation, EACH organization will go through the chaincode to evaluate how the chaincode has been written and what it does and then they will have to APPROVE it (next step)
```
source ./lifecycle_org1_setup.sh
```

```
peer lifecycle chaincode install Carshowroom.tar.gz --peerAddresses $CORE_PEER_ADDRESS --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE
```

To check if installed:
```
peer lifecycle chaincode queryinstalled --peerAddresses $CORE_PEER_ADDRESS --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE
```

To install chaincode locally from peers (can check then if hashes are the same):

```
peer lifecycle chaincode getinstalledpackage --package-id <package_id> \
--output-directory . --peerAddresses $CORE_PEER_ADDRESS --tlsRootCertFiles \
$CORE_PEER_TLS_ROOTCERT_FILE
```

## Step 3: Approve chaincode (on every node)

```
peer lifecycle chaincode approveformyorg -o $ORDERER_ADDRESS \
--ordererTLSHostnameOverride orderer.example.com \
--tls --cafile $ORDERER_CA -C samplechannel --name Carshowroom \
--version 1.0 --init-required \
--package-id Carshowroom_1:22711a022b3dcf03ea998cf98c36681c297115ee9cb788ef4801a12c53086af0 \
--sequence 1
```

## Step 4: Commit chaincode (on every node)

To check readiness for commit:
```
peer lifecycle chaincode checkcommitreadiness -C samplechannel \
--name Carshowroom --version 1.0 --sequence 1 --output json --init-required
```

```
source ./lifecycle_setup_Channel_commit.sh
```

Commit:
```
peer lifecycle chaincode commit -o localhost:7050 \
--ordererTLSHostnameOverride orderer.example.com --tls $CORE_PEER_TLS_ENABLED \
--cafile $ORDERER_CA -C samplechannel --name Carshowroom --peerAddresses localhost:7051 \
--tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE_ORG1 --peerAddresses localhost:9051 \
--tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE_ORG2 --version 1.0 --sequence 1 --init-required
```

To query commited chaincode:
```
source ./lifecycle_org1_setup.sh
```
```
peer lifecycle chaincode querycommitted -C mychannel --name basic
```

# Execute chaincode function

```
source ./lifecycle_org1_setup.sh
```

Alias:
```
alias invoke="peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
--tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C mychannel -n coffee \
--peerAddresses localhost:7051 --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE_ORG1 \
--peerAddresses localhost:9051 --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE_ORG2 \
--peerAddresses localhost:6051 --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE_ORG3"
```

Add coffee order:
```
invoke -c '{
    "Args": [
        "placeOrder",
        "ORDER1",
        "Arabica",
        "100",
        "ORG1",
        "2025-11-10"
    ]
}'
```

Query order:
```
invoke -c '{
    "Args": [
        "queryOrder",
        "ORDER1"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "prepareProductForDelivery",
        "ORDER1",
        "Batch1"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "queryBatch",
        "Batch1"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "shipBatch",
        "Batch1"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "updateTemperatureAndHumidity",
        "Batch1",
        "30",
        "10"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "deliverBatch",
        "ORDER1",
        "Batch1"
    ]
}'
```
