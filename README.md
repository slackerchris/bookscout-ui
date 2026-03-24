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

See [CHANGELOG.md](CHANGELOG.md) for the full history.
