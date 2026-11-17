// Plays the presenter's demo against a running API (ADR-0014): starting state, Helsinki, every seeded
// city, a few demo actions, then two resets back to the starting state. Expectations come from
// backend/LocalBuddy.Api/DemoData/demo-seed.json, read at runtime.
//   DEMO_PASSWORD=... node .claude/tools/demo-check.mjs      (API, DEMO_EMAIL optional; exits 1 on the first failure)
// Never prints a token, a header or the password: failures show method, path, status and the problem code.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const API = process.env.API ?? 'http://localhost:5200/api/v1';
const EMAIL = process.env.DEMO_EMAIL ?? 'anna@demo.localbuddy.test';
const PASSWORD = process.env.DEMO_PASSWORD;
if (!PASSWORD) { console.log('FAIL  DEMO_PASSWORD is not set'); process.exit(1); }

const seed = JSON.parse(readFileSync(new URL('../../backend/LocalBuddy.Api/DemoData/demo-seed.json', import.meta.url), 'utf8'));
const DOMAIN = EMAIL.split('@')[1];
const HELSINKI = 'Helsinki';
const person = Object.fromEntries(seed.people.map((p) => [p.key, p]));
const presenter = person[seed.presenter];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const same = (a, b) => a.toLowerCase() === b.toLowerCase();
const hosts = (role) => role === 'host' || role === 'entrambi';

/// Mirrors DemoSeed.IdOf: the first 16 bytes of SHA-256(email) read as a .NET Guid (first three fields little-endian).
function idOf(key) {
  const b = createHash('sha256').update(`${key}@${DOMAIN}`, 'utf8').digest();
  const h = (i) => b[i].toString(16).padStart(2, '0');
  const hex = (...ix) => ix.map(h).join('');
  return `${hex(3, 2, 1, 0)}-${hex(5, 4)}-${hex(7, 6)}-${hex(8, 9)}-${hex(10, 11, 12, 13, 14, 15)}`;
}
const nameOf = Object.fromEntries(seed.people.map((p) => [idOf(p.key), p.key]));
const names = (ids) => [...ids].map((id) => nameOf[id] ?? id).sort().join(',');

