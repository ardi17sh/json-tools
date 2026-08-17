# Search Feature for JSON Formatter

**Date:** 2026-08-17
**Status:** Draft

## Overview

Add search functionality to both the input and output panels of the JSON Formatter tool. Users can search for text within their raw JSON input and within the formatted, collapsible output tree.

## Requirements

### Input Panel Search

- A search input field placed in the Input panel header.
- Case-insensitive text matching across the entire textarea content.
- Prev / Next navigation buttons to cycle through matches.
- Match counter showing current position and total (e.g., "2/5").
- Pressing Enter navigates to the next match; Shift+Enter navigates to the previous match.
- The current match is selected and scrolled into view in the textarea.
- Clearing the search query removes all selections.

### Output Panel Search

- A search input field placed in the Output panel header.
- Case-insensitive text matching across the rendered JSON tree.
- Prev / Next navigation buttons to cycle through matches.
- Match counter showing current position and total.
- Pressing Enter navigates to the next match; Shift+Enter navigates to the previous match.
- Matching text nodes are visually highlighted.
- The currently active match receives a distinct highlight style and is scrolled into view.
- If a match is inside a collapsed tree node, the parent node automatically expands to reveal the match.
- Clearing the search query removes all highlights and restores the tree to its previous expansion state.

### Shared Behavior

- Search is case-insensitive by default.
- Navigation wraps around (next from last match goes to first, prev from first goes to last).
- Buttons are disabled when there are zero matches.
- Changing the search query resets the current match index to the first match.
- Changing the underlying JSON content automatically re-runs the search on the new content.

## UI Placement

- Search controls sit in each panel's header, to the right of the panel title and alongside existing action buttons (e.g., Copy button in the Output panel).
- The search input uses a compact text field with a placeholder.
- Navigation uses small arrow buttons.

## Interaction Design

### Input Search Flow

1. User types a query into the Input search box.
2. The system finds all case-insensitive matches in the textarea.
3. The first match is automatically selected and the textarea scrolls to it.
4. User clicks Next or presses Enter to move to subsequent matches.
5. User clicks Prev or presses Shift+Enter to move to prior matches.
6. User clears the query; selection is removed.

### Output Search Flow

1. User types a query into the Output search box.
2. The system traverses the rendered DOM tree to find all case-insensitive text matches.
3. Matching text is wrapped with a highlight element.
4. The first match receives an active highlight style and is scrolled into view.
5. If a match is inside a collapsed details element, all ancestor details elements are opened.
6. User navigates with Prev / Next buttons or keyboard shortcuts.
7. User clears the query; all highlight elements are removed and the tree returns to its natural state.

## Styling

- Search input uses the application's existing form control styles.
- Match counter uses muted text color.
- Navigation buttons are compact and disabled when no matches exist.
- Output highlights use a subtle background color for regular matches and a stronger background with an outline for the active match.
- All colors align with the existing Tokyo Night dark theme palette.

## Accessibility

- Navigation buttons include aria-label attributes.
- Keyboard shortcuts (Enter / Shift+Enter) provide an alternative to mouse interaction.
- Focus management ensures the search input remains usable after navigation.

## Testing Strategy

### Unit Tests

- Case-insensitive matching logic.
- Multiple match detection.
- Empty query handling.
- No-match handling.

### Integration Tests

- Input search selection and scrolling.
- Output highlight insertion and cleanup.
- Auto-expansion of collapsed parent nodes.
- Navigation wrapping behavior.
- Query clearing resets state.

### Manual Testing

- Large JSON files (performance).
- Deeply nested structures (auto-expand behavior).
- Unicode and special characters in search queries.
- Mobile responsive layout (search controls in stacked panels).
