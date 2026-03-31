# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.64.0] — 2026-03-30

### Added
- **Import toast notifications** — `import.complete` SSE events show a Sonner toast (bottom-right) with the book title and author name on any page.
- **Downloads — Recently Imported** — replaces n8n execution history with a live BookScout DB query (`/books/recently-imported`). Refreshes automatically when an `import.complete` event arrives.
- **Books — mark as owned toggle** — each book row now has a toggle button (`BookCheck` / `BookX`) to flip `have_it` without leaving the page. Green when owned, neutral when missing.
- **Books — Audible link** — books with an ASIN show an external link button that opens `audible.com/pd/{asin}` in a new tab.

### Fixed
- **Sonner integration** — previous attempt (0.63.10) used a shadcn-generated `sonner.tsx` with a circular self-import and a `next-themes` dependency that isn't installed, causing a silent runtime crash. Replaced with a direct, minimal wrapper around the Sonner `Toaster`.

---

## [0.63.11] — 2026-03-30

### Reverted
- **0.63.10 changes rolled back** — removed `ImportNotifier`, Sonner toast integration, and the recently-imported Downloads section due to 502 errors on the `/api/v1/events` SSE endpoint introduced in that release. Downloads page restored to 0.63.9 state (queue + n8n import history).

---

## [0.63.10] — 2026-03-30

### Added
- **Import toast notifications** — `import.complete` SSE events now trigger a Sonner toast showing the book title and author name, appearing bottom-right on any page.
- **Downloads — Recently Imported section** — replaces the unreliable n8n execution history panel with a live query against BookScout's own database (`/books/recently-imported`). Automatically refreshes when an `import.complete` event arrives.

### Fixed
- **n8n workflow: all torrents now processed** — `Prepare Candidate Imports` now iterates all input items and passes the qBittorrent cookie through item data, removing the fragile `$('Extract SID').item` paired-item chain that caused errors on multi-torrent runs. `Has Content Path` IF node removed (redundant — filtering already happens in `Prepare Candidate Imports`). `Merge Import Response` updated to reference `Prepare Candidate Imports` directly.

---

## [0.63.9] — 2026-03-29

### Added
- **Downloads — n8n Import History** — new section showing the last 20 executions of the qBittorrent poller workflow with book titles and imported/failed badges. Polls every 60 seconds. Requires `n8n.api_key` in backend config or `N8N_API_KEY` env var.

### Removed
- **Downloads — Owned Books section** — removed the full owned-books list (2 000+ rows); coverage remains on each Author Detail page.

---

## [0.63.8] — 2026-03-30

### Added
- **Integrations — live n8n status** — the Integrations page now reads the backend `automation.n8n` health status from `GET /api/v1/search/status` and shows it as a normal live integration card instead of a static placeholder.

### Changed
- **Downloads — audiobook-focused queue view** — the Downloads page now filters the queue to audiobook-looking items using category/save-path/title hints so unrelated downloader items do not dominate the view.
- **Downloads — compact status-sorted layout** — queue items now render in a cleaner table-like list with status dots, normalized labels, concise metadata, and ordering by status then title for faster scanning.
- **Downloads — queue summary counts** — the header summary now shows audiobook queue totals for total, downloading, paused, and completed items.

---

## [0.63.6] — 2026-03-29

### Fixed
- **Favorited authors float to the top of the All tab** — the "All" tab now sorts favorited authors first (alphabetically within favorites, then alphabetically for the rest), matching the behaviour of the "Watching" tab.

---

## [0.63.5] — 2026-03-29

### Added
- **Downloads page** — new sidebar entry and `/downloads` route.
  - **Active Queue** section polls `GET /api/v1/search/download/queue` every 5 seconds, showing each item with a progress bar, percentage, size, and ETA.  Handles SABnzbd, qBittorrent, and Transmission field differences.  Completed/seeding items appear in a separate sub-section below active ones.
  - **Owned Books** section lists all books marked as owned (sorted by most recently updated) so you can see what has been confirmed in your library.  Items imported via BookScout's post-processing are tagged "Imported".

