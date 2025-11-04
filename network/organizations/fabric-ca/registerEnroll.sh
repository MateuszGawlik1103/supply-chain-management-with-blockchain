#!/usr/bin/env bash

function createOrg() {
  local ORG_NAME=$1           # e.g. org1
  local ORG_DOMAIN=$2         # e.g. example.com
  local CA_PORT=$3            # e.g. 7054
  local CA_NAME=$4            # e.g. ca-org1
  local CA_ADMIN_USER="admin"
  local CA_ADMIN_PASS="adminpw"

  infoln "Enrolling the CA admin for ${ORG_NAME}"

  local ORG_PATH="${PWD}/organizations/peerOrganizations/${ORG_NAME}.${ORG_DOMAIN}"
  mkdir -p "${ORG_PATH}"

  export FABRIC_CA_CLIENT_HOME=${ORG_PATH}

  set -x
  fabric-ca-client enroll \
    -u https://${CA_ADMIN_USER}:${CA_ADMIN_PASS}@localhost:${CA_PORT} \
    --caname ${CA_NAME} \
    --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG_NAME}/ca-cert.pem"
  { set +x; } 2>/dev/null

  cat > "${ORG_PATH}/msp/config.yaml" <<EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-${CA_PORT}-${CA_NAME}.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-${CA_PORT}-${CA_NAME}.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-${CA_PORT}-${CA_NAME}.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-${CA_PORT}-${CA_NAME}.pem
    OrganizationalUnitIdentifier: orderer
EOF

  mkdir -p "${ORG_PATH}/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/${ORG_NAME}/ca-cert.pem" "${ORG_PATH}/msp/tlscacerts/ca.crt"

  mkdir -p "${ORG_PATH}/tlsca"
  cp "${PWD}/organizations/fabric-ca/${ORG_NAME}/ca-cert.pem" "${ORG_PATH}/tlsca/tlsca.${ORG_NAME}.${ORG_DOMAIN}-cert.pem"

  mkdir -p "${ORG_PATH}/ca"
  cp "${PWD}/organizations/fabric-ca/${ORG_NAME}/ca-cert.pem" "${ORG_PATH}/ca/ca.${ORG_NAME}.${ORG_DOMAIN}-cert.pem"

  infoln "Registering identities for ${ORG_NAME}"
  for ID in "peer0:peer0pw:peer" "user1:user1pw:client" "${ORG_NAME}admin:${ORG_NAME}adminpw:admin"; do
    IFS=":" read -r NAME PASS TYPE <<< "$ID"
    set -x
    fabric-ca-client register \
      --caname ${CA_NAME} \
      --id.name ${NAME} \
      --id.secret ${PASS} \
      --id.type ${TYPE} \
      --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG_NAME}/ca-cert.pem"
    { set +x; } 2>/dev/null
  done

  infoln "Generating peer0 MSP for ${ORG_NAME}"
  local PEER_PATH="${ORG_PATH}/peers/peer0.${ORG_NAME}.${ORG_DOMAIN}"
  fabric-ca-client enroll \
    -u https://peer0:peer0pw@localhost:${CA_PORT} \
    --caname ${CA_NAME} \
    -M "${PEER_PATH}/msp" \
    --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG_NAME}/ca-cert.pem"
  cp "${ORG_PATH}/msp/config.yaml" "${PEER_PATH}/msp/config.yaml"

  infoln "Generating peer0 TLS certs"
  fabric-ca-client enroll \
    -u https://peer0:peer0pw@localhost:${CA_PORT} \
    --caname ${CA_NAME} \
    -M "${PEER_PATH}/tls" \
    --enrollment.profile tls \
    --csr.hosts peer0.${ORG_NAME}.${ORG_DOMAIN} \
    --csr.hosts localhost \
    --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG_NAME}/ca-cert.pem"

  cp "${PEER_PATH}/tls/tlscacerts/"* "${PEER_PATH}/tls/ca.crt"
  cp "${PEER_PATH}/tls/signcerts/"* "${PEER_PATH}/tls/server.crt"
  cp "${PEER_PATH}/tls/keystore/"* "${PEER_PATH}/tls/server.key"

  for USER in "user1:user1pw:User1@${ORG_NAME}.${ORG_DOMAIN}" "${ORG_NAME}admin:${ORG_NAME}adminpw:Admin@${ORG_NAME}.${ORG_DOMAIN}"; do
    IFS=":" read -r NAME PASS MSP_DIR <<< "$USER"
    infoln "Generating MSP for ${MSP_DIR}"
    fabric-ca-client enroll \
      -u https://${NAME}:${PASS}@localhost:${CA_PORT} \
      --caname ${CA_NAME} \
      -M "${ORG_PATH}/users/${MSP_DIR}/msp" \
      --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG_NAME}/ca-cert.pem"
    cp "${ORG_PATH}/msp/config.yaml" "${ORG_PATH}/users/${MSP_DIR}/msp/config.yaml"
  done
}


function createOrderer() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/ordererOrganizations/example.com

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/example.com

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml"

  # Copy org's root certs
  mkdir -p "${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem" "${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

  mkdir -p "${PWD}/organizations/ordererOrganizations/example.com/tlsca"
  cp "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem" "${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem"

  mkdir -p "${PWD}/organizations/ordererOrganizations/example.com/ca"
  cp "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem" "${PWD}/organizations/ordererOrganizations/example.com/ca/ca.example.com-cert.pem"

  # REGISTER orderer
  infoln "Registering orderer"
  set -x
  fabric-ca-client register \
    --caname ca-orderer \
    --id.name orderer \
    --id.secret ordererpw \
    --id.type orderer \
    --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  # REGISTER orderer admin
  infoln "Registering the orderer admin"
  set -x
  fabric-ca-client register \
    --caname ca-orderer \
    --id.name ordererAdmin \
    --id.secret ordererAdminpw \
    --id.type admin \
    --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  # ENROLL orderer MSP
  infoln "Generating the orderer MSP"
  set -x
  fabric-ca-client enroll \
    -u https://orderer:ordererpw@localhost:9054 \
    --caname ca-orderer \
    -M "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp" \
    --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml" \
     "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/config.yaml"

  # ENROLL orderer TLS
  infoln "Generating the orderer TLS certificates"
  set -x
  fabric-ca-client enroll \
    -u https://orderer:ordererpw@localhost:9054 \
    --caname ca-orderer \
    -M "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls" \
    --enrollment.profile tls \
    --csr.hosts orderer.example.com \
    --csr.hosts localhost \
    --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/"* \
     "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt"
  cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/signcerts/"* \
     "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt"
  cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/keystore/"* \
     "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key"

  # ENROLL orderer admin MSP
  infoln "Generating the admin MSP"
  set -x
  fabric-ca-client enroll \
    -u https://ordererAdmin:ordererAdminpw@localhost:9054 \
    --caname ca-orderer \
    -M "${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp" \
    --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml" \
     "${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/config.yaml"
}
