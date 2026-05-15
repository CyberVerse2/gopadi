# GoPadi — Design Brief

> The old `DESIGN.md` (forest+marigold market-board direction) is superseded by this brief and the design context in `.impeccable.md`. Throw the old one out before implementation begins.

## 0. Foundation (locked in `.impeccable.md`)

- Brutalist / utilitarian dark interface for phone-first use in Nigerian university towns.
- Voice: **exact, deadpan, alive.**
- Money is the headline; type, weight, and one accent color do all the work.
- Anti-references (non-negotiable): old GoPadi, generic crypto dapp, generic SaaS, African-stereotype visuals.

---

## 1. Brand System Proposal

### Type stack — three voices, three jobs

- **Display: Boogy Brut Polymorphic Std** (Velvetyne, OFL). Used only for: hero numerals on the detail page, large standalone amounts, section index markers, the wordmark. Structural, raw, completely non-generic — looks like industrial signage.
- **UI / Body: Mona Sans** (GitHub, OFL, variable). Every label, paragraph, button, nav item. Geometric, readable across weights 200–900, supports tabular numerals.
- **Data / Numerals: Geist Mono** (Vercel, OFL). USDC amounts in lists and forms, escrow IDs, Stellar addresses, timestamps, transaction hashes. The "this is a fact" typeface.

No Inter, no Manrope, no IBM Plex, no Space Grotesk, no Plus Jakarta. Stack is committed.

### Color (OKLCH, tinted toward signal hue)

Dark surface stack (chroma 0.005–0.012 tinted toward 30°):

```
--bg          oklch(0.16 0.005 30)   near-black canvas
--bg-2        oklch(0.19 0.008 30)   panel surfaces
--bg-3        oklch(0.23 0.010 30)   input fills, pressed states
--rule        oklch(0.32 0.012 30)   hairline borders (1px)
--rule-strong oklch(0.42 0.015 30)   emphasized borders, form underlines
--text        oklch(0.96 0.008 30)   bone-white primary text
--text-2      oklch(0.78 0.012 30)   secondary/explanatory
--text-3      oklch(0.58 0.010 30)   labels, metadata
--text-4      oklch(0.42 0.008 30)   disabled, placeholders
```

Signal:

```
--signal      oklch(0.68 0.22 30)    vermillion — single hot accent
--signal-soft oklch(0.28 0.07 30)    vermillion wash for active filters
```

Used for: active CTA fill, escrow protected total, live state dots, next-action indicator. Rare and earned.

Semantic state (only when meaningful, never decorative):

```
--ok          oklch(0.72 0.18 145)   released/paid, completion
--warn        oklch(0.78 0.16 75)    proof uploaded, awaiting confirm
--risk        oklch(0.62 0.22 18)    dispute open
```

### Spacing & shape

