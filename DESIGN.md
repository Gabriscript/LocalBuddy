---
name: LocalBuddy
description: A cultural exchange between travellers and locals, never a paid guide service.
colors:
  ink: "#1E3A5C"
  ink-lifted: "#A8C4EA"
  paper: "#F7F4F1"
  card: "#FEFDFC"
  paper-sunk: "#EFEAE5"
  text: "#1C1A19"
  text-muted: "#6B6560"
  hairline: "#E6E1DC"
  night: "#141212"
  night-card: "#1E1B1B"
  night-sunk: "#262222"
  night-text: "#F5F2F0"
  night-text-muted: "#A9A19B"
  night-hairline: "#332E2E"
  verified: "#0B6E20"
  refusal: "#DC2626"
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
    backgroundColor: "{colors.ink}"
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

Hospitality networks ran on letters long before they ran on apps. Servas members carried one from 1949 onwards: paper, a name written out in full, a stranger vouched for. LocalBuddy is that letter, on a phone. The surface is warm paper, the names are set in a serif that belongs on printed matter, and the only saturated thing on any screen is the photograph of a person or a street.

The system is quiet on purpose, because of what the product is not. Paying for the experience itself is forbidden by law in Italy (GUIDELINES section 2), so nothing may look like a marketplace: no price tags, no urgency, no booking chrome. The match is mutual and free, so nothing may look like dating: no rose accent, no heart, no flame. Both readings attract exactly the wrong person to a service where a stranger walks you around their neighbourhood and sometimes puts you up for the night.

Density is low and the rhythm is generous. A discovery card shows one person at a time, at a size that makes reading their answer to "what would we do together" the natural next move rather than swiping past it.

**Key Characteristics:**
- Warm paper neutrals, never white, never black.
- One accent, ink, on the primary action and nothing else.
- Playfair for names, Geist for everything a finger touches.
- Flat by default: depth comes from paper against card, not from shadow.
- Photography is the only colour the interface allows itself.

## 2. Colors

Paper and ink, with the saturation left to the photographs.

### Primary
- **Ink** (`#1E3A5C`): the primary action, and only that. The filled button, the active tab, the tick that says "I would like to meet you". Deep enough to read as a considered mark rather than a notification. In dark mode it lifts to **Lifted Ink** (`#A8C4EA`) so it stays legible on a dark surface instead of sinking into it.

### Neutral
- **Paper** (`#F7F4F1`): the page. Warm off-white, so a card laid on it is visible without a shadow.
- **Card** (`#FEFDFC`): anything laid on the page. Cards, sheets, the tab bar.
- **Sunk Paper** (`#EFEAE5`): anything you type into or toggle. Inputs, chips at rest, chat bubbles, skeleton blocks.
- **Text** (`#1C1A19`): body and headings. Warm near-black, never `#000000`.
- **Muted Text** (`#6B6560`): captions, secondary lines, placeholders. 4.87:1 against Sunk Paper, so it stays readable on the darkest neutral it can land on.
- **Hairline** (`#E6E1DC`): every border in the app is one hairline of this.
- Dark mode re-tones the same roles: **Night** (`#141212`), **Night Card** (`#1E1B1B`), **Night Sunk** (`#262222`), **Night Text** (`#F5F2F0`), **Night Muted** (`#A9A19B`), **Night Hairline** (`#332E2E`).

### Tertiary
- **Verified** (`#0B6E20`): the identity badge, and nothing else. Green means "this person showed a document", never "success" in general.
- **Refusal** (`#DC2626`): validation errors and destructive confirmations only.

### Named Rules

**The Quiet Accent Rule.** Ink appears on the primary action of a screen and nowhere else. If two things on one screen are ink, one of them is wrong. Selection state is carried by Text on Paper (the filled chip), not by the accent.

**The Not A Dating App Rule.** No rose, no red, no pink as an accent. No heart, no flame, no spark. The mechanic is mutual interest; the visual language is an introduction, not a courtship.

