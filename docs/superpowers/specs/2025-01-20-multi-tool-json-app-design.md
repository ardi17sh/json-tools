# Multi-Tool JSON Application Design

**Date:** 2025-01-20
**Status:** Approved

## Overview

Transform the existing JSON Beautifier into a multi-tool application with three independent tools accessible via tab navigation. Each tool has its own input and output, allowing users to work on different JSON inputs for different purposes without interference.

## Requirements

### Core Structure
- Single page with tab navigation at the top
- Three independent tools: JSON Beautifier, JSON Formatter, TypeScript Generator
- Each tool maintains its own input textarea and output display
- Switching tabs does not share or preserve input between tools
- Active tab visually highlighted

### Tool Specifications

#### 1. JSON Beautifier (Existing)
- **Input:** Textarea for JSON input
- **Output:** Collapsible tree view with syntax highlighting
- **Controls:**
  - Indent size selector (2 spaces, 4 spaces, tab)
  - Collapse All / Expand All buttons
  - Copy button
- **Features:**
  - Auto-detect and parse stringified JSON (existing functionality)
  - Interactive tree nodes with collapse/expand
  - Color-coded syntax (strings, numbers, booleans, null)

#### 2. JSON Formatter (New)
- **Input:** Textarea for JSON input
- **Output:** Traditional formatted JSON string with indentation
- **Controls:**
  - Copy button only
- **Features:**
  - Fixed 2-space indentation (no options)
  - Auto-detect and parse stringified JSON
  - Display as formatted text (not tree)

#### 3. TypeScript Generator (New, Using Existing Logic)
- **Input:** Textarea for JSON input
- **Output:** Generated TypeScript types/interfaces
- **Controls:**
  - Type construct toggle: `interface` | `type`
  - Root name input (default: "Root")
  - Nested objects toggle: `inline` | `extracted`
  - Array syntax toggle: `T[]` | `Array<T>`
  - Copy button
- **Features:**
  - Uses existing `typeGenerator.js` logic
  - Follows approved TypeScript generation design spec
  - Auto-detect and parse stringified JSON

## Architecture

### Component Structure

```
+page.svelte (Parent with tab navigation)
├── InputPanel.svelte (Reusable textarea component)
├── OutputPanel.svelte (Reusable display area)
├── JsonBeautifier.svelte
│   ├── Uses InputPanel
│   ├── Uses OutputPanel with tree rendering
│   └── Tree view controls
├── JsonFormatter.svelte
│   ├── Uses InputPanel
│   └── Uses OutputPanel with formatted string rendering
└── TypeScriptGenerator.svelte
    ├── Uses InputPanel
    ├── Uses OutputPanel with TypeScript rendering
    └── TypeScript option controls
```

### Shared Components

#### InputPanel.svelte
Reusable textarea component with:
- Consistent styling across all tools
- Placeholder text
- onChange handler
- Common props: `value`, `placeholder`, `onInput`

#### OutputPanel.svelte
Reusable display container with:
- Header with title and action buttons
- Scrollable content area
- Common props: `title`, `children` (slot), `actions` (slot for buttons)

### State Management

Each tool component maintains its own state:
- `input`: string (textarea value)
- `parsed`: any (parsed JSON)
- `error`: string (parse error message)
- Tool-specific state (e.g., `collapsed` for beautifier, TypeScript options for generator)

Parent page (`+page.svelte`) maintains:
- `activeTab`: 'beautifier' | 'formatter' | 'typescript'

### Navigation

Tab bar in header with three buttons:
- "Beautifier" (default active)
- "Formatter"
- "TypeScript"

Active tab:
- Visually highlighted (different background/border)
- Corresponding tool component rendered
- Other tools not rendered (conditional rendering)

## Implementation Details

### Tab Navigation
```svelte
<header>
  <div class="tabs">
    <button class:active={activeTab === 'beautifier'}>Beautifier</button>
    <button class:active={activeTab === 'formatter'}>Formatter</button>
    <button class:active={activeTab === 'typescript'}>TypeScript</button>
  </div>
</header>

<main>
  {#if activeTab === 'beautifier'}
    <JsonBeautifier />
  {:else if activeTab === 'formatter'}
    <JsonFormatter />
  {:else if activeTab === 'typescript'}
    <TypeScriptGenerator />
  {/if}
</main>
```

### JSON Beautifier Component
Extract existing logic from current `+page.svelte`:
- Tree view rendering (JsonNode snippet)
- Collapse/expand functionality
- Indent controls
- Copy functionality
- Stringified JSON auto-detection

### JSON Formatter Component
Simple implementation:
- Parse input with auto-detection
- Display formatted JSON string using `JSON.stringify(parsed, null, 2)`
- Copy button using `navigator.clipboard.writeText()`

### TypeScript Generator Component
Integrate existing `typeGenerator.js`:
- Parse input with auto-detection
- Generate TypeScript based on options
- Display generated code
- Option controls per approved spec

### Styling
- Maintain existing dark theme (Tokyo Night)
- Consistent spacing and typography
- Tab buttons styled to match existing button design
- Active tab uses accent color (#7aa2f7)

## Data Flow

```
User Input (textarea)
    ↓
onChange handler
    ↓
JSON.parse() with auto-detection loop
    ↓
Store in component state (parsed)
    ↓
Render output based on tool type
    ↓
User interactions (copy, collapse, toggle options)
```

## Error Handling

All three tools:
- Catch JSON parse errors
- Display error message in output area
- Clear error when input changes
- Disable copy button when error exists

TypeScript Generator:
- Catch type generation errors
- Display inline error message
- Fallback to error display if generation fails

## Testing Strategy

### Unit Tests
- InputPanel component rendering
- OutputPanel component rendering
- JSON parsing with auto-detection
- TypeScript generation (existing tests)

### Integration Tests
- Tab switching functionality
- Each tool's input/output flow
- Copy functionality across tools
- Error handling in each tool

### Manual Testing
- Test with various JSON structures
- Test stringified JSON auto-detection
- Test all TypeScript generator options
- Test tab switching with different inputs
- Verify independent state per tool

## Migration Plan

1. Create shared components (InputPanel, OutputPanel)
2. Extract existing beautifier logic into JsonBeautifier.svelte
3. Create JsonFormatter.svelte
4. Create TypeScriptGenerator.svelte (using existing typeGenerator.js)
5. Update +page.svelte to handle tab navigation
6. Test all three tools independently
7. Test tab switching and state isolation

## Dependencies

- No new external dependencies
- Uses existing:
  - `typeGenerator.js` for TypeScript generation
  - Svelte 5 runes ($state, $props)
  - Existing styling and theme

## Performance Considerations

- Lazy render: only active tab's component is rendered
- Each tool maintains independent state (no cross-tool updates)
- Debounce parsing if needed for large inputs
- TypeScript generation runs on-demand (when switching to TypeScript tab or options change)

## Accessibility

- Tab buttons have clear focus states
- Active tab indicated visually and with aria-current
- Textareas have proper labels (via aria-label or associated label elements)
- Copy buttons have clear state feedback
- Error messages are announced to screen readers

## Future Enhancements (Out of Scope)

- Share input between tools (toggle option)
- Export/import JSON from file
- JSON validation with detailed error messages
- JSON schema generation
- Additional language support (Go, Rust, Python types)
- Dark/light theme toggle
