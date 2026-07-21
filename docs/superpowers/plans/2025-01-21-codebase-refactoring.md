# Codebase Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the JSON Tools codebase to be clean, modular, DRY, and consistent in styling. Extract shared Svelte components, shared utilities, and shared CSS.

**Architecture:** Extract reusable components (CopyButton, JsonInput, Panel), shared utilities (clipboard, jsonParser), and shared CSS (global.css with design tokens). Reduce page components from monolithic files (~380-480 lines) to thin orchestrators (~200-250 lines) that compose shared pieces.

**Tech Stack:** SvelteKit 2, Svelte 5 (Runes mode), TypeScript, Vitest 4, Vite 8, adapter-static

## Global Constraints

- All existing tests must continue to pass
- No visual regressions — app must look identical before and after
- No behavioral regressions — all features must work exactly as before
- No new dependencies
- No changes to `typeGenerator.ts` or its tests
- Use design tokens (CSS custom properties) for all colors/spacing/typography
- Each file must have one clear responsibility

---

## File Structure

### New files to create

| File | Responsibility |
|------|----------------|
| `src/lib/clipboard.ts` | Clipboard utility with fallback |
| `src/lib/clipboard.test.ts` | Tests for clipboard utility |
| `src/lib/jsonParser.ts` | JSON parsing utility with auto-detect |
| `src/lib/jsonParser.test.ts` | Tests for JSON parsing utility |
| `src/styles/global.css` | Design tokens + shared component styles |
| `src/lib/components/CopyButton.svelte` | Copy-to-clipboard button with feedback |
| `src/lib/components/JsonInput.svelte` | Styled textarea for JSON input |
| `src/lib/components/Panel.svelte` | Container with title + actions slot |

### Files to modify

| File | Changes |
|------|---------|
| `src/routes/+page.svelte` | Remove duplicated logic, use shared components/utilities, reduce from ~480 to ~250 lines |
| `src/routes/type-generator/+page.svelte` | Remove duplicated logic, use shared components/utilities, reduce from ~380 to ~200 lines |
| `src/routes/+layout.svelte` | Import global.css, remove duplicated styles, keep only layout-specific styles |

---

## Task 1: Create clipboard utility with tests

**Files:**
- Create: `src/lib/clipboard.ts`
- Create: `src/lib/clipboard.test.ts`

**Interfaces:**
- Produces: `export async function copyToClipboard(text: string): Promise<boolean>`
  - Returns `true` on success, `false` on failure
  - Attempts `navigator.clipboard.writeText` first, falls back to textarea + `document.execCommand('copy')`

- [ ] **Step 1: Write failing test for successful clipboard copy**

Create `src/lib/clipboard.test.ts` with a test that:
- Stubs `navigator.clipboard.writeText` to resolve successfully
- Calls `copyToClipboard('test text')`
- Asserts `writeText` was called with `'test text'` and result is `true`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/clipboard.test.ts`
Expected: FAIL with "Cannot find module './clipboard'"

- [ ] **Step 3: Create clipboard utility**

Create `src/lib/clipboard.ts`:
- Export async function `copyToClipboard(text: string): Promise<boolean>`
- Try block: call `navigator.clipboard.writeText(text)`, return `true`
- Catch block: create a hidden textarea, set its value, append to body, select it, call `document.execCommand('copy')`, remove textarea, return `true`
- If fallback also fails: remove textarea, return `false`
- Handle the case where fallback `execCommand` also throws by wrapping it in its own try/catch

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/clipboard.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing test for fallback behavior**

Add a test that:
- Stubs `navigator.clipboard.writeText` to reject
- Mocks `document.createElement`, `document.body.appendChild`, `document.body.removeChild`, and `document.execCommand`
- Calls `copyToClipboard('test text')`
- Asserts `execCommand` was called with `'copy'` and result is `true`

- [ ] **Step 6: Run test to verify fallback works**

Run: `npm test -- src/lib/clipboard.test.ts`
Expected: PASS (both tests pass)

- [ ] **Step 7: Commit**

```bash
git add src/lib/clipboard.ts src/lib/clipboard.test.ts
git commit -m "feat: add clipboard utility with fallback"
```

---

## Task 2: Create JSON parser utility with tests

**Files:**
- Create: `src/lib/jsonParser.ts`
- Create: `src/lib/jsonParser.test.ts`

**Interfaces:**
- Produces: `export function parseJson(input: string): { data: unknown | null; error: string }`
  - Returns `{ data: null, error: '' }` for empty/whitespace input
  - Returns `{ data: parsed, error: '' }` on success
  - Returns `{ data: null, error: message }` on failure

- [ ] **Step 1: Write failing tests for basic parsing**

Create `src/lib/jsonParser.test.ts` with tests that:
- Parses valid JSON object `'{"name":"John","age":30}'` — expects `data` to equal the parsed object and `error` to be empty
- Parses valid JSON array `'[1, 2, 3]'` — expects correct array
- Returns error for invalid JSON `'{invalid}'` — expects `data` null and `error` truthy
- Returns empty result for empty string `''` — expects `data` null and `error` empty string
- Returns empty result for whitespace-only `'   \n\t  '` — expects `data` null and `error` empty string

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/jsonParser.test.ts`
Expected: FAIL with "Cannot find module './jsonParser'"

