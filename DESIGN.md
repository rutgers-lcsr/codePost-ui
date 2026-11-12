---
name: codePost
description: A calm, green-on-white grading console where the work is the hero and the chrome stays out of the way.
colors:
  brand-green: "#198665"
  brand-green-vibrant: "#48cc98"
  brand-green-dark: "#17996e"
  brand-green-deep: "#0d7354"
  brand-green-ink: "#034d39"
  brand-green-tint: "#f0fff6"
  brand-green-wash: "rgba(25, 134, 101, 0.1)"
  console-black: "#1b1b1b"
  console-black-deep: "#0f0f0f"
  page-grey: "#f2f2f2"
  surface-white: "#ffffff"
  ink: "rgba(0, 0, 0, 0.8)"
  ink-heading: "rgba(0, 0, 0, 0.9)"
  ink-secondary: "rgba(0, 0, 0, 0.6)"
  ink-disabled: "rgba(0, 0, 0, 0.3)"
  line: "rgba(0, 0, 0, 0.2)"
  line-control: "rgba(0, 0, 0, 0.45)"
  line-soft: "rgba(0, 0, 0, 0.1)"
  danger-red: "#cf1322"
  danger-red-hover: "#a8071a"
  danger-red-active: "#820014"
  danger-tint: "#fff1f0"
  warning-amber: "#a26510"
  warning-orange-ink: "#ad4e00"
  warning-tint: "#fff7e6"
  signal-yellow: "#ffbf00"
  link-blue: "#1473cc"
  accent-blue: "#4e78ff"
  caution-band: "#ffc53d"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontWeight: 300
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    letterSpacing: "-0.2px"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5715
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  overline:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "1.5px"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
rounded:
  sm: "4px"
  md: "8px"
  lg: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "36px"
components:
  button-primary:
    backgroundColor: "{colors.brand-green}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-default:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-default-hover:
    backgroundColor: "#f5f5f5"
    textColor: "{colors.brand-green}"
  button-destructive:
    backgroundColor: "{colors.danger-red}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-destructive-hover:
    backgroundColor: "{colors.danger-red-hover}"
  icon-delete-quiet:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-secondary}"
    rounded: "999px"
    size: "32px"
  icon-delete-quiet-hover:
    textColor: "{colors.danger-red}"
  tag-default:
    backgroundColor: "{colors.brand-green-wash}"
    textColor: "{colors.brand-green-deep}"
    rounded: "{rounded.sm}"
    padding: "0 7px"
    typography: "{typography.label}"
  tag-good:
    backgroundColor: "{colors.brand-green-tint}"
    textColor: "{colors.brand-green-deep}"
    rounded: "{rounded.sm}"
    typography: "{typography.label}"
  tag-warning:
    backgroundColor: "{colors.warning-tint}"
    textColor: "{colors.warning-orange-ink}"
    rounded: "{rounded.sm}"
    typography: "{typography.label}"
  tag-error:
    backgroundColor: "{colors.danger-tint}"
    textColor: "{colors.danger-red-hover}"
    rounded: "{rounded.sm}"
    typography: "{typography.label}"
  input:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    borderColor: "{colors.line-control}"
    placeholderColor: "{colors.ink-secondary}"
    rounded: "{rounded.sm}"
    height: "32px"
  nav-item-selected:
    backgroundColor: "{colors.brand-green}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    height: "44px"
  card:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
---

# Design System: codePost

## Overview

**Creative North Star: "The Grader's Desk"**

<!-- Proposed, not yet confirmed with the owner: the metaphor and mood words below are a first draft. -->

codePost is a tool people use for hours during grading week, so its visual world is a clean desk: white
working surfaces on a quiet grey ground, one green for every action that moves work forward, and a dark
console frame (sidebar and header) that stays out of the eye line. Density is moderate and consistent: tables
at Ant Design's middle size, 14px body text, 12px as the floor for any secondary label. Nothing animates for
its own sake; the only motion is a short fade-and-rise when a page's cards arrive.

