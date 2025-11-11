#!/bin/sh
export PATH=${PWD}/bin:$PATH
export FABRIC_CFG_PATH=$PWD/config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/\
organizations/peerOrganizations/org3.example.com/\
peers/peer0.org3.example.com/tls/ca.crt

export CORE_PEER_TLS_ROOTCERT_FILE_ORG1=$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

export CORE_PEER_TLS_ROOTCERT_FILE_ORG2=$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

export CORE_PEER_TLS_ROOTCERT_FILE_ORG3=$PWD/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/org3.example.com/

export CORE_PEER_MSPCONFIGPATH=${PWD}/\
organizations/peerOrganizations/org3.example.com/\
users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:6051
export ORDERER_ADDRESS=localhost:7050
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt
