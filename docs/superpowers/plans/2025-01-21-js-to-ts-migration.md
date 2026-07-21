# JavaScript → TypeScript Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the JSON Tools SvelteKit project from JavaScript (with JSDoc annotations) to full TypeScript, one file at a time, with verification after each step.

**Architecture:** Incremental migration strategy. First, create a `tsconfig.json` with `allowJs: true` so both `.js` and `.ts` files can coexist during migration. Convert files from the outside in: config files → library modules → route modules → Svelte components. After every file conversion, run `npm run check`, `npm run build`, and `npm test` to catch regressions immediately. Once all files are `.ts`, remove `allowJs` for a clean TypeScript-only project.

**Tech Stack:** SvelteKit 2, Svelte 5 (Runes mode), TypeScript, Vite 8, Vitest 4, adapter-static

## Global Constraints

- **No behavior changes.** This is a language migration only. The app must work identically before and after.
- **Verify after every task.** Run `npm run check && npm run build && npm test` after each file conversion. All three must pass.
- **One file at a time.** Never convert multiple files in a single task. Each task = one file renamed + types added + verified.
- **Keep existing test passing.** The existing test suite in `typeGenerator.test.js` must continue to pass throughout the migration.
- **No new dependencies.** TypeScript is already installed as a devDependency. No new packages needed.
- **Commit after each task.** Each task ends with a git commit.

## File Structure (before → after)

| Before | After | Responsibility |
|--------|-------|----------------|
| `jsconfig.json` | `tsconfig.json` | TypeScript compiler configuration |
| `vite.config.js` | `vite.config.ts` | Vite build configuration |
| `vitest.config.js` | `vitest.config.ts` | Vitest test runner configuration |
| `src/lib/index.js` | `src/lib/index.ts` | Library barrel export (placeholder) |
| `src/lib/typeGenerator.js` | `src/lib/typeGenerator.ts` | Core type generation logic |
| `src/lib/typeGenerator.test.js` | `src/lib/typeGenerator.test.ts` | Tests for type generation |
| `src/routes/+layout.js` | `src/routes/+layout.ts` | Layout route config (prerender) |
| `src/routes/+layout.svelte` | `src/routes/+layout.svelte` | Layout component (script gets `lang="ts"`) |
| `src/routes/+page.svelte` | `src/routes/+page.svelte` | JSON Formatter page (script gets `lang="ts"`) |
| `src/routes/type-generator/+page.svelte` | `src/routes/type-generator/+page.svelte` | Type Generator page (script gets `lang="ts"`) |
| `src/app.d.ts` | `src/app.d.ts` | Global type declarations (no change needed) |
| `package.json` | `package.json` | Update `check` script to reference `tsconfig.json` |

---

## Task 1: Create tsconfig.json and update package.json

**Files:**
- Delete: `jsconfig.json`
- Create: `tsconfig.json`
- Modify: `package.json`

**What to do:**

1. Rename `jsconfig.json` to `tsconfig.json` (or delete the old one and create a new one with the same content plus TypeScript-specific options).
2. In the new `tsconfig.json`, keep `allowJs: true` and `checkJs: true` so existing `.js` files still compile. Add or confirm these TypeScript-specific settings:
   - `"strict": true` (already present)
   - `"moduleResolution": "bundler"` (already present)
   - Keep `"extends": "./.svelte-kit/tsconfig.json"`
3. In `package.json`, update the `check` and `check:watch` scripts to reference `--tsconfig ./tsconfig.json` instead of `--tsconfig ./jsconfig.json`.
4. Run `npm run check` to verify the new config works with all existing `.js` files.
5. Run `npm run build` to verify the build still produces output.
6. Run `npm test` to verify tests still pass.

**Expected output:**
- `jsconfig.json` no longer exists
- `tsconfig.json` exists and is valid
- `npm run check` exits with 0
- `npm run build` exits with 0
- `npm test` exits with 0 (all tests pass)

**Definition of done:**
- [ ] `jsconfig.json` is removed
- [ ] `tsconfig.json` exists with `allowJs: true`, `strict: true`, `moduleResolution: "bundler"`
- [ ] `package.json` `check` script references `tsconfig.json`
- [ ] `npm run check && npm run build && npm test` all pass
- [ ] Git commit made

---

## Task 2: Convert vite.config.js → vite.config.ts