- 4pt scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96` exposed as `--space-xs`…`--space-3xl`.
- Corner radius: `0` by default. Pills (`9999px`) reserved for status badges only.
- Buttons are rectilinear with hairline borders and a vermillion fill for primary.
- Borders before shadows. Shadows do not exist in this system.

---

## 2. Surface 1 — Errands List (`/errands`)

### Primary job

Role-aware split on one URL. Padis see open work to grab. Customers see their own posts and current state.

### Layout

- **Header line:** wallet short address in mono, role pill (`PADI` / `CUSTOMER`), canonical action ("Post errand" for customers, "Filter open work" for Padis). No hero, no banner.
- **Padi view:** dense hairline-divided table of open errands. Columns: index, category label, title, location, item budget, **fee** (vermillion, mono, large), deadline, Accept. The table IS the page — no card grid.
- **Customer view:** same table chrome, different columns: index, title, state badge (mono, hairline border), protected amount, next-action.
- **Empty state — Padi:** "No open errands in your area right now. Check back at lunch — markets get busy after 11."
- **Empty state — Customer:** "You haven't posted anything yet. Posting is three steps." → text link.

### Interaction

- Row click → detail. Row hover → row background → `--bg-2`, fee brightens.
- Filters above table: category (text buttons), sort (fee high→low / deadline soon / newest). Active filter has vermillion underline.
- Optimistic Accept: row state flips instantly; signature happens in background.

---

## 3. Surface 2 — Errand Detail (`/errands/[id]`)

### Primary job

Show the errand task in full. Money is present and persistent but not the page hero — the task is.

### Layout

- **Above-fold (mobile):** Errand title at display scale. Below: category + location + posted-time on one mono line. Below: persistent escrow strip sticky to bottom of viewport.
- **Below-fold:** Description. Structured items list (from `DecodedErrand`) — checkboxes for Padi role, read-only for customer. Route (pickup → drop). Proof section (empty until upload).
- **Right rail (desktop) / sticky bottom (mobile) — the escrow card:**
  - Boogy Brut display numeral — protected total
  - Line items (item budget, Padi fee, total) in Geist Mono
  - State badge with timestamp
  - **One contextual primary action** (see below)

### State machine, horizontal step indicator

`Posted · Accepted · Funded · In progress · Proof · Confirmed · Released` — active step vermillion, completed bone-white, future `--text-4`. Hairline connectors.

### Primary action — always one, never two

| Viewer | State | Action |
|---|---|---|
| Padi | posted | Accept errand |
| Customer | accepted | Fund escrow |
| Padi | funded / in_progress | Upload proof |
| Customer | proof_uploaded | Confirm & release |
| Either | funded+ | Open dispute (secondary **text link**, never a button) |

### Interaction

- Tap escrow strip on mobile → sheet with Stellar contract ID, transaction hashes, block-explorer link. Progressive disclosure.
- State transitions animate the step indicator only — active step slides one position right, `cubic-bezier(0.22, 1, 0.36, 1)`, 220ms.

---

## 4. Surface 3 — Post Errand (`/post-errand`)

### Primary job

Get a customer from "I need someone to do X" to a funded errand in under 90 seconds on a phone.

### Flow — 4 steps

1. **Task** — title, description, category. Single text input with placeholder examples ("Buy 2kg rice and a tin of milk from Ogbete Market"). AI decode runs in background and pre-fills items; never blocks Continue.
2. **Place** — pickup, drop. Free text. Suggested locations from previous errands.
3. **Money** — item budget (large mono input), Padi fee (large mono input, default suggested by category). Live total at hero scale below.
4. **Review** — full summary, total escrow at maximum display size. One button: **Post & fund.** Wallet signs once; escrow is created and funded together.

### Layout per step

- **Mobile:** full-screen step. Numbered hairline step indicator at top. Content centered. Sticky bottom bar: [← Back] [Continue →].
- **Desktop:** same step layout, single column ~520px wide, **left-aligned** to a hairline rule at the viewport's left edge (asymmetric, not centered).

### Key states

- **Validation errors:** inline below field, vermillion mono, single line. Never red, never modal.
- **AI decode happening:** small mono line at bottom of step 1 — "Reading your errand…" → "Found 3 items, 1 deadline." Non-blocking.
- **Wallet not connected:** revealed inline in step 4 as "Connect wallet" before Post & fund. One tap. Never modal.

### Interaction

- Step transition: content fade-out 120ms, fade-in 200ms with `ease-out-quart`. Step indicator fills with vermillion smoothly.
- Back is always available, never destructive — values persist across navigations.

---

## 5. Surface 4 — Admin / Resolver (`/admin`)

### Primary job

Three jobs on one surface, switched by a top tab strip (text buttons, not pills): **Disputes · Escrows · Metrics.**

### Disputes tab (default)

- Single column of open dispute rows. Each row: errand title, who opened it, opened-at, total escrow at stake (mono, large). Tap to expand.
- Expanded: customer's claim, Padi's proof, evidence link, escrow line items, two buttons — **Release to Padi** / **Refund customer**. Resolver-notes textarea required before action.
- Resolved disputes below a hairline divider, dimmed.

### Escrows tab

- Table of every escrow contract. Columns: contract ID (mono), errand title, customer wallet (short mono), Padi wallet (short mono), amount, state, last updated. Click → errand detail in new tab.
- Filters: state, date range, amount threshold. No search box on day one.
- "Force-act" menu reveals on hover / long-press with manual ops (re-fund, manual release, manual refund). Destructive ops require typing the contract ID inline — no soft confirm modals.

### Metrics tab

- Five numbers at hero display scale, mono, no chart chrome:
  - **Total volume (USDC)**
  - **Active errands**
  - **Completion rate**
  - **Dispute rate**
  - **Average resolution time**
- Tiny mono delta below each vs. last 7 days. No sparklines, no donut charts. The numbers ARE the dashboard.

### Layout

- Desktop-first surface. Admin works at a desk, not on a phone.
- Tabs at top, content fills viewport, no sidebar.

---

## 6. Key States Across All Surfaces

| State | Treatment |
|---|---|
| Loading | Hairline placeholder rows (no shimmer). Mono "Loading…" lower-left of viewport, never centered. |
| Empty | Copy that teaches. Never illustrations. Never "Get started" buttons that lead nowhere. |
| Error | Vermillion mono text inline below the field, or in a top-of-page strip. Never red, never modal. |
| Offline | Persistent top-of-viewport hairline strip: "No network. Actions will retry." Warn tint. |
| Wallet locked | The relevant action button is replaced inline by "Connect wallet." Never a fullscreen blocker. |

---

## 7. Interaction Model — System-wide

- **One primary action per page.** Always one. Never two competing CTAs.
- **Mono fonts for data, sans for UI.** Address shown? Mono. Label? Sans. Strict.
- **Borders before backgrounds.** New section = hairline above. Nothing else.
- **No modals except wallet-driven signing prompts.** Form errors, confirmations, pickers — all inline.
- **Motion budget: 250ms max per transition.** Easing: `cubic-bezier(0.22, 1, 0.36, 1)`. Only state transitions and step indicators animate. No scroll-reveal theater.
- **Tabular numerals globally** via the mono stack or `font-feature-settings: 'tnum'`.

---

## 8. Recommended References

When implementing, lean on:
- `spatial-design.md` — hairline-led layouts, the structured void
- `interaction-design.md` — form-heavy post-errand flow, inline error handling
- `motion-design.md` — state-transition motion, step indicator
- `ux-writing.md` — empty states that teach, deadpan-with-wit voice

---

## 9. Decisions Locked

1. **Signal color:** **vermillion** — `oklch(0.68 0.22 30)`. Single hot accent.
2. **Wordmark:** **Geist Mono lockup**, bone-white, lowercase `gopadi` (or with a leading slash mark — to be explored during implementation). No two-tone, no display face.
3. **Landing page:** in scope, but addressed **after** the three priority surfaces (errands, post-errand, admin). Same system.
4. **Block explorer:** **Stellar Expert** (`stellar.expert`) for contract IDs and transaction hashes.

## 10. Implementation Order

1. Foundation: globals.css with the new tokens, font loading (Boogy Brut, Mona Sans, Geist Mono), reset of old CSS variables.
2. Errand detail (`/errands/[id]`) — establishes the system for everything else, includes the escrow card, step indicator, and the main role-based action logic.
3. Errands list (`/errands`) — derives directly from the detail page styling.
4. Post errand (`/post-errand`) — 4-step wizard.
5. Admin (`/admin`) — 3 tabs.
6. Landing (`/`) — last, on top of the now-mature system.

Before step 1, delete the old `DESIGN.md` and `DESIGN.json` (the rejected design system).
