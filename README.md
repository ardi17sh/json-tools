# JSON Tools

A fast, privacy-focused collection of JSON utilities that run entirely in the browser — JSON formatting, TypeScript type generation, and more. No data ever leaves your machine.

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

| Platform             | How                                                                 |
| -------------------- | ------------------------------------------------------------------- |
| **Netlify**          | Drag and drop `build/` or connect your repo                         |
| **Vercel**           | Import the project or deploy `build/` directly                      |
| **GitHub Pages**     | Push `build/` contents to a `gh-pages` branch                       |
| **Cloudflare Pages** | See [Deploy to Cloudflare Pages](#deploy-to-cloudflare-pages) below |
| **Any static host**  | Upload the contents of `build/`                                     |

### Deploy to Cloudflare Pages

#### Option A: Via Dashboard (recommended for first deploy)

1. Push your code to a GitHub/GitLab repository.
2. Go to [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/?to=/:account/pages).
3. Click **Create a project** → **Connect to Git**.
4. Select your repository and click **Begin setup**.
5. Configure the build settings:

   | Setting           | Value            |
   | ----------------- | ---------------- |
   | **Build command** | `npm run build`  |
   | **Build output**  | `build`          |
   | **Node version**  | `18` (or higher) |

6. Click **Save and Deploy**.

Cloudflare will build and deploy automatically on every push to the connected branch.

#### Option B: Direct Upload (manual / CI)

```bash
# Build the site
npm run build

# Upload to Cloudflare Pages via Wrangler CLI
npx wrangler pages deploy build --project-name=json-tools
```

On first run, Wrangler will prompt you to authenticate and create the project if it doesn't exist.

#### Option C: Using `@sveltejs/adapter-cloudflare`

If you want Cloudflare-specific features (edge functions, `_redirects`, `_headers`), swap the adapter:

```bash
npm install -D @sveltejs/adapter-cloudflare
```

Then update `vite.config.js`:

```js
import adapter from "@sveltejs/adapter-cloudflare";
```

This is optional — `adapter-static` works perfectly for this site since it's purely client-side.

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
