# BookScout UI

A React control panel for [BookScout](https://github.com/slackerchris/bookscout) — track missing audiobooks, manage authors, monitor download activity, and check integration health, all in one place.

> **Optional sidecar** — BookScout runs fine without this UI. It's a convenience front-end that talks to the BookScout API.

---

## Features

- **Dashboard** — stats overview, high-confidence missing books, active jobs, live event feed
- **Missing Books** — filterable table with search, download, ignore, and mark-owned actions
- **Authors** — add/remove authors, trigger scans, manage co-authors
- **Activity** — paginated jobs and events log with live SSE updates
- **Integrations** — per-service health cards (Audiobookshelf, Prowlarr, Downloader, n8n)

## Tech Stack

| | |
|---|---|
| React 19 + Vite 8 | SPA, fast HMR |
| TypeScript 5.9 | Strict mode |
| Tailwind v4 | Vite plugin, no config file |
| shadcn/ui | New York style, zinc theme |
| TanStack Query v5 | Data fetching + cache |
| React Router v7 | Client-side routing |
| Server-Sent Events | Live updates from BookScout API |

---

## Development

```bash
npm install
npm run dev        # starts at http://localhost:5173
```

The Vite dev server proxies `/api` and `/health` to `http://localhost:8765` (BookScout API).

## Production Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

---

## Docker

### Build the image

```bash
docker build -t bookscout-ui:latest .
```

### Run standalone

```bash
docker run -d \
  --name bookscout-ui \
  -p 8080:80 \
  --network bookscout \
  bookscout-ui:latest
```

### docker compose (standalone)

```yaml
services:
  bookscout-ui:
    image: bookscout-ui:latest
    build: .
    container_name: bookscout-ui
    restart: unless-stopped
    ports:
      - "8080:80"
    networks:
      - bookscout

networks:
  bookscout:
    external: true
```

### Add to an existing BookScout compose stack

```yaml
services:
  bookscout-ui:
    image: ghcr.io/slackerchris/bookscout-ui:latest
    container_name: bookscout-ui
    restart: unless-stopped
    ports:
      - "8080:80"
    depends_on:
      - bookscout
    networks:
      - bookscout
```

nginx inside the container proxies `/api/` → `http://bookscout:8765` (the BookScout service on the same network). SSE buffering is disabled so live updates work correctly.

---

## Environment

No runtime environment variables are required. The API base URL is resolved at the nginx proxy layer — just make sure the UI container and the BookScout API container share the same Docker network.

---

## Changelog

### v1.0.0 — 2026-03-24
- Initial release
- Dashboard with stats, active jobs, event feed, high-confidence missing books
- Missing Books page with filtering and actions
- Authors page with add/remove/scan/co-authors
- Activity page with paginated jobs and events, live SSE updates
- Integrations page with per-service health checks
- Multi-stage Docker build (node → nginx:alpine)
- nginx config with SSE support and SPA fallback
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