**Files:**
- Delete: `vite.config.js`
- Create: `vite.config.ts`

**What to do:**

1. Rename `vite.config.js` to `vite.config.ts`.
2. Open the new file. The existing code uses `defineConfig()` from `vite`, which already provides full type inference. The code itself should not need changes — just the file extension.
3. If the TypeScript checker complains about the `adapter` option inside `sveltekit()` plugin options, that's expected (it's a SvelteKit plugin-specific option). No type annotation needed since Vite's `defineConfig` handles it.
4. Run `npm run check` to verify no type errors.
5. Run `npm run build` to verify Vite still picks up the config and builds successfully.
6. Run `npm test` to verify tests still pass.

**Expected output:**
- `vite.config.js` no longer exists
- `vite.config.ts` exists with the same logic
- `npm run build` succeeds (Vite reads `.ts` config natively)

**Definition of done:**
- [ ] `vite.config.js` removed, `vite.config.ts` created
- [ ] File content is identical in logic (just renamed)
- [ ] `npm run check && npm run build && npm test` all pass
- [ ] Git commit made

---

## Task 3: Convert vitest.config.js → vitest.config.ts

**Files:**
- Delete: `vitest.config.js`
- Create: `vitest.config.ts`

**What to do:**

1. Rename `vitest.config.js` to `vitest.config.ts`.
2. The existing `defineConfig()` from `vitest/config` provides type inference. The code should not need changes — just the file extension.
3. The `include` pattern currently points to `src/**/*.test.js`. **Do NOT change this yet** — the test file is still `.js`. We'll update this pattern when we convert the test file (Task 5).
4. Run `npm test` to verify Vitest still finds and runs the `.test.js` test file.
5. Run `npm run build` and `npm run check` to verify nothing broke.

**Expected output:**
- `vitest.config.js` no longer exists
- `vitest.config.ts` exists
- Tests still run and pass (Vitest reads `.ts` config natively)

**Definition of done:**
- [ ] `vitest.config.js` removed, `vitest.config.ts` created
- [ ] `include` pattern still matches `*.test.js` (not changed yet)
- [ ] `npm run check && npm run build && npm test` all pass
- [ ] Git commit made

---

## Task 4: Convert src/lib/typeGenerator.js → src/lib/typeGenerator.ts

**This is the largest and most important task.** The file currently uses JSDoc annotations for types. You'll replace them with real TypeScript syntax.

**Files:**
- Delete: `src/lib/typeGenerator.js`
- Create: `src/lib/typeGenerator.ts`

**What to do:**

1. Rename `src/lib/typeGenerator.js` to `src/lib/typeGenerator.ts`.

2. **Convert `@typedef` to TypeScript types/interfaces.** The file has two `@typedef` blocks:
   - `TypeOptions` — has fields `arraySyntax` (union of `'shorthand' | 'generic'`) and `indent` (number). Convert this to a TypeScript `type` or `interface`.
   - `ExtractOptions` — extends `TypeOptions` with optional fields `typeConstruct` (union of `'interface' | 'type'`) and `rootName` (string). Convert this to a TypeScript `type` or `interface`.

3. **Remove all JSDoc `@param`, `@returns`, and `@typedef` annotations.** Replace them with inline TypeScript parameter types and return types on every function:
   - `capitalize(str)` → add `str: string` parameter type and `: string` return type
   - `toTypeName(key)` → add `key: string` parameter type and `: string` return type
   - `generateInlineType(value, options, depth)` → add `value: unknown`, `options: TypeOptions`, `depth: number = 0` parameter types and `: string` return type
   - `generateType(value, options, depth)` → same types as `generateInlineType`, and add `export` keyword
   - `generateExtractedTypes(value, options)` → add `value: unknown`, `options: ExtractOptions` parameter types and `: string` return type

4. **Remove JSDoc `@type` cast annotations.** Inside function bodies there are casts like `/** @type {Record<string, unknown>} */ (value)`. Replace these with TypeScript `as` casts: `(value as Record<string, unknown>)`.

5. **Remove all `/** @param ... */` and `/** @returns ... */` comment blocks.** They are no longer needed since TypeScript provides the type information.

6. Run `npm run check` — this file should have zero type errors.
7. Run `npm test` — the test file still imports from `./typeGenerator` (extensionless), which resolves to the new `.ts` file. All existing tests should pass.
8. Run `npm run build` to verify the full build works.

