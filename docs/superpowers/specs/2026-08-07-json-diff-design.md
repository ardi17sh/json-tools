# JSON Diff / Compare — Design

## Overview

Add a third tool to the JSON Tools app: a side-by-side JSON diff that highlights
added, removed, and changed keys/values. It parses two JSON payloads entered by
the user and renders both as nested trees with per-node color highlighting.

The feature is entirely client-side, stays prerendered/static (matching the
existing formatter and type-generator tools), and adds **no new dependencies**.

## Goals / Non-goals

Goals:
- Compare two JSON values and show, at the key/value level, what changed.
- Reuse the existing formatter's `<details>` tree rendering, `tones` bracket
  palette, gutter/indent-guide CSS, and `$derived` reactive pattern.
- Pure, unit-testable diff logic.

Non-goals (YAGNI):
- Smart array diffing (reorders, value-matched inserts). Arrays compare by
  index only (see Array rule).
- Custom diff configurable preferences (e.g. ignore keys, custom colors).
- Merging/patching, exporting diff files.
- Server-side processing.

## Diff engine — `src/lib/jsonDiff.ts`

A pure function that walks two values and produces a status-tagged tree.

```ts
export type DiffStatus = 'same' | 'added' | 'removed' | 'changed';

export interface DiffNode {
  key: string;
  status: DiffStatus;
  oldValue: unknown;   // undefined when 'added'
  newValue: unknown;   // undefined when 'removed'
  children?: DiffNode[];
}

export function diffJson(oldValue: unknown, newValue: unknown, key = ''): DiffNode;
```

### Rules

- **Type mismatch** (e.g. `string` vs `object`): status `changed`, no recursion;
  both raw values preserved.
- **Primitives** (`null`, `string`, `number`, `boolean`):
  equal → `same`; different → `changed`.
- **Objects**: merge keys from both sides (union).
  - key only in old → `removed`
  - key only in new → `added`
  - key in both → recurse
- **Arrays**: compare by index (`key` is the index, as a string).
  - beyond the shorter length → `added` (new side) / `removed` (old side)
  - both elements are objects → recurse; otherwise status computed like primitives.
- **Identical at a node** → `same`, children omitted (pruned).

`null` is treated as a primitive value, not a container.

## UI — new component `src/lib/components/DiffNode.svelte`

Recursive tree component mirroring the formatter's `<details>` tree.

Props: `node: DiffNode`, `depth = 0`, `side: 'old' | 'new'`.

- Renders `<details class="block" open style:--bc={tones[depth % tones.length]}>`
  reusing the existing `.children`, `.closer`, `.opener`, `.leaf`, `.key`,
  `.colon`, `.bracket`, `.collapsed-hint` styles from the formatter.
- Old side displays `oldValue`; new side displays `newValue`.
  - `changed` leaves: value in **red** on old side, **green** on new side.
  - `added`: green value shown only on the new side (old side shows its
    collapsed summary without the value).
  - `removed`: red value shown only on the old side.
  - `same`: neutral value, no highlight.
- `each` iterator is index-keyed (consistent with the formatter; safe because
  the tree is read-only and never reorders).

Collapsed summary `{N keys}` / `[N items]` is shown for both sides identically
so the two trees align row-for-row.

## Page — new route `src/routes/diff/+page.svelte`

Mirrors the existing two-panel grid, then the diff trees below.

```
[JSON Left textarea]   [JSON Right textarea]
   (inline error)         (inline error)
---------------------------- full width ----------------------------
[    Old tree (left JSON, red highlights)    ]
[    New tree (right JSON, green highlights) ]
```

State:
```ts
let left  = $state('');
let right = $state('');

const leftParsed  = $derived.by(() => left.trim()  ? parseJson(left)  : null);
const rightParsed = $derived.by(() => right.trim() ? parseJson(right) : null);

let diff = $derived.by(() => {
  const l = leftParsed, r = rightParsed;
  if (!l || !r || l.error || r.error) return null;
  return diffJson(l.data, r.data);
});
```

- If either input is empty or malformed: show inline error, hide output trees.
- Valid both sides: render two `DiffNode` trees (`side="old"`, `side="new"`)
  from the single `diff` value.
- Reuses the existing textarea input styling (`.input-area`) and error style.

## Navigation

Add a nav item in `src/routes/+layout.svelte`:

```
{ href: '/diff', label: 'JSON Diff' }
```

## Error handling

- Malformed JSON on either side → inline per-input error, no output (same UX
  as the type-generator).
- Empty input → no parse, no output.
- Empty arrays on one side → tail added/removed per array rule.
- No depth guard (YAGNI): recursion is bounded by the data itself.

## Testing — `src/lib/jsonDiff.test.ts`

Pure unit tests (no rendering), matching existing `*.test.ts` style:

1. Identical objects → all `same` (children pruned).
2. Added key → `added`.
3. Removed key → `removed`.
4. Changed primitive → `changed`, correct old/new values.
5. Type mismatch (string ↔ object) → `changed`, no children.
6. Arrays by index: shorter tail → added/removed; mid-insert shifts later
   indexes (documents the index-only decision).
7. Nested change → `changed` at parent.

## File changes

- `src/lib/jsonDiff.ts` (new) — diff engine.
- `src/lib/jsonDiff.test.ts` (new) — unit tests.
- `src/lib/components/DiffNode.svelte` (new) — diff tree component.
- `src/routes/diff/+page.svelte` (new) — page.
- `src/routes/+layout.svelte` (edit) — add `JSON Diff` nav item.

No new dependencies. App remains fully prerendered and client-side.