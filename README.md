# To launch a network

```
wsl
```

```
cd network
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
        "ORG3",
        "2025-11-10"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "createBatch",
        "O1_Batch1",
        "ORDER1",
        "100",
        "ORG1"
    ]
}'
```


```
invoke -c '{
    "Args": [
        "shipBatch",
        "O1_Batch1",
        "ORG2"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "updateTemperatureAndHumidity",
        "O1_Batch1",
        "30",
        "10"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "deliverBatch",
        "O1_Batch1",
        "ORG3"
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
        "queryBatch",
        "O1_Batch1"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "getBatchHistory",
        "O1_Batch1"
    ]
}' 2>&1 | grep -oP '(?<=payload:").*(?=")' | sed 's/\\"/"/g' | jq '.'
```

```
invoke -c '{
    "Args": [
        "getOrderHistory",
        "ORDER1"
    ]
}' 2>&1 | grep -oP '(?<=payload:").*(?=")' | sed 's/\\"/"/g' | jq '.'
```

# Backend

## Prod
```
docker secret create key secrets/key.pem
docker secret create cert secrets/cert.pem
docker secret create ca secrets/ca.crt
```

```
docker build -t backend-prd -f prd.Dockerfile .
```

```
docker stack deploy -c docker-compose.yml backend-prd
```

```
docker stack rm backend-prd
```

## Dev

```
docker build -t backend-dev -f dev.Dockerfile .
```

```
docker run --rm -it \
  --name backend-dev \
  --network fabric_test \
  -v $(pwd)/secrets/:/run/secrets/ \
  -v $(pwd)/.eslintrc.js:/usr/src/app/.eslintrc.js \
  -v $(pwd)/package.json:/usr/src/app/package.json \
  -v $(pwd)/package-lock.json:/usr/src/app/package-lock.json \
  -v $(pwd)/src/:/usr/src/app/src/ \
  -p 3000:3000 \
  backend-dev \
  /bin/sh
```