---

## [0.63.4] — 2026-03-29

### Changed
- **Scan progress indicator stays active until scan completes** — the "Scan now" spinner on both the Authors page and Author Detail page now remains active until the `scan.complete` SSE event arrives, rather than clearing as soon as the scan job is queued.  This gives accurate visual feedback for long-running scans.  A 10-minute client-side timeout prevents the spinner from getting permanently stuck if SSE is unavailable.

---

## [0.63.3] — 2026-03-29

### Added
- **Confidence score reasons in tooltip** — hovering the confidence badge now shows the score value plus the list of reasons that contributed to it (e.g. "exact author match", "asin present", "audiobook format match").

---

## [0.63.2] — 2026-03-29

### Fixed
- **Unwatched author cards now use the same card design as watched authors** — removed the separate `UnwatchedCard` component that looked different/dimmed. All authors in the "All" tab now render with `AuthorCard`; unwatched ones show "Not watching" status and a Watch button in place of Scan/Coauthors/Remove.

---

## [0.63.1] — 2026-03-29

### Added
- **"All" tab on Authors page (default)** — shows every author (watched + not watching) as cards in a single grid.  Watched authors show their full action set; unwatched authors show a Watch button and a Dismiss option.  Allows at-a-glance overview without switching tabs.

### Fixed
- **`GET /authors/` now returns watchlisted authors only** — the endpoint was doing an outer join without a `WHERE watchlist IS NOT NULL` filter, so it returned all authors regardless of watch status.  Authors page "Watching" tab now correctly shows only authors on the watchlist.
- **ABS import no longer adds authors to watchlist** — `session.add(Watchlist(...))` was still present in the import handler despite the intended change.  Import now creates Author records only; users watch authors manually via the Authors page.

---

## [0.63.0] — 2026-03-28

### Added
- **"Not watching" tab on Authors page** — authors imported from ABS but not yet on the watchlist now appear in a dedicated tab with an amber badge showing the count.  Each row has a Watch button; a "Watch all" shortcut adds every visible author at once.  A Dismiss button (hover-reveal) is planned but the tab makes manual triage easy.

### Changed
- **ABS import result stored in backend DB** — `useAbsImport` no longer caches the last import result in localStorage.  Results are persisted to the `app_settings` table in PostgreSQL, so a browser clear or fresh install no longer shows stale data.
- **ABS import no longer auto-adds authors to watchlist** — importing from Audiobookshelf now creates Author records only; users review the "Not watching" tab and add authors to the watchlist manually.

### Fixed
- **Integrations page blank after DB wipe** — backend now returns `{}` when no import result exists; the UI guards on `imported_at` presence so it treats an empty object the same as null.

---

## [0.62.1] — 2026-03-28

### Changed
- **Server-side favourites** — `useFavoriteAuthors` now stores favourites in the backend (`GET/POST/DELETE /authors/{id}/favorite`) instead of localStorage.  Favourites survive browser clears and are shared across devices.  Optimistic updates keep the UI responsive while the request is in flight.

---

## [0.62.0] — 2026-03-28

### Changed
- **Server-side pagination for books** — `AuthorDetailPage` now fetches one page of 100 books at a time (`limit=100&offset=N`) instead of loading all books at once.  Fixes crashes and freezes when authors have thousands of missing books.
- **Book count via dedicated endpoint** — uses `GET /books/count` to display the total book count, keeping the count accurate across pages without fetching all records.
- **SSE invalidation scoped** — `scan.complete` events now invalidate only the current page and count queries instead of `bookKeys.all`, eliminating the cascade of full-catalog refetches that caused UI freezes during active scans.
- **Authors count from count endpoint** — dashboard "Authors tracked" stat card now calls `GET /authors/count` instead of `GET /authors/` and discarding the payload.
- **`useMemo` for filtered author list** — `AuthorsPage` now memoizes the filtered+sorted author array to avoid recomputing on every unrelated render.
- **`useMemo` for combobox options** — `BooksFilterBar` memoizes the author dropdown options array (sorting 300 authors) so it is only rebuilt when the authors list changes.
- **Removed `useHighConfidenceMissing`** — unused hook that fetched all high-confidence missing books unpaginated; deleted.

