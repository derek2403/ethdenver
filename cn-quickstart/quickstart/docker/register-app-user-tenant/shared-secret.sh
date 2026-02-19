#!/bin/bash
# Copyright (c) 2026, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: 0BSD

# This script is executed by the `splice-onboarding` container. It leverages provided functions from `/app/utils`
# and the resolved environment to register App User tenant to the backend service.
# Note: This script is intended for local development environment only and is not meant for production use.

set -eo pipefail

source /app/utils.sh

# Source party IDs exported by the backend-service onboarding
if [ -f /onboarding/backend-service/on/backend-service.sh ]; then
  source /onboarding/backend-service/on/backend-service.sh
fi

register_tenant() {
  local providerAdmin=$1
  local partyId=$2
  local tenantId=$3
  local tenantUser=$4
  local walletUrl=$5
  local isInternal=${6:-false}
  echo "register_tenant $providerAdmin $partyId $tenantId $tenantUser (internal=$isInternal)" >&2

  curl -c cookies.txt -X POST \
    -d "username=${providerAdmin}" \
    "http://backend-service:${BACKEND_PORT}/login"

  curl_check "http://backend-service:${BACKEND_PORT}/admin/tenant-registrations" "" "application/json" \
   -b cookies.txt \
   -H 'Authorization: Custom' \
   --data-raw '{
     "tenantId": "'$tenantId'",
     "partyId": "'$partyId'",
     "walletUrl": "'$walletUrl'",
     "clientId": "",
     "issuerUrl": "",
     "internal": '$isInternal',
     "users": ["'$tenantUser'"]
   }'
}

WALLET_URL="http://wallet.localhost:${APP_USER_UI_PORT}"

# Register the original app user tenant
register_tenant $AUTH_APP_PROVIDER_WALLET_ADMIN_USER_NAME $APP_USER_PARTY "AppUser" $AUTH_APP_USER_WALLET_ADMIN_USER_NAME "$WALLET_URL"

# Register additional role tenants (party IDs come from onboarding.sh via shared env)
register_tenant $AUTH_APP_PROVIDER_WALLET_ADMIN_USER_NAME $SELLER_PARTY "Seller" "seller" "$WALLET_URL" true
register_tenant $AUTH_APP_PROVIDER_WALLET_ADMIN_USER_NAME $BUYER_PARTY "Buyer" "buyer" "$WALLET_URL"
register_tenant $AUTH_APP_PROVIDER_WALLET_ADMIN_USER_NAME $LOGISTICS_PARTY "Logistics" "logistics" "$WALLET_URL"
register_tenant $AUTH_APP_PROVIDER_WALLET_ADMIN_USER_NAME $FINANCE_PARTY "Finance" "finance" "$WALLET_URL"
