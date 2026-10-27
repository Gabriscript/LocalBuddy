#!/usr/bin/env bash
# Demo seed for the LocalBuddy DEV database: nine invented people from demo-photos/PROMPTS.md,
# created through the real HTTP API (credits excepted, see the end). Never point this at anything
# but a local Development API.
#
#   docker start localbuddy-postgres-1
#   dotnet run --project backend/LocalBuddy.Api --launch-profile http   # :5200
#   bash backend/scripts/seed-demo.sh
#
# Every demo account is <name>@demo.localbuddy.test with the password DemoPass123!
# Re-running is safe: each demo account that already exists is deleted (DELETE /users/me, which
# cascades its photos, matches and conversations) and created again. Nothing else is touched.
# Identity is verified through POST /users/me/verify, which FakeIdentityVerifier approves in
# Development only (ADR-0002); outside Development no verifier is registered at all.
set -euo pipefail

API=${API:-http://localhost:5200/api/v1}
DOMAIN=demo.localbuddy.test
PASSWORD='DemoPass123!'
# pwd -W: Git Bash curl is a native Windows build and cannot open /c/... paths inside -F.
PHOTOS=$(cd "$(dirname "$0")/../../demo-photos" && { pwd -W 2>/dev/null || pwd; })
TMP=$(cd "$(mktemp -d)" && { pwd -W 2>/dev/null || pwd; }); trap 'rm -rf "$TMP"' EXIT

declare -A TOKEN ID

# $1 = accepted status codes as a regex, rest = curl args. Body lands in $TMP/body.
# The auth endpoints allow 10 calls a minute per address, so a 429 waits out the window.
req() {
  local want=$1 code; shift
  while :; do
    code=$(curl -s -o "$TMP/body" -w '%{http_code}' "$@") || true # curl exit codes still reach the FAIL line as 000
    [ "$code" = 429 ] || break
    echo "    rate limited, waiting 60s"; sleep 61
  done
  [[ $code =~ ^($want)$ ]] || { echo "FAIL ($code) $*: $(cat "$TMP/body")" >&2; exit 1; }
  CODE=$code
}
field() { grep -o "\"$1\":\"[^\"]*\"" "$TMP/body" | head -1 | cut -d'"' -f4; }
# Bodies go through a file: Windows argv mangles accents (Lucía, Ballarò), and a 429 retry
# needs the body a second time.
body() { printf "%s" "$1" >"$TMP/json"; echo "$TMP/json"; }
auth() { echo "Authorization: Bearer ${TOKEN[$1]}"; }

# $1 key, $2 name, $3 city, $4 role, $5 portrait, $6 what we will do, $7 why I host,
# $8 languages, $9 car/smokes/pets as "true false false", $10 times of day, $11 home photo or "-"
person() {
  local key=$1 email="$1@$DOMAIN" car smokes pets slots="" t
  read -r car smokes pets <<<"$9"
  echo "$2 ($email)"

  local creds="{\"email\":\"$email\",\"password\":\"$PASSWORD\"}"
  req '200|401' -X POST "$API/auth/login" -H 'Content-Type: application/json' -d "$creds"
  if [ "$CODE" = 200 ]; then
    req 204 -X DELETE "$API/users/me" -H "Authorization: Bearer $(field token)"
    echo "    removed the previous copy"
  fi

  req 201 -X POST "$API/auth/register" -H 'Content-Type: application/json' \
    --data-binary "@$(body "{\"email\":\"$email\",\"password\":\"$PASSWORD\",\"name\":\"$2\",\"city\":\"$3\",\"role\":\"$4\"}")"
  TOKEN[$key]=$(field token); ID[$key]=$(field userId)

  req 204 -X PUT "$API/users/me" -H "$(auth "$key")" -H 'Content-Type: application/json' --data-binary "@$(body "{
    \"name\":\"$2\",\"city\":\"$3\",\"role\":\"$4\",
    \"whatWeWillDo\":\"$6\",\"whyIHost\":\"$7\",\"languagesSpoken\":\"$8\",
    \"hasCar\":$car,\"smokes\":$smokes,\"hasPets\":$pets,\"profileVisibleToAnonymous\":true}")"

  for t in ${10}; do slots+="${slots:+,}{\"timeOfDay\":\"$t\",\"seasonStart\":null,\"seasonEnd\":null}"; done
  req 204 -X PUT "$API/users/me/availability" -H "$(auth "$key")" -H 'Content-Type: application/json' -d "[$slots]"

  local overnight=false; [ "${11}" != - ] && overnight=true
  if [ "$4" != guest ]; then
    req 200 -X PUT "$API/listings/me" -H "$(auth "$key")" -H 'Content-Type: application/json' \
      -d "{\"offersExperience\":true,\"offersOvernight\":$overnight,\"overnightComplianceAck\":$overnight}"
  fi

  req 200 -X POST "$API/users/me/verify" -H "$(auth "$key")"

  req 201 -X POST "$API/photos?type=Profile" -H "$(auth "$key")" -F "file=@$PHOTOS/$5;type=image/jpeg"
  if [ "$overnight" = true ]; then
    req 201 -X POST "$API/photos?type=Home" -H "$(auth "$key")" -F "file=@$PHOTOS/${11};type=image/jpeg"
  fi
}

# Both sides express interest; leaves the conversation id in CONV.
match() {
  req 200 -X POST "$API/users/${ID[$2]}/interest" -H "$(auth "$1")"
  req 201 -X POST "$API/users/${ID[$1]}/interest" -H "$(auth "$2")"
  CONV=$(field conversationId)
  echo "match: $1 <-> $2"
}
say() { req 201 -X POST "$API/conversations/$CONV/messages" -H "$(auth "$1")" -H 'Content-Type: application/json' --data-binary "@$(body "{\"content\":\"$2\"}")"; }

echo "hosts"
person anna "Anna" "Milano" host p01-anna.jpg \
  "Aperitivo on the Navigli like we do it, not like the guidebook. Then a walk through the old ringhiera courtyards of Isola, and if you want, risotto at mine." \
  "I moved here from Bergamo ten years ago and somebody showed me the real Milano. Now it is my turn." \
  "Italian, English, a bit of German" "false false true" "afternoon evening" h02-kitchen.jpg
person marco "Marco" "Napoli" host p02-marco.jpg \
  "Coffee at my bar in the Quartieri Spagnoli, the shrines nobody looks up at, pizza fritta from the lady on the corner. We go by scooter if you are brave." \
  "Napoli has a bad name with people who never came. I like to change their mind, one espresso at a time." \
  "Italian, Neapolitan, English" "true false false" "morning afternoon" -
person giulia "Giulia" "Bologna" host p03-giulia.jpg \
  "A bike ride under the porticoes up to San Luca, tortellini where the students eat, and the secret window on the canal. I have a spare room with a view on the roofs." \
  "I study architecture and I talk about this city too much. Better to do it with someone who wants to listen." \
  "Italian, English, Spanish" "false false false" "afternoon evening night" h01-guest-room.jpg
person rosa "Rosa" "Palermo" host p04-rosa.jpg \
  "Ballarò market in the morning, I teach you to choose the artichokes and to bargain like a Palermitana. After, we cook together at my place." \
  "My children live in Milano and London. When guests come to my table the house is full again." \
  "Italian, Sicilian, a little English" "false false true" "morning" -
person amara "Amara" "Torino" host p05-amara.jpg \
  "Bicerin in a historic café, the Quadrilatero at dusk and the Po by bike. On Sundays, the Balon flea market." \
  "Torino is quiet and people think it is cold. It is not, it only needs someone to open the door." \
  "Italian, English, French" "true false false" "afternoon evening" -

echo "travellers"
person wei "Wei" "Roma" guest p06-wei.jpg \
  "First time in Italy! I want to see how people really live here, the morning bar, the market, the small streets. I take many photos, I promise to ask first." \
  "" "Mandarin, Taiwanese Hokkien, English" "false false false" "morning afternoon" -
person tom "Tom" "Firenze" guest p07-tom.jpg \
  "Walking holiday, a fortnight from Florence down to Naples. Keen on proper food, old bookshops and anyone happy to explain the football to me." \
  "" "English, a smattering of Italian" "false false false" "afternoon evening" -
person lucia "Lucía" "Venezia" guest p08-lucia.jpg \
  "I am from Sevilla and I travel slow, one month in Italy. I love to cook, so markets and home kitchens are my favourite thing, and I can teach you a real gazpacho." \
  "" "Spanish, English, Italian a bit" "false false false" "morning evening" -
person julien "Julien" "Genova" guest p09-julien.jpg \
  "Focaccia hunter on a train trip from Genoa to Milan. I like the places that are not on Instagram, a good bookshop and a bar where people argue about politics." \
  "" "French, English, Italian (I try)" "false true false" "afternoon evening night" -

echo "matches"
match tom giulia
match julien anna
say julien "Ciao Anna! I arrive in Milano on Friday by train from Genova. Would Saturday afternoon work for the Navigli walk?"
say anna "Ciao Julien! Saturday is perfect. Let us meet at 17:00 at Porta Genova station, then aperitivo on the canal."
say julien "Parfait, see you there. I bring some focaccia from Genova, it is the least I can do."

# Credits only come from reviews, so no endpoint grants them: written straight to the dev database.
# 11 beats the older @example.com demo accounts (10), which would otherwise lead the feed on the
# id tie-break (DiscoveryController orders by credits, then id).
echo "credits"
docker exec "${PG:-localbuddy-postgres-1}" sh -c 'psql -U "$POSTGRES_USER" -d localbuddy -qAtc "update \"AspNetUsers\" set \"CreditsBalance\" = 11 where \"Email\" like '\''%@'"$DOMAIN"''\''"'

echo
echo "demo seed done: 9 accounts @$DOMAIN"