**Expected output:**
- `src/lib/typeGenerator.js` no longer exists
- `src/lib/typeGenerator.ts` exists with:
  - Two named TypeScript types/interfaces (`TypeOptions`, `ExtractOptions`) replacing the JSDoc `@typedef` blocks
  - All functions have explicit parameter types and return types
  - Zero JSDoc `@param`, `@returns`, `@typedef`, or `@type` annotations remaining
  - `as` casts replacing JSDoc type casts
- All existing tests pass without modification

**Definition of done:**
- [ ] File renamed from `.js` to `.ts`
- [ ] `TypeOptions` and `ExtractOptions` are proper TypeScript types/interfaces
- [ ] All 5 functions have TypeScript parameter and return types
- [ ] Zero JSDoc type annotations remain in the file
- [ ] `npm run check && npm run build && npm test` all pass
- [ ] Git commit made

---

## Task 5: Convert src/lib/typeGenerator.test.js → src/lib/typeGenerator.test.ts

**Files:**
- Delete: `src/lib/typeGenerator.test.js`
- Create: `src/lib/typeGenerator.test.ts`
- Modify: `vitest.config.ts` (update include pattern)

**What to do:**

1. Rename `src/lib/typeGenerator.test.js` to `src/lib/typeGenerator.test.ts`.

2. Open the file. The test code uses `describe`, `it`, `expect` from `vitest` and calls `generateType` and `generateExtractedTypes`. The code should work as-is since the imported functions are now typed via the `.ts` module. No type annotations are needed in test files — the types flow from the imports.

3. Open `vitest.config.ts` and update the `include` pattern from `src/**/*.test.js` to `src/**/*.test.ts` (since there are no more `.test.js` files).

4. Run `npm test` to verify Vitest finds the renamed test file and all tests pass.
5. Run `npm run check` and `npm run build` to verify nothing broke.

**Expected output:**
- `src/lib/typeGenerator.test.js` no longer exists
- `src/lib/typeGenerator.test.ts` exists with same test logic
- `vitest.config.ts` include pattern updated to `*.test.ts`
- All tests pass

**Definition of done:**
- [ ] Test file renamed from `.test.js` to `.test.ts`
- [ ] `vitest.config.ts` include pattern updated to `src/**/*.test.ts`
- [ ] `npm run check && npm run build && npm test` all pass
- [ ] Git commit made

---

## Task 6: Convert src/lib/index.js → src/lib/index.ts

**Files:**
- Delete: `src/lib/index.js`
- Create: `src/lib/index.ts`

**What to do:**

1. Rename `src/lib/index.js` to `src/lib/index.ts`.
2. The file currently only contains a comment (`// place files you want to import through the $lib alias in this folder.`). No code changes needed — just the rename.
3. Run `npm run check && npm run build && npm test` to verify.

**Expected output:**
- `src/lib/index.js` no longer exists
- `src/lib/index.ts` exists (same content, just renamed)

**Definition of done:**
- [ ] File renamed from `.js` to `.ts`
- [ ] `npm run check && npm run build && npm test` all pass
- [ ] Git commit made

---

## Task 7: Convert src/routes/+layout.js → +layout.ts

**Files:**
- Delete: `src/routes/+layout.js`
- Create: `src/routes/+layout.ts`

**What to do:**

1. Rename `src/routes/+layout.js` to `src/routes/+layout.ts`.
2. The file exports `prerender = true`. Add a TypeScript type annotation: the value should be typed as `boolean` (or use `as const` for a literal `true` type — either approach is fine).
3. Run `npm run check && npm run build && npm test` to verify.

**Expected output:**
- `src/routes/+layout.js` no longer exists
- `src/routes/+layout.ts` exists with the `prerender` export properly typed

**Definition of done:**
- [ ] File renamed from `.js` to `.ts`
- [ ] `prerender` export has a TypeScript type annotation
- [ ] `npm run check && npm run build && npm test` all pass
- [ ] Git commit made

---

## Task 8: Convert src/routes/+layout.svelte (add lang="ts")

**Files:**
- Modify: `src/routes/+layout.svelte`

**What to do:**

