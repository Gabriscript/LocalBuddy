---
name: LocalBuddy
description: A cultural exchange between travellers and locals, never a paid guide service.
colors:
  coral: "#C8324E"
  coral-lifted: "#F45D73"
  night: "#032B43"
  night-raised: "#174763"
  sky: "#CFE6EF"
  paper: "#F7F4F1"
  card: "#FEFDFC"
  paper-sunk: "#EFEAE5"
  text: "#1C1A19"
  text-muted: "#6B6560"
  hairline: "#E6E1DC"
  dark-page: "#021C2C"
  dark-card: "#06283D"
  dark-sunk: "#0B3248"
  dark-text: "#F2F6F8"
  dark-text-muted: "#9FB3C0"
  dark-hairline: "#16405A"
  verified: "#0B6E20"
  verified-dark: "#5CD37B"
  refusal: "#DC2626"
  refusal-dark: "#F87171"
typography:
  display:
    fontFamily: "PlayfairDisplay_600SemiBold"
    fontSize: "32px"
    lineHeight: "40px"
  title:
    fontFamily: "PlayfairDisplay_600SemiBold"
    fontSize: "22px"
    lineHeight: "30px"
  body:
    fontFamily: "Geist_400Regular"
    fontSize: "16px"
    lineHeight: "24px"
  label:
    fontFamily: "Geist_600SemiBold"
    fontSize: "14px"
    lineHeight: "20px"
  caption:
    fontFamily: "Geist_400Regular"
    fontSize: "13px"
    lineHeight: "18px"
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.paper-sunk}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "52px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "52px"
  button-danger:
    backgroundColor: "{colors.refusal}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "52px"
  chip:
    backgroundColor: "{colors.paper-sunk}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.text}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "{colors.paper-sunk}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "52px"
  icon-button:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.pill}"
    height: "56px"
    width: "56px"
---

# Design System: LocalBuddy

## 1. Overview

**Creative North Star: "The Letter of Introduction"**

Hospitality networks ran on letters long before they ran on apps. Servas members carried one from 1949 onwards: paper, a name written out in full, a stranger vouched for. LocalBuddy is that letter, on a phone. The surface is warm paper, the names are set in a serif that belongs on printed matter, and apart from one coral control and the Night band at the top of a tab, the only saturated thing on a screen is the photograph of a person or a street.

The system is quiet on purpose, because of what the product is not. Paying for the experience itself is forbidden by law in Italy (GUIDELINES section 2), so nothing may look like a marketplace: no price tags, no urgency, no booking chrome. The match is mutual and free, so nothing may look like dating: no blush glow, no heart, no flame. Both readings attract exactly the wrong person to a service where a stranger walks you around their neighbourhood and sometimes puts you up for the night.

Density is low and the rhythm is generous. A discovery card shows one person at a time, at a size that makes reading their answer to "what would we do together" the natural next move rather than swiping past it.

**Key Characteristics:**
- Warm paper neutrals, never white, never black.
- One accent, coral, on the primary action and nothing else, as a flat fill.
- Playfair for names, Geist for everything a finger touches.
- Flat by default: depth comes from paper against card, not from shadow.
- Photography is the only colour the interface allows itself.

## 2. Colors

Paper and coral under a Night band, with the rest of the saturation left to the photographs.

### Primary
- **Coral** (`#C8324E`): the primary action, and only that. The filled button, the active tab, the tick that says "I would like to meet you". White on it is 5.22:1; as a label it is 5.14:1 on Card and 4.76:1 on Paper. In dark mode it lifts to **Lifted Coral** (`#F45D73`) with a Night label (4.66:1), so it stays legible on navy instead of sinking into it (5.53:1 on Dark Page, 4.83:1 on Dark Card). Always a flat fill: no glow, no gradient.

