#!/usr/bin/env bash
# Resets the LocalBuddy demo cast (ADR-0014): signs in as the presenter and calls
# POST /demo/reset. The cast itself lives in the API (DemoData/demo-seed.json); this script only
# resets it, and an enabled API seeds it by itself on first boot.
#
# Enable the switch in the API's environment (off by default, never in a committed settings file):
#   Demo__ResetEnabled=true
#   Demo__AccountPassword=<password, at least 12 characters>
#   Demo__PhotosPath=<repo>/demo-photos/pexels     # portraits are not in git; missing = no photo
#
#   DEMO_PASSWORD=<same password> bash backend/scripts/seed-demo.sh
#   API=https://demo-api.EXAMPLE.TLD/api/v1 DEMO_PASSWORD=... bash backend/scripts/seed-demo.sh
#
# Prints the HTTP status of each step and, on failure, only the problem `code`. Never a token,
# a header or the password: both travel through files, never on a command line.
set -euo pipefail
umask 077

API=${API:-http://localhost:5200/api/v1}
DEMO_EMAIL=${DEMO_EMAIL:-anna@demo.localbuddy.test}
: "${DEMO_PASSWORD:?set DEMO_PASSWORD to the API's Demo__AccountPassword}"
# pwd -W: Git Bash curl is a native Windows build and cannot open /c/... paths.
TMP=$(cd "$(mktemp -d)" && { pwd -W 2>/dev/null || pwd; }); trap 'rm -rf "$TMP"' EXIT

# $1 = step name, $2 = expected status, rest = curl args. Body lands in $TMP/body.
# The auth endpoints allow 10 calls a minute per address, so a 429 waits out the window.
req() {
  local step=$1 want=$2 code; shift 2
  while :; do
    code=$(curl -s -o "$TMP/body" -w '%{http_code}' "$@") || true # curl failures show as 000
    [ "$code" = 429 ] || break
    echo "$step: 429, waiting 60s"; sleep 61
  done
  echo "$step: $code"
  if [ "$code" != "$want" ]; then
    echo "$step failed: code=$(field code)" >&2
    exit 1
  fi
}
field() { grep -o "\"$1\":\"[^\"]*\"" "$TMP/body" 2>/dev/null | head -1 | cut -d'"' -f4 || true; }
json() { local s=${1//\\/\\\\}; printf '%s' "${s//\"/\\\"}"; }

printf '{"email":"%s","password":"%s"}' "$(json "$DEMO_EMAIL")" "$(json "$DEMO_PASSWORD")" >"$TMP/login.json"
req login 200 -X POST "$API/auth/login" -H 'Content-Type: application/json' --data-binary "@$TMP/login.json"

printf 'Authorization: Bearer %s\n' "$(field token)" >"$TMP/auth.hdr"
req reset 204 -X POST "$API/demo/reset" -H "@$TMP/auth.hdr"

echo "demo reset done"
