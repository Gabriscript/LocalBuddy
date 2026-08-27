#!/usr/bin/env bash
# Smoke test for the LocalBuddy API. Start the API first:
#   cd backend/LocalBuddy.Api && dotnet run --urls http://localhost:5200
# then: bash smoke-test.sh
set -euo pipefail

API=${API:-http://localhost:5200/api}
STAMP=$(date +%s)
pass() { echo "  ok  $1"; }
fail() { echo "  FAIL $1"; exit 1; }

# $1=description $2=expected status $3.. = curl args
expect() {
  local desc=$1 want=$2; shift 2
  local got
  got=$(curl -s -o /tmp/lb_body -w '%{http_code}' "$@")
  [ "$got" = "$want" ] && pass "$desc" || fail "$desc (wanted $want, got $got: $(cat /tmp/lb_body))"
}

register() { # $1=email suffix -> echoes token
  curl -s -X POST "$API/Auth/register" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1-$STAMP@test.com\",\"password\":\"Passw0rd!\",\"name\":\"$1\",\"city\":\"Milano\",\"role\":\"entrambi\"}" \
    | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}
me_id() { curl -s "$API/Users/me" -H "Authorization: Bearer $1" | grep -o '"id":"[^"]*"' | cut -d'"' -f4; }

echo "auth"
A=$(register alice); [ -n "$A" ] && pass "register alice" || fail "register alice"
B=$(register bob);   [ -n "$B" ] && pass "register bob"   || fail "register bob"
AID=$(me_id "$A"); BID=$(me_id "$B")
expect "reject anonymous access" 401 "$API/Users/me"

echo "listing / TULPS gate"
expect "overnight without compliance ack is refused" 400 \
  -X PUT "$API/Listings/me" -H "Authorization: Bearer $A" -H 'Content-Type: application/json' \
  -d '{"offersExperience":true,"offersOvernight":true,"overnightComplianceAck":false}'
expect "overnight with ack is accepted" 200 \
  -X PUT "$API/Listings/me" -H "Authorization: Bearer $A" -H 'Content-Type: application/json' \
  -d '{"offersExperience":true,"offersOvernight":true,"overnightComplianceAck":true}'

echo "matching"
curl -s -X POST "$API/Matches/interest/$BID" -H "Authorization: Bearer $A" | grep -q '"matched":false' \
  && pass "one-sided interest does not match" || fail "one-sided interest should not match"
CONV=$(curl -s -X POST "$API/Matches/interest/$AID" -H "Authorization: Bearer $B" \
  | grep -o '"conversationId":"[^"]*"' | cut -d'"' -f4)
[ -n "$CONV" ] && pass "reciprocal interest opens a conversation" || fail "reciprocal interest should match"
expect "cannot respond to the same profile twice" 400 \
  -X POST "$API/Matches/interest/$BID" -H "Authorization: Bearer $A"

echo "chat access control"
expect "participant can send" 200 \
  -X POST "$API/Conversations/$CONV/messages" -H "Authorization: Bearer $A" \
  -H 'Content-Type: application/json' -d '{"content":"ciao"}'
expect "empty message refused" 400 \
  -X POST "$API/Conversations/$CONV/messages" -H "Authorization: Bearer $A" \
  -H 'Content-Type: application/json' -d '{"content":"  "}'
C=$(register carol)
expect "outsider cannot read the conversation" 403 \
  "$API/Conversations/$CONV/messages" -H "Authorization: Bearer $C"

echo "reviews"
expect "review without an exchange is refused" 400 \
  -X POST "$API/Reviews" -H "Authorization: Bearer $C" -H 'Content-Type: application/json' \
  -d "{\"subjectId\":\"$AID\",\"rating\":5,\"comment\":\"nope\"}"
expect "review after an exchange is accepted" 204 \
  -X POST "$API/Reviews" -H "Authorization: Bearer $B" -H 'Content-Type: application/json' \
  -d "{\"subjectId\":\"$AID\",\"rating\":5,\"comment\":\"great host\"}"
expect "rating out of range is refused" 400 \
  -X POST "$API/Reviews" -H "Authorization: Bearer $A" -H 'Content-Type: application/json' \
  -d "{\"subjectId\":\"$BID\",\"rating\":9,\"comment\":\"bad rating\"}"

echo "blocking"
expect "block succeeds" 204 -X POST "$API/Safety/block/$BID" -H "Authorization: Bearer $A"
curl -s "$API/Discovery?city=Milano" -H "Authorization: Bearer $A" | grep -q "$BID" \
  && fail "blocked user still shows in discovery" || pass "blocked user hidden from discovery"

echo "photos"
expect "non-image upload refused" 400 \
  -X POST "$API/Photos?type=Profile" -H "Authorization: Bearer $A" -F "file=@$0"

echo
echo "all checks passed"
