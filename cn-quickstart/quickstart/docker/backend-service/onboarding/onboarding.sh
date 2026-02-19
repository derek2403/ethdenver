#!/bin/bash
# Copyright (c) 2026, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: 0BSD

# This script is executed by the `splice-onboarding` container. It leverages provided functions from `/app/utils`
# and the resolved environment to onboard a backend service user to a participant (handling user creation and rights assignment),
# and propagating the necessary environment variables to the backend service via the `backend-service.sh` script stored in the shared `onboarding` volume.
# The backend service container sources this shared script during its initialization phase, prior to launching the main process.
# Note: This onboarding script is intended for local development environment only and is not meant for production use.

set -eo pipefail

source /app/utils.sh

init() {
  local backendUserId=$1
  create_user "$APP_PROVIDER_PARTICIPANT_ADMIN_TOKEN" $backendUserId $AUTH_APP_PROVIDER_BACKEND_USER_NAME "" "canton:3${PARTICIPANT_JSON_API_PORT_SUFFIX}"
  grant_rights "$APP_PROVIDER_PARTICIPANT_ADMIN_TOKEN" $backendUserId $APP_PROVIDER_PARTY "ReadAs ActAs" "canton:3${PARTICIPANT_JSON_API_PORT_SUFFIX}"
}

allocate_extra_parties() {
  local participant="canton:3${PARTICIPANT_JSON_API_PORT_SUFFIX}"

  # Seller = APP_PROVIDER_PARTY (canton:3) — matches licensing pattern where provider = seller
  SELLER_PARTY=$APP_PROVIDER_PARTY
  # Buyer = APP_USER_PARTY (canton:2) — wallet on canton:2 can see AllocationRequests
  BUYER_PARTY=$APP_USER_PARTY
  # Extra disclosure-only parties — allocated fresh on canton:3
  LOGISTICS_PARTY=$(allocate_party "$APP_PROVIDER_PARTICIPANT_ADMIN_TOKEN" "logistics" "$participant")
  FINANCE_PARTY=$(allocate_party "$APP_PROVIDER_PARTICIPANT_ADMIN_TOKEN" "finance" "$participant")

  local backendUserId=$1
  for PARTY_ID in $LOGISTICS_PARTY $FINANCE_PARTY; do
    grant_rights "$APP_PROVIDER_PARTICIPANT_ADMIN_TOKEN" $backendUserId $PARTY_ID "ReadAs ActAs" "$participant"
  done

  # Grant PQS user ReadAs for extra parties so they appear in PQS queries
  local pqsUserId=${AUTH_APP_PROVIDER_PQS_USER_ID:-${AUTH_APP_PROVIDER_PQS_USER_NAME}}
  if [ -n "$pqsUserId" ]; then
    for PARTY_ID in $LOGISTICS_PARTY $FINANCE_PARTY; do
      grant_rights "$APP_PROVIDER_PARTICIPANT_ADMIN_TOKEN" $pqsUserId $PARTY_ID "ReadAs" "$participant"
    done
  fi
}

if [ "$AUTH_MODE" == "oauth2" ]; then
  init "$AUTH_APP_PROVIDER_BACKEND_USER_ID"
  allocate_extra_parties "$AUTH_APP_PROVIDER_BACKEND_USER_ID"
  share_file "backend-service/on/backend-service.sh" <<EOF
  export APP_PROVIDER_PARTY=${APP_PROVIDER_PARTY}
  export SELLER_PARTY=${SELLER_PARTY}
  export BUYER_PARTY=${BUYER_PARTY}
  export LOGISTICS_PARTY=${LOGISTICS_PARTY}
  export FINANCE_PARTY=${FINANCE_PARTY}
EOF

else
  init "$AUTH_APP_PROVIDER_BACKEND_USER_NAME"
  allocate_extra_parties "$AUTH_APP_PROVIDER_BACKEND_USER_NAME"
  APP_PROVIDER_BACKEND_USER_TOKEN=$(generate_jwt "$AUTH_APP_PROVIDER_BACKEND_USER_NAME" "$AUTH_APP_PROVIDER_AUDIENCE")
  share_file "backend-service/on/backend-service.sh" <<EOF
  export APP_PROVIDER_PARTY=${APP_PROVIDER_PARTY}
  export SELLER_PARTY=${SELLER_PARTY}
  export BUYER_PARTY=${BUYER_PARTY}
  export LOGISTICS_PARTY=${LOGISTICS_PARTY}
  export FINANCE_PARTY=${FINANCE_PARTY}
  export APP_PROVIDER_BACKEND_USER_TOKEN=${APP_PROVIDER_BACKEND_USER_TOKEN}
EOF
fi
