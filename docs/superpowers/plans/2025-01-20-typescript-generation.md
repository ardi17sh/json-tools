# TypeScript Type Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TypeScript type generation to the JSON Beautifier with toggleable options for interface/type, inline/extracted, and array syntax.

**Architecture:** Pure JavaScript type generation functions in a separate module, integrated into the existing SvelteKit page via UI controls. Type generation happens client-side when user switches to TypeScript tab.

**Tech Stack:** SvelteKit 5, Svelte 5 (Runes mode), vanilla JavaScript (no external dependencies)

## Global Constraints

- All processing client-side, no server logic
- No localStorage, cookies, or tracking
- Static deployment via adapter-static
- Zero external dependencies beyond SvelteKit
- TypeScript generation must handle: string, number, boolean, null, arrays, objects
- Support both `interface` and `type` constructs
- Support both inline and extracted nested object modes
- Support both `T[]` and `Array<T>` array syntax
- Root type name defaults to "Root" but is editable

---

### Task 1: Set Up Test Infrastructure

**Files:**
- Create: `src/lib/typeGenerator.test.js`
- Create: `vitest.config.js`

**Interfaces:**
- Consumes: Nothing (initial setup)
- Produces: Test infrastructure for type generation functions

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`
Expected: Vitest added to devDependencies

- [ ] **Step 2: Create Vitest config**

Create `vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.js']
  }
});
```

- [ ] **Step 3: Add test script to package.json**

Modify `package.json` to add test script:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4: Create empty test file**

Create `src/lib/typeGenerator.test.js`:

```javascript
import { describe, it, expect } from 'vitest';