---

## [0.61.5] — 2026-03-28

### Removed
- **Active Downloads section** — Removed from the dashboard entirely.

---

## [0.61.4] — 2026-03-28

### Fixed
- **Dashboard — download status labels** — Status strings like `stalledUP` now
  correctly map to readable labels (`Stalled`, `Seeding`, etc.).  The lookup is
  now case-insensitive so mixed-case variants from qBittorrent (`stalledUP`,
  `forcedUP`, `pausedUP`) no longer fall through as raw text.
- **Dashboard — download bar colors** — Removed amber/yellow from all states.
  Active downloads show green, errors show red, stalled/seeding/complete items
  show a neutral muted bar.  Status text follows the same neutral palette.

---

## [0.61.3] — 2026-03-27

### Removed
- **Missing Books page** — Removed `MissingBooksPage`, its `/missing-books` route,
  and the sidebar nav entry.  Per-author missing books are available on each Author
  detail page; the dashboard stat card shows the global missing count.  `BooksFilterBar`,
  `BooksTable`, and `useBooks` are retained as they are used by the Author detail page.

---

## [0.61.2] — 2026-03-27

### Changed
- **Dashboard — stat cards use `/books/count` endpoint** — Previously the three
  stat cards fetched the entire book list (potentially 20 000+ rows) and counted
  client-side.  They now call `GET /books/count` which returns `{"count": N}` from
  a single SQL aggregate — dramatically reducing payload on first load and on
  background refetch.
- **Author detail page — stat chips simplified** — "Total books" + "Owned"
  chips replaced by a single **Confirmed** chip (`owned_count`), since total
  includes unverified/low-confidence discoveries that aren't meaningful to the
  user.  Missing is still shown as `book_count − owned_count`.

### Fixed
- **Dashboard — active downloads: item names now visible** — Download item rows
  lacked `min-w-0` on the name span, causing the flex layout to crush the text
  to zero width.  Names now truncate correctly with a hover tooltip.
- **Dashboard — active downloads: raw status strings normalised** — qBittorrent
  state strings such as `stalledUP`, `forcedUP`, and `uploading` are now mapped
  to readable labels (Stalled, Forced, Seeding, etc.) with colour coding:
  amber for stalled/error, green for downloading, sky for seeding.
- **Dashboard — active downloads: unrealistic ETA hidden** — ETA is now
  suppressed when `progress` is 100 %, the item is stalled, or the value exceeds
  24 h, preventing `2400h 0m` entries for stalled torrents.
- **Dashboard — active downloads: list capped at `max-h-72` with scroll** —
  Large queues no longer push all other content off-screen.  Item count shown in
  the card header.

---

## [0.61.0] — 2026-03-27

### Added
- **Author detail page** — Clicking an author card navigates to `/authors/:id` showing a full detail view: large avatar, active badge, last scanned timestamp, Total / Owned / Missing stat chips, and a filterable book table (same server-side confidence + missing filters, English-only toggle, series-sorted). Scan, Favorite, Coauthors, and Remove actions are all available inline. SSE refreshes the book list and counts live when a scan completes.
- **Authors — card grid view** — Authors page redesigned from a table to a responsive card grid (2–6 columns). Each card shows a colour-coded avatar, name, watching/inactive status, and inline Scan / Coauthors / Remove actions. Avatar/name area is a clickable link to the detail page.
- **Authors — favorites** — Star any author to pin them to the top of the list and highlight their card with an amber ring. Favorites persist in localStorage. A *Favorites* filter button shows only starred authors. The header sub-text shows the favorited count.
- **Authors — sort toggle** — A–Z / Z–A toggle button replaces the column header sort arrow.
- **Dashboard — service health bar** — Compact row of status dots for BookScout API, Prowlarr, Jackett, and the active download client. Polls the same endpoints as the Integrations page.
- **Dashboard — active downloads card** — Shows the current download queue (name, progress bar, %, ETA, status) polled every 15 s via `/search/download/queue`.
- **Integrations — BookScout API live status** — Replaced the static "Status unavailable" card with a live status badge driven by `GET /health`.

