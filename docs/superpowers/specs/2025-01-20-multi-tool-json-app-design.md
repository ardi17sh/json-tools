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
- **Controls:** Indent size selector (2 spaces, 4 spaces, tab), Collapse All / Expand All buttons, Copy button
- **Features:** Auto-detect and parse stringified JSON (existing functionality), Interactive tree nodes with collapse/expand, Color-coded syntax (strings, numbers, booleans, null)

#### 2. JSON Formatter (New)

- **Input:** Textarea for JSON input
- **Output:** Traditional formatted JSON string with indentation
- **Controls:** Copy button only
- **Features:** Fixed 2-space indentation (no options), Auto-detect and parse stringified JSON, Display as formatted text (not tree)

#### 3. TypeScript Generator (New, Using Existing Logic)

- **Input:** Textarea for JSON input
- **Output:** Generated TypeScript types/interfaces
- **Controls:** Type construct toggle (`interface` / `type`), Root name input (default: "Root"), Nested objects toggle (`inline` / `extracted`), Array syntax toggle (`T[]` / `Array<T>`), Copy button
- **Features:** Uses existing type generator logic, Follows approved TypeScript generation design spec, Auto-detect and parse stringified JSON

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

Reusable textarea component with: consistent styling across all tools, placeholder text, onChange handler, Common props: `value`, `placeholder`, `onInput`

#### OutputPanel.svelte

Reusable display container with: header containing title and action buttons, scrollable content area below, Common props: `title`, children via slot, optional action buttons via slot

### State Management

Each tool component maintains its own state including the input value (textarea text), parsed JSON result, error message from parsing, plus tool-specific variables like collapsed tree nodes for the beautifier and TypeScript option settings for the generator.

The parent page (`+page.svelte`) tracks only which tab is currently active. Navigation uses simple conditional rendering with three buttons in a bar—"Beautifier" (default), "Formatter", "TypeScript"—where the active tab gets visual highlighting. Only the corresponding tool component renders while others are hidden, matching the existing dark theme (Tokyo Night) throughout.

## Styling

- Maintain existing dark theme (Tokyo Night)
- Consistent spacing and typography across all tools
- Tab buttons styled to match existing button design patterns
- Active tab uses accent color (#7aa2f7)

## Error Handling

All three tools handle JSON parse errors by displaying a message in the output area, clear error state when input changes, and disable copy until parsing succeeds. TypeScript Generator additionally catches type generation errors with inline display and fallback to error state if generation fails completely.

## Testing Strategy

### Unit Tests

- InputPanel component rendering
- OutputPanel component rendering
- JSON parsing with auto-detection logic
- TypeScript generation (existing tests in separate spec)

### Integration Tests

- Tab switching functionality across all tools
- Each tool's input/output flow independently
- Copy functionality within each tool
- Error handling paths through each tool

### Manual Testing

- Various JSON structure inputs for each tool
- Stringified JSON auto-detection verification
- All TypeScript generator toggle combinations
- Tab switching with different inputs to verify state isolation between tools
