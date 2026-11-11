# LocalBuddy mark (concept D: a person in the doorway)

One idea: someone who lives there, standing in the open door. Frame = the door (host's place),
figure = the person. Night frame + coral figure on light; Paper frame + lifted coral on Night.

Status: proposal of 2026-11-02, **not wired into the app or the landing page yet**. The current
brand (`../*.svg`, wordmark only) is untouched. Sources are SVG; PNGs in `png/` were rendered
with headless Chrome.

## Files
- `mark.svg`, `mark-dark.svg`: main mark on light / on Night. `mark-black.svg`, `mark-white.svg`: one colour.
- `mark-small.svg`, `mark-small-dark.svg`: small-size cut (thicker frame, bigger figure). Use below 32 px.
- `lockup-horizontal.svg`, `lockup-horizontal-dark.svg`: mark + "LocalBuddy" (Playfair 600).
- `app-icon.svg` (1024, full bleed Night), `android-foreground.svg`, `android-monochrome.svg`,
  `android-background.svg` (108 dp, mark inside the 66 dp safe circle), `splash.svg`, `favicon.svg`.

## Rules
- Colours (DESIGN.md): coral `#C8324E`, coral-lifted `#F45D73`, Night `#032B43`, Paper `#F7F4F1`.
  Never put the Night frame on Night: use the `-dark` files.
- Clear space: one frame-leg width (36/256 of the mark's box) on every side.
- Minimum: main mark 32 px, small cut 16 px, lockup 120 px wide.
- Do not: recolour the figure Night on a Night ground, add a heart or pin, rotate, outline, add shadows, swap the font.

## Known limits
- Lockup, splash and app icon use live `<text>` (Playfair via `@font-face` to `web/fonts/`). Convert to
  outlines before sending to a printer or a store listing.
- Some files use a `transform` to place the mark; harmless for rendering, flatten before handing to a designer.
- Not checked: trademark search (EUIPO TMview, reverse image search). The arch-plus-person idea is common; do it before investing.
- Not seen on a real launcher or in a splash on Android 12+.