### Changed
- **Versioning scheme** — UI version numbers now track the BookScout backend (e.g. `0.61.0` aligns with BookScout `0.61.x`). Previous UI-only versions (1.x) are retained in this changelog for history.
- **Dashboard — missing books table removed** — The high-confidence books table has been removed from the dashboard; the stat card count is sufficient.
- **Dashboard — stat queries** — Refetch interval raised to 5 minutes (was 1 min) to reduce load with large libraries.
- **Missing Books — confidence filter pushed server-side** — `confidence_band` is now sent as a query parameter instead of being applied client-side, cutting the data transferred for large libraries.
- **Missing Books / Books table — pagination** — BooksTable now renders 100 rows at a time with prev/next controls, preventing browser crashes with 9 000+ book result sets.

---

## [1.5.0] — 2026-03-27

### Changed
- **Missing Books — sort order** — Books are now sorted by author, then series name, then series position. Standalone books (no series) appear at the bottom within each author group.

---

## [1.4.10] — 2026-03-27

### Added
- **Missing Books — book ID** — Each book now shows its internal ID below the title to assist with debugging download hand-offs.

---

## [1.4.9] — 2026-03-27

### Changed
- **Missing Books — author filter** — Replaced the plain dropdown with a searchable combobox. Opens directly below the trigger (no more scroll-jump), auto-focuses a search input, and filters authors as you type.
- **Missing Books — confidence filter default** — Now defaults to *High* instead of *All* on page load.

### Fixed
- **Missing Books — confidence dropdown** — Set `position="popper"` so it drops straight down instead of jumping to align with the selected item.

---

## [1.4.8] — 2026-03-27

### Fixed
- **Missing Books — author dropdown** — Authors are now sorted by last name (`name_sort`) and displayed in "Last, First" format so the alphabetical order matches what is shown.

---

## [1.4.7] — 2026-03-26

### Fixed
- **`english_only` filter — Polish/Czech/Latin-Extended titles** — Extended the
  non-Latin fallback regex to include Latin Extended-A/B Unicode ranges
  (U+0100–U+024F), catching diacritics like ą, ć, ę, ł, ś, ź, ż that are
  common in Polish, Czech, Hungarian, Romanian etc. but never appear in
  English book titles.

---

## [1.4.6] — 2026-03-26

### Fixed
- **`english_only` filter — Latin-script non-English books** — Filter now uses
  the book's stored `language` code when available. Previously it only checked
  for non-Latin scripts, so Polish (and other Latin-diacritic) translations
  slipped through. Books with no language value still fall back to the
  non-Latin character regex.

---

## [1.4.5] — 2026-03-26

### Fixed
- **Search/Download drawer** — Query now pre-fills as `"Title Author"` instead of title-only, reducing false-positive results.
- **Search/Download drawer** — Audiobook category filter (`3030`) is now passed to both Prowlarr and Jackett so results are scoped to audiobook indexers only.

---

## [1.4.4] — 2026-03-26

### Changed
- **Missing Books — grouped by author** — Books are now grouped under shaded author header rows (showing name and per-author count) instead of repeating the author name on every row. Rows are sorted by displayed author name (first last) so the visual order matches what you read.

---

## [1.4.3] — 2026-03-26

### Added
- **Source tooltip** — Hovering the book title shows a tooltip listing which metadata sources (OpenLibrary, Google Books, Audnexus, ISBNdb) contributed that record.

