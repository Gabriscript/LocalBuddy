#!/usr/bin/env bash
# Smoke test for the LocalBuddy API. Start the API first:
#   cd backend/LocalBuddy.Api && dotnet run --urls http://localhost:5200
# then: bash smoke-test.sh
set -euo pipefail

API=${API:-http://localhost:5200/api/v1}
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
  curl -s -X POST "$API/auth/register" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1-$STAMP@test.com\",\"password\":\"Passw0rd!\",\"name\":\"$1\",\"city\":\"Milano\",\"role\":\"entrambi\"}" \
    | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}
me_id() { curl -s "$API/users/me" -H "Authorization: Bearer $1" | grep -o '"id":"[^"]*"' | cut -d'"' -f4; }
verify() { curl -s -o /dev/null -X POST "$API/users/me/verify" -H "Authorization: Bearer $1"; }

echo "auth"
A=$(register alice); [ -n "$A" ] && pass "register alice" || fail "register alice"
B=$(register bob);   [ -n "$B" ] && pass "register bob"   || fail "register bob"
AID=$(me_id "$A"); BID=$(me_id "$B")
expect "reject anonymous access" 401 "$API/users/me"
expect "duplicate registration is refused without confirming the address" 400 \
  -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d "{\"email\":\"alice-$STAMP@test.com\",\"password\":\"Passw0rd!\",\"name\":\"a\",\"city\":\"Milano\",\"role\":\"host\"}"
grep -q '"code":"registration_failed"' /tmp/lb_body \
  && pass "errors carry a machine-readable code" || fail "error body has no code field"

echo "identity gate"
U=$(register unverified)
expect "unverified member cannot express interest" 403 \
  -X POST "$API/users/$BID/interest" -H "Authorization: Bearer $U"
expect "unverified member can still report someone" 202 \
  -X POST "$API/reports" -H "Authorization: Bearer $U" -H 'Content-Type: application/json' \
  -d "{\"reportedId\":\"$BID\",\"reason\":\"safety must not need paperwork\"}"
expect "unverified member can still browse" 200 "$API/discovery?city=Milano" -H "Authorization: Bearer $U"
verify "$A"; verify "$B"
pass "alice and bob verified their identity"

echo "listing / TULPS gate"
expect "overnight without compliance ack is refused" 400 \
  -X PUT "$API/listings/me" -H "Authorization: Bearer $A" -H 'Content-Type: application/json' \
  -d '{"offersExperience":true,"offersOvernight":true,"overnightComplianceAck":false}'
expect "overnight with ack is accepted" 200 \
  -X PUT "$API/listings/me" -H "Authorization: Bearer $A" -H 'Content-Type: application/json' \
  -d '{"offersExperience":true,"offersOvernight":true,"overnightComplianceAck":true}'

echo "matching"
curl -s -X POST "$API/users/$BID/interest" -H "Authorization: Bearer $A" | grep -q '"matched":false' \
  && pass "one-sided interest does not match" || fail "one-sided interest should not match"
expect "reciprocal interest creates a conversation" 201 \
  -X POST "$API/users/$AID/interest" -H "Authorization: Bearer $B"
CONV=$(grep -o '"conversationId":"[^"]*"' /tmp/lb_body | cut -d'"' -f4)
[ -n "$CONV" ] && pass "201 carries the conversation id" || fail "no conversation id returned"
expect "responding twice is a conflict" 409 \
  -X POST "$API/users/$BID/interest" -H "Authorization: Bearer $A"

echo "chat access control"
expect "participant can send" 201 \
  -X POST "$API/conversations/$CONV/messages" -H "Authorization: Bearer $A" \
  -H 'Content-Type: application/json' -d '{"content":"ciao"}'
expect "empty message refused" 400 \
  -X POST "$API/conversations/$CONV/messages" -H "Authorization: Bearer $A" \
  -H 'Content-Type: application/json' -d '{"content":"  "}'
expect "over-long message refused" 400 \
  -X POST "$API/conversations/$CONV/messages" -H "Authorization: Bearer $A" \
  -H 'Content-Type: application/json' -d "{\"content\":\"$(head -c 2001 /dev/zero | tr '\0' 'a')\"}"
C=$(register carol)
expect "outsider cannot read the conversation" 403 \
  "$API/conversations/$CONV/messages" -H "Authorization: Bearer $C"
curl -s "$API/conversations/$CONV/messages" -H "Authorization: Bearer $A" | grep -q '"hasMore":false' \
  && pass "collections come back paginated" || fail "message list is not a page"

echo "reviews"
expect "review without an exchange is refused" 400 \
  -X POST "$API/reviews" -H "Authorization: Bearer $C" -H 'Content-Type: application/json' \
  -d "{\"subjectId\":\"$AID\",\"rating\":5,\"comment\":\"nope\"}"
expect "review after an exchange is created" 201 \
  -X POST "$API/reviews" -H "Authorization: Bearer $B" -H 'Content-Type: application/json' \
  -d "{\"subjectId\":\"$AID\",\"rating\":5,\"comment\":\"great host\"}"
expect "rating out of range is refused" 400 \
  -X POST "$API/reviews" -H "Authorization: Bearer $A" -H 'Content-Type: application/json' \
  -d "{\"subjectId\":\"$BID\",\"rating\":9,\"comment\":\"bad rating\"}"
expect "reviews are readable per user" 200 "$API/users/$AID/reviews" -H "Authorization: Bearer $B"

echo "blocking"
expect "block is idempotent" 204 -X PUT "$API/users/$BID/block" -H "Authorization: Bearer $A"
expect "blocking twice is still fine" 204 -X PUT "$API/users/$BID/block" -H "Authorization: Bearer $A"
curl -s "$API/discovery?city=Milano" -H "Authorization: Bearer $A" | grep -q "$BID" \
  && fail "blocked user still shows in discovery" || pass "blocked user hidden from discovery"

echo "photos"
expect "non-image upload refused" 400 \
  -X POST "$API/photos?type=Profile" -H "Authorization: Bearer $A" -F "file=@$0"

echo
echo "all checks passed"
