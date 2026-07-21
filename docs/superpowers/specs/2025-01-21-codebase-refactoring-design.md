# Codebase Refactoring Design

**Date:** 2025-01-21
**Status:** Approved

## Overview

Refactor the JSON Tools codebase to be clean, modular, DRY, and consistent in styling. Extract shared Svelte components, shared utilities, and shared CSS. Reduce page components from monolithic files to thin orchestrators that compose shared pieces.

## Goals

1. **DRY** — Eliminate all duplicated logic (CSS, clipboard, JSON parsing)
2. **Modular** — Extract reusable Svelte components with clean prop/slot APIs
3. **Consistent styling** — Single source of truth via CSS design tokens and shared classes
4. **Clean** — Each file has one clear responsibility

## Non-Goals

- No visual/UX changes — the app must look and behave identically
- No feature additions
- No changes to `typeGenerator.ts` (it's already well-structured)

## Architecture

### New file structure

```
src/
├── lib/
│   ├── components/
│   │   ├── CopyButton.svelte       # Copy-to-clipboard button with feedback
│   │   ├── JsonInput.svelte        # Styled textarea for JSON input
│   │   └── Panel.svelte            # Container with title + actions slot
│   ├── clipboard.ts                 # Clipboard utility (API + fallback)
│   ├── jsonParser.ts                # JSON parsing utility with auto-detect
│   ├── typeGenerator.ts             # (existing, unchanged)
│   └── index.ts                     # (existing barrel export)
├── routes/
│   ├── +page.svelte                # JSON Formatter (slimmed down)
│   ├── type-generator/
│   │   └── +page.svelte            # Type Generator (slimmed down)
│   └── +layout.svelte              # Layout (imports global CSS)
└── styles/
    └── global.css                   # Design tokens + shared component styles
```

### Shared components

#### `<CopyButton>`

**File:** `src/lib/components/CopyButton.svelte`

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | `''` | The text to copy to clipboard |
| `disabled` | `boolean` | `false` | Disables the button when true |

**Behavior:**
- Uses `copyToClipboard()` from `$lib/clipboard` internally
- Shows "Copy" by default, switches to "✓ Copied!" for 2 seconds after click
- Renders as a `<button>` with `.copy-btn` class
- No events, no slots — fully self-contained

#### `<JsonInput>`

**File:** `src/lib/components/JsonInput.svelte`

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | Bindable textarea content |
| `placeholder` | `string` | `''` | Placeholder text |

**Behavior:**
- Renders a styled `<textarea>` with `.input-area` class
- Parent uses `bind:value` for two-way binding
- No events, no slots — just a styled textarea

#### `<Panel>`

**File:** `src/lib/components/Panel.svelte`

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `''` | Header title text |

**Slots:**

| Slot | Description |
|------|-------------|
| `actions` | Optional right-side header actions (buttons, controls) |
| default | Panel body content |

**Behavior:**
- Renders panel container (`.panel`) with header (`.panel-header`) and body
- Title rendered as `<span>` in header
- Actions slot rendered in `.panel-actions` area (only if content exists)
- Default slot rendered as panel body

### Shared utilities

#### `src/lib/clipboard.ts`

**API:**
```typescript
export async function copyToClipboard(text: string): Promise<boolean>
```

**Behavior:**
- Attempts `navigator.clipboard.writeText(text)` first
- Falls back to textarea + `document.execCommand('copy')` if clipboard API unavailable
- Returns `true` on success, `false` on failure
- Does NOT manage "copied" state

#### `src/lib/jsonParser.ts`

**API:**
```typescript
export function parseJson(input: string): {
  data: unknown | null;
  error: string;
}
```

**Behavior:**
- Returns `{ data: null, error: '' }` for empty/whitespace-only input
- Parses JSON with `JSON.parse(input)`
- Auto-detects stringified JSON: if result is a string, recursively parses until non-string or error
- Returns `{ data: <parsed>, error: '' }` on success
- Returns `{ data: null, error: <message> }` on failure
- Handles `unknown` catch properly: `e instanceof Error ? e.message : String(e)`

### Shared CSS

**File:** `src/styles/global.css`

**Imported in:** `src/routes/+layout.svelte`

**Design tokens (CSS custom properties):**

```
:root {
  /* Colors */
  --color-bg: #1a1b26;
  --color-bg-secondary: #24283b;
  --color-bg-tertiary: #1f2335;
  --color-border: #3b4261;
  --color-border-hover: #4a5280;
  --color-text: #c0caf5;
  --color-text-muted: #9aa5ce;
  --color-text-dim: #565f89;
  --color-primary: #7aa2f7;
  --color-error: #f7768e;

  /* JSON syntax colors */
  --color-json-string: #9ece6a;
  --color-json-number: #ff9e64;
  --color-json-bool: #bb9af7;
  --color-json-null: #f7768e;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 10px;
}
```

**Shared classes:**
- Base: `body` (font, background, color)
- Form controls: `button`, `select`, `label`, `.text-input`, `.checkbox-label`
- Layout: `.panel`, `.panel-header`, `.panel-actions`
- Inputs/outputs: `.input-area`, `.output-area`
- Feedback: `.error`, `.copy-btn`, `.small-btn`
- Responsive: media queries for mobile layout

**Note:** Hardcoded color values in existing components will be replaced with CSS custom properties.

## Refactored page structure

### JSON Formatter (`src/routes/+page.svelte`)

**Imports:**
- `<Panel>` from `$lib/components/Panel.svelte`
- `<JsonInput>` from `$lib/components/JsonInput.svelte`
- `<CopyButton>` from `$lib/components/CopyButton.svelte`
- `parseJson` from `$lib/jsonParser`

**State:** `input`, `parsed`, `error`, `indent`, `collapsed`

**Logic that stays page-specific:**
- `$effect` watching `input` → calls `parseJson()` → updates `parsed`/`error`
- `getOutput()` — formats parsed JSON with indent setting
- `toggle()`, `collapseAll()`, `expandAll()` — tree collapse state
- `isCollapsible()`, `formatValue()` — tree rendering helpers
- `clearAll()` — resets page-specific state
- `JsonNode` snippet — recursive tree rendering

**Structure:**
- Header with indent `<select>` + Clear button
- `<Panel title="Input">` → `<JsonInput bind:value={input} placeholder="Paste your JSON here..." />`
- `<Panel title="Output">` → actions: Collapse All, Expand All, `<CopyButton>` → body: tree view or error

**Estimated size:** ~250 lines (down from ~480)

### Type Generator (`src/routes/type-generator/+page.svelte`)

**Imports:**
- `<Panel>` from `$lib/components/Panel.svelte`
- `<JsonInput>` from `$lib/components/JsonInput.svelte`
- `<CopyButton>` from `$lib/components/CopyButton.svelte`
- `parseJson` from `$lib/jsonParser`
- `generateType`, `generateExtractedTypes` + `ExtractOptions` type from `$lib/typeGenerator`

**State:** `input`, `parsed`, `error`, `typeConstruct`, `arraySyntax`, `rootName`, `indent`, `extractNested`

**Logic that stays page-specific:**
- `$effect` watching `input` → calls `parseJson()` → updates `parsed`/`error`
- `getOptions()` — builds `ExtractOptions` from state
- `getOutput()` — generates TypeScript types
- `clearAll()` — resets page-specific state
- Type generation control UI

**Structure:**
- Header with construct/array/root-name/indent/extract controls + Clear button
- `<Panel title="JSON Input">` → `<JsonInput bind:value={input} placeholder={placeholder} />`
- `<Panel title="TypeScript Output">` → actions: `<CopyButton>` → body: `<pre>` output or error

**Estimated size:** ~200 lines (down from ~380)

### Layout (`src/routes/+layout.svelte`)

**Changes:**
- Add import of `../styles/global.css`
- Remove all shared CSS rules from `<style>` block
- Keep only layout-specific styles: `.app-shell`, `.nav-bar`, `.nav-brand`, `.nav-links`, `.nav-link`, `.app-content`

## What does NOT change

- `src/lib/typeGenerator.ts` — already well-structured, no refactoring needed
- `src/lib/typeGenerator.test.ts` — tests continue to pass unchanged
- App behavior — identical look, feel, and functionality
- SvelteKit routing structure

## Summary of file changes

| File | Before | After |
|------|--------|-------|
| `+page.svelte` (formatter) | ~480 lines | ~250 lines |
| `type-generator/+page.svelte` | ~380 lines | ~200 lines |
| `+layout.svelte` | ~110 lines | ~70 lines |
| **New:** `styles/global.css` | — | ~180 lines |
| **New:** `components/CopyButton.svelte` | — | ~40 lines |
| **New:** `components/JsonInput.svelte` | — | ~30 lines |
| **New:** `components/Panel.svelte` | — | ~30 lines |
| **New:** `lib/clipboard.ts` | — | ~20 lines |
| **New:** `lib/jsonParser.ts` | — | ~20 lines |

## Constraints

- All existing tests must continue to pass
- No visual regressions — app must look identical before and after
- No behavioral regressions — all features must work exactly as before
- No new dependencies
- No changes to `typeGenerator.ts` or its tests