- [ ] **Step 3: Create JSON parser utility**

Create `src/lib/jsonParser.ts`:
- Trim the input, return `{ data: null, error: '' }` if empty after trim
- Try block: `JSON.parse` the trimmed input
- While loop: while `typeof parsed === 'string'`, try to `JSON.parse` again (handles double-stringified JSON)
- Return `{ data: parsed, error: '' }` on success
- Catch block: extract error message using `e instanceof Error ? e.message : String(e)`, return `{ data: null, error: message }`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/jsonParser.test.ts`
Expected: PASS (all 5 tests pass)

- [ ] **Step 5: Write failing test for auto-detect stringified JSON**

Add a test that:
- Creates a double-stringified JSON: `JSON.stringify(JSON.stringify({ name: 'John' }))`
- Calls `parseJson` with it
- Expects `data` to equal `{ name: 'John' }` and `error` to be empty

- [ ] **Step 6: Run test to verify auto-detect works**

Run: `npm test -- src/lib/jsonParser.test.ts`
Expected: PASS (all 6 tests pass)

- [ ] **Step 7: Commit**

```bash
git add src/lib/jsonParser.ts src/lib/jsonParser.test.ts
git commit -m "feat: add JSON parser utility with auto-detect"
```

---

## Task 3: Create global.css with design tokens

**Files:**
- Create: `src/styles/global.css`

**Interfaces:**
- Produces: CSS custom properties and shared classes for entire app

- [ ] **Step 1: Create global.css with design tokens and shared styles**

Create `src/styles/global.css` with:

**Design tokens (`:root`):**
- Colors: `--color-bg` (#1a1b26), `--color-bg-secondary` (#24283b), `--color-bg-tertiary` (#1f2335), `--color-border` (#3b4261), `--color-border-hover` (#4a5280), `--color-text` (#c0caf5), `--color-text-muted` (#9aa5ce), `--color-text-dim` (#565f89), `--color-primary` (#7aa2f7), `--color-error` (#f7768e)
- JSON syntax colors: `--color-json-string` (#9ece6a), `--color-json-number` (#ff9e64), `--color-json-bool` (#bb9af7), `--color-json-null` (#f7768e)
- Spacing: `--spacing-xs` (0.25rem), `--spacing-sm` (0.5rem), `--spacing-md` (1rem), `--spacing-lg` (1.5rem)
- Typography: `--font-sans`, `--font-mono`
- Border radius: `--radius-sm` (6px), `--radius-md` (10px)

**Shared classes (using `:global()` prefix):**
- Base: `body` (font, background, color, margin, padding, box-sizing), `*` (box-sizing)
- Form controls: `button`, `select`, `label`, `.text-input`, `.checkbox-label` — all using CSS custom properties
- Panel layout: `.panel`, `.panel-header`, `.panel-header span`, `.panel-actions`
- Inputs/outputs: `.input-area`, `.input-area:focus`, `.input-area::placeholder`, `.output-area`
- Feedback: `.error`, `.copy-btn`, `.copy-btn:disabled`, `.small-btn`
- Responsive: media query at 768px for `.input-area` and `.output-area` min-height

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add global.css with design tokens and shared styles"
```

---

## Task 4: Create CopyButton component

**Files:**
- Create: `src/lib/components/CopyButton.svelte`

**Interfaces:**
- Consumes: `copyToClipboard` from `$lib/clipboard`
- Produces: Self-contained button component

**Props:** `text: string`, `disabled?: boolean` (default `false`)

