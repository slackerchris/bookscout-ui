# BookScout UI

A React control panel for [BookScout](https://github.com/slackerchris/bookscout) — track missing audiobooks, manage authors, monitor scan activity, and manage downloads in real time.

> **Optional sidecar** — BookScout runs fine without this UI. It's a convenience front-end that talks to the BookScout `/api/v1` REST + SSE API.

---

## Architecture

![BookScout UI architecture](docs/architecture.svg)

---

## Features

### Library & Metadata
- **Dashboard** — compact library stats (total, missing, high-confidence, upcoming) plus live service health indicators
- **Authors** — All / Watching / Not-watching tabs; add authors, trigger scans, view co-authors, mark favorites
- **Author Detail** — per-author bookshelf with column sorting (series, release, confidence, status, title), filter presets, missing/confirmed breakdown, scan progress via SSE
- **Edit book drawer** — manually correct title, subtitle, series, position, release date, language, narrator, ASIN/ISBN for any book; includes a one-click "Rescan author" button
- **Inline badges** — upcoming releases, non-English, low-confidence, and missing-date badges displayed directly in book rows
- **Filter presets** — four built-in presets (Upcoming, High conf missing, Owned only, Needs cleanup) plus save/delete custom presets
- **Empty-state reasons** — when no books match, the UI explains which filter is responsible
- **Series page** (v0.69.0) — every series with a completion bar, per-position ownership chips, catalog-gap detection, and per-book search from the missing list
- **Co-authors page** — books credited to multiple watched authors; pick the true primary (choices are pinned against scan reassignment)

### Search & Downloads
- **Find Download drawer** — searches Prowlarr + Jackett for any book; results scored by relevance (title + author + year + narrator + format + seeders) with the best match highlighted
- **Auto-download toggle** (v0.69.0) — ⚡ button per author: new HIGH-confidence released books are grabbed automatically after each scan, or queued for approval
- **Downloads page** — Queue / Pending approval / History / Imported tabs; pending auto-downloads get one-click Download / Dismiss
- **Settings page** — download quality preferences (min seeders, preferred format, language, require unabridged, max size, auto-download mode) stored server-side

### Operations
- **Health banner** — visible at the top of every page when the API or a required service is degraded
- **Integrations page** — live status cards for BookScout API, Prowlarr, Jackett, and qBittorrent/Transmission/SABnzbd; full webhook manager (add/remove/reactivate/test)
- **Activity** — real-time SSE event log (up to 200 events) with a "Scan all authors" button
- **Settings page** — one-click JSON export of the full catalog; config.yaml reference
- **Keyboard shortcuts** — `s` = scan, `f` = toggle missing-only (Author Detail page)

---

## Tech Stack

| | |
|---|---|
| React 19 + Vite 8 | SPA, fast HMR |
| TypeScript 5.9 | Strict mode |
| Tailwind v4 | Vite plugin, no config file |
| shadcn/ui | New York style, zinc theme |
| TanStack Query v5 | Data fetching + cache |
| React Router v7 | Client-side routing |
| Server-Sent Events | Singleton connection, fan-out to all subscribers |

---

## Development

```bash
npm install
npm run dev        # starts at http://localhost:5173
```

The Vite dev server proxies `/api` and `/health` to `http://localhost:8765` (BookScout API default port).

## Production Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

---

## Docker

### Pull from registry

```bash
docker pull ghcr.io/slackerchris/bookscout-ui:latest
```

### Build locally

```bash
docker build -t bookscout-ui:latest .
```

### Run standalone

```bash
docker run -d \
  --name bookscout-ui \
  -p 8080:80 \
  --network bookscout \
  ghcr.io/slackerchris/bookscout-ui:latest
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

nginx inside the container proxies `/api/` → `http://bookscout:8765` (the BookScout service on the same Docker network). `proxy_buffering off` is set so SSE live updates work correctly.

---

## API Compatibility

Requires BookScout **v0.69.0** or later. Key endpoints used:

| Endpoint | Used by |
|---|---|
| `GET /api/v1/books/` | Author Detail |
| `GET /api/v1/books/export` | Settings page export |
| `GET /api/v1/books/duplicates` | (future merge UI) |
| `GET /api/v1/books/co-author-conflicts` | Co-authors page |
| `GET /api/v1/series/` | Series page |
| `PATCH /api/v1/authors/{id}` | Auto-download toggle |
| `GET /api/v1/download-history/?status=pending` | Downloads › Pending approval tab |
| `POST /api/v1/download-history/{id}/approve` | Pending approval › Download |
| `POST /api/v1/download-history/{id}/dismiss` | Pending approval › Dismiss |
| `PATCH /api/v1/books/{id}` | Edit book drawer |
| `POST /api/v1/books/{id}/rescan` | Edit book drawer rescan button |
| `GET /api/v1/authors/` | Authors page, Dashboard |
| `GET /api/v1/authors/{id}/coauthors` | Coauthors drawer |
| `POST /api/v1/scans/author/{id}` | Scan author button |
| `POST /api/v1/search/` | Find Download drawer |
| `POST /api/v1/search/download` | Find Download "Get" button; records download history |
| `GET /api/v1/search/download/queue` | Downloads › Queue tab |
| `GET /api/v1/download-history/` | Downloads › History tab |
| `DELETE /api/v1/download-history/` | Settings › Clear history |
| `GET /api/v1/settings/download-preferences` | Settings page |
| `PATCH /api/v1/settings/download-preferences` | Settings page |
| `GET /api/v1/webhooks/` | Integrations page webhook manager |
| `POST /api/v1/webhooks/{id}/test` | Webhook test button |
| `GET /api/v1/events` | SSE live updates (singleton connection) |
| `GET /health` | Health banner, Integrations page |

---

## Environment

No runtime environment variables required. The API base URL is resolved at the nginx proxy layer — ensure the UI container and the BookScout API container share the same Docker network (`bookscout` by default).

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full history.