---

## [1.4.2] — 2026-03-26

### Added
- **Dismiss button** — Every book row now has a trash icon button. Clicking it shows an inline Confirm / Cancel prompt; confirming soft-deletes the book via `DELETE /api/v1/books/{id}` so it won't reappear on re-scan.

---

## [1.4.1] — 2026-03-26

### Added
- **Search & download drawer** — Every row in the Missing Books table now has a search icon button that opens a side drawer. The drawer auto-searches Prowlarr/Jackett using the book title (`POST /api/v1/search/`), displays results in a table (title, indexer, type NZB/Torrent, seeders, size), and lets you send any result directly to the configured download client (`POST /api/v1/search/download`). Per-row state transitions: idle → Sending… → Queued ✓ / Failed, preventing accidental double-sends.
- **`searchApi.search()`** — `POST /api/v1/search/` returning `SearchResult[]`.
- **`searchApi.download()`** — `POST /api/v1/search/download` accepting `DownloadRequest`.
- **`searchApi.queue()`** — `GET /api/v1/search/download/queue` returning `DownloadQueueItem[]` (typed, ready for a future queue view).
- **`SearchDownloadDrawer`** — new `src/features/books/SearchDownloadDrawer.tsx` component.
- **New types** — `SearchResult`, `DownloadRequest`, `DownloadQueueItem` exported from `src/lib/api/search.ts`.

---

## [1.4.0] — 2026-03-26

### Added
- **Missing Books — author & series context** — The Missing Books page now fetches books per-author in parallel and displays an **Author** column alongside each title. Series info (`series_name · #position`) is shown as a subtitle under the book title when present.
- **Missing Books — author filter** — A new author dropdown in the filter bar lets you narrow the missing books list to a single author.
- **Missing Books — English only filter** — A new "English only" checkbox (on by default on the Missing Books page) hides titles containing non-Latin script characters (Cyrillic, CJK, Arabic, Hebrew, etc.), reducing noise from foreign-language editions.

---

## [1.3.2] — 2026-03-25

### Fixed
- **204 No Content on author delete** — `api` client now skips `res.json()` for 204 responses (and any response with `Content-Length: 0`), returning `undefined` instead of throwing "Unexpected end of JSON input". Affects author delete and any other endpoint that returns no body on success.

---

## [1.3.1] — 2026-03-25

### Added
- **Scan all authors button** — After a successful ABS import, the Integrations page now shows a **Scan all authors** button alongside Re-import. Clicking it calls `POST /api/v1/scans/all` to enqueue a full watchlist scan. Button transitions to "Queuing…" while pending, then "Scan queued" with a checkmark on success. Any error is shown inline below the buttons.

### Fixed
- **Author sort uses display name** — Sort on the Authors page now compares `name` ("First Last") instead of `name_sort` ("Last, First"), so ascending order matches what is visually displayed.

---

## [1.3.0] — 2026-03-25

### Added
- **Author sort** — Name column header on the Authors page is now clickable, toggling ascending/descending sort (uses `name_sort` so articles like "The" sort correctly).
- **Version display in sidebar** — UI version baked in at build time from `package.json` via Vite `define`. BookScout API version fetched live from `GET /health`, refreshes every 60 seconds. Silently absent if the API is unreachable.
- **Live Integrations status** — Prowlarr, Jackett, and the configured download client (SABnzbd / qBittorrent / Transmission) now show real-time connectivity status via `GET /api/v1/search/status`, polling every 30 seconds. States: not configured / connected (green dot + version) / unreachable (red dot + error detail). Download client card label resolves dynamically from the backend response key.
- **`src/lib/api/search.ts`** — `searchApi.status()` typed against `ServiceStatus` / `SearchStatusResult`.
- **`src/features/integrations/useSearchStatus.ts`** — `useQuery` hook for `/search/status`.
- **`src/hooks/useHealth.ts`** — `useQuery` hook for `GET /health`.
- **`src/vite-env.d.ts`** — TypeScript declaration for `__APP_VERSION__` Vite define constant.
- **`ROADMAP.md`** — new file for tracking planned and in-progress work.

