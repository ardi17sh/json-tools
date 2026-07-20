# TypeScript Type Generation Feature Design

**Date:** 2025-01-20
**Status:** Approved

## Overview

Add TypeScript type generation to the JSON Beautifier. Users paste JSON, get formatted output on the left, and can toggle to see generated TypeScript types on the right.

## User Requirements

- Generate TypeScript types from JSON input
- Toggle between `interface` and `type` declarations
- Toggle between inline and extracted nested objects
- Toggle between `T[]` and `Array<T>` array syntax
- Custom root type name (default: "Root")
- Copy button for generated TypeScript
- All client-side, no data storage

## Design Decisions

### Type Construct
- **Choice:** Both `interface` and `type` with user toggle
- **Rationale:** Different use cases prefer different constructs

### Nested Object Handling
- **Choice:** Both inline and extracted with user toggle
- **Rationale:** Inline is simpler for small JSON; extracted is better for reusability

### Root Type Name
- **Choice:** Default "Root" with editable input field
- **Rationale:** Sensible default, but users often want custom names

### Array Syntax
- **Choice:** Both `T[]` and `Array<T>` with user toggle
- **Rationale:** Style preference varies by team/project

## Architecture

### Component Structure
```
+page.svelte
├── Input panel (textarea)
├── Output panel
│   ├── Beautified JSON view (existing)
│   └── TypeScript view (new)
└── TypeScript controls (new)
    ├── Type construct toggle (interface/type)
    ├── Root name input
    ├── Nested objects toggle (inline/extracted)
    └── Array syntax toggle (T[]/Array<T>)
```

### State Management
Add new state variables:
- `typeConstruct`: 'interface' | 'type'
- `rootName`: string (default: 'Root')
- `nestedMode`: 'inline' | 'extracted'
- `arraySyntax`: 'shorthand' | 'generic'
- `outputMode`: 'json' | 'typescript'
- `typescriptOutput`: string (generated types)
- `copiedTypes`: boolean

### Type Generation Logic

#### Type Mapping
```javascript
string → string
number → number
boolean → boolean
null → null
Array<T> → T[] or Array<T>
Object → { ... } or extracted interface/type
```

#### Algorithm
1. Parse JSON input
2. If `nestedMode === 'inline'`:
   - Recursively generate type literals inline
3. If `nestedMode === 'extracted'`:
   - Collect all nested objects with generated names
   - Generate root type referencing extracted types
   - Generate each extracted type separately
4. Format based on `typeConstruct` and `arraySyntax`

#### Naming Strategy for Extracted Types
- Root: user-provided name (default "Root")
- Nested: capitalize parent key name
  - `user` → `User`
  - `address` → `Address`
  - Handle conflicts by appending number suffix

### UI Layout

#### Option 1: Toggle View (Recommended)
- Single output panel with tabs: "JSON" | "TypeScript"
- TypeScript controls appear when "TypeScript" tab is active
- Simpler, less cluttered

#### Option 2: Separate Panel
- Third panel below or side-by-side
- More screen real estate
- Can see both JSON and types simultaneously

**Decision:** Option 1 (toggle view) — cleaner UI, matches "simple" requirement

### Controls Placement
- TypeScript controls in output panel header (when TypeScript tab active)
- Compact layout: small buttons and input
- Controls: `[interface|type] [Root name input] [inline|extracted] [T[]|Array<T>]`

## Implementation Details

### Type Generation Function
```javascript
function generateTypes(parsed, options) {
  const { typeConstruct, rootName, nestedMode, arraySyntax } = options;
  
  if (nestedMode === 'inline') {
    return generateInlineType(parsed, rootName, typeConstruct, arraySyntax);
  } else {
    return generateExtractedTypes(parsed, rootName, typeConstruct, arraySyntax);
  }
}
```

### Inline Generation
Recursively build type string:
- Primitives: return type name
- Arrays: `elementType[]` or `Array<elementType>`
- Objects: `{ key: type; ... }`

### Extracted Generation
1. Traverse JSON tree, collect all objects with paths
2. Generate names for each (capitalize keys)
3. Build type definitions in dependency order
4. Root type references extracted types by name

### Formatting
- 2-space indentation
- Semicolons after properties
- Proper line breaks
- Match user's indent preference for nested structures

## Error Handling
- Invalid JSON: show error, no type generation
- Empty input: show placeholder or empty output
- Type generation errors: catch and display inline

## Testing Strategy
- Test with various JSON structures:
  - Simple objects
  - Nested objects
  - Arrays of primitives
  - Arrays of objects
  - Mixed types
  - Null values
  - Empty objects/arrays
- Test all toggle combinations
- Test custom root names
- Test edge cases (empty input, invalid JSON)

## Dependencies
- None — pure JavaScript implementation
- No external libraries for type generation

## Performance Considerations
- Generate types when switching to TypeScript tab
- Debounce if real-time generation causes lag
- For very large JSON, consider lazy generation

## Future Enhancements (Out of Scope)
- Optional properties (detect missing keys in arrays)
- Union types for mixed arrays
- Date/datetime detection
- Custom type mappings
- Export to file
