# JSON Beautifier

A fast, privacy-focused JSON beautifier that runs entirely in the browser. Paste JSON, get it formatted instantly with an interactive tree view — no data ever leaves your machine.

Built with **SvelteKit 5** and deployed as a static site (~140 KB).

## Features

- **Interactive tree view** — collapsible nodes with expand/collapse all controls
- **Real-time formatting** — output updates as you type
- **Auto-detect stringified JSON** — automatically unwraps nested `JSON.stringify`'d strings
- **Configurable indentation** — 2 spaces, 4 spaces, or tabs
- **Copy to clipboard** — one-click copy with fallback for older browsers
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

## Deployment

The `build/` directory is a fully self-contained static site — no server-side runtime required.

| Platform             | How                                                                    |
| -------------------- | ---------------------------------------------------------------------- |
| **Netlify**          | Drag and drop `build/` or connect your repo                            |
| **Vercel**           | Import the project or deploy `build/` directly                         |
| **GitHub Pages**     | Push `build/` contents to a `gh-pages` branch                          |
| **Cloudflare Pages** | Connect repo, set build command to `npm run build`, output to `build/` |
| **Any static host**  | Upload the contents of `build/`                                        |

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
json-beautifier/
├── src/
│   ├── routes/
│   │   ├── +layout.js          # Prerender config
│   │   ├── +layout.svelte      # Root layout with metadata
│   │   └── +page.svelte        # Main app UI and logic
│   ├── lib/
│   │   ├── typeGenerator.js    # TypeScript type generation from JSON
│   │   └── typeGenerator.test.js
│   ├── app.html                # HTML shell
│   └── app.d.ts                # SvelteKit type declarations
├── static/                     # Static assets
├── Dockerfile                  # nginx-alpine production image
├── docker-compose.yml          # Docker Compose config
├── vite.config.js              # Vite + SvelteKit config
└── vitest.config.js            # Test runner config
```

## License

MIT