**The Photographs Carry The Colour Rule.** The interface contributes paper, ink and one green badge. Everything else chromatic on the screen is a photograph of a person or a place.

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

Two surfaces float over content rather than sitting in it: the filter sheet and the profile action bar. Both are anchored to an edge, both carry a hairline on the side that faces the content, and neither uses a shadow to announce itself.

### Named Rules

**The Flat By Default Rule.** No drop shadows, no elevation, no glass. If two things need separating, try tone first, then a hairline. If neither works, the layout is wrong, not the shadow missing.

## 5. Components

### Buttons
- **Shape:** fully rounded (pill, 999px), 52px tall, 24px of horizontal padding. 52 clears the 44pt minimum with room for larger type before anything clips.
- **Primary:** Ink fill, white label. One per screen.
- **Secondary:** Sunk Paper fill, Text label. The companion action, such as "Pass" beside "Show interest".
- **Quiet:** no fill, no border, Text label. For anything deliberately understated, such as signing out or the paid unlock.
- **Danger:** Refusal fill, white label. Only for confirming something that takes away: blocking a member, and one day deleting an account. Never for an ordinary action that happens to feel serious.
- **States:** pressed drops opacity to 0.75, disabled to 0.45, and neither moves the bounds, so nothing around the button jumps. A loading button shows a spinner beside its label and reports `aria-busy`.

### Chips
- **Style:** pill, 44px tall, Sunk Paper fill with a hairline at rest.
- **Selected:** Text fill, Paper label. Selection is a tonal inversion, not the accent.
- **Roles:** a single choice group is `role="radio"` inside `role="radiogroup"`; a multiple choice group is `role="checkbox"`. Never a plain button with a colour change, which says nothing to a screen reader.

### Cards
- **Corner Style:** 20px, the largest radius in the system, reserved for the thing that holds a person.
- **Background:** Card, on Paper, with one hairline border and clipped corners so the photograph reaches them.
- **Photo:** 4:3, declared as a ratio so the row keeps its height before the image arrives. Taller, and the name, the pills and the two decisions fall below the fold.
- **Composition:** photograph, then name and city, then pills, then the one line that matters. The two round decision buttons are siblings of the card body, never nested inside it: a tappable card wrapping tappable buttons is ambiguous about what a tap meant.

### Inputs
- **Style:** Sunk Paper fill, hairline border, 12px radius, 52px tall to match a button.
- **Label:** always above the field, always visible. A placeholder is not a label: it vanishes the moment someone starts typing, which is when they need it.
- **Error:** the border turns Refusal and the message appears below the field with `role="alert"`.
- **Multiline:** 104px, text starting at the top rather than floating in the middle of the box.

### Navigation
- Three tabs, each with an icon and a word. An icon alone is a guess. The active tab is Ink, the rest are Muted Text. Icons inside a labelled control are always `aria-hidden`, or a screen reader reads the tab as an empty string followed by its name.

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
- **Don't** introduce a second accent. One ink, one verified green, one refusal red, and nothing else.
- **Don't** use rose, a heart, a flame or a countdown. This is not a dating app and not a marketplace.
- **Don't** put a price, a discount or scarcity language anywhere near the experience itself. Paying for it is illegal (GUIDELINES section 2); the only thing that can be paid for is skipping the match.
- **Don't** use `#FFFFFF` or `#000000`. Paper and warm near-black exist for this reason.
- **Don't** set body text in the system face. The app read as iOS on a phone and as Windows in a browser before Geist landed.
- **Don't** put a display serif on a button, a chip, a field label or a tab.
- **Don't** add a drop shadow to create depth. Tone, then a hairline.
- **Don't** add perpetual animation. Motion reports state: a press, a load, a change. Nothing loops for decoration, and everything that moves stops when the system asks for less movement.
- **Don't** write an em dash in anything a member reads. A comma, a colon or a full stop says it without the typographic flourish.
- **Don't** ship a control that does nothing. A button with an empty handler is a promise the product has not kept yet.
