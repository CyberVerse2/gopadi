---
name: GoPadi
description: Escrowed local errand marketplace with a sharp, trust-first operational UI.
colors:
  canvas: "oklch(0.16 0.005 30)"
  surface: "oklch(0.19 0.008 30)"
  surface-raised: "oklch(0.23 0.010 30)"
  rule: "oklch(0.32 0.012 30)"
  rule-strong: "oklch(0.42 0.015 30)"
  text: "oklch(0.96 0.008 30)"
  text-muted: "oklch(0.78 0.012 30)"
  text-faint: "oklch(0.58 0.010 30)"
  signal: "oklch(0.68 0.22 30)"
  signal-hover: "oklch(0.76 0.20 30)"
  signal-soft: "oklch(0.28 0.07 30)"
  ok: "oklch(0.72 0.18 145)"
  warn: "oklch(0.78 0.16 75)"
  risk: "oklch(0.62 0.22 18)"
typography:
  display:
    fontFamily: "Boogy Brut Poster, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "0"
  body:
    fontFamily: "Mona Sans, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, JetBrains Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
  4xl: "64px"
  5xl: "96px"
components:
  button-primary:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
  nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-muted}"
    height: "48px"
---

# Design System: GoPadi

## 1. Overview

**Creative North Star: "The Escrow Control Room"**

The current GoPadi UI is an operational escrow surface: dark, compact, mono-forward, and built around hairline structure. It should feel like a serious money-backed workflow for local errands, where every status, wallet, amount, and transaction receipt can be scanned quickly.

This document captures the current implemented UI tokens in `app/globals.css`. It intentionally records the shipped dark vermillion system. `PRODUCT.md` points toward a brighter green and marigold consumer direction, so any logo or brand refresh should either update the app tokens to match that direction or consciously preserve this sharper control-room mode for authenticated product surfaces.

**Key Characteristics:**
- Dark warm canvas, never pure black.
- Vermillion signal color used for primary action and current state.
- Hairline borders create structure instead of shadows.
- Mono labels, addresses, timestamps, and transaction facts carry trust.
- Big tabular numbers make escrow amounts feel concrete.

## 2. Colors

The current palette is a warm near-black system with one hot vermillion signal and restrained semantic states.

### Primary
- **Vermillion Signal**: The primary action, active step, underline, pulse, and high-attention state. Use it sparingly and only for user intent or live state.

### Secondary
- **Trust Green**: Semantic success only. Use for submitted, complete, ready, or positive escrow states.
- **Warning Amber**: Semantic caution only. Use for pending risk, insufficient readiness, or deadline pressure.
- **Risk Red**: Semantic failure, rejected proof, dispute, blocked receiver, or destructive action.

### Neutral
- **Warm Black Canvas**: The page background. It is tinted, not pure black.
- **Raised Charcoal Surface**: Tool panels, right rails, drawers, and grouped controls.
- **Bone Text Stack**: Main text is high contrast but slightly warm; secondary text steps down through muted and faint roles.
- **Hairline Rules**: Dividers and panel borders use 1px rules. No thick decorative side borders.

### Named Rules

**The One Signal Rule.** Vermillion is for primary intent and current state only. If a screen starts glowing orange everywhere, it has lost hierarchy.

**The No Pure Black Rule.** Do not use `#000` or `#fff`. All neutrals stay lightly tinted.

## 3. Typography

**Display Font:** Boogy Brut Poster, with sans fallbacks.  
**Body Font:** Mona Sans, with system sans fallbacks.  
**Label/Mono Font:** Geist Mono, with system mono fallbacks.

**Character:** Heavy sans headings give product confidence; mono labels make escrow, wallet, and timeline details feel precise. Display type is reserved for hero amounts and strong numeric moments, not ordinary labels.

### Hierarchy
- **Display** (900, large responsive sizes, 0.9 line-height): Hero USDC amounts and rare expressive numeric emphasis.
- **Headline** (800, tight line-height): Page titles and major section titles.
- **Title** (700 to 800): Card titles, selected Padi names, drawer headers, and operational subheads.
- **Body** (400 to 500, 1.55 line-height): Descriptions, errand briefs, proof rules, and readable paragraphs. Keep prose under 65 to 75ch.
- **Label** (500, 0.6875rem, uppercase, 0.08em tracking): Eyebrows, nav labels, statuses, wallet facts, timestamps, and CTAs.

