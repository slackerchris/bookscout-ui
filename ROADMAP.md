# Roadmap

Planned and in-progress work for BookScout UI. Items at the top of each section are higher priority. Move things to [CHANGELOG.md](CHANGELOG.md) once shipped.

---

## In Progress

<!-- Things actively being worked on -->

---

## Planned

### Merge duplicates UI
Display groups of books identified by `GET /books/duplicates` and allow merging two rows into one (keep primary, discard duplicate, transfer identifiers).

### Source comparison panel
For a selected book, show a side-by-side comparison of what each metadata source (Audnexus, OpenLibrary, Google Books, ISBNdb) returned, so the user can see why a field has its current value and override it if needed.

### Retry failed downloads
Surface the "failed" entries in the download history with a one-click retry that pre-fills the search drawer for that book. Also surface failed auto-imports (`bs-failed`-tagged torrents) with a retry that clears the tag.

### Bearer-token auth support
Send `Authorization: Bearer` headers from the API client (and handle the SSE token query-param) so the backend's `secret_key` auth can be enabled while using the UI.

### Pin indicator for primary author
Show `primary_author_manual` as a pin badge on the Co-authors page with an explicit unpin control (the backend pins automatically when a primary is chosen).

### Author `active` toggle
UI control to deactivate / reactivate an author and optionally show inactive authors in a separate tab.

### Author watchlist settings
UI control to toggle `scan_enabled` per author (expose `PATCH /authors/{id}/watchlist`).

---

## Ideas / Backlog

### Per-service configuration on Integrations
Allow setting service URLs and credentials from the UI rather than requiring direct backend config.

### Scan schedule editor
Visual cron editor for `scan.schedule_cron` stored in config.yaml.

---

## Known Gaps / Deferred

### `features/activity/` — empty feature folder
The Activity page logic lives directly in `src/pages/ActivityPage.tsx`. If the page grows (filters, pagination, persistence) it should be refactored into a proper feature module here.

### `features/integrations/` — partial
Only `useAbsImport.ts` lives here. Future Integrations feature code (service status hooks, config hooks) should be co-located.
