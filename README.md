# To launch a network

```
wsl
```

```
docker network create -d overlay --attachable fabric_test
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
        "ORDER2",
        "Arabica",
        "Arabica from select crops, known for its delicate acidity and clean, sweet finish. These beans are of consistent quality, ideal for specialty coffees.",
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
        "O2_Batch1",
        "Brazil",
        "ORDER2",
        "100",
        "ORG1"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "shipBatch",
        "O2_Batch1",
        "ORG2",
        "Container ship"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "updateTemperatureAndHumidity",
        "O2_Batch1",
        "34",
        "15"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "deliverBatch",
        "O2_Batch1",
        "ORG3",
        "Warsaw-Warehouse-12A",
        "OK – good quality, no defects",
        "1kg vacuum bag",
        "medium"
    ]
}'
```


Query order:
```
invoke -c '{
    "Args": [
        "queryOrder",
        "ORDER2"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "queryBatch",
        "O2_Batch1"
    ]
}'
```

```
invoke -c '{
    "Args": [
        "getBatchHistory",
        "O2_Batch1"
    ]
}' 2>&1 | grep -oP '(?<=payload:").*(?=")' | sed 's/\\"/"/g' | jq '.'
```

```
invoke -c '{
    "Args": [
        "getOrderHistory",
        "ORDER2"
    ]
}' 2>&1 | grep -oP '(?<=payload:").*(?=")' | sed 's/\\"/"/g' | jq '.'
```

# Backend

## Prod

Create following file in `backend/secrets/` folder:
- key - private key

Add secret:
```
docker secret create key secrets/appUser1-key.pem
```

Create following files in `backend/certs/` folder:
- ca - TLS certificate
- cert - public certificate

```
docker build -t backend-prd -f docker/prd.Dockerfile .
```

```
docker stack deploy -c docker/docker-compose.yml backend-prd
```

```
docker stack rm backend-prd
```

## Dev

```
docker build -t backend-dev -f docker/dev.Dockerfile .
```

```
docker run --rm -it \
  --name backend-dev \
  --network fabric_test \
  -v $(pwd)/secrets/:/run/secrets/ \
  -v $(pwd)/certs/:/run/certs/ \
  -v $(pwd)/.eslintrc.js:/usr/src/app/.eslintrc.js \
  -v $(pwd)/package.json:/usr/src/app/package.json \
  -v $(pwd)/.env:/usr/src/app/.env \
  -v $(pwd)/package-lock.json:/usr/src/app/package-lock.json \
  -v $(pwd)/src/:/usr/src/app/src/ \
  -p 3000:3000 \
  backend-dev \
  /bin/sh
```


# Enroll read-only user
```
fabric-ca-client enroll \
  -u https://admin:adminpw@localhost:7054 \
  --caname ca-org1 \
  --tls.certfiles $CORE_PEER_TLS_ROOTCERT_FILE_ORG1
```

```
fabric-ca-client register \
  --caname ca-org1 \
  --id.name readUser2 \
  --id.secret readUser2pw \
  --id.type client \
  --id.attrs "hf.AffiliationMgr=false,hf.Revoker=false,hf.IntermediateCA=false,hf.GenCRL=false" \
  -u https://admin:adminpw@localhost:7054 \
  --tls.certfiles $CORE_PEER_TLS_ROOTCERT_FILE_ORG1
```

```
fabric-ca-client enroll -u https://readUser2:readUser2pw@localhost:7054 --caname ca-org1 \
  -u https://admin:adminpw@localhost:7054 \
  --tls.certfiles $CORE_PEER_TLS_ROOTCERT_FILE_ORG1
```

```
fabric-ca-client identity list \
  -u https://admin:adminpw@localhost:7054 \
  --tls.certfiles $CORE_PEER_TLS_ROOTCERT_FILE_ORG1
```


```
curl -s http://localhost:3000/order/ORDER2/history | jq .
curl http://localhost:3000/batch/O2_Batch1/history | jq .
```


echo "coffee_pass" | docker secret create postgres_password -


```
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"janek","password":"tajnehaslo123"}'
```

```
curl -X POST http://10.0.1.139:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"janek","password":"tajnehaslo123"}'
```

# Database
```
psql -h localhost -U coffee_user -d coffee_db
```

```
curl http://localhost:3000/batch/O2_Batch1/history \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc2MzI4MzU5OCwiZXhwIjoxNzYzMjg3MTk4fQ.I5iIWWhwbFKPDrxf0L1b3Eb4faEw1MonuWxEN3y52CU"
```

# Frontend

## DEV

```
docker build -t "frontend-dev" -f "frontend/docker/dev.Dockerfile" .
```

```
docker run --rm --name "frontend-dev" -p 3000:3000 -p 4000:4000 -p 5000:5000 \
     --network fabric_test \
     -v "$(pwd)/frontend/src:/app/src" \
     -v "$(pwd)/frontend/config:/app/config" \
     -v "$(pwd)/frontend/package.json:/app/package.json" \
     -v "$(pwd)/frontend/package-lock.json:/app/package-lock.json" \
     -v "$(pwd)/frontend/tsconfig.json:/app/tsconfig.json" \
     -v "$(pwd)/frontend/tsconfig.app.json:/app/tsconfig.app.json" \
     -v "$(pwd)/frontend/tsconfig.node.json:/app/tsconfig.node.json" \
     -v "$(pwd)/frontend/tsconfig.test.json:/app/tsconfig.test.json" \
     -v "$(pwd)/frontend/assets:/app/assets" \
     -it "frontend-dev" /bin/sh
```


## PRD

```
docker build -t "frontend-prd" -f "frontend/docker/prd.Dockerfile" .
```
