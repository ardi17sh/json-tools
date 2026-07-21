# Multi-Tool JSON Application Implementation Plan [L1-1577]

## Global Constraints

### Shared Components Strategy

Instead of duplicating parsing logic across multiple components, create a shared utility module that provides `parseJson(input)`. All three tools (JSON Beautifier, JSON Formatter, TypeScript Generator) call this function. This avoids code duplication and ensures consistent auto-detection behavior.

The auto-detection logic attempts `JSON.parse()` once on the raw input. If it fails, it loops through stringified variants — `'""' + input`, then `'"" + input + ""'` — parsing each until one succeeds or all fail. Each attempt stores the result and any error message for later use.

### Component Design

Rather than creating many isolated components, think in terms of a shared `JsonBeautifier.svelte` that uses its own internal state (`parsed`, `error`, `collapsed`, etc.) while maintaining its existing interactive tree rendering with collapse/expand nodes, indentation controls (2 spaces, 4 spaces, tab), copy functionality, and stringified JSON auto-detection.

### State Management Approach

Each tool maintains independent state internally:

- JSON Beautifier handles its own parse result, error message, collapsed tree state, and indent selection
- TypeScript Generator needs `parsed`, `error`, plus type generation options like `typeConstruct`, `rootName`, `nestedMode`, `arraySyntax`
- The parent page tracks just the active tab

For TypeScript, generation runs client-side in two modes: inline (recursively building type literals) or extracted (collecting nested objects with generated names, building root + extracted types separately). Type mapping converts primitives to their TS equivalents (string→string, number→number, boolean→boolean, null→null), arrays use the user-selected syntax format, and objects render as `{ key: type; ... }` inline.

Naming for extracted types follows a pattern where nested objects get capitalized parent key names with conflict resolution via numeric suffixes. Error handling catches invalid JSON for display, empty input shows placeholder or error message, and generation errors are caught inline in the UI. The app uses a dark Tokyo Night theme throughout.
