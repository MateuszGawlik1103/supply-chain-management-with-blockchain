#!/bin/bash
set -e

# ================================
# Configuration
# ================================
APP_USER="$1"
ORG_NAME="org1"
ORG_DOMAIN="example.com"
NETWORK_DIR="${PWD}/../network"   # relative path from backend/scripts/
BACKEND_CERTS_DIR="${PWD}/certs"
BACKEND_SECRETS_DIR="${PWD}/secrets"

# ================================
# Paths to Fabric MSP files
# ================================
USER_MSP_DIR="${NETWORK_DIR}/organizations/peerOrganizations/${ORG_NAME}.${ORG_DOMAIN}/users/${APP_USER}@${ORG_NAME}.${ORG_DOMAIN}/msp"
SIGNCERT="${USER_MSP_DIR}/signcerts/cert.pem"
KEYSTORE_DIR="${USER_MSP_DIR}/keystore"
TLS_CERT="${NETWORK_DIR}/organizations/peerOrganizations/${ORG_NAME}.${ORG_DOMAIN}/peers/peer0.${ORG_NAME}.${ORG_DOMAIN}/tls/ca.crt"

# ================================
# Validate files
# ================================
echo "Checking Fabric identity for ${APP_USER}..."

if [ ! -f "${SIGNCERT}" ]; then
  echo "ERROR: Certificate not found at ${SIGNCERT}"
  exit 1
fi

KEY_FILE=$(ls ${KEYSTORE_DIR}/*_sk 2>/dev/null || true)
if [ -z "${KEY_FILE}" ]; then
  echo "ERROR: Private key not found in ${KEYSTORE_DIR}"
  exit 1
fi

if [ ! -f "${TLS_CERT}" ]; then
  echo "WARNING: TLS CA certificate not found at ${TLS_CERT}"
fi

# ================================
# Clean old backend artifacts
# ================================
echo "Cleaning old backend certificates and keys..."
rm -rf "${BACKEND_CERTS_DIR:?}/"*
rm -f "${BACKEND_SECRETS_DIR:?}"/*.pem

# ================================
# Create directories if not exist
# ================================
mkdir -p "${BACKEND_CERTS_DIR}"
mkdir -p "${BACKEND_SECRETS_DIR}"

# ================================
# Copy certificates and keys
# ================================
echo "Copying certificates for ${APP_USER}..."

cp "${SIGNCERT}" "${BACKEND_CERTS_DIR}/${APP_USER}-cert.pem"
cp "${KEY_FILE}" "${BACKEND_SECRETS_DIR}/${APP_USER}-key.pem"

if [ -f "${TLS_CERT}" ]; then
  cp "${TLS_CERT}" "${BACKEND_CERTS_DIR}/${APP_USER}-ca.pem"
fi

# ================================
# Summary
# ================================
echo "Copied files:"
echo " - Public cert : ${BACKEND_CERTS_DIR}/${APP_USER}-cert.pem"
echo " - Private key : ${BACKEND_SECRETS_DIR}/${APP_USER}-key.pem"
if [ -f "${TLS_CERT}" ]; then
  echo " - TLS cert    : ${BACKEND_CERTS_DIR}/${APP_USER}-ca.pem"
fi

echo "All done! ${APP_USER} artifacts are ready for backend use."