Brand expression lives in precise details rather than decoration: the green focus ring, the dark sider with
uppercase 11px "ADMIN CONSOLE" / "STAFF CONSOLE" labels, status chips that say their state in words, and
destructive controls that stay grey until you point at them. The marketing site at `/` is a separate, warmer
world (Fraunces display type, longer measure) and is not governed by the console rules below.

**Key Characteristics:**
- One accent (brand green) for primary actions, selection and focus; semantic red, orange and yellow are
  reserved for state and never used as decoration.
- Every text colour clears WCAG AA on its own surface, including tinted tags and white-on-red confirms.
- Dark console chrome, white content, grey page ground; depth by border and tone, not by shadow.
- Controls name their action ("Delete assignment", "Return to staff console", "Clear search").
- Destructive affordances are quiet at rest and explicit when armed.

## Colors

A single green against neutral blacks and greys, with semantic hues kept separate and darkened to AA.

### Primary
- **Brand Green** (#198665, green-6): primary buttons, selected sidebar item, links inside the console,
  focus ring (3px), input focus border. 4.5:1 with white text, so it is the only green allowed behind white.
- **Vibrant Green** (#48cc98): the sider's brand band and hover tints only; never behind text.
- **Deep Green** (#0d7354, green-8): text on green tints (the default tag, "Attached", the "Good" tag). 5.2:1
  on the 10% wash and 5.7:1 on the tint.
- **Green Ink** (#034d39, green-9): selected option text in dropdowns, where the row is already green-tinted.
- **Green Tint** (#f0fff6) and **Green Wash** (rgba(25,134,101,.1)): backgrounds for tags, selected rows,
  active option rows.

### Neutral
- **Console Black** (#1b1b1b) and **Console Black Deep** (#0f0f0f): sider, header and the impersonation bar;
  the deep shade is the sider's submenu and collapse trigger.
- **Page Grey** (#f2f2f2): the layout ground behind every card and table.
- **Surface White** (#ffffff): cards, tables, modals, inputs.
- **Ink** (rgba(0,0,0,.8)) for body text, **Ink Heading** (.9) for headings, **Ink Secondary** (.6) for
  descriptions, hints and timestamps (5.7:1), **Ink Disabled** (.3) for disabled text only.
- **Line** (rgba(0,0,0,.2)) for general borders, **Line Control** (.45) for the edge of inputs, selects,
  radios and checkboxes (3.4:1, the only thing showing where the control is), and **Line Soft** (.1) for
  dividers and card borders. Placeholders use Ink Secondary.
- On the dark chrome, text is white at .85 (menu items) and .6 (overlines); never grey hex values.

### Semantic
- **Danger Red** (#cf1322) with hover #a8071a and active #820014: every destructive confirm button, the red
  sidebar badge, danger text. Ant Design's default red fails AA under white text, so these are set as theme
  tokens, not per component.
- **Warning Amber** (#a26510) is the warning token; **Warning Orange Ink** (#ad4e00) on **Warning Tint**
  (#fff7e6) is the warning tag (5.1:1), used for "Pending" and "slow" latency.
- **Signal Yellow** (#ffbf00) with Console Black text: count badges in the dark sider.
- **Link Blue** (#1473cc): links in running text outside the console; **Accent Blue** (#4e78ff): the marketing site.
- **Caution Band** (#ffc53d): the 3px top band of the impersonation bar, the one place amber marks chrome.

### Named Rules
**The One Green Rule.** Brand green means "this acts or is selected". It is never a background for
paragraphs, never a decorative stripe, and never used to mean "good" in a tag (that is Deep Green on Tint).

**The AA Tint Rule.** Text on a tinted surface uses the hue's -8 shade (green #0d7354, orange #ad4e00, red
#a8071a), never the -6 shade Ant Design's preset tags use. If a tint and text pair is below 4.5:1, change the
text, not the tint.

**The Quiet Delete Rule.** A delete or revoke icon rests in Ink Secondary with a Line border and turns Danger
Red only on hover or keyboard focus. A destructive *confirm* button (in a dialog, after the user has typed or
chosen) is solid Danger Red with white text.

## Typography

**Display Font:** Fraunces (with Georgia, serif), marketing pages only
**Body Font:** Plus Jakarta Sans (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, monospace) for code, keys and file names

**Character:** Plus Jakarta Sans gives the console a rounded, even texture that stays legible at 12px in dense
tables; Fraunces is kept for the public site so the tool itself never reads as a brochure.

### Hierarchy
- **Headline** (600, 28px, 1.2): the one page title (`h1`) at the top of every console page, on the same
  baseline on every page so the eye lands in the same place.
- **Title** (600, 15px, -0.2px tracking): row subjects (assignment names, course names in cards).
- **Body** (400, 14px, 1.5715): table cells, dialog text, descriptions.
- **Label** (500, 12px): tags, chips, hints under controls, secondary lines in cards. 12px is the floor: nothing
  a person must read is set smaller.
- **Overline** (500, 11px, 1.5px tracking, uppercase): the sider's console label only, in white at .6.
- **Mono** (13px): API keys, commands, file names; never as a costume for "technical" prose.

### Named Rules
**The 12px Floor.** Secondary text is 12px; the detector flags 11px and so should you. Overlines are the one
exception and carry no information a reader needs.

**The Words Under Chips Rule.** A status chip's consequence is written as text beneath it ("Past due date",
"Grades hidden"), not encoded in a glyph or a colour alone.

## Layout

Fixed dark chrome, scrolling white content. The header is 64px; the sider is 220px (165px below 1000px,
130px in compact embedded views) and collapses to icons on request, remembering the choice per browser. The
sider is a flex column: brand and overline pinned at the top, the navigation scrolling in the middle with a
bottom shadow when it overflows, footer links and the collapse trigger pinned below. Content sits on Page Grey
with 24px padding and a 36px/28px top bar on the settings page so its title aligns with the others.

Breakpoints are few and measured: 1440px is where the assignments table fits all seven row actions beside the
progress column (below it they fold into one menu); 1000px tightens the sider; 800px is the compact layout;
500px switches students and the phone console to single-column. Admin content never goes under 700px wide
(the page scrolls instead); grading content never under 600px.

Spacing follows an 8px rhythm with 4px and 12px as the half steps: 4px between a chip and its caret, 8px
between related controls, 12px inside toolbars, 16px between cards in a row, 24px card padding, 36px for the
settings top bar.

## Elevation & Depth

Flat by default. Cards and tables sit on Page Grey with a 1px Line Soft border; the only resting shadows are
the hairline under primary buttons (`0 2px 0 rgba(0,0,0,.045)`) and the settings cards' two-layer whisper
(`0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.02)`). Popovers, dropdowns and the jump palette lift with the
theme shadow; the impersonation bar casts upward.

### Shadow Vocabulary
- **Theme popup** (`0 2px 8px rgba(0, 0, 0, 0.12)`): popovers, dropdowns, tooltips, the skip link when focused.
- **Button hairline** (`0 2px 0 rgba(0, 0, 0, 0.045)`): primary and danger buttons at rest.
- **Settings card** (`0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.02)`): settings section cards only.
- **Upward chrome** (`0 -2px 8px rgba(0, 0, 0, 0.25)`): the fixed impersonation bar.
- **Scroll shade** (`linear-gradient(transparent, rgba(0,0,0,.14))`, 36px): the bottom of any in-card or
  in-popover scroller while there is more below; it disappears when the end is in view.

### Named Rules
**The Border-Or-Shadow Rule.** A surface declares its edge once. Cards use the 1px border; popups use the
theme shadow; nothing gets both.

## Shapes

Small, consistent radii: 4px on buttons, inputs, tags and menu items; 8px on cards; 10px on modals. Icon-only
row actions are 32px circles. Chips are 4px rectangles, not pills; pills are reserved for the skip link and
count badges. Borders are 1px; the only thicker lines are the 3px brand band (Vibrant Green) at the top of the
sider's brand area, the 3px Caution Band on the impersonation bar, and the 3px focus ring.

## Components

### Buttons
- **Shape:** 4px radius, 8px 16px padding, 32px tall at the default size.
- **Primary:** Brand Green with white text and the button hairline; hover lightens via the theme.
- **Default:** white with a Line Soft border and Ink text; hover turns text and border Brand Green on #f5f5f5.
- **Destructive confirm:** solid Danger Red (#cf1322) with white text; hover #a8071a.
- **Quiet delete icon:** 32px circle, Ink Secondary icon, Line border; Danger Red icon and border on
  hover/focus. Always has an `aria-label` naming the record ("Delete Java Assignment") and a tooltip.
- **Focus:** a 3px Brand Green ring on every control, on white and on the dark chrome.

### Chips and Tags
- **Default tag:** Deep Green text on Green Wash, 12px, 500 weight, 4px radius.
- **State tags:** Good (Deep Green on Green Tint), Warning (Orange Ink on Warning Tint), Error (#a8071a on
  #fff1f0). Each says what its colour means in words ("2106 ms · very slow"), with the threshold on hover.
- **Status chips (assignments):** a bordered chip with a caret that opens a chooser; the consequence is
  written under the chip in 12px.
- **Count badges:** Signal Yellow with Console Black text in the sider; Danger Red for pending requests.

### Cards / Containers
- **Corner style:** 8px.
- **Background:** Surface White on Page Grey.
- **Border:** 1px Line Soft; no shadow at rest (settings cards excepted, see Elevation).
- **Internal padding:** 24px (16px for the small size used in status rows).
- Tables inside cards scroll inside the card with the key column pinned; they never clip.

### Inputs / Fields
- **Style:** white, 1px Line border, 4px radius, 32px tall.
- **Focus:** Brand Green border plus a 2px ring at 20% green.
- **Error:** Danger Red border; warning state (a near miss) uses the amber border, with the reason written
  beneath the field in 13px.

### Navigation
- **Sider:** Console Black; items 44px tall (36px on windows under 860px tall), white at .85; the selected
  item is a Brand Green block with white text; hover is green text on a 20% green tint. Group titles are
  overlines; groups opened near the bottom scroll into view.
- **Header:** Console Black, 64px, course switcher on the left, account and logout on the right.
- **Skip link:** "Skip to content" appears on the first Tab, white pill with Brand Green text, and lands on
  the page `h1`.
- **Jump palette (staff console):** Ctrl+K / ⌘K, a 520px modal with an ARIA combobox, grouped results, a
  12px hint line, and focus returned to the opener on close.

### Signature: the impersonation bar
Fixed to the bottom of every page while staff act as another user: Console Black, a 3px Caution Band on top,
13px white text naming the account and its course roles, the sentence "Actions here are real and saved as
this user", and one "Return to staff console" button. The page is padded beneath it so it covers nothing.

## Do's and Don'ts

### Do:
- **Do** set every error, warning and tag colour through the theme tokens or `src/theme/tagStyles.ts`; the
  presets fail AA.
- **Do** give every icon-only control an `aria-label` that names the record and a tooltip with the verb.
- **Do** write the consequence of a state as text ("Past due date", "Off: no one sees this banner").
- **Do** keep secondary text at rgba(0,0,0,.6) or darker and 12px or larger.
- **Do** keep a page's `h1` on the same baseline as every other page's.
- **Do** make destructive confirms explain why they are disabled and name what is lost in numbers.

### Don't:
- **Don't** use Brand Green as a background behind body text or as decoration.
- **Don't** fold the seven assignment row actions into a menu at 1440px and above (owner decision).
- **Don't** use `title` attributes as the only label; they are invisible to keyboard and screen-reader users.
- **Don't** add a coloured left border, a gradient, or a drop shadow to a card to make it "pop".
- **Don't** use Ant Design's `type="danger"` on CPButton (it is not a button type) or `color="green"` /
  `color="orange"` presets on tags.
- **Don't** set text smaller than 12px except the sider overline.
