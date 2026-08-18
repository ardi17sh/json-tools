# JSON Tools

A fast, privacy-focused collection of JSON utilities that run entirely in the browser — JSON formatting, TypeScript type generation, and JSON diffing. No data ever leaves your machine.

Built with **SvelteKit 5** and deployed as a static site (~140 KB).

## Features

- **JSON Formatter** — real-time formatting with a collapsible tree view, configurable indentation (2/4 spaces or tabs), auto-detection of stringified JSON, and debounced output search
- **Output search** — case-insensitive matching with 500ms debounce, previous/next navigation, match counts, active-match scrolling, and automatic tree expansion
- **Expand/collapse controls** — expand or collapse the entire formatted output tree from the panel header
- **TypeScript Type Generator** — generate inline types or extracted interfaces/types from JSON
- **JSON Diff** — side-by-side comparison of two JSON inputs, highlighting added, removed, and changed properties and values
- **Copy to clipboard** — one-click copy
- **Syntax highlighting** — color-coded strings, numbers, booleans, and null values
- **Error reporting** — inline JSON parse errors with messages
- **Zero network calls** — everything runs client-side, nothing is stored or transmitted
- **Responsive layout** — side-by-side on desktop, stacked on mobile

## Prerequisites

- **Node.js** 18+
- **npm** 9+

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Scripts

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | Start the Vite dev server with HMR               |
| `npm run build`       | Build the static site to `build/`                |
| `npm run preview`     | Preview the production build locally             |
| `npm run check`       | Run `svelte-check` for type and lint diagnostics |
| `npm run check:watch` | Same as above, in watch mode                     |
| `npm test`            | Run the test suite (Vitest)                      |
| `npm run test:watch`  | Run tests in watch mode                          |

## Building for Production

```bash
npm run build
```

The static site is output to the `build/` directory. Serve it with any static file host.

## Docker

Build and run with Docker Compose:

```bash
# Build the static site first, then start the container
npm run build
docker compose up --build
```

Or build everything inside Docker (requires the `build/` directory to exist):

```bash
docker compose up --build
```

The site is served via **nginx** on `http://localhost:8080`.

## Tech Stack

- **SvelteKit 2** with **Svelte 5** (Runes mode)
- **adapter-static** for static site generation
- **Vite 8** as the build tool
- **Vitest** for testing
- Zero runtime dependencies beyond SvelteKit

## Project Structure

```
json-tools/
├── src/
│   ├── routes/
│   │   ├── +layout.ts           # Prerender config
│   │   ├── +layout.svelte       # Root layout with navigation
│   │   ├── +page.svelte         # JSON Formatter
│   │   ├── diff/+page.svelte    # JSON Diff
│   │   ├── type-generator/
│   │   │   └── +page.svelte     # Type Generator
│   ├── lib/
│   │   ├── clipboard.ts         # Clipboard helper
│   │   ├── jsonDiff.ts          # JSON diff engine
│   │   ├── jsonParser.ts        # JSON parser with auto-detect
│   │   ├── typeGenerator.ts     # TypeScript type generation
│   │   ├── formatValue.ts        # Shared JSON value formatting
│   │   ├── search.ts             # Case-insensitive search matching
│   │   ├── search.test.ts        # Search helper tests
│   │   └── components/           # Shared Svelte components
│   │       ├── Panel.svelte
│   │       └── SearchControls.svelte
│   ├── styles/
│   │   └── global.css            # Design tokens and shared styles
│   ├── app.html                  # HTML shell
│   └── app.d.ts                  # SvelteKit type declarations
├── static/                     # Static assets
├── Dockerfile                  # nginx-alpine production image
├── docker-compose.yml          # Docker Compose config
├── vite.config.ts              # Vite + SvelteKit config
└── vitest.config.ts            # Test runner config
```

## License

MIT
