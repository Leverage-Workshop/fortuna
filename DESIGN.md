# Fortuna Design System

Read this before writing any UI. It covers how things look, not what to build: a pattern here
does not authorize a feature. Scope still comes from `feature_list.json` (see `AGENTS.md`).

**Origin.** Adapted from a [getdesign.md](https://getdesign.md) extraction of The Verge's 2024
redesign (dark canvas, acid mint and ultraviolet accents, mono uppercase labels, flat hairline
depth). Fortuna keeps that attitude but drops the parts that only suit a news feed. Proprietary
fonts are swapped for Google Fonts, brand names for Fortuna tokens, and the hover blue is gone
because it failed contrast. The editorial grammar is retargeted at a forecasting tool, where
every number has to be readable, traceable and honest about where it came from.

## 1. Principles

1. **Dark canvas, loud accents, flat depth.** Near-black `#131313` everywhere. Hierarchy comes
   from color fills and 1px hairlines, never from shadows, glows or gradients.
2. **Type tells you who produced the content.** Sans is the interface, mono is data from code,
   serif is model-written prose. A reader can tell computed facts from AI narrative at a glance,
   which is the product's core rule: models narrate, code produces the numbers.
3. **Color carries meaning, so it is spent sparingly.** Each accent has one job (§3). Never add
   decorative color, and never rely on color alone: every colored value also has a sign, numeral
   or label.
4. **Absence is explicit.** "Not built yet (M3)" and "No data for this run" look different
   (§6.6). An empty state never looks like a zero.

## 2. Mood

A trading terminal crossed with a magazine cover. The page sits quiet and dark until something
earns attention: a forecast with edge, a binding constraint, a run waiting for approval. Those
moments get solid color. Everything else is white or gray type on black with hairline rules.

## 3. Color

### Tokens

| Token | Value | Role |
|---|---|---|
| `canvas` | `#131313` | Page background. The only background. |
| `surface` | `#2d2d2d` | Secondary panels, secondary buttons, table header bands, bar tracks |
| `hairline` | `#313131` | Default 1px borders, table rules, image frames |
| `ink` | `#ffffff` | Headlines, primary text, emphasis borders |
| `ink-soft` | `#e9e9e9` | Body text on `surface`, button text |
| `ink-muted` | `#949494` | Metadata, timestamps, captions, axis labels, placeholders |
| `mint` | `#3cffd0` | Primary action, active state, the model's forecast, positive edge |
| `mint-deep` | `#309875` | Borders on mint-adjacent elements where pure mint is too hot |
| `violet` | `#5200ff` | Human-in-the-loop: approval gates, the user's edits. Fill only |
| `violet-deep` | `#3d00bf` | Run-stream rail, violet borders |
| `yellow` | `#ffd23f` | Caution: the contaminated flag, stale evidence, judge overrides |
| `pink` | `#ff4f8b` | Negative edge, failed steps, validation errors |
| `orange` | `#ff7a1a` | Constraint load: the 0–4 score ramp, binding constraints |
| `focus` | `#1eaedb` | Keyboard focus ring only |

### Semantic roles (Fortuna-specific)

| Meaning | Treatment |
|---|---|
| Model probability | `mint`. Bars and dots in mint, value in mono `ink` |
| Market price | `ink` outline marker or white bar. Never mint, so model and market never blur |
| Edge (model − market, in pp) | `+4.2 pp` in mint, `−3.1 pp` in pink. Always signed, always with the unit |
| Constraint score 0–4 | Orange ramp (below), numeral always printed |
| Pruned option | Struck through, `ink-muted`, plus an orange `BINDING · LEGAL` pill naming the lens |
| Contaminated (past-event) run | Yellow pill `CONTAMINATED · NOT SCORED`, black text, on the summary and every probability |
| Awaiting user approval | Violet fill tile, white text, mint primary button inside |
| Judge override | Yellow 1px border on the probability, with the stated reason one click away |
| Failed agent step / error | Pink text and pink 1px border. Not red: pink is the system's alarm |

**Constraint score ramp** (orange mixed into canvas, in sRGB):

| Score | Label | Cell fill | Numeral |
|---|---|---|---|
| 0 | None | `transparent`, `hairline` border | `ink-muted` |
| 1 | Friction | `color-mix(in srgb, var(--color-orange) 20%, var(--color-canvas))` | `ink` |
| 2 | Costly | `… 40% …` | `ink` |
| 3 | Severe | `… 70% …` | `ink` |
| 4 | Binding | `orange` solid | black, bold, with `BINDING` label |

**Lenses are labeled, not colored.** Political, economic, geopolitical and legal are always
identified by mono text (`POL`, `ECON`, `GEO`, `LEGAL`), never by a hue, so the palette stays
free for meaning.

### Contrast (WCAG, measured)

| Pair | Ratio | Rule |
|---|---|---|
| `ink` on `canvas` | 18.6 | Any size |
| `ink-muted` on `canvas` | 6.1 | Any size |
| `ink-muted` on `surface` | 4.5 | Body size minimum; don't go smaller than 12px |
| `mint` / `yellow` / `orange` / `pink` on `canvas` | 14.5 / 12.9 / 7.1 / 6.0 | OK as text |
| black on `mint` / `yellow` / `orange` / `pink` | 16.4 / 14.5 / 8.1 / 6.7 | Text on accent fills is always black |
| `ink` on `violet` | 7.5 | Text on violet fills is always white |
| `violet` on `canvas` | 2.5 | **Never use violet as text or a thin line on canvas.** Fills only |
| `hairline` on `canvas` | 1.4 | Decorative only. Never the sole boundary of a control |

Score cells: white on 20% / 40% / 70% orange measures 13.6 / 8.9 / 4.6.

### Never

- Gradients, glows, blurs or drop shadows.
- Mint or violet as a background wash or tint behind a whole region.
- New accent colors. If a meaning has no color, use a label.
- Blue link hovers. The source system's `#3860be` measures 3.2:1 on canvas and is dropped.

## 4. Typography

| Family | Google Font | CSS var | Used for |
|---|---|---|---|
| Display | Anton 400 | `--font-anton` | The `FORTUNA` wordmark and page titles. Nothing else |
| Sans | Space Grotesk 300–700 | `--font-space-grotesk` | All UI: headings, labels, buttons, body copy |
| Mono | JetBrains Mono 500–600 | `--font-jetbrains-mono` | Numbers, UPPERCASE labels, timestamps, tool arguments, code |
| Serif | Newsreader 400, italic | `--font-newsreader` | Model-written prose: rationales, judge reasoning, narrative summaries, the epigraph |

### Scale

| Role | Family | Size / line-height | Weight | Tracking | Case |
|---|---|---|---|---|---|
| Wordmark | Display | 72px / 0.95 (48px mobile) | 400 | 0.01em | UPPER |
| Page title | Display | 48px / 0.95 (36px mobile) | 400 | 0.01em | as written |
| Section heading | Sans | 28px / 1.1 | 700 | 0 | Sentence |
| Card heading | Sans | 20px / 1.15 | 700 | 0 | Sentence |
| Eyebrow (whisper) | Sans | 18px / 1.2 | 300 | 0.1em | UPPER |
| Body | Sans | 16px / 1.6 | 400 | 0 | Sentence |
| Body small | Sans | 14px / 1.5 | 400 | 0 | Sentence |
| Model prose | Serif | 17px / 1.55 | 400 | -0.01em | Sentence |
| Big number (probability, edge) | Mono | 40px / 1.0 | 600 | -0.02em | n/a |
| Table number | Mono | 14px / 1.3 | 500 | 0 | n/a |
| Label / kicker / tag | Mono | 11–12px / 1.3 | 600 | 0.12em | UPPER |
| Button | Mono | 12px / 1.0 | 600 | 0.12em | UPPER |
| Timestamp | Mono | 11px / 1.2 | 500 | 0.1em | UPPER |

### Rules

- **Mono is for numbers, labels and code, never prose.** Lowercase mono appears only in tool
  arguments, JSON and IDs.
- **Every number uses `tabular-nums`** so columns align and live values don't jitter.
- **Serif means a model wrote it.** Don't use serif for anything computed or user-entered. If a
  model paragraph quotes a number, the number links to its source row (see the run report rules).
- **Display only at 36px+**, and only for the wordmark and page titles. The one exception is the
  24px wordmark in the nav bar.
- **The whisper/shout pair** (a 300-weight tracked eyebrow above a display title) is the
  signature move. Use it once per page, at the top.
- Probabilities print as `62%` (whole numbers unless the difference matters), edge as
  `+4.2 pp`, Brier as `0.183`, money as `$0.41`. Use a true minus sign `−`, not a hyphen.

## 5. Shape, space, depth

**Radius scale** (each value has a job):

| Token | Value | Used for |
|---|---|---|
| `rounded-tag` | 2px | Inputs, textareas, score cells |
| `rounded-frame` | 4px | Images, charts and code blocks nested in a card |
| `rounded-pill-sm` | 20px | Pills and tags |
| `rounded-card` | 20px | Cards, report sections |
| `rounded-feature` | 24px | Feature tiles (forecast summary, approval gate), primary buttons |
| `rounded-pill-lg` | 40px | Outlined buttons |
| `rounded-full` | full | Status dots, avatars, icon buttons |

**Spacing.** 4px base. Use 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Card padding is 24px (16px under
640px). Gaps are 48–64px between report sections and 12–16px between run-stream items.

**Container.** Max width 1280px, side padding 16px mobile, 24px tablet, 48px desktop.

**Depth ladder.**

| Level | Treatment | Use |
|---|---|---|
| 0 | None | Text on canvas |
| 1 | 1px `hairline` | Default cards, tables, frames |
| 2 | 1px `ink` | Emphasized card, selected row |
| 3 | 1px `mint` / inset `0 -1px 0 mint` | Active tab, focused card |
| 4 | Accent fill | The one thing on screen that matters most |

At most **one** accent-filled tile per viewport. If two things compete, one of them is wrong.

## 6. Components

### 6.1 Buttons

| Variant | Rest | Hover | Notes |
|---|---|---|---|
| Primary | `mint` fill, black mono label, `rounded-feature`, `px-6 py-3` | `ink` fill, black text | One per view. "Run forecast", "Approve" |
| Secondary | `surface` fill, `ink-soft` label | 1px `ink` ring | Cancel, export, re-run |
| Outline | transparent, 1px `mint`, mint label, `rounded-pill-lg` | mint fill, black text | Low-emphasis actions next to a primary |
| Destructive | transparent, 1px `pink`, pink label | pink fill, black text | Delete, discard |

All buttons are at least 44px tall. Disabled is 40% opacity with no hover. Focus is a 2px
`focus` outline offset by 2px, on every interactive element, with no other change.

### 6.2 Inputs

Canvas background, 1px `ink-muted` border, `rounded-tag`, 16px sans in `ink`, placeholder in
`ink-muted`. Focus: border goes `mint`, plus the focus outline. Error: pink border and a pink
message below in 14px sans. Never signal an error by color alone. The scenario textarea is the
same field at full width, min 6 rows, with a mono character count bottom-right.

### 6.3 Pills and tags

`rounded-pill-sm`, mono 11px / 600 / UPPER / 0.12em, `px-2.5 py-1`. Accent-filled pills
(yellow, orange, pink) use black text; outlined pills use `hairline` border and `ink-muted` text.
Examples: `CONTAMINATED · NOT SCORED`, `BINDING · LEGAL`, `DEMOCRATIC`, `M3`.

### 6.4 Cards and report sections

Canvas fill, 1px `hairline`, `rounded-card`, 24px padding. Header row: mono kicker
(`CONSTRAINT MATRIX`) left, provenance or count right in `ink-muted`. No hover lift or scale. A
clickable card changes only its border to `ink` and its title to `mint`, over 150ms.

### 6.5 Feature tiles

The forecast summary and the approval gate are the two accent tiles.

- **Forecast summary:** canvas with 1px `ink` border, `rounded-feature`, 32px padding. Eyebrow
  (question), big mono probabilities per outcome, model vs market bar, signed edge.
- **Approval gate:** violet fill, white text, `rounded-feature`. It holds the parsed actors and
  options for the user to confirm, with a mint primary "Approve" and a secondary "Edit".

### 6.6 Empty and unbuilt states

| State | Treatment |
|---|---|
| Not built yet | 1px **dashed** `ink-muted` border, mono `NOT BUILT YET · M3` tag, one sans line on what will appear |
| No data for this run | Normal hairline card, `ink-muted` sentence: "No data for this run." No tag |
| Loading | Hairline skeleton bars in `surface`, no shimmer. Streaming text uses Streamdown's block caret |
| Error | Pink 1px border, pink mono `FAILED` tag, the error in sans, a secondary "Retry" |

### 6.7 Tables (constraint matrix, evidence ledger, track record)

- Header: mono 11px UPPER `ink-muted` on `surface`. Rows separated by 1px `hairline`, no zebra.
- Numbers right-aligned, mono, tabular. Text left-aligned.
- Row hover: `ink` hairline top and bottom, no fill change.
- The table scrolls sideways inside its own container on narrow screens, with the first column
  sticky. The page itself never scrolls sideways.
- In the constraint matrix, options are rows and lenses are columns. Each cell is a score cell
  (§3 ramp, `rounded-tag`, 40px square) that opens its rationale (serif) and evidence (links).

### 6.8 Run stream (agent progress)

A vertical timeline, adapted from the source system's StoryStream.

- A 1px `violet-deep` rail on the left. Each step sits on the rail with a mono timestamp
  (`14:02:11`) and an 8px status dot.
- Each step is a card: mono role kicker (`ECONOMIC CONSTRAINT`), sans one-line status, and
  collapsible serif reasoning or a tool-call row (mono tool name, lowercase mono args, cutoff
  date, source link).
- Status dots: running is a mint ring, done is solid mint, failed is solid pink, waiting for the
  user is solid violet, skipped is a hollow `ink-muted` ring. Each dot has a text label for
  screen readers.
- The approval gate (§6.5) appears inline in the stream when the run pauses.

### 6.9 Probability and edge displays

- **Bar:** a 6px `surface` track with a mint fill for the model and a 2px white tick for the
  market price. Label both ends in mono: `MODEL 62%` / `MARKET 55%`.
- **Edge:** signed mono with the unit, mint or pink, followed by `vs Kalshi` / `vs Polymarket`
  in `ink-muted`.
- **Decision tree:** hairline connectors, nodes as cards. Branch labels show probability in mono.
  Pruned branches are struck through and muted, with their binding-lens pill.

### 6.10 Charts

Follow the `dataviz` skill when a chart is actually built (charting library still unselected).
Grid and axes use `hairline` and `ink-muted` mono 11px. Model series are mint, market series
white, the perfect-calibration diagonal a dashed `ink-muted` line. No chart backgrounds; they
sit on canvas.

### 6.11 Navigation

A thin top bar on canvas: `FORTUNA` wordmark at 24px display on the left, then mono UPPER links
(`RUNS`, `TRACK RECORD`), with a 1px inset mint underline on the active one. Link hover changes
the text to mint, with no underline. Under 768px the links collapse into a drawer with 44px rows.

### 6.12 Links in prose

`ink` text with a 1px `mint-deep` underline offset by 3px. Hover makes the text and underline
`mint`. Source links open in a new tab and show the domain in `ink-muted` mono after the text.

## 7. Motion

150ms ease on color, border-color and opacity only. No movement, scale, parallax or bounce. The
running status ring may pulse its opacity. Under `prefers-reduced-motion: reduce`, drop all
transitions and the pulse.

## 8. Responsive

| Width | Changes |
|---|---|
| < 640px | One column, 16px gutters, wordmark 48px, big numbers 32px, tables scroll in place |
| 640–1023px | Two-column summary (probabilities / market), card padding 24px |
| ≥ 1024px | Run report gets a sticky section index on the left; run stream can sit in a right rail |
| ≥ 1280px | Container stops growing; margins absorb the rest |

Touch targets are at least 44px. Mono labels never go below 11px.

## 9. Implementation (Next.js 16 + Tailwind 4)

This section shows how to apply the system. The app does not use it yet: `src/app/globals.css`
still has the skeleton's light/dark tokens. Apply this the first time a UI feature is built, in
the same PR.

### Fonts (`src/app/fonts.ts`)

Load the fonts with `next/font/google` as CSS variables, then put all four `.variable` classes
on `<html>` in `layout.tsx`. Variable names must differ from the Tailwind theme names below, or
the variables reference themselves.

```ts
import { Anton, JetBrains_Mono, Newsreader, Space_Grotesk } from "next/font/google";

export const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
export const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
export const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
export const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});
```

### Tokens (`src/app/globals.css`)

```css
@import "tailwindcss";
@source "../../node_modules/streamdown/dist/*.js";

@theme {
  --color-canvas: #131313;
  --color-surface: #2d2d2d;
  --color-hairline: #313131;
  --color-ink: #ffffff;
  --color-ink-soft: #e9e9e9;
  --color-ink-muted: #949494;
  --color-mint: #3cffd0;
  --color-mint-deep: #309875;
  --color-violet: #5200ff;
  --color-violet-deep: #3d00bf;
  --color-yellow: #ffd23f;
  --color-pink: #ff4f8b;
  --color-orange: #ff7a1a;
  --color-focus: #1eaedb;

  --radius-tag: 2px;
  --radius-frame: 4px;
  --radius-pill-sm: 20px;
  --radius-card: 20px;
  --radius-feature: 24px;
  --radius-pill-lg: 40px;
}

@theme inline {
  --font-display: var(--font-anton), Impact, sans-serif;
  --font-sans: var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
  --font-serif: var(--font-newsreader), Georgia, serif;
}

:root {
  color-scheme: dark;
}

body {
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-sans);
}

:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
  }
}
```

Dark only: remove the skeleton's `prefers-color-scheme` block when you apply this. Classes then
read as `bg-canvas`, `text-ink-muted`, `border-hairline`, `rounded-card`, `font-mono`, and so
on. Use `tabular-nums` on every number.

### Primitives

Build interactive components on `@base-ui/react` (already installed) and style them with these
tokens. Streamdown output gets serif body text, mono code, and `mint-deep` link underlines.

## 10. Review checklist

Before shipping UI, check:

1. Background is `canvas` everywhere. No light surfaces, no shadows, no gradients.
2. Every radius is from §5. Score cells and inputs use 2px; nothing is square.
3. Mono only for numbers, UPPER labels and code. Serif only for model prose. Display only 36px+
   (the nav wordmark excepted).
4. Every colored value also has a sign, numeral or label. Violet never appears as text.
5. Model is mint and market is white, everywhere. Edge is signed with `pp`.
6. "Not built yet" and "No data" are visually different.
7. At most one accent-filled tile is visible at a time.
8. Focus ring is visible on every control; targets are 44px+; no sideways page scroll at 375px.