**Behavior:**
- Imports `copyToClipboard` from `$lib/clipboard`
- Internal `$state` for `copied` (boolean, default `false`)
- `handleClick()`: if text is empty or disabled, return early. Call `copyToClipboard(text)`. If successful, set `copied = true` and reset to `false` after 2000ms via `setTimeout`
- Button with class `copy-btn`, calls `handleClick` on click, respects `disabled` prop
- Shows "✓ Copied!" when `copied` is true, "Copy" otherwise

- [ ] **Step 1: Create CopyButton.svelte**

Create the component with the above behavior using Svelte 5 runes syntax.

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/CopyButton.svelte
git commit -m "feat: add CopyButton component"
```

---

## Task 5: Create JsonInput component

**Files:**
- Create: `src/lib/components/JsonInput.svelte`

**Interfaces:**
- Consumes: Nothing (uses global CSS)
- Produces: Two-way bindable textarea component

**Props:** `value?: string` (default `''`, bindable), `placeholder?: string` (default `''`)

**Behavior:**
- Renders a `<textarea>` with class `input-area`
- Uses `bind:value` for two-way binding with parent
- Uses `bind:placeholder` for placeholder text
- Sets `spellcheck="false"`

- [ ] **Step 1: Create JsonInput.svelte**

Create the component with the above behavior using Svelte 5 runes syntax with `$bindable`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/JsonInput.svelte
git commit -m "feat: add JsonInput component"
```

---

## Task 6: Create Panel component

**Files:**
- Create: `src/lib/components/Panel.svelte`

**Interfaces:**
- Consumes: Nothing (uses global CSS)
- Produces: Container component with title and slots

**Props:** `title: string`, `actions?: Snippet`, `children: Snippet`

**Behavior:**
- Renders a `<div class="panel">` container
- Header: `<div class="panel-header">` with `<span>` for title, and optionally `<div class="panel-actions">` if `actions` slot is provided
- Body: renders the `children` slot

- [ ] **Step 1: Create Panel.svelte**

Create the component with the above behavior. Use `Snippet` type from `'svelte'`. Only render the actions wrapper `{#if actions}` when the slot is provided.

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/Panel.svelte
git commit -m "feat: add Panel component"
```

---

## Task 7: Refactor JSON Formatter page

**Files:**
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: `Panel`, `JsonInput`, `CopyButton` components; `parseJson` utility

**What changes:**
- **Import** `Panel`, `JsonInput`, `CopyButton` from `$lib/components/` and `parseJson` from `$lib/jsonParser`
- **Replace** the manual JSON parsing logic (try/catch/while loop) with a `$effect` that watches `input` and calls `parseJson(input)`, updating `parsed` and `error` accordingly
- **Replace** the inline textarea with `<JsonInput bind:value={input} placeholder="Paste your JSON here..." />` inside a `<Panel title="Input">`
- **Replace** the manual output panel with `<Panel title="Output">` containing an `actions` snippet with Collapse All, Expand All, and `<CopyButton>`
- **Replace** the manual copy logic — the `<CopyButton>` component handles it internally via the `text={getOutput()}` prop
- **Replace** all hardcoded CSS values with CSS custom properties (`var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`)
- **Remove** all duplicated CSS rules that are now in `global.css` (panel styles, input-area, output-area, error, button, select, label, copy-btn, small-btn, etc.)
- **Keep** page-specific CSS: tree view styles (`.tree`, `.opener`, `.closer`, `.leaf`, `.toggle`, `.gutter`, `.children`, `.bracket`, `.collapsed-hint`, `.key`, `.colon`, `.comma`), JSON syntax color classes, and responsive layout

- [ ] **Step 1: Refactor +page.svelte**

Rewrite the component using the shared components and utilities. Replace the `beautify()` function with the `$effect`-based `parseJson` pattern. Replace manual textarea and copy logic with `<JsonInput>` and `<CopyButton>`.

- [ ] **Step 2: Run verification**

Run: `npm run check && npm run build && npm test`
Expected: All checks pass

- [ ] **Step 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "refactor: JSON Formatter uses shared components and utilities"
```

---

## Task 8: Refactor Type Generator page

**Files:**
- Modify: `src/routes/type-generator/+page.svelte`

**Interfaces:**
- Consumes: `Panel`, `JsonInput`, `CopyButton` components; `parseJson` utility; `generateType`, `generateExtractedTypes` from existing `typeGenerator.ts`