### Named Rules

**The Facts Use Mono Rule.** Wallets, hashes, amounts, timestamps, statuses, and action labels use mono. Human descriptions use sans.

**The No Italic Rule.** Emphasis comes from weight, size, and color. Do not use serif italics.

## 4. Elevation

The system is flat by default. Depth comes from tonal layers, sticky rails, drawers, and 1px hairline boundaries. Shadows are not part of the current vocabulary; neither is glassmorphism.

### Named Rules

**The Hairline Structure Rule.** Use 1px borders and spacing to separate UI regions. Do not fake hierarchy with heavy shadows.

**The Flat Money Rule.** Escrow amounts should feel concrete through scale and tabular numerals, not through decorative glow.

## 5. Components

### Buttons
- **Shape:** Square operational buttons (0px radius) in the current app shell.
- **Primary:** Vermillion fill, dark ink, mono uppercase label, 12px by 16px padding.
- **Secondary:** Transparent background, strong hairline border, bone text.
- **Ghost:** Transparent, muted text, used for back/edit actions.
- **Risk:** Transparent with risk border and risk text.
- **Hover / Focus:** Hover changes color only; active state presses down 1px; focus-visible uses a 2px vermillion outline.

### Chips
- **Style:** Text-first, mono uppercase, usually with underline or hairline treatment instead of filled pills.
- **State:** Selected state uses text contrast plus signal underline. Inactive states stay muted.

### Cards / Containers
- **Corner Style:** Most current product surfaces are square or lightly rounded at 8px when a true framed panel is useful.
- **Background:** Raised charcoal for panels, drawers, and grouped surfaces.
- **Shadow Strategy:** No shadows. Use `hairline`, `hairline-t`, `hairline-b`, and tonal surfaces.
- **Internal Padding:** 16px to 24px for compact panels; 32px and up only for major page bands.

### Inputs / Fields
- **Style:** Transparent fields with hairline bottom borders.
- **Focus:** Use the global vermillion focus ring.
- **Error / Disabled:** Risk text and risk border for error; opacity reduction for disabled.

### Navigation
- **Style:** Sticky 48px top bar with blurred dark canvas, hairline bottom rule, mono nav labels, and active signal underline.
- **Mobile Treatment:** Keep the nav compact; avoid hidden gestures for core posting or wallet actions.

### Status Timeline
- **Style:** A vertical rail with circular nodes and 1px connector line.
- **State:** Done nodes use text color, active nodes use signal, pending nodes use canvas and rule border.
- **Trustless Data:** Receipts, viewer links, contracts, transaction hashes, and submitted actions should live inline with the relevant lifecycle step.

### Chat Drawer
- **Style:** Right-side drawer with dark canvas, sticky header, and message/system events in one stream.
- **State:** Chat stays open for deal questions; dispute state adds resolver context rather than replacing the chat surface.

## 6. Do's and Don'ts

### Do:
- **Do** keep wallet, escrow, and transaction details visible near the status they affect.
- **Do** use vermillion for the active step, primary CTA, and current escrow action.
- **Do** render USDC totals in large, tabular numerals.
- **Do** use hairline rules and tonal surfaces for structure.
- **Do** preserve exact local place names; do not rename markets, hostels, streets, or landmarks.

### Don't:
- **Don't** use editorial serif italics.
- **Don't** use museum-catalog restraint when the product needs urgency and trust.
- **Don't** use pure black on stark white.
- **Don't** use cyan-to-purple gradients.
- **Don't** use glassmorphism.
- **Don't** use gradient text.
- **Don't** use dark dashboards with neon accents.
- **Don't** use the same-sized 4-card "How it works" template.
- **Don't** use tribal-pattern visual clichés.
- **Don't** use `border-left` or `border-right` thicker than 1px as decorative side-stripe accents.
