// Writes the "two threads" mark (concept E) and every brand SVG that carries it.
// Two lives come in from opposite corners, twist round each other three times, and go on.
// usage: node make-mark-e.mjs   then   node render-brand.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../../..');
const brand = join(root, 'mobile/assets/brand');
const NIGHT = '#032B43', PAPER = '#F7F4F1', CORAL = '#C8324E', LIFTED = '#F45D73';

// Geometry in a 256 box. y = 128 -/+ env(x) * cos(phase(x)): wide apart at the ends, a tight
// twist in the middle. Three crossings, so each thread leaves on the side it did not enter.
// The small cut (header, favicon, sign-in) has thicker threads and a looser twist: below about
// 48 px the main one thins into hairlines.
const X0 = 26, X1 = 230, TWIST0 = 44, TWIST1 = 212, WIDE = 84;
const MAIN = { tight: 18, stroke: 24, gap: 7 };
const SMALL = { tight: 24, stroke: 34, gap: 8 };
// Eased in and out, so a thread bends into the twist instead of turning a corner.
const ease = (t) => t * t * (3 - 2 * t);
const phase = (x) => 3 * Math.PI * ease(Math.min(1, Math.max(0, (x - TWIST0) / (TWIST1 - TWIST0))));
// The threads cross where the cosine changes sign.
const crossings = [];
for (let x = X0 + 1; x <= X1; x += 1) if (Math.cos(phase(x - 1)) * Math.cos(phase(x)) <= 0 && crossings.at(-1) !== x - 1) crossings.push(x);

let n = 0;
/// The mark as a fragment in a 256 box. `a` enters top left, `b` bottom left.
function mark(a, b, cut = MAIN) {
  const env = (x) => cut.tight + (WIDE - cut.tight) * Math.min(1, Math.abs(x - 128) / (128 - X0)) ** 3;
  const path = (sign, from = X0, to = X1) => {
    let d = "";
    for (let x = from; x <= to; x += 1) d += `${d ? "L" : "M"}${x} ${(128 - sign * env(x) * Math.cos(phase(x))).toFixed(1)}`;
    return d;
  };
  // Where a thread passes under, the other one's outline is cut out of it: no ground colour needed.
  const hole = (sign, at) =>
    at.map((x) => `<path d="${path(sign, x - 15, x + 15)}" stroke="#000" stroke-width="${cut.stroke + 2 * cut.gap}"/>`).join("");
  const id = `e${n++}`;
  const stroke = `fill="none" stroke-width="${cut.stroke}" stroke-linecap="round" stroke-linejoin="round"`;
  const mask = (name, holes) =>
    `<mask id="${id}${name}" maskUnits="userSpaceOnUse" x="0" y="0" width="256" height="256" fill="none"><rect width="256" height="256" fill="#fff"/>${holes}</mask>`;
  return (
    `<defs>${mask("a", hole(-1, [crossings[1]]))}${mask("b", hole(1, [crossings[0], crossings[2]]))}</defs>` +
    `<path ${stroke} stroke="${b}" mask="url(#${id}b)" d="${path(-1)}"/>` +
    `<path ${stroke} stroke="${a}" mask="url(#${id}a)" d="${path(1)}"/>`
  );
}
const svg = (box, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}">\n  <title>LocalBuddy</title>\n  ${body}\n</svg>\n`;
const placed = (cx, cy, scale, a, b, cut) =>
  `<g transform="translate(${cx} ${cy}) scale(${scale}) translate(-128 -128)">${mark(a, b, cut)}</g>`;
const font =
  "<style>@font-face { font-family: 'Playfair Display'; font-weight: 600; src: url('../../../web/fonts/playfair-display-latin-600-normal.woff2') format('woff2'); } text { font-family: 'Playfair Display', serif; font-weight: 600; }</style>";

const files = {
  'mark-e/mark.svg': svg(256, mark(NIGHT, CORAL)),
  'mark-e/mark-dark.svg': svg(256, mark(PAPER, LIFTED)),
  'mark-e/mark-white.svg': svg(256, mark('#FFFFFF', '#FFFFFF')),
  'mark-e/mark-small.svg': svg(256, mark(NIGHT, CORAL, SMALL)),
  'mark-e/mark-small-dark.svg': svg(256, mark(PAPER, LIFTED, SMALL)),
  '../../../web/logo-mark.svg': svg(256, mark(NIGHT, CORAL, SMALL)),
  '../../../web/logo-mark-dark.svg': svg(256, mark(PAPER, LIFTED, SMALL)),
  'icon.svg': svg(1024, `<rect width="1024" height="1024" fill="${NIGHT}"/>\n  ${placed(512, 512, 2.9, PAPER, LIFTED)}`),
  // 108 dp canvas, the mark inside the 66 dp circle every launcher mask keeps
  'android-icon-foreground.svg': svg(108, placed(54, 54, 0.23, PAPER, LIFTED)),
  'android-icon-monochrome.svg': svg(108, placed(54, 54, 0.23, '#FFFFFF', '#FFFFFF')),
  'favicon.svg': svg(48, `<rect width="48" height="48" rx="10" fill="${NIGHT}"/>\n  ${placed(24, 24, 0.16, PAPER, LIFTED, SMALL)}`),
  'splash-icon.svg': svg(
    300,
    `${font}\n  ${placed(150, 112, 0.5, PAPER, LIFTED)}\n  <text x="150" y="226" font-size="40" text-anchor="middle"><tspan fill="${PAPER}">Local</tspan><tspan fill="${LIFTED}">Buddy</tspan></text>`
  ),
};
mkdirSync(join(brand, 'mark-e/png'), { recursive: true });
for (const [name, body] of Object.entries(files)) {
  writeFileSync(join(brand, name), body);
  console.log(name);
}