1. Change the opening `<script>` tag to `<script lang="ts">`.
2. Add TypeScript types to the reactive variables and props:
   - `children` comes from `$props()` — type it using SvelteKit's `Snippet` type (import from `svelte`). The destructured `children` should be typed as `Snippet`.
   - `navItems` is an array of objects with `href` (string) and `label` (string). Add a type annotation for the array or the object shape.
   - `$page` comes from `$app/stores` and is already typed by SvelteKit — no changes needed there.
3. Run `npm run check` to verify no type errors in the Svelte file.
4. Run `npm run build` and `npm test`.

**Expected output:**
- `<script>` tag has `lang="ts"` attribute
- `children` prop is typed as `Snippet`
- `navItems` array elements are typed (either inline or via an interface)
- No TypeScript errors

**Definition of done:**
- [ ] Script tag has `lang="ts"`
- [ ] `children` prop typed properly
- [ ] `navItems` has type annotations
- [ ] `npm run check && npm run build && npm test` all pass
- [ ] Git commit made

---

## Task 9: Convert src/routes/+page.svelte (JSON Formatter page)

**Files:**
- Modify: `src/routes/+page.svelte`

**What to do:**

1. Change the opening `<script>` tag to `<script lang="ts">`.

2. Add TypeScript types to all `$state()` reactive variables:
   - `input` — `string`
   - `parsed` — `unknown` (since it holds the result of `JSON.parse`, which returns `unknown` in strict mode; currently typed as `null` initial value)
   - `error` — `string`
   - `indent` — `number`
   - `copied` — `boolean`
   - `collapsed` — `Set<string>` (it holds path strings)

3. Add TypeScript types to function parameters:
   - `handleInput(e)` — type `e` as a Svelte `InputEventHandler` event, or more simply as `{ target: HTMLTextAreaElement }` or use the Svelte event type
   - `handleIndentChange(e)` — type `e` similarly for a select element's change event
   - `toggle(path)` — type `path` as `string`
   - `formatValue(val)` — type `val` as `unknown`, return type should be `{ text: string; cls: string }`
   - `isCollapsible(val)` — type `val` as `unknown`, return type `boolean`
   - `collectPaths(val, path)` (inner function in `collapseAll`) — type `val` as `unknown`, `path` as `string`

4. The `parsed` variable is initialized as `null` but holds parsed JSON. Its type should be `unknown` (since JSON can be anything). Where the code checks `parsed !== null`, TypeScript will narrow the type. Ensure no type errors arise from accessing properties on `parsed`.

5. In the `JsonNode` snippet, the parameters `value`, `path`, `depth` should be typed:
   - `value`: `unknown`
   - `path`: `string`
   - `depth`: `number`

6. Run `npm run check` — fix any type errors.
7. Run `npm run build` and `npm test`.

**Expected output:**
- `<script lang="ts">` on the script tag
- All `$state()` variables have explicit type annotations
- All function parameters and return types are annotated
- The `JsonNode` snippet parameters are typed
- No TypeScript errors

**Definition of done:**
- [ ] Script tag has `lang="ts"`
- [ ] All 6 `$state` variables have type annotations
- [ ] All functions have typed parameters and return types
- [ ] `JsonNode` snippet parameters are typed
- [ ] `npm run check && npm run build && npm test` all pass
- [ ] Git commit made

---

## Task 10: Convert src/routes/type-generator/+page.svelte (Type Generator page)

**Files:**
- Modify: `src/routes/type-generator/+page.svelte`

**What to do:**

1. Change the opening `<script>` tag to `<script lang="ts">`.

2. **Fix the import path.** The current import is `from '$lib/typeGenerator.js'`. Since the file is now `.ts`, change this to `from '$lib/typeGenerator'` (extensionless, works with bundler module resolution).

3. Add TypeScript types to all `$state()` reactive variables:
   - `input` — `string`
   - `parsed` — `unknown` (same reasoning as Task 9)
   - `error` — `string`
   - `copied` — `boolean`
   - `typeConstruct` — `'interface' | 'type'` (union type matching the select options)
   - `arraySyntax` — `'shorthand' | 'generic'` (union type matching the select options)
   - `rootName` — `string`
   - `indent` — `number`
   - `extractNested` — `boolean`

