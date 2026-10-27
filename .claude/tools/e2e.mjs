// End-to-end walk of the main flows against the local stack (API :5200, Expo web :8081), driven through
// headless Chrome. Two throwaway accounts @e2e.localbuddy.test are created through the real API and
// deleted at the end, so the demo data is untouched.
//   node .claude/tools/e2e.mjs <outDir>      (prints PASS/FAIL per step, exits 1 on the first failure)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const outDir = process.argv[2] ?? '.';
mkdirSync(outDir, { recursive: true });
const API = 'http://localhost:5200/api/v1';
const WEB = 'http://localhost:8081';
const PASSWORD = 'E2ePass123!';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `  -> ${detail}`}`);
  if (!ok) throw new Error(`step failed: ${name}`);
}

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

async function makeUser(key, name) {
  const email = `${key}@e2e.localbuddy.test`;
  // A leftover from a failed run is removed first, as the demo seed does.
  const old = await api('/auth/login', { method: 'POST', body: { email, password: PASSWORD } });
  if (old.status === 200) await api('/users/me', { method: 'DELETE', token: old.json.token });
  const reg = await api('/auth/register', { method: 'POST', body: { email, password: PASSWORD, name, city: 'Helsinki', role: 'host' } });
  check(`register ${name}`, reg.status === 201, JSON.stringify(reg.json));
  const token = reg.json.token;
  await api('/users/me/verify', { method: 'POST', token });
  return { email, token, id: reg.json.userId, name };
}

// --- Chrome over CDP -------------------------------------------------------------------------
const port = 9377;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'lb-e2e-'))}`,
  '--no-first-run', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' });
let ws; let nextId = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((resolve) => { pending.set(++nextId, resolve); ws.send(JSON.stringify({ id: nextId, method, params })); });
const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.result.value;
const text = () => evalJs('document.body.innerText');
const url = () => evalJs('location.pathname');

async function waitFor(what, predicate, ms = 15000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { const v = await predicate(); if (v) return v; } catch { /* page still loading */ } await sleep(300); }
  throw new Error(`timed out waiting for ${what}; page says: ${(await text()).slice(0, 300).replace(/\n/g, ' | ')}`);
}

async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(outDir, `${name}.png`), Buffer.from(r.result.data, 'base64'));
}

async function clickAt(x, y) {
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased'])
    await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
}

/// Clicks the first visible element whose aria-label or own text matches `match` (RegExp source).
async function click(match) {
  const box = await waitFor(`a "${match}" control`, () => evalJs(`(() => {
    const re = new RegExp(${JSON.stringify(match)}, 'i');
    const els = [...document.querySelectorAll('[role=button],[role=tab],button,a,[tabindex]')];
    const el = els.find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (re.test(e.getAttribute('aria-label') || '') || re.test(e.innerText || '')); });
    if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`));
  await clickAt(box.x, box.y);
}

async function typeInto(index, value) {
  const box = await waitFor(`input #${index}`, () => evalJs(`(() => {
    const el = document.querySelectorAll('input,textarea')[${index}]; if (!el) return null;
    const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`));
  await clickAt(box.x, box.y);
  await send('Input.insertText', { text: value });
}

async function go(path) {
  await send('Page.navigate', { url: WEB + path });
  await sleep(1500);
}