### Fixed
- **Confirm dialog stays open after delete** — `handleRemoveConfirm` now closes the dialog before mutating (close-first pattern), avoiding a TanStack Query v5 re-render race.
- **Add author error handling** — `AddAuthorDialog` now shows inline error below the input. Mutation resets on dialog close so stale errors don't reappear on reopen.
- **Remove / scan error handling** — Failed remove and scan mutations now surface a red error banner on the Authors page with the server error message.

### Changed
- **ABS import state refactored into hooks** — `IntegrationsPage` no longer manages `localStorage` directly. State is now owned by `useAbsImportResult` (`useQuery`, `staleTime: Infinity`, seeded from localStorage) and `useAbsImport` (`useMutation` that writes localStorage and syncs cache via `setQueryData` on success). Result is invalidatable via `absImportKeys.result`.
- **`src/features/integrations/useAbsImport.ts`** — new feature hook encapsulating all ABS import state.

---

## [1.2.6] — 2026-03-24

### Changed
- **Favicon** — replaced generated SVG with custom icon set (ico, 16/32px PNG, Apple touch icon, 192/512px Android Chrome). Added `site.webmanifest` for PWA metadata.


### Changed
- **Favicon** — replaced default Vite logo with a BookScout-themed SVG: open book (indigo) with a green radar sweep arc and dot.
- **Page title** — changed from `bookscout-ui` to `BookScout`.


### Added
- **Audiobookshelf import** (`POST /api/v1/audiobookshelf/import-authors`) — new setup action on the Integrations page. The card shows a primary "Import authors from Audiobookshelf" button on first visit; after a successful run it switches to a success state showing the result counts (added / skipped / total) and the timestamp. A small "Re-import" button is available for subsequent runs without hiding the fact it's already been done. Result is persisted to `localStorage` so the state survives page reloads.


### Fixed
- **`Book` type** — Expanded to match the full `BookOut` schema: added `title_sort`, `subtitle`, `isbn`, `isbn13`, `asin`, `release_date`, `published_year`, `series_name`, `series_position`, `format`, `source`, `cover_url`, `description`, `match_method`, `created_at`, `updated_at`.
- **`Author` type** — Added `asin` and `openlibrary_key` fields present in `AuthorOut`.
- **`AuthorDetail` type** — New interface extending `Author` with `book_count` and `owned_count`; returned by `GET /authors/{id}` detail endpoint. `authorsApi.get()` now typed accordingly.
- **`BooksParams.author_id`** — Corrected from `string` to `number` (backend takes an integer).
- **`booksApi`** — Added `include_deleted?: boolean` param to `list()`; added `update(id, patch)` (`PATCH /books/{id}`) and `remove(id)` (`DELETE /books/{id}`) methods.
- **`authorsApi.list()`** — Added `active_only?: boolean` param.
- **`authorsApi`** — Added `update(id, patch)` (`PATCH /authors/{id}`) and `watchlist(id, settings)` (`PATCH /authors/{id}/watchlist`) methods.
- **`useAuthors` / `useDashboard`** — Fixed `queryFn: authorsApi.list` → `queryFn: () => authorsApi.list()` to avoid TanStack Query passing its context object as the params argument after the signature change.