describe('TypeScript Type Generator', () => {
  it('should pass initial test', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 5: Run test to verify setup**

Run: `npm test`
Expected: Test passes with "should pass initial test"

- [ ] **Step 6: Commit**

```bash
git add vitest.config.js package.json src/lib/typeGenerator.test.js
git commit -m "test: set up Vitest for type generation tests"
```

---

### Task 2: Implement Primitive Type Generation

**Files:**
- Create: `src/lib/typeGenerator.js`
- Modify: `src/lib/typeGenerator.test.js`

**Interfaces:**
- Consumes: Nothing
- Produces: `generateType(value, options)` function that handles primitives

- [ ] **Step 1: Write failing test for primitives**

Add to `src/lib/typeGenerator.test.js`:

```javascript
import { generateType } from './typeGenerator';

describe('generateType - primitives', () => {
  it('should generate string type', () => {
    const result = generateType('hello', { arraySyntax: 'shorthand' });
    expect(result).toBe('string');
  });

  it('should generate number type', () => {
    const result = generateType(42, { arraySyntax: 'shorthand' });
    expect(result).toBe('number');
  });

  it('should generate boolean type', () => {
    const result = generateType(true, { arraySyntax: 'shorthand' });
    expect(result).toBe('boolean');
  });

  it('should generate null type', () => {
    const result = generateType(null, { arraySyntax: 'shorthand' });
    expect(result).toBe('null');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - "generateType is not defined"

- [ ] **Step 3: Implement primitive type generation**

Create `src/lib/typeGenerator.js`:

```javascript
export function generateType(value, options) {
  if (value === null) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  
  throw new Error('Unsupported type');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: All 4 primitive tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/typeGenerator.js src/lib/typeGenerator.test.js
git commit -m "feat: add primitive type generation (string, number, boolean, null)"
```

---

### Task 3: Implement Array Type Generation

**Files:**
- Modify: `src/lib/typeGenerator.js`
- Modify: `src/lib/typeGenerator.test.js`

**Interfaces:**
- Consumes: `generateType(value, options)` from Task 2
- Produces: Array support with both `T[]` and `Array<T>` syntax

- [ ] **Step 1: Write failing test for arrays**

Add to `src/lib/typeGenerator.test.js`:

```javascript
describe('generateType - arrays', () => {
  it('should generate array with shorthand syntax', () => {
    const result = generateType([1, 2, 3], { arraySyntax: 'shorthand' });
    expect(result).toBe('number[]');
  });

  it('should generate array with generic syntax', () => {
    const result = generateType([1, 2, 3], { arraySyntax: 'generic' });
    expect(result).toBe('Array<number>');
  });

  it('should generate string array', () => {
    const result = generateType(['a', 'b'], { arraySyntax: 'shorthand' });
    expect(result).toBe('string[]');
  });

  it('should handle empty array', () => {
    const result = generateType([], { arraySyntax: 'shorthand' });
    expect(result).toBe('unknown[]');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - arrays throw "Unsupported type"

- [ ] **Step 3: Implement array type generation**

Modify `src/lib/typeGenerator.js`:

```javascript
export function generateType(value, options) {
  if (value === null) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return options.arraySyntax === 'shorthand' ? 'unknown[]' : 'Array<unknown>';
    }
    const elementType = generateType(value[0], options);
    return options.arraySyntax === 'shorthand' 
      ? `${elementType}[]` 
      : `Array<${elementType}>`;
  }
  
  throw new Error('Unsupported type');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: All array tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/typeGenerator.js src/lib/typeGenerator.test.js
git commit -m "feat: add array type generation with shorthand and generic syntax"
```

---

### Task 4: Implement Inline Object Type Generation

**Files:**
- Modify: `src/lib/typeGenerator.js`
- Modify: `src/lib/typeGenerator.test.js`

**Interfaces:**
- Consumes: `generateType(value, options)` from Task 3
- Produces: Inline object type generation

- [ ] **Step 1: Write failing test for inline objects**

Add to `src/lib/typeGenerator.test.js`:

```javascript
describe('generateType - inline objects', () => {
  it('should generate inline object type', () => {
    const value = { name: 'John', age: 30 };
    const options = { arraySyntax: 'shorthand', indent: 2 };
    const result = generateType(value, options);
    expect(result).toBe(`{
  name: string;
  age: number;
}`);
  });

  it('should handle nested objects inline', () => {
    const value = { user: { name: 'John' } };
    const options = { arraySyntax: 'shorthand', indent: 2 };
    const result = generateType(value, options);
    expect(result).toBe(`{
  user: {
    name: string;
  };
}`);
  });

  it('should handle empty object', () => {
    const value = {};
    const options = { arraySyntax: 'shorthand', indent: 2 };
    const result = generateType(value, options);
    expect(result).toBe('{}');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - objects throw "Unsupported type"

- [ ] **Step 3: Implement inline object type generation**

Modify `src/lib/typeGenerator.js`:

```javascript
export function generateType(value, options, depth = 0) {
  const indent = ' '.repeat(options.indent * depth);
  const innerIndent = ' '.repeat(options.indent * (depth + 1));
  
  if (value === null) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return options.arraySyntax === 'shorthand' ? 'unknown[]' : 'Array<unknown>';
    }
    const elementType = generateType(value[0], options, depth);
    return options.arraySyntax === 'shorthand' 
      ? `${elementType}[]` 
      : `Array<${elementType}>`;
  }
  
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    
    const properties = entries.map(([key, val]) => {
      const type = generateType(val, options, depth + 1);
      return `${innerIndent}${key}: ${type};`;
    });
    
    return `{\n${properties.join('\n')}\n${indent}}`;
  }
  
  throw new Error('Unsupported type');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: All inline object tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/typeGenerator.js src/lib/typeGenerator.test.js
git commit -m "feat: add inline object type generation"
```

---

### Task 5: Implement Extracted Types Mode

**Files:**
- Modify: `src/lib/typeGenerator.js`
- Modify: `src/lib/typeGenerator.test.js`

**Interfaces:**
- Consumes: `generateType(value, options)` from Task 4
- Produces: `generateExtractedTypes(value, options)` function

- [ ] **Step 1: Write failing test for extracted types**

Add to `src/lib/typeGenerator.test.js`:

```javascript
import { generateExtractedTypes } from './typeGenerator';

describe('generateExtractedTypes', () => {
  it('should extract nested objects', () => {
    const value = { user: { name: 'John', age: 30 } };
    const options = { 
      typeConstruct: 'interface', 
      rootName: 'Root',
      arraySyntax: 'shorthand',
      indent: 2
    };
    const result = generateExtractedTypes(value, options);
    expect(result).toContain('interface Root {');
    expect(result).toContain('user: User;');
    expect(result).toContain('interface User {');
    expect(result).toContain('name: string;');
    expect(result).toContain('age: number;');
  });

  it('should use type construct when specified', () => {
    const value = { user: { name: 'John' } };
    const options = { 
      typeConstruct: 'type', 
      rootName: 'Root',
      arraySyntax: 'shorthand',
      indent: 2
    };
    const result = generateExtractedTypes(value, options);
    expect(result).toContain('type Root =');
    expect(result).toContain('type User =');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - "generateExtractedTypes is not defined"

- [ ] **Step 3: Implement extracted types generation**

Add to `src/lib/typeGenerator.js`:

```javascript
export function generateExtractedTypes(value, options) {
  const types = new Map();
  collectTypes(value, options.rootName, types, options);
  
  const output = [];
  for (const [name, typeDef] of types) {
    if (options.typeConstruct === 'interface') {
      output.push(`interface ${name} ${typeDef}`);
    } else {
      output.push(`type ${name} = ${typeDef};`);
    }
  }
  
  return output.join('\n\n');
}

function collectTypes(value, name, types, options) {
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      const elementTypeName = capitalize(name);
      collectTypes(value[0], elementTypeName, types, options);
    }
    return;
  }
  
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value);
    const properties = [];
    
    for (const [key, val] of entries) {
      if (typeof val === 'object' && val !== null) {
        const typeName = capitalize(key);
        collectTypes(val, typeName, types, options);
        properties.push(`${key}: ${typeName}`);
      } else {
        const type = generateType(val, options, 0);
        properties.push(`${key}: ${type}`);
      }
    }
    
    const innerIndent = ' '.repeat(options.indent);
    const formattedProps = properties.map(p => `${innerIndent}${p};`).join('\n');
    types.set(name, `{\n${formattedProps}\n}`);
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: All extracted types tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/typeGenerator.js src/lib/typeGenerator.test.js
git commit -m "feat: add extracted types mode for nested objects"
```

---

### Task 6: Create Main Type Generation Function

**Files:**
- Modify: `src/lib/typeGenerator.js`
- Modify: `src/lib/typeGenerator.test.js`

**Interfaces:**
- Consumes: All previous functions
- Produces: `generateTypeScript(value, options)` main entry point

- [ ] **Step 1: Write failing test for main function**

Add to `src/lib/typeGenerator.test.js`:

```javascript
import { generateTypeScript } from './typeGenerator';

describe('generateTypeScript', () => {
  it('should generate interface with inline objects', () => {
    const value = { name: 'John', age: 30 };
    const options = {
      typeConstruct: 'interface',
      rootName: 'Person',
      nestedMode: 'inline',
      arraySyntax: 'shorthand',
      indent: 2
    };
    const result = generateTypeScript(value, options);
    expect(result).toBe(`interface Person {
  name: string;
  age: number;
}`);
  });

  it('should generate type with extracted objects', () => {
    const value = { user: { name: 'John' } };
    const options = {
      typeConstruct: 'type',
      rootName: 'Root',
      nestedMode: 'extracted',
      arraySyntax: 'generic',
      indent: 2
    };
    const result = generateTypeScript(value, options);
    expect(result).toContain('type Root =');
    expect(result).toContain('type User =');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - "generateTypeScript is not defined"

- [ ] **Step 3: Implement main function**

Add to `src/lib/typeGenerator.js`:

```javascript
export function generateTypeScript(value, options) {
  if (options.nestedMode === 'inline') {
    const typeBody = generateType(value, options, 0);
    if (options.typeConstruct === 'interface') {
      return `interface ${options.rootName} ${typeBody}`;
    } else {
      return `type ${options.rootName} = ${typeBody};`;
    }
  } else {
    return generateExtractedTypes(value, options);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: All main function tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/typeGenerator.js src/lib/typeGenerator.test.js
git commit -m "feat: add main generateTypeScript function"
```

---

### Task 7: Add TypeScript UI Controls

**Files:**
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: `generateTypeScript` from `src/lib/typeGenerator.js`
- Produces: UI controls for TypeScript generation options

- [ ] **Step 1: Import type generator**

Add to `<script>` section in `src/routes/+page.svelte`:

```javascript
import { generateTypeScript } from '$lib/typeGenerator';
```

- [ ] **Step 2: Add state variables**

Add after existing state variables:

```javascript
let outputMode = $state('json'); // 'json' | 'typescript'
let typeConstruct = $state('interface'); // 'interface' | 'type'
let rootName = $state('Root');
let nestedMode = $state('inline'); // 'inline' | 'extracted'
let arraySyntax = $state('shorthand'); // 'shorthand' | 'generic'
let typescriptOutput = $state('');
let copiedTypes = $state(false);
```

- [ ] **Step 3: Add type generation function**

Add to script section:

```javascript
function generateTypes() {
  if (parsed === null) {
    typescriptOutput = '';
    return;
  }
  
  try {
    typescriptOutput = generateTypeScript(parsed, {
      typeConstruct,
      rootName,
      nestedMode,
      arraySyntax,
      indent
    });
  } catch (e) {
    typescriptOutput = `Error: ${e.message}`;
  }
}

function handleOutputModeChange(mode) {
  outputMode = mode;
  if (mode === 'typescript') {
    generateTypes();
  }
}

async function copyTypes() {
  if (!typescriptOutput) return;
  try {
    await navigator.clipboard.writeText(typescriptOutput);
    copiedTypes = true;
    setTimeout(() => (copiedTypes = false), 2000);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = typescriptOutput;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copiedTypes = true;
    setTimeout(() => (copiedTypes = false), 2000);
  }
}
```

- [ ] **Step 4: Add tab switcher to output panel header**

Replace the output panel header with:

```html
<div class="panel-header">
  <div class="tabs">
    <button 
      class="tab" 
      class:active={outputMode === 'json'}
      onclick={() => handleOutputModeChange('json')}
    >
      JSON
    </button>
    <button 
      class="tab" 
      class:active={outputMode === 'typescript'}
      onclick={() => handleOutputModeChange('typescript')}
    >
      TypeScript
    </button>
  </div>
  <div class="panel-actions">
    {#if outputMode === 'json'}
      {#if parsed !== null}
        <button class="small-btn" onclick={collapseAll}>Collapse All</button>
        <button class="small-btn" onclick={expandAll}>Expand All</button>
      {/if}
      <button class="copy-btn" onclick={copyOutput} disabled={parsed === null}>
        {copied ? '✓ Copied!' : 'Copy'}
      </button>
    {:else}
      <button class="copy-btn" onclick={copyTypes} disabled={!typescriptOutput}>
        {copiedTypes ? '✓ Copied!' : 'Copy'}
      </button>
    {/if}
  </div>
</div>
```

- [ ] **Step 5: Add TypeScript controls panel**

Add after the panel-header, before the output-area:

```html
{#if outputMode === 'typescript'}
  <div class="typescript-controls">
    <div class="control-group">
      <label>Type:</label>
      <div class="toggle-group">
        <button 
          class="toggle-option"
          class:active={typeConstruct === 'interface'}
          onclick={() => { typeConstruct = 'interface'; generateTypes(); }}
        >
          interface
        </button>
        <button 
          class="toggle-option"
          class:active={typeConstruct === 'type'}
          onclick={() => { typeConstruct = 'type'; generateTypes(); }}
        >
          type
        </button>
      </div>
    </div>
    
    <div class="control-group">
      <label>Name:</label>
      <input 
        type="text" 
        class="name-input"
        value={rootName}
        oninput={(e) => { rootName = e.target.value; generateTypes(); }}
      />
    </div>
    
    <div class="control-group">
      <label>Nested:</label>
      <div class="toggle-group">
        <button 
          class="toggle-option"
          class:active={nestedMode === 'inline'}
          onclick={() => { nestedMode = 'inline'; generateTypes(); }}
        >
          inline
        </button>
        <button 
          class="toggle-option"
          class:active={nestedMode === 'extracted'}
          onclick={() => { nestedMode = 'extracted'; generateTypes(); }}
        >
          extracted
        </button>
      </div>
    </div>
    
    <div class="control-group">
      <label>Array:</label>
      <div class="toggle-group">
        <button 
          class="toggle-option"
          class:active={arraySyntax === 'shorthand'}
          onclick={() => { arraySyntax = 'shorthand'; generateTypes(); }}
        >
          T[]
        </button>
        <button 
          class="toggle-option"
          class:active={arraySyntax === 'generic'}
          onclick={() => { arraySyntax = 'generic'; generateTypes(); }}
        >
          Array&lt;T&gt;
        </button>
      </div>
    </div>
  </div>
{/if}
```

- [ ] **Step 6: Update output area to show TypeScript**

Replace the output area section with:

```html
{#if error}
  <div class="error">{error}</div>
{:else if outputMode === 'json' && parsed !== null}
  <div class="output-area tree">
    {@render JsonNode(parsed, 'root', 0)}
  </div>
{:else if outputMode === 'typescript' && typescriptOutput}
  <pre class="output-area typescript-output"><code>{typescriptOutput}</code></pre>
{/if}
```

- [ ] **Step 7: Add styles for tabs and controls**

Add to `<style>` section:

```css
.tabs {
  display: flex;
  gap: 0.5rem;
}

.tab {
  background: transparent;
  border: none;
  color: #9aa5ce;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s, color 0.15s;
}

.tab:hover {
  background: #3b4261;
  color: #c0caf5;
}

.tab.active {
  background: #3b4261;
  color: #7aa2f7;
}

.typescript-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #3b4261;
  background: #1f2335;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.75rem;
  color: #9aa5ce;
}

.toggle-group {
  display: flex;
  gap: 0.25rem;
}

.toggle-option {
  background: #3b4261;
  border: 1px solid #4a5280;
  color: #9aa5ce;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.toggle-option:hover {
  background: #4a5280;
  color: #c0caf5;
}

.toggle-option.active {
  background: #7aa2f7;
  border-color: #7aa2f7;
  color: #1a1b26;
}

.name-input {
  background: #3b4261;
  border: 1px solid #4a5280;
  color: #c0caf5;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  width: 100px;
}

.name-input:focus {
  outline: none;
  border-color: #7aa2f7;
}

.typescript-output {
  color: #bb9af7;
}
```

- [ ] **Step 8: Test the UI**

Run: `npm run dev`
Expected: App loads with JSON/TypeScript tabs visible

- [ ] **Step 9: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: add TypeScript UI controls and tab switcher"
```

---

### Task 8: Integration Testing and Bug Fixes

**Files:**
- Modify: `src/lib/typeGenerator.test.js`

**Interfaces:**
- Consumes: All previous functionality
- Produces: Comprehensive test coverage

- [ ] **Step 1: Add comprehensive integration tests**

Add to `src/lib/typeGenerator.test.js`:

```javascript
describe('Integration tests', () => {
  it('should handle complex nested structure', () => {
    const value = {
      users: [
        { name: 'John', age: 30, address: { city: 'NYC', zip: '10001' } }
      ],
      metadata: {
        count: 1,
        active: true
      }
    };
    
    const options = {
      typeConstruct: 'interface',
      rootName: 'ApiResponse',
      nestedMode: 'extracted',
      arraySyntax: 'shorthand',
      indent: 2
    };
    
    const result = generateTypeScript(value, options);
    expect(result).toContain('interface ApiResponse');
    expect(result).toContain('users: Users[]');
    expect(result).toContain('interface Users');
    expect(result).toContain('address: Address');
    expect(result).toContain('interface Address');
  });

  it('should handle all primitive types in array', () => {
    const value = { items: ['a', 'b', 'c'] };
    const options = {
      typeConstruct: 'type',
      rootName: 'Root',
      nestedMode: 'inline',
      arraySyntax: 'generic',
      indent: 2
    };
    const result = generateTypeScript(value, options);
    expect(result).toContain('items: Array<string>');
  });
});
```

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 3: Fix any bugs found**

If tests fail, fix the implementation in `src/lib/typeGenerator.js`

- [ ] **Step 4: Commit**

```bash
git add src/lib/typeGenerator.test.js src/lib/typeGenerator.js
git commit -m "test: add comprehensive integration tests"
```

---

### Task 9: Build and Verify

**Files:**
- None (build verification)

**Interfaces:**
- Consumes: All previous work
- Produces: Working static build

- [ ] **Step 1: Build the project**

Run: `npm run build`
Expected: Build completes without errors, `build/` directory created

- [ ] **Step 2: Test with Docker**

Run: `docker compose up --build -d`
Expected: Container starts successfully

- [ ] **Step 3: Verify functionality**

Open: `http://localhost:8080`
Test:
1. Paste JSON: `{"name": "John", "age": 30}`
2. Click "TypeScript" tab
3. Verify output shows: `interface Root { name: string; age: number; }`
4. Change root name to "Person"
5. Verify output updates
6. Toggle to "type"
7. Verify output changes to `type Person = ...`
8. Click "Copy" button
9. Verify clipboard contains the TypeScript

- [ ] **Step 4: Stop Docker**

Run: `docker compose down`

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: final build and verification"
```

---

### Task 10: Update Documentation

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: All features
- Produces: Updated documentation

- [ ] **Step 1: Update README with TypeScript feature**

Add to `README.md` after "Features" section:

```markdown
## TypeScript Type Generation

Generate TypeScript types from your JSON with customizable options:

- **Type construct:** Choose between `interface` or `type`
- **Root name:** Custom name for the root type (default: "Root")
- **Nested mode:** Inline (all in one declaration) or Extracted (separate types)
- **Array syntax:** Shorthand (`T[]`) or Generic (`Array<T>`)

### Example

Input JSON:
```json
{
  "user": {
    "name": "John",
    "age": 30
  }
}
```

Output (interface, extracted):
```typescript
interface Root {
  user: User;
}

interface User {
  name: string;
  age: number;
}
```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add TypeScript generation feature to README"
```
