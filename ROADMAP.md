# Roadmap

Planned and in-progress work for BookScout UI. Items at the top of each section are higher priority. Move things to [CHANGELOG.md](CHANGELOG.md) once shipped.

---

## In Progress

<!-- Things actively being worked on -->

---

## Planned

### Integrations page — service status cards
The Prowlarr, Downloader, BookScout API, and n8n cards are currently static placeholders. Once the backend exposes the relevant health or status endpoints, wire each card up to show live connection status (connected / unreachable / not configured).

### Integrations page — per-service configuration
Allow setting service URLs and credentials from the UI rather than requiring direct backend config.

---

## Ideas / Backlog

<!-- Lower priority — not yet committed -->

---

## Known Gaps / Deferred

### `features/activity/` — empty feature folder
The Activity page logic lives directly in `src/pages/ActivityPage.tsx`. If the page grows (filters, pagination, persistence) it should be refactored into a proper feature module here.

### `features/integrations/` — partial
Only `useAbsImport.ts` lives here. Future Integrations feature code (service status hooks, config hooks) should be co-located.

### Book-level mutations not surfaced in UI
`booksApi.update()` (`PATCH /books/{id}`) and `booksApi.remove()` (`DELETE /books/{id}`) are implemented in the API layer but not yet exposed in `BooksTable` or elsewhere.

### Author `active` toggle not in UI
`authorsApi.update()` supports toggling `active`, and `authorsApi.list()` accepts `active_only: false`, but there is no UI control to deactivate/reactivate an author or show inactive authors.

### Author watchlist settings not in UI
`authorsApi.watchlist()` (`PATCH /authors/{id}/watchlist`) exists in the API layer with no UI to call it.