4. Add TypeScript types to function parameters:
   - `handleInput(e)` — type `e` as a textarea input event
   - `getOptions()` — return type should match the `ExtractOptions` type from `typeGenerator.ts`. Import the `ExtractOptions` type from `$lib/typeGenerator` and use it as the return type.
   - `getOutput()` — return type `string`
   - `copyOutput()` — return type `Promise<void>` (it's async)
   - `clearAll()` — no parameters, return type `void`

5. The `placeholder` constant is a string — add `: string` type if desired (TypeScript will infer it, but explicit is fine).

6. Run `npm run check` — fix any type errors. The `getOptions()` function constructs an object that must match the `ExtractOptions` interface from Task 4. Verify the types align.
7. Run `npm run build` and `npm test`.

**Expected output:**
- `<script lang="ts">` on the script tag
- Import path updated to `$lib/typeGenerator` (no `.js` extension)
- `ExtractOptions` type imported and used as return type of `getOptions()`
- All `$state` variables have type annotations
- All function parameters and return types are annotated
- No TypeScript errors

**Definition of done:**
- [ ] Script tag has `lang="ts"`
- [ ] Import path updated (no `.js` extension)
- [ ] `ExtractOptions` imported and used
- [ ] All 9 `$state` variables have type annotations
- [ ] All functions have typed parameters and return types
- [ ] `npm run check && npm run build && npm test` all pass
- [ ] Git commit made

---

## Task 11: Remove allowJs and finalize TypeScript configuration

**Files:**
- Modify: `tsconfig.json`

**What to do:**

1. Open `tsconfig.json`. At this point, all source files in `src/` should be `.ts` or `.svelte`. No `.js` files should remain in the source tree.

2. Verify no `.js` source files remain by listing all files in `src/`:
   - Run a command to find all `.js` files under `src/` (there should be none)
   - If any remain, go back and convert them before proceeding

3. In `tsconfig.json`, change `allowJs` from `true` to `false` (or remove the option entirely since `false` is the default).

4. Change `checkJs` from `true` to `false` (or remove it, since it only applies when `allowJs` is true).

5. Run `npm run check` to verify the project compiles as pure TypeScript with no fallback to JavaScript.
6. Run `npm run build` to verify the production build works.
7. Run `npm test` to verify all tests pass.

**Expected output:**
- `tsconfig.json` has `allowJs: false` (or the option is absent)
- `tsconfig.json` has `checkJs: false` (or the option is absent)
- No `.js` files exist in `src/` directory
- Project is now pure TypeScript

**Definition of done:**
- [ ] `allowJs` set to `false` or removed from `tsconfig.json`
- [ ] `checkJs` set to `false` or removed from `tsconfig.json`
- [ ] Zero `.js` files remain under `src/`
- [ ] `npm run check && npm run build && npm test` all pass
- [ ] Git commit made

---

## Task 12: Final verification and regression test

**Files:**
- No file changes — this is a verification-only task

**What to do:**

1. Run the full verification suite:
   - `npm run check` — TypeScript type checking with `svelte-check`
   - `npm run build` — production build with Vite
   - `npm test` — all unit tests with Vitest

2. Start the dev server with `npm run dev` and manually verify in a browser:
   - Navigate to `/` (JSON Formatter page)
     - Paste valid JSON → verify it beautifies correctly
     - Test Collapse All / Expand All buttons
     - Test Copy button
     - Test Clear button
     - Change indent setting
     - Paste invalid JSON → verify error message shows
   - Navigate to `/type-generator` (Type Generator page)
     - Paste valid JSON → verify TypeScript types generate correctly
     - Toggle between `interface` and `type` constructs
     - Toggle between `T[]` and `Array<T>` array syntax
     - Change root name
     - Toggle "Extract nested" checkbox
     - Test Copy button
     - Test Clear button
     - Paste invalid JSON → verify error message shows

3. Verify the build output in the `build/` directory contains the expected HTML and assets.

4. Run `npm run preview` to test the production build locally and verify both pages work.

**Expected output:**
- All automated checks pass with zero errors or warnings
- Both pages work correctly in the browser with no regressions
- Production build output is valid

**Definition of done:**
- [ ] `npm run check` passes with zero errors
- [ ] `npm run build` succeeds
- [ ] `npm test` passes (all tests green)
- [ ] Manual browser test: JSON Formatter works correctly
- [ ] Manual browser test: Type Generator works correctly
- [ ] `npm run preview` serves working pages
- [ ] Git commit made (if any fixes were needed)
- [ ] Migration complete ✓