**What changes:**
- **Import** `Panel`, `JsonInput`, `CopyButton` from `$lib/components/`, `parseJson` from `$lib/jsonParser`, and `generateType`, `generateExtractedTypes` from `$lib/typeGenerator`
- **Replace** the manual JSON parsing logic with a `$effect` that calls `parseJson(input)`
- **Replace** the inline textarea with `<JsonInput bind:value={input} {placeholder} />` inside a `<Panel title="JSON Input">`
- **Replace** the manual output panel with `<Panel title="TypeScript Output">` containing an `actions` snippet with `<CopyButton>`
- **Replace** the manual copy logic — the `<CopyButton>` handles it internally
- **Replace** all hardcoded CSS values with CSS custom properties
- **Remove** all duplicated CSS rules now in `global.css`
- **Keep** page-specific CSS: layout, header, controls, main grid, responsive

- [ ] **Step 1: Refactor type-generator/+page.svelte**

Rewrite the component using the shared components and utilities. Replace the `parse()` function with `$effect`-based `parseJson` pattern. Replace manual textarea and copy logic.

- [ ] **Step 2: Run verification**

Run: `npm run check && npm run build && npm test`
Expected: All checks pass

- [ ] **Step 3: Commit**

```bash
git add src/routes/type-generator/+page.svelte
git commit -m "refactor: Type Generator uses shared components and utilities"
```

---

## Task 9: Refactor layout to import global.css

**Files:**
- Modify: `src/routes/+layout.svelte`

**Interfaces:**
- Consumes: `global.css`
- Produces: Global styles applied to entire app

**What changes:**
- **Add** `import '../styles/global.css'` in the script block
- **Remove** the `:global(*)` and `:global(body)` rules from the `<style>` block (now in global.css)
- **Replace** all hardcoded color values in layout styles with CSS custom properties:
  - `#1f2335` → `var(--color-bg-tertiary)`
  - `#3b4261` → `var(--color-border)`
  - `#7aa2f7` → `var(--color-primary)`
  - `#9aa5ce` → `var(--color-text-muted)`
  - `#c0caf5` → `var(--color-text)`
  - `#24283b` → `var(--color-bg-secondary)`
  - `6px` → `var(--radius-sm)`
  - `1.5rem` → `var(--spacing-lg)`

- [ ] **Step 1: Refactor +layout.svelte**

Add the global CSS import and replace all hardcoded values with design tokens.

- [ ] **Step 2: Run verification**

Run: `npm run check && npm run build && npm test`
Expected: All checks pass

- [ ] **Step 3: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "refactor: layout imports global.css and uses design tokens"
```

---

## Task 10: Final verification and regression test

**Files:**
- No file changes — this is a verification-only task

- [ ] **Step 1: Run full verification suite**

Run: `npm run check && npm run build && npm test`
Expected: All checks pass with zero errors

- [ ] **Step 2: Verify no .js files remain in src/**

Run: `find src -type f -name '*.js' | wc -l`
Expected: Output is `0`

- [ ] **Step 3: Start dev server and manually test both pages**

Run: `npm run dev -- --open`

In browser:
- Navigate to `/` (JSON Formatter)
  - Paste valid JSON → verify it beautifies correctly
  - Test Collapse All / Expand All buttons
  - Test Copy button
  - Test Clear button
  - Change indent setting
  - Paste invalid JSON → verify error message shows
- Navigate to `/type-generator` (Type Generator)
  - Paste valid JSON → verify TypeScript types generate correctly
  - Toggle between `interface` and `type` constructs
  - Toggle between `T[]` and `Array<T>` array syntax
  - Change root name
  - Toggle "Extract nested" checkbox
  - Test Copy button
  - Test Clear button
  - Paste invalid JSON → verify error message shows

- [ ] **Step 4: Verify production build**

Run: `npm run preview`

In browser:
- Verify both pages work identically in production build
- Verify all styling is correct (colors, spacing, typography match original)
- Verify responsive layout on mobile viewport (resize browser to < 768px)

- [ ] **Step 5: Commit (if any fixes needed)**

If any issues were found and fixed:

```bash
git add -A
git commit -m "fix: resolve issues found in final verification"
```

Otherwise, no commit needed.

---

## Plan complete

All 10 tasks defined with:
- Exact file paths
- Detailed step-by-step instructions (no code — see spec/design doc for reference)
- Exact commands with expected output
- Frequent commits (one per task)
- TDD where applicable (Tasks 1-2)

**Next:** Execute this plan using subagent-driven-development (recommended) or executing-plans skill.