function utcDay(offset) {
  const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

let ok = 0; let warnings = 0; let requests = 0;
function check(name, pass, detail = '') {
  console.log(`${pass ? 'ok  ' : 'FAIL'}  ${name}${pass || !detail ? '' : `  -> ${detail}`}`);
  if (!pass) throw new Error(`step failed: ${name}`);
  ok++;
}
function warn(name, detail) { console.log(`warn  ${name}  -> ${detail}`); warnings++; }

let token;
async function api(method, path, body, expect = [200]) {
  for (let attempt = 0; ; attempt++) {
    requests++;
    const res = await fetch(API + path, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429 && attempt === 0) { await sleep((Number(res.headers.get('retry-after')) || 60) * 1000); continue; }
    const text = await res.text();
    let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
    if (!expect.includes(res.status))
      throw new Error(`${method} ${path} -> ${res.status}${json?.code ? ` (${json.code})` : ''}, expected ${expect.join('/')}`);
    return json;
  }
}

async function allPages(path) {
  const items = [];
  for (let page = 0; ; page++) {
    const r = await api('GET', `${path}${path.includes('?') ? '&' : '?'}pageSize=50&page=${page}`);
    items.push(...r.items);
    if (!r.hasMore) return items;
  }
}

const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const presenterTrips = presenter.trips.map((t) => `${t.city}|${utcDay(t.from)}|${utcDay(t.to)}`);
const myMatches = seed.matches.filter((m) => m.a === seed.presenter || m.b === seed.presenter)
  .map((m) => idOf(m.a === seed.presenter ? m.b : m.a));
const received = seed.requests.filter((r) => r.to === seed.presenter).map((r) => idOf(r.from));
const sent = seed.requests.filter((r) => r.from === seed.presenter).map((r) => idOf(r.to));
const noteFrom = Object.fromEntries(seed.requests.filter((r) => r.to === seed.presenter).map((r) => [idOf(r.from), r.note]));
// Mirrors MatchesController.Requests: the asker's earliest active trip to the presenter's city or to a city she is visiting.
const presenterPlaces = [presenter.city, ...presenter.trips.filter((t) => t.to >= 0).map((t) => t.city)];
const expectedTrip = Object.fromEntries(seed.requests.filter((r) => r.to === seed.presenter).map((r) => {
  const t = person[r.from].trips.filter((x) => x.to >= 0 && presenterPlaces.some((c) => same(c, x.city)))
    .sort((a, b) => a.from - b.from)[0];
  return [idOf(r.from), t ? `${t.city}|${utcDay(t.from)}|${utcDay(t.to)}` : 'none'];
}));
// The sauna host: a Helsinki resident who hosts, mentions sauna, and is waiting on the presenter.
const saunaKey = seed.requests.find((r) => r.to === seed.presenter && same(person[r.from].city, HELSINKI)
  && hosts(person[r.from].role) && /sauna/i.test(`${person[r.from].whatWeWillDo} ${person[r.from].whyIHost}`))?.from;

async function startingState(label) {
  const trips = await allPages('/trips');
  const got = trips.map((t) => `${t.city}|${t.from}|${t.to}`);
  check(`${label}: trips are the seed's (${presenterTrips.join('; ')})`, sameSet(new Set(got), new Set(presenterTrips)), got.join('; '));
  const convs = await allPages('/conversations');
  check(`${label}: conversations are the seed's matches (${names(myMatches)})`,
    sameSet(new Set(convs.map((c) => c.otherUserId)), new Set(myMatches)), names(convs.map((c) => c.otherUserId)));
  check(`${label}: every conversation has unread messages`, convs.every((c) => Number(c.unreadCount) > 0),
    convs.map((c) => `${nameOf[c.otherUserId]}=${c.unreadCount}`).join(','));
  const inbox = await allPages('/users/me/requests');
  check(`${label}: requests received (${names(received)})`, sameSet(new Set(inbox.map((c) => c.id)), new Set(received)), names(inbox.map((c) => c.id)));
  // ADR-0015: each received request carries the seed's note, and the asker's trip into the presenter's world.
  const wrongNotes = inbox.filter((c) => !c.note || c.note !== noteFrom[c.id]);
  check(`${label}: every request received carries the seed's note`, wrongNotes.length === 0, names(wrongNotes.map((c) => c.id)));
  const tripOf = (c) => (c.trip ? `${c.trip.city}|${c.trip.from}|${c.trip.to}` : 'none');
  const wrongTrips = inbox.filter((c) => tripOf(c) !== expectedTrip[c.id]);
  check(`${label}: requests carry the asker's trip (${inbox.filter((c) => c.trip).map((c) => `${nameOf[c.id]}=${c.trip.city}`).join(', ')})`,
    wrongTrips.length === 0 && inbox.some((c) => c.trip),
    wrongTrips.map((c) => `${nameOf[c.id]}: ${tripOf(c)} vs ${expectedTrip[c.id]}`).join('; '));
  const outbox = await allPages('/users/me/requests/sent');
  check(`${label}: requests sent (${names(sent)})`, sameSet(new Set(outbox.map((c) => c.id)), new Set(sent)), names(outbox.map((c) => c.id)));
  return { trips, inbox };
}

const feed = (city, extra = '') => allPages(`/discovery?city=${encodeURIComponent(city)}${extra}`);
const residents = (cards, city) => cards.filter((c) => same(c.city, city));
const visitors = (cards, city) => cards.filter((c) => c.trip && same(c.trip.city, city) && !same(c.city, city));

try {
  check('the seed names a sauna host waiting on the presenter', !!saunaKey);
  const saunaId = idOf(saunaKey);

  // 1. Sign in once (the auth endpoints allow 10 calls a minute).
  const auth = await api('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  token = auth.token;
  const me = await api('GET', '/users/me');
  check('presenter signs in and may reset the demo', me.canResetDemo === true, `canResetDemo=${me.canResetDemo}`);
  check('presenter id is the one derived from the seed address', me.id === idOf(seed.presenter), me.id);

  // 2. Starting state.
  const { trips } = await startingState('start');

  // 3. Helsinki, as the presenter sees it.
  const myHelsinki = trips.find((t) => same(t.city, HELSINKI));
  check('presenter has a Helsinki trip', !!myHelsinki);
  const hel = await feed(HELSINKI);
  check(`Helsinki shows the sauna host (${saunaKey})`, hel.some((c) => c.id === saunaId && same(c.city, HELSINKI) && hosts(c.role)), names(hel.map((c) => c.id)));
  const overlapping = visitors(hel, HELSINKI).filter((c) => c.trip.from <= myHelsinki.to && c.trip.to >= myHelsinki.from);
  check(`Helsinki shows 2+ visitors overlapping ${myHelsinki.from}..${myHelsinki.to}`, overlapping.length >= 2, names(overlapping.map((c) => c.id)));
  const fam = await feed(HELSINKI, '&lifestyle=family');
  const famRes = residents(fam, HELSINKI); const famVis = visitors(fam, HELSINKI);
  check(`Helsinki families: 2+ residents and 2+ visitors (${names(famRes.map((c) => c.id))} / ${names(famVis.map((c) => c.id))})`,
    famRes.length >= 2 && famVis.length >= 2);
  const noPhoto = [...hel, ...fam].filter((c) => !c.photoUrl);
  if (noPhoto.length) warn('some Helsinki cards have no photoUrl (photo folder missing?)', names(new Set(noPhoto.map((c) => c.id))));
  else check('every Helsinki card has a photo', true);
  // ADR-0017: Aino's profile counts the references the seed gives her.
  const ainoRefs = (seed.references ?? []).filter((r) => r.to === 'aino');
  const ainoAsHost = ainoRefs.filter((r) => r.context === 'wasHosted').length;
  const aino = await api('GET', `/users/${idOf('aino')}`);
  check(`aino's profile counts ${ainoRefs.length} references, ${ainoAsHost} as host`,
    ainoRefs.length > 0 && aino.references === ainoRefs.length && aino.referencesAsHost === ainoAsHost,
    `${aino.references} references, ${aino.referencesAsHost} as host`);

  // 4. Every seeded city: two resident hosts and at least one visitor.
  const feeds = { [HELSINKI]: hel };
  for (const city of seed.cities) {
    const cards = feeds[city] ?? (feeds[city] = await feed(city));
    const h = residents(cards, city).filter((c) => hosts(c.role));
    const v = cards.filter((c) => c.trip);
    check(`${city}: ${h.length} resident hosts, ${v.length} with a trip`, h.length >= 2 && v.length >= 1, names(cards.map((c) => c.id)));
  }
  // ADR-0016: the English name finds the same residents as the Italian one.
  const firenze = seed.cities.find((c) => same(c, 'Firenze'));
  if (firenze) {
    const it = new Set(residents(feeds[firenze], firenze).map((c) => c.id));
    const en = new Set(residents(await feed('Florence'), firenze).map((c) => c.id));
    check(`"Florence" shows the residents of ${firenze} (${names(it)})`, it.size > 0 && sameSet(it, en), names(en));
  }
  // The feed takes no date (ADR-0013): a presenter trip on arbitrary dates leaves it unchanged.
  const other = seed.cities.find((c) => !same(c, HELSINKI) && !same(c, presenter.city));
  const before = feeds[other];
  await api('POST', '/trips', { city: other, from: utcDay(37), to: utcDay(41) }, [201]);
  const after = await feed(other);
  const ids = (cards) => new Set(cards.map((c) => c.id));
  check(`${other} feed unchanged after a presenter trip ${utcDay(37)}..${utcDay(41)}`,
    sameSet(ids(residents(before, other)), ids(residents(after, other))) && sameSet(ids(visitors(before, other)), ids(visitors(after, other))),
    `${names(ids(before))} vs ${names(ids(after))}`);

  // 5. Change the state the way a demo does.
  const yes = await api('POST', `/users/${saunaId}/interest`, null, [200, 201]);
  check(`saying yes to ${saunaKey} matches at once`, yes.matched === true && !!yes.conversationId, JSON.stringify(yes));
  const opening = await allPages(`/conversations/${yes.conversationId}/messages`);
  check(`the chat with ${saunaKey} opens with their note`,
    opening.length === 1 && opening[0].senderId === saunaId && opening[0].content === noteFrom[saunaId],
    `${opening.length} messages, first from ${nameOf[opening.at(-1)?.senderId] ?? 'nobody'}`);
  await api('POST', `/conversations/${yes.conversationId}/messages`, { content: 'See you after Slush? I would love that sauna.' }, [201]);
  check('presenter sends a message mentioning Slush', true);
  const waiting = new Set(received);
  const visitor = visitors(hel, HELSINKI).find((c) => !waiting.has(c.id) && !sent.includes(c.id));
  check('a Helsinki visitor is left to ask', !!visitor);
  const ask = await api('POST', `/users/${visitor.id}/interest`, null, [200, 201]);
  check(`asking ${nameOf[visitor.id] ?? visitor.id} leaves a pending request`, ask.matched === false, JSON.stringify(ask));

  // 6. Reset, then the starting state again with the same ids.
  await api('POST', '/demo/reset', null, [204]);
  check('first reset answers 204', true);
  const me2 = await api('GET', '/users/me');
  check('presenter keeps the same id and stays signed in', me2.id === me.id, me2.id);
  const { inbox: inbox2 } = await startingState('after reset');
  check(`${saunaKey} keeps the same id and is waiting again`, inbox2.some((c) => c.id === saunaId));

  // 7. Reset again: idempotent.
  await api('POST', '/demo/reset', null, [204]);
  check('second reset answers 204', true);
  await startingState('after second reset');
} catch (e) {
  if (!/^step failed/.test(e.message)) console.log(`FAIL  ${e.message}`);
  process.exitCode = 1;
} finally {
  console.log(`demo check: ${ok} ok, ${warnings} warnings${process.exitCode ? ', FAILED' : ''} (${requests} requests)`);
}