### Fixed
- **books.ts** — Added `String(v) !== 'undefined'` defensive guard to prevent the literal string `"undefined"` from being serialised into the query string if a param somehow slips through as an unresolved undefined.
- **BooksFilterBar** — Removed the `q` search input entirely; `GET /api/v1/books/` has no `q` parameter so the field silently did nothing. `q` removed from `BooksFilter`, `BooksParams`, and `filterToParams`. Added optional `defaultFilter?: BooksFilter` prop: `isDirty` is now computed against `defaultFilter` (falling back to `DEFAULT_BOOKS_FILTER`), and the Clear button resets to that value.
- **MissingBooksPage** — Passes `defaultFilter={{ ...DEFAULT_BOOKS_FILTER, missing_only: true }}` to `<BooksFilterBar>` so that Clear resets back to *missing books* view (not all-books), and the Clear button is only shown when the user has changed something relative to that page-level default.
- **Dark mode** — Persistence added: a small inline script in `index.html` reads `localStorage.getItem('theme')` before React mounts (eliminates flash-of-wrong-theme). `Sidebar.tsx` toggle now writes `localStorage.setItem('theme', …)` on each change and initialises from `localStorage` rather than the DOM class.

### Removed
- **`scansApi.scanAuthor`** — Unused; `authorsApi.scan(id)` already covers the same `POST /scans/author/{id}` endpoint.
- **`EventFeed.tsx`** — Dead code; not imported anywhere since v1.2.0.
- **`ActiveJobsList.tsx`** — Dead stub; not imported anywhere.

### Added
- **`ErrorBoundary`** — New `src/components/ErrorBoundary.tsx` class component wrapping the route tree in `App.tsx`. Renders an inline error card with a "Try again" button on uncaught render errors; prevents a blank white screen.



### Fixed
- **Singleton SSE** — replaced three independent `EventSource` connections (Dashboard, MissingBooks, Activity) with a single `<SSEProvider>` in `App.tsx` that fans events out to all subscribers via `useBookScoutSSE`. Eliminates triple Redis pub/sub subscriptions on the server.
- **books.ts** — `q: ''` no longer serialised into the query string; empty-string values are now filtered out alongside `undefined`.
- **BooksFilterBar** — `DEFAULT_BOOKS_FILTER.missing_only` changed to `false` (the "cleared" state). `MissingBooksPage` explicitly initialises with `missing_only: true` so the page still opens showing missing books, but pressing Clear now correctly shows all books rather than snapping back to missing-only.
- **useCoauthors** — null `authorId` no longer collides with `authorId = 0` in the React Query cache; uses `['authors', 'coauthors', '__disabled__']` as the sentinel key when disabled.
- **AuthorsPage** — removed "Last scan" column; `list_authors()` returns bare `Author` objects with no watchlist join so `last_scanned` is always `null` from that endpoint. The column only ever showed "Never" which is misleading.
- **ActivityPage** — `clientSeq` moved from a module-level mutable variable to `useRef` to prevent stale values across HMR reloads.

## [1.2.0] — 2026-03-24

### Fixed
- **Books API** — `booksApi.list()` now returns `Book[]` (flat array) matching the actual BookScout response; removed the non-existent `Paginated<Book>` wrapper. All `data.total` references updated to `data.length` and `data.items` unwrapped to `data`.
- **Scan endpoint** — author scan corrected from `POST /authors/{id}/scan` → `POST /scans/author/{id}`.
- **SSE event types** — hook now normalises using the real `event` discriminator field; removed all fake types (`scan_completed`, `missing_book_found`, etc.); aligned to `scan.complete` and `coauthor.discovered`.
- **`Book` type** — removed non-existent `author`, `missing`, `last_scan_at` fields; added `deleted`; `id` is now `number`.
- **`Author` type** — `id` changed to `number`; field renamed `last_scan_at` → `last_scanned`; added `name_sort`, `active`.
- **`Coauthor` type** — `id` changed to `number`; added `on_watchlist`, `book_count`.
- **Dead endpoints removed** — `actionsApi` / `eventsApi` removed (no `/actions` or `/events` REST endpoints exist in BookScout).
- **Dashboard** — removed `useRecentEvents` / `useActiveJobs` and the dead "Active Jobs" / "Recent Events" cards; flat-array count selects corrected.
- **BooksTable** — removed `Author` and `Last scan` columns (fields absent from `BookOut`); `bookState` simplified to `have_it`.
- **EventFeed** — event config updated to real SSE types.
- **CoauthorsDrawer** — `on_watchlist` indicator shown per coauthor.
- **AuthorsPage** — `last_scan_at` → `last_scanned`, ID state types changed to `number`.