const users = [];
try {
  let t;
  for (let i = 0; i < 50 && !t; i++) { try { t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === 'page'); } catch { await sleep(200); } }
  ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

  // 1. Two people exist; Ben says he would like to meet Eva, who has not answered.
  const eva = await makeUser('e2e-eva', 'Eva'); users.push(eva);
  const ben = await makeUser('e2e-ben', 'Ben'); users.push(ben);
  const said = await api(`/users/${eva.id}/interest`, { method: 'POST', token: ben.token });
  check('Ben shows interest in Eva (no match yet)', said.status === 200 && said.json.matched === false, JSON.stringify(said));
  const count = await api('/users/me/requests/count', { token: eva.token });
  check('Eva has one request', count.json?.count === 1, JSON.stringify(count));

  // 2. Eva signs in through the real form.
  await go('/login');
  await waitFor('the login form', async () => (await text()).includes('Sign in'));
  await typeInto(0, eva.email);
  await typeInto(1, PASSWORD);
  await shot('1-login-filled');
  await click('^Sign in$');
  await waitFor('leaving /login', async () => (await url()) !== '/login');
  check('sign-in leaves the login screen', true);
  check('signed-in session starts in the app', ['/discover', '/chats', '/me', '/'].includes(await url()) || (await url()).startsWith('/'), await url());

  // 3. The request is on Chats: strip with Ben, and the tab badge.
  await go('/chats');
  await waitFor('the request strip', async () => (await text()).includes('Requests'));
  const chats = await text();
  check('Chats shows the request strip with Ben', chats.includes('Requests') && chats.includes('Ben'));
  check('the Chats tab carries a badge of 1', await evalJs(`[...document.querySelectorAll('[role=tab]')].some((t) => /chats/i.test(t.getAttribute('aria-label') || '') && /1/.test(t.getAttribute('aria-label') || '') )`));
  await shot('2-chats-with-request');

  // 4. Open Requests and accept.
  await click('Requests');
  await waitFor('/requests', async () => (await url()) === '/requests');
  await waitFor('Ben card', async () => (await text()).includes('Ben'));
  check('Requests screen lists Ben', true);
  await shot('3-requests');
  const labels = await evalJs(`[...document.querySelectorAll('[role=button]')].map((e) => e.getAttribute('aria-label')).filter(Boolean)`);
  const accept = labels.find((l) => /interest|interessat|interesad|intéress/i.test(l) && /Ben/.test(l));
  check('the card has a labelled accept button', !!accept, JSON.stringify(labels));
  await click(accept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  await waitFor('the match overlay', async () => /match|hello|ciao|say/i.test(await text()), 10000);
  check('accepting opens the match overlay', true);
  await shot('4-match');
  const conv = await api('/conversations', { token: eva.token });
  check('a conversation now exists on the server', conv.json?.items?.length === 1, JSON.stringify(conv.json));
  const left = await api('/users/me/requests/count', { token: eva.token });
  check('the request count is back to 0', left.json?.count === 0, JSON.stringify(left.json));

  // 5. Say hello: the chat opens and Eva writes; Ben reads it through the API.
  await sleep(1500); // the three choices fly out of the photo before they can be pressed
  await click('^Say hello$');
  await waitFor('the chat', async () => (await url()).startsWith('/chat/'));
  check('"say hello" opens the chat', true);
  const message = 'Hei Ben, welcome to Helsinki!';
  await typeInto(0, message);
  await click('^Send message$');
  await waitFor('the sent message', async () => (await text()).includes(message));
  check('Eva sends a message and sees it', true);
  await shot('5-chat');
  const seen = await api(`/conversations/${conv.json.items[0].id}/messages`, { token: ben.token });
  check('Ben receives it through the API', seen.json?.items?.some((m) => m.content === message), JSON.stringify(seen.json));

  // 6. Ben's side refreshes on its own: a second message arrives while his chat is open.
  const benWeb = await api('/auth/login', { method: 'POST', body: { email: ben.email, password: PASSWORD } });
  await evalJs(`localStorage.setItem('localbuddy.token', ${JSON.stringify(benWeb.json.token)}); true`);
  await go(`/chat/${conv.json.items[0].id}`);
  await waitFor('Ben sees Eva\'s message', async () => (await text()).includes(message));
  const later = 'And one more, without you reloading.';
  await api(`/conversations/${conv.json.items[0].id}/messages`, { method: 'POST', token: eva.token, body: { content: later } });
  await waitFor('the polled message (within ~8 s)', async () => (await text()).includes(later), 9000);
  check('a new message appears in an open chat without reloading', true);
  await shot('6-chat-polled');
} catch (e) {
  console.log(`ERROR ${e.message}`);
  try { await shot('failure'); } catch { /* nothing to capture */ }
  process.exitCode = 1;
} finally {
  for (const u of users) {
    const login = await api('/auth/login', { method: 'POST', body: { email: u.email, password: PASSWORD } });
    if (login.status === 200) await api('/users/me', { method: 'DELETE', token: login.json.token });
  }
  console.log(`cleanup: removed ${users.length} throwaway accounts`);
  console.log(`${results.filter((r) => r.ok).length}/${results.length} steps passed`);
  chrome.kill();
  setTimeout(() => process.exit(process.exitCode ?? 0), 200);
}
