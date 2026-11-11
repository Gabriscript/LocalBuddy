// Renders the brand SVGs in mobile/assets/brand to the PNGs app.json points at, with the
// installed headless Chrome (transparent background, 1 CSS px = 1 image px).
// usage: node render-brand.mjs   (from anywhere)
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../../..');
const brand = join(root, 'mobile/assets/brand');
const out = join(root, 'mobile/assets/images');
// [source, output relative to mobile/assets/images, width, height]
const jobs = [
  ['icon.svg', 'icon.png', 1024, 1024],
  ['favicon.svg', 'favicon.png', 48, 48],
  ['favicon.svg', '../../../web/favicon.png', 64, 64],
  ['android-icon-background.svg', 'android-icon-background.png', 432, 432],
  ['android-icon-foreground.svg', 'android-icon-foreground.png', 432, 432],
  ['android-icon-monochrome.svg', 'android-icon-monochrome.png', 432, 432],
  // 3x the 184 dp imageWidth in app.json; the viewBox is square (mark above wordmark, inside the 192 dp circle)
  ['splash-icon.svg', 'splash-icon.png', 552, 552],
  // the sign-in screen draws the mark as an image, one per theme
  ['mark-e/mark-small.svg', '../brand/mark-e/png/mark.png', 512, 512],
  ['mark-e/mark-small-dark.svg', '../brand/mark-e/png/mark-dark.png', 512, 512],
];
const port = 9334;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'lb-brand-'))}`,
  '--no-first-run', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let list;
  for (let i = 0; i < 50 && !list; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(200); } }
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await send('Page.enable');
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  for (const [svg, png, width, height] of jobs) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: pathToFileURL(join(brand, svg)).href });
    await sleep(300);
    // the SVGs use Playfair via @font-face: capture only once it has loaded
    await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
    await sleep(150);
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width, height, scale: 1 } });
    writeFileSync(join(out, png), Buffer.from(shot.result.data, 'base64'));
    console.log(png, width, height);
  }
  ws.close();
} finally {
  chrome.kill();
}