### Added
- `src/lib/api/scans.ts` — `scansApi` with `scanAll()`, `scanAuthor(id)`, `jobStatus(jobId)`.
- **Activity page** rewritten as a real-time SSE event log (up to 200 events in memory) with a "Scan all authors" button calling `POST /api/v1/scans/all`.

---

## [1.1.0] — 2026-03-24

### Fixed
- API base URL corrected from `/api` to `/api/v1` to match BookScout's actual routing
- SSE endpoint corrected from `/api/events/stream` → `/api/v1/events`
- `authorsApi` list/add now use trailing slashes per FastAPI convention

### Changed
- `Book` type: replaced `confidence: number` (0–1 float) with `score: number` (raw int)
  and `confidence_band: 'high' | 'medium' | 'low'` to match actual API response
- `Book` type: `owned / ignored / wanted` fields replaced with `have_it / missing`
- `Author` type: removed `coauthors: string[]` — coauthors are now fetched separately
  via `GET /api/v1/authors/{id}/coauthors`
- `BooksParams`: `owned / ignored / wanted / search` → `have_it / confidence_band /
  missing_only / q` to match real query parameters
- `BooksFilterBar`: redesigned — confidence band select and "Missing only" checkbox
  replace the owned/ignored/wanted dropdowns
- `ConfidenceBadge`: now shows band label (High / Medium / Low) with raw score in a
  tooltip instead of a computed percentage
- `BookStateBadge`: states are now `have_it / missing / unknown`
- Dashboard stat cards: derived from live book count queries instead of the
  non-existent `/api/v1/stats` endpoint — now shows Missing, High-confidence, Authors
- `BooksTable`: action buttons removed (no book-level mutation endpoints in BookScout API)
- `IntegrationsPage`: replaced live health-check cards with a static placeholder noting
  that `/api/v1/integrations` does not yet exist in BookScout

### Added
- `Coauthor` type (`id`, `name`)
- `authorsApi.coauthors(id)` — fetches co-authors for a single author
- `useCoauthors(authorId)` hook — lazy query, only fires when the drawer is opened
- `CoauthorsDrawer`: now fetches co-authors on demand instead of reading from the
  author object
- Dark mode: `prefers-color-scheme` is applied on first load; Moon / Sun toggle added
  to the bottom of the sidebar

### Removed
- `statsApi` (`/api/v1/stats` endpoint does not exist)
- `integrationsApi` (`/api/v1/integrations` endpoint does not exist)
- `useBookAction` hook and all book-level mutations (search / download / ignore /
  mark-owned endpoints do not exist)
- `DashboardStats` and `IntegrationStatus` types

---

## [1.0.0] — 2026-03-24

### Added
- Full React 19 + Vite 8 + TypeScript 5.9 application scaffold
- Tailwind v4 with shadcn/ui (New York style, zinc theme)
- TanStack Query v5 for data fetching and cache management
- React Router v7 with nested routes and `AppShell` sidebar layout
- SSE hook (`useBookScoutSSE`) with automatic reconnect (3 s back-off)
- **Dashboard** — stat cards, high-confidence missing books table, active jobs list,
  live event feed
- **Missing Books** page — filterable/searchable table, pagination
- **Authors** page — add / remove / scan authors, co-authors drawer
- **Activity** page — paginated jobs and events tables with live SSE invalidation
- **Integrations** page — per-service status cards with health-check button
- Multi-stage `Dockerfile` (node:22-alpine build → nginx:1.27-alpine runtime)
- `nginx.conf` with `/api/` proxy to BookScout, SSE buffering disabled, SPA fallback,
  and aggressive asset caching
- `docker-compose.yml` for standalone deployment on a shared `bookscout` network
- `.dockerignore` and `.gitignore`