### Brand
- **Night** (`#032B43`): brand surfaces only. The header band of the three tab screens, the splash, the app icon. The same in both themes. Paper on it is 13.40:1. A control laid on the band is **Night Raised** (`#174763`), Paper on it 9.05:1.
- **Sky** (`#CFE6EF`): decoration. The circles on the band and on the icon. As text it appears only on Night (the line under a band's title, 11.34:1), and it is never the background of body copy.

### Neutral
- **Paper** (`#F7F4F1`): the page. Warm off-white, so a card laid on it is visible without a shadow.
- **Card** (`#FEFDFC`): anything laid on the page. Cards, sheets, the tab bar.
- **Sunk Paper** (`#EFEAE5`): anything you type into or toggle. Inputs, chips at rest, the other person's chat bubbles, skeleton blocks.
- **Text** (`#1C1A19`): body and headings. Warm near-black, never `#000000`.
- **Muted Text** (`#6B6560`): captions, secondary lines, placeholders. 4.87:1 against Sunk Paper, so it stays readable on the darkest neutral it can land on.
- **Hairline** (`#E6E1DC`): every border in the app is one hairline of this.
- Dark mode re-tones the same roles onto navy rather than warm black, so the page reads as the band's own colour turned down: **Dark Page** (`#021C2C`), **Dark Card** (`#06283D`), **Dark Sunk** (`#0B3248`), **Dark Text** (`#F2F6F8`, 12.35:1 on Dark Sunk), **Dark Muted** (`#9FB3C0`, 6.19:1 on Dark Sunk), **Dark Hairline** (`#16405A`).

### Tertiary
- **Verified** (`#0B6E20`): the identity badge, and nothing else. Green means "this person showed a document", never "success" in general. Dark mode `#5CD37B` (7.07:1 on Dark Sunk).
- **Refusal** (`#DC2626`): validation errors and destructive confirmations only. Dark mode `#F87171` (4.85:1 on Dark Sunk; a Night label on it is 5.31:1).

### Named Rules

**The Quiet Accent Rule.** One coral element at a time: the primary action of a screen, or the raised Discover circle while Discover is active, and nothing else. If two controls in view are coral, one of them is wrong. The coral circle on the band is decoration on a brand surface, not a control, and does not count. Selection state is carried by Text on Paper (the filled chip), not by the accent.

**The Not A Dating App Rule.** Coral is a flat accent on a control, never a mood: no glow, no gradient, no blush wash over a photograph, no pink-to-red ramp. No heart, no flame, no spark. The mechanic is mutual interest; the visual language is an introduction, not a courtship.

**The Photographs Carry The Colour Rule.** The interface contributes paper, one coral accent, the Night band with its two circles, and one green badge. Everything else chromatic on the screen is a photograph of a person or a place.

## 3. Typography

**Display Font:** Playfair Display SemiBold (600)
**Body Font:** Geist Regular (400) and Geist SemiBold (600)

**Character:** A high contrast serif next to a neutral grotesque. Playfair gives a name the weight of something printed; Geist gets out of the way and stays legible at 13px on a phone held at arm's length on a street.

### Hierarchy
- **Display** (Playfair 600, 32/40): the name of a screen and the name of a person on their profile. One per screen.
- **Title** (Playfair 600, 22/30): section names inside a profile ("What we'll do"), and the name on a discovery card.
- **Body** (Geist 400, 16/24): everything anyone reads in sentences. Profile answers, messages, hints, empty states.
- **Label** (Geist 600, 14/20): buttons, chips, field labels, tab names.
- **Caption** (Geist 400, 13/18): the line under a field, the pill text, the secondary line of a row.

### Named Rules

**The Names Rule.** Playfair sets names: a person, a city, a screen, a section. It never sets a button, a chip, a field label or a tab. A serif on a control reads as decoration and slows the eye exactly where it should not be slowed.

**The Weight Lives In The Family Rule.** Never reach for `fontWeight` on a custom face. Android ignores it and synthesises nothing, so the bold that looked right on iOS is missing on half the devices. Pick the family that already carries the weight.

## 4. Elevation

The system is flat. There is not one `shadowOffset` in the app and there should not be. Depth is tonal: Paper is the page, Card sits on it, Sunk Paper sits in it, and a single hairline separates whatever still needs separating after that.

This is why the neutrals are warm rather than white. On a pure white page a card can only be drawn by its border, which is how an interface ends up as a stack of rectangles. On warm paper the card is lighter than its surroundings and needs no outline to exist.

Three things float over content rather than sitting in it: the filter sheet, the profile's action row and the chat composer. The sheet is anchored to an edge and carries a hairline on the side that faces the content; the action row and the composer have no bar behind them at all, only their own controls, each a surface with its own hairline or Coral fill. None of them uses a shadow to announce itself.

### Named Rules

**The Flat By Default Rule.** No drop shadows, no elevation, no glass. If two things need separating, try tone first, then a hairline. If neither works, the layout is wrong, not the shadow missing.

## 5. Components

### Buttons
- **Shape:** fully rounded (pill, 999px), 52px tall, 24px of horizontal padding. 52 clears the 44pt minimum with room for larger type before anything clips.
- **Primary:** Coral fill, white label (Lifted Coral with a Night label in dark mode). One per screen.
- **Secondary:** Sunk Paper fill, Text label. The companion action, such as "Try again" under an error.
- **Quiet:** no fill, no border, Text label. For anything deliberately understated, such as signing out or the paid unlock.
- **Danger:** Refusal fill, white label. Only for confirming something that takes away: blocking a member, and one day deleting an account. Never for an ordinary action that happens to feel serious.
- **States:** pressed drops opacity to 0.75, disabled to 0.45, and neither moves the bounds, so nothing around the button jumps. A loading button shows a spinner beside its label and reports `aria-busy`.

### Chips
- **Style:** pill, 44px tall, Sunk Paper fill with a hairline at rest.
- **Selected:** Text fill, Paper label. Selection is a tonal inversion, not the accent.
- **Roles:** a single choice group is `role="radio"` inside `role="radiogroup"`; a multiple choice group is `role="checkbox"`. Never a plain button with a colour change, which says nothing to a screen reader.
- **Segmented:** the one exception to chips, for who the feed shows. A full-pill Sunk Paper track with a hairline, the chosen option a Card thumb with a hairline and a Text label, the others Muted Text. Still a `radiogroup` of `radio`s.

### Cards
- **Corner Style:** 20px, the largest radius in the system, reserved for the thing that holds a person.
- **Background:** Card, on Paper, with one hairline border and clipped corners so the photograph reaches them.
- **Headline:** the name in Playfair with the Verified badge on the right, only for a verified identity; under it the city, the role and the rating in Muted Text.
- **Photo:** 4:3, declared as a ratio so the row keeps its height before the image arrives. Taller, and the name, the pills and the two decisions fall below the fold.
- **Composition:** photograph, then name and city, then pills, then the one line that matters. The two round decision buttons are siblings of the card body, never nested inside it: a tappable card wrapping tappable buttons is ambiguous about what a tap meant.

### Profile
- The primary photo runs full width from the top edge, with round Card buttons over it for back and for report or block. The home photos follow the words as a row of 12px thumbnails.
- The two decisions float at the bottom with no bar behind them: a round Card button with a hairline to pass, and the Coral capsule to show interest. The paid unlock sits at the end of the profile as a quiet button, away from both.

### Conversation
- The header is Card with a hairline below it: back, a small round photo, the name and the city.
- Their bubbles are Sunk Paper; mine are Card with a hairline. Coral belongs to the send button alone. 18px corners, with the corner on the sender's side cut to 6px as the tail.
- The composer floats above the bottom inset: a Sunk Paper capsule with a hairline and a round Coral send button.

### Inputs
- **Style:** Sunk Paper fill, hairline border, 12px radius, 52px tall to match a button.
- **Label:** always above the field, always visible. A placeholder is not a label: it vanishes the moment someone starts typing, which is when they need it.
- **Error:** the border turns Refusal and the message appears below the field with `role="alert"`.
- **Multiline:** 104px, text starting at the top rather than floating in the middle of the box.

### Navigation
- A floating bar: one capsule of Card with a hairline all round, 16px in from each side and 8px above the bottom safe area. It floats over the content, so every tab screen ends its scroll with enough room for the last item to clear it.
- Three destinations, each with an icon and a word. An icon alone is a guess. Discover sits in the middle, raised: a 56px circle centred on the capsule's top edge, so half of it stands above the bar, set in a 6px ring of Paper so it reads as cut out of the bar rather than stuck on it. Its word sits on the same line as the other two.
- The active destination is Coral: the word and the filled icon at the sides, the whole circle in the middle. At rest the sides are Muted Text with an outline icon, and the circle is Sunk Paper with a hairline. Only one thing in the bar is ever Coral.
- The three tab screens open under a **header band** of Night, from the top edge under a light status bar, in both themes. The screen's name in Display, Paper; an optional line under it in Sky; at most one control on the right, a round Night Raised button with a Paper icon (the Discover filters). A Coral circle bleeds off the top-right corner with a Sky circle partly behind it: flat, `aria-hidden`, and never under the title or the control. The control column stays reserved on screens without one, so a long title wraps before it reaches the circles. The band ends on a straight edge, and everything else (the role switch, the feed, the list) starts on the page below it. One component, `TabHeader`, draws it for all three.
- No shadow, no glow, no glass. The bar is a surface like any other, separated by tone and a hairline.
- The bar is a `tablist` and each destination a `tab` with `aria-selected`. Icons inside it are always `aria-hidden`, or a screen reader reads each tab as an empty string followed by its name.

### The curved menu (landing page only)
- Below 860px the four header links give way to one button, and the menu opens as a circle growing out of that button: the curve is the movement, not a shape drawn around the panel. Above 860px the links stay where they can be seen — hiding four of them where there is room to show them costs more than it buys.
- Ink panel (`#1E3A5C`: the landing page has not taken the Coral and Night palette yet), Paper text, and in dark mode the same pair the other way round. The sections are a numbered list whose numbers are drawn by a CSS counter, so the order cannot disagree with the list. The language link sits below and outside it: it leaves the page rather than moving you down it, so it is neither numbered nor set in the display face.
- The letters rise one after another, each waiting on the one before it. This happens on opening, not only on hover: the menu exists only below 860px, and most of what is below 860px has no pointer at all. Hover repeats it for anyone who has one.
- It is a modal dialog with a name. Everything behind it is `inert` while it is open, Escape closes it, and focus returns to the button that opened it. None of it moves when the system asks for less motion, and all of it still works.

### Loading
- Lists load into their own shape: the discovery feed shows cards down to the 4:3 block, the conversation list shows rows. One pulse, 0.65 to 1 opacity over 700ms each way, drives every block on a screen, and no pulse at all when the system asks for less movement. Screens without a known shape keep a centred spinner.

### Sheets
- Everything that asks a question without leaving the screen slides up from the bottom edge: the filters, the safety actions, the review, the paid unlock. One shell (`Sheet`), a title, a close button, and a footer that holds the one or two buttons that finish the job.
- A sheet is mounted only while it is open, so it always starts from the current state. The cost is no slide-out animation, which nobody waits for.

### The match moment
- The one screen allowed to celebrate. The other person's photograph sits in the middle and the next actions come out of it like satellites, then wind back in when it is dismissed: the ring turns as it opens and unwinds as it closes, while each satellite turns the other way so its label stays upright.
- Labels live under the circles, always visible. A phone has no hover, and an unlabelled circle is a guess.
- It appears without any motion when the system asks for less, and it is a dialog with a name, not an effect.

### Named Rules

**The Whole Row Rule.** A labelled on/off choice is one control: the row. Not a small switch beside text that does nothing when tapped. The switch is drawn, `aria-hidden`, and the row reports the state.

**The Skeleton Not Spinner Rule.** Any list whose shape is known loads as that shape. A spinner in the middle of an empty screen tells the reader nothing about what is coming.

## 6. Do's and Don'ts

### Do:
- **Do** use `role` and `aria-*` props. React Native maps them on iOS, Android and the web, where `accessibilityState` never reaches the DOM.
- **Do** give every screen title and profile section `role="heading"`, so the screen can be navigated by headings.
- **Do** hide decorative icons with `aria-hidden`. A pill icon read aloud is an empty string in the middle of a sentence.
- **Do** carry the whole meaning of a card or a row in its accessible label. A card is one control, and its children are never read out.
- **Do** keep every tap target at 44pt or more, and every text pair at 4.5:1 or better against the surface behind it, in both themes.
- **Do** check both themes before calling anything finished.

### Don't:
- **Don't** introduce a second accent. One coral, one verified green, one refusal red, and nothing else. Night and Sky are brand surfaces, not accents.
- **Don't** use a glow, a gradient, a heart, a flame or a countdown. This is not a dating app and not a marketplace.
- **Don't** put a price, a discount or scarcity language anywhere near the experience itself. Paying for it is illegal (GUIDELINES section 2); the only thing that can be paid for is skipping the match.
- **Don't** use `#FFFFFF` or `#000000`. Paper and warm near-black exist for this reason.
- **Don't** set body text in the system face. The app read as iOS on a phone and as Windows in a browser before Geist landed.
- **Don't** put a display serif on a button, a chip, a field label or a tab.
- **Don't** add a drop shadow to create depth. Tone, then a hairline.
- **Don't** add perpetual animation. Motion reports state: a press, a load, a change. Nothing loops for decoration, and everything that moves stops when the system asks for less movement.
- **Don't** write an em dash in anything a member reads. A comma, a colon or a full stop says it without the typographic flourish.
- **Don't** ship a control that does nothing. A button with an empty handler is a promise the product has not kept yet.
