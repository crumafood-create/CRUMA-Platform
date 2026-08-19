#!/usr/bin/env bash
set -euo pipefail

evidence_dir="${CRUMA_PRODUCTION_PREP_EVIDENCE_DIR:-$(mktemp -d)}"
plan_file="$evidence_dir/reconciliation-plan.json"
packet_file="$evidence_dir/authorization-packet.json"
project_ref_file="supabase/.temp/project-ref"

chmod 700 "$evidence_dir"

if [[ ! -f "$project_ref_file" ]]; then
  printf 'PRODUCTION_PREPARATION_STATUS=LINK_REQUIRED\n' >&2
  exit 1
fi

project_ref="$(tr -d '\r\n' < "$project_ref_file")"
node scripts/database/plan-migration-reconciliation.ts > "$plan_file"
node scripts/database/prepare-production-reconciliation.ts \
  "$plan_file" "$project_ref" > "$packet_file"

if grep -ERq 'postgres(ql)?://|sbp_|SERVICE_ROLE_KEY|JWT_SECRET|YOUR-PASSWORD' "$evidence_dir"; then
  printf 'PREP_EVIDENCE_SECRET_SCAN=FAIL\n' >&2
  exit 1
fi
printf 'PREP_EVIDENCE_SECRET_SCAN=OK\n'

node -e '
  const packet = require(process.argv[1]);
  console.log("PRODUCTION_PREPARATION_STATUS=OK");
  console.log("REMOTE_WRITES_AUTHORIZED=" + packet.remoteWritesAuthorized);
  console.log("EXECUTION_COMMAND=" + packet.executionCommand);
  console.log("PLAN_FINGERPRINT=" + packet.planFingerprint);
' "$packet_file"

printf 'EVIDENCE_DIR=%s\n' "$evidence_dir"
