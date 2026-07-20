# JSON Beautifier

A simple, client-side JSON beautifier built with SvelteKit 5.

## Features

- **Side-by-side layout**: Input on left, formatted output on right
- **Real-time formatting**: Formats as you type
- **Configurable indent**: 2 spaces, 4 spaces, or tabs
- **Copy to clipboard**: One-click copy button
- **Error handling**: Shows JSON parsing errors inline
- **No data storage**: Everything runs client-side, nothing is sent anywhere
- **Static deployment**: Pure HTML/CSS/JS, deploy anywhere

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The static site will be in the `build/` directory (140KB total).

## Deployment

The `build/` directory contains a fully static site that can be deployed anywhere:

- **Netlify**: Drag and drop the `build/` folder
- **Vercel**: Deploy the `build/` folder
- **GitHub Pages**: Push `build/` to gh-pages branch
- **Any static host**: Upload the contents of `build/`

## Tech Stack

- SvelteKit 5
- Svelte 5 (Runes mode)
- adapter-static for static site generation
- Zero dependencies beyond SvelteKit

## Docker

```bash
docker compose up --build
```

Then open http://localhost:8080

## License

MIT
