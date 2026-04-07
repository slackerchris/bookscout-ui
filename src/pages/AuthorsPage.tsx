import { memo, useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthors, useUnwatchedAuthors, useAuthorMutations } from '@/features/authors/useAuthors'
import { useFavoriteAuthors } from '@/features/authors/useFavoriteAuthors'
import { useBookScoutSSE } from '@/lib/sse/useBookScoutSSE'
import type { BookScoutEvent } from '@/types'
import AddAuthorDialog from '@/features/authors/AddAuthorDialog'
import CoauthorsDrawer from '@/features/authors/CoauthorsDrawer'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Author } from '@/types'
import { Plus, ScanLine, Trash2, Users, Loader2, AlertCircle, Star, ArrowUpDown, Eye, EyeOff, Clock } from 'lucide-react'

const INITIAL_RENDER_COUNT = 60
const RENDER_STEP = 60

// ── Avatar helpers ─────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-rose-500',  'bg-teal-500',  'bg-pink-500',    'bg-indigo-500',
  'bg-amber-500', 'bg-cyan-500',
]

function avatarColor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase()
}

// ── Relative time helper ───────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

// ── Watched author card ────────────────────────────────────────────────────

interface AuthorCardProps {
  author: Author
  isFavorite: boolean
  isScanning: boolean
  onFavorite: () => void
  onScan: () => void
  onCoauthors: () => void
  onRemove: () => void
  /** If provided, the card is in "unwatched" mode — shows Watch instead of Scan/Coauthors/Remove */
  onWatch?: () => void
  isWatching?: boolean
}

const AuthorCard = memo(function AuthorCard({ author, isFavorite, isScanning, onFavorite, onScan, onCoauthors, onRemove, onWatch, isWatching }: AuthorCardProps) {
  return (
    <Card className={cn(
      'relative flex flex-col overflow-hidden transition-shadow hover:shadow-md',
      isFavorite && 'ring-1 ring-amber-400/70',
    )}>
      {!onWatch && (
        <button
          className="absolute top-2.5 right-2.5 z-10 text-muted-foreground/30 hover:text-amber-400 transition-colors"
          onClick={onFavorite}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={13} className={cn(isFavorite && 'fill-amber-400 text-amber-400')} />
        </button>
      )}

      <CardContent className="flex flex-col gap-3 p-4">
        <Link to={`/authors/${author.id}`} className="flex items-center gap-3 pr-5 group">
          <div className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold select-none',
            avatarColor(author.name),
          )}>
            {initials(author.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground leading-snug group-hover:underline">{author.name}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">{onWatch ? 'Not watching' : 'Watching'}</p>
            {author.last_scanned && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-medium">
                <Clock size={9} />
                {relativeTime(author.last_scanned)}
              </span>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-1 border-t border-border pt-2.5">
          {onWatch ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 flex-1 text-xs gap-1.5"
                disabled={isWatching}
                onClick={onWatch}
              >
                {isWatching ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                Watch
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                onClick={onRemove}
                title="Dismiss author"
                aria-label="Dismiss author"
              >
                <Trash2 size={12} />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 flex-1 text-xs gap-1.5"
                disabled={isScanning}
                onClick={onScan}
                title="Scan for new books"
              >
                {isScanning ? <Loader2 size={12} className="animate-spin" /> : <ScanLine size={12} />}
                Scan
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onCoauthors}
                title="View coauthors"
                aria-label="View coauthors"
              >
                <Users size={12} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                onClick={onRemove}
                title="Remove author"
                aria-label="Remove author"
              >
                <Trash2 size={12} />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}, (prev, next) => {
  return (
    prev.author.id === next.author.id &&
    prev.author.name === next.author.name &&
    prev.author.last_scanned === next.author.last_scanned &&
    prev.isFavorite === next.isFavorite &&
    prev.isScanning === next.isScanning &&
    prev.isWatching === next.isWatching &&
    Boolean(prev.onWatch) === Boolean(next.onWatch)
  )
})

// ── Unwatched author row (Not watching tab) ───────────────────────────────

interface UnwatchedRowProps {
  author: Author
  isWatching: boolean
  onWatch: () => void
  onDismiss: () => void
}

const UnwatchedRow = memo(function UnwatchedRow({ author, isWatching, onWatch, onDismiss }: UnwatchedRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/40 group">
      <div className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold select-none',
        avatarColor(author.name),
      )}>
        {initials(author.name)}
      </div>
      <span className="flex-1 text-sm text-foreground truncate">{author.name}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
          onClick={onDismiss}
          title="Dismiss (remove from list)"
          aria-label="Dismiss author"
        >
          <Trash2 size={12} />
        </Button>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs gap-1.5 shrink-0"
        disabled={isWatching}
        onClick={onWatch}
      >
        {isWatching ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />}
        Watch
      </Button>
    </div>
  )
}, (prev, next) => {
  return (
    prev.author.id === next.author.id &&
    prev.author.name === next.author.name &&
    prev.isWatching === next.isWatching
  )
})

// ── Page ────────────────────────────────────────────────────────────────────

export default function AuthorsPage() {
  const [tab, setTab] = useState<'all' | 'watching' | 'unwatched'>('all')

  const { data: authors = [], isLoading, isError } = useAuthors()
  const { data: unwatched = [], isLoading: unwatchedLoading } = useUnwatchedAuthors(tab === 'all' || tab === 'unwatched')
  const { add, remove, scan, watch, watchMany } = useAuthorMutations()
  const { favorites, toggle: toggleFavorite } = useFavoriteAuthors()
  const [search, setSearch] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [coauthorTarget, setCoauthorTarget] = useState<{ id: number; name: string } | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Author | null>(null)
  const [scanningId, setScanningId] = useState<number | null>(null)
  const [watchingId, setWatchingId] = useState<number | null>(null)
  const [allVisible, setAllVisible] = useState(INITIAL_RENDER_COUNT)
  const [watchingVisible, setWatchingVisible] = useState(INITIAL_RENDER_COUNT)
  const [unwatchedVisible, setUnwatchedVisible] = useState(INITIAL_RENDER_COUNT)

  const deferredSearch = useDeferredValue(search)
  const normalizedSearch = useMemo(() => deferredSearch.trim().toLowerCase(), [deferredSearch])
  const watchedIds = useMemo(() => new Set(authors.map((a) => a.id)), [authors])

  const filtered = useMemo(() =>
    authors
      .filter((a) => a.name.toLowerCase().includes(normalizedSearch))
      .filter((a) => !favoritesOnly || favorites.has(a.id))
      .sort((a, b) => {
        const aFav = favorites.has(a.id) ? 0 : 1
        const bFav = favorites.has(b.id) ? 0 : 1
        if (aFav !== bFav) return aFav - bFav
        const cmp = a.name.localeCompare(b.name)
        return sortDir === 'asc' ? cmp : -cmp
      }),
  [authors, normalizedSearch, favoritesOnly, favorites, sortDir])

  const filteredUnwatched = useMemo(() =>
    unwatched.filter((a) => a.name.toLowerCase().includes(normalizedSearch)),
  [unwatched, normalizedSearch])

  const allAuthors = useMemo(() => {
    // Deduplicate by id — during a refetch race the same author can briefly
    // appear in both lists. Prefer the watched version (authors) since it's
    // the more authoritative source.
    const combined = [...authors, ...unwatched.filter((a) => !watchedIds.has(a.id))]
    return combined
      .filter((a) => a.name.toLowerCase().includes(normalizedSearch))
      .sort((a, b) => {
        const aFav = favorites.has(a.id) ? 0 : 1
        const bFav = favorites.has(b.id) ? 0 : 1
        if (aFav !== bFav) return aFav - bFav
        return a.name.localeCompare(b.name)
      })
  }, [authors, unwatched, watchedIds, normalizedSearch, favorites])

  const visibleAllAuthors = useMemo(() => allAuthors.slice(0, allVisible), [allAuthors, allVisible])
  const visibleWatchingAuthors = useMemo(() => filtered.slice(0, watchingVisible), [filtered, watchingVisible])
  const visibleUnwatchedAuthors = useMemo(() => filteredUnwatched.slice(0, unwatchedVisible), [filteredUnwatched, unwatchedVisible])

  function resetVisible() {
    setAllVisible(INITIAL_RENDER_COUNT)
    setWatchingVisible(INITIAL_RENDER_COUNT)
    setUnwatchedVisible(INITIAL_RENDER_COUNT)
  }

  function handleAddOpenChange(open: boolean) {
    if (!open) add.reset()
    setAddOpen(open)
  }

  function handleAdd(name: string) {
    add.mutate(name, { onSuccess: () => setAddOpen(false) })
  }

  useBookScoutSSE((event: BookScoutEvent) => {
    if (event.event_type === 'scan.complete') {
      const aid = event.payload.author_id
      setScanningId((cur) => (cur === aid ? null : cur))
    }
  })

  function handleScan(author: Author) {
    setScanningId(author.id)
    // Clear on error; otherwise wait for scan.complete SSE event.
    scan.mutate(author.id, {
      onError: () => setScanningId(null),
    })
    setTimeout(() => setScanningId((cur) => (cur === author.id ? null : cur)), 10 * 60 * 1000)
  }

  function handleWatch(author: Author) {
    setWatchingId(author.id)
    watch.mutate(author.id, { onSettled: () => setWatchingId(null) })
  }

  function handleWatchAll() {
    if (filteredUnwatched.length === 0) return
    watchMany.mutate(filteredUnwatched.map((author) => author.id))
  }

  function handleRemoveConfirm() {
    if (!removeTarget) return
    const id = removeTarget.id
    setRemoveTarget(null)
    remove.mutate(id)
  }

  const showUnwatchedBadge = !unwatchedLoading && unwatched.length > 0

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Authors</h1>
          {tab === 'all' && !isLoading && !unwatchedLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {authors.length + unwatched.length} total · {authors.length} watching · {unwatched.length} not watching
            </p>
          )}
          {tab === 'watching' && !isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {authors.length} watched{favorites.size > 0 && ` · ${favorites.size} favorited`}
            </p>
          )}
          {tab === 'unwatched' && !unwatchedLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {unwatched.length} imported, not yet watching
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          Add author
        </Button>
      </div>

      {/* Tab toggle + filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Tab toggle */}
        <div role="tablist" aria-label="Author list view" className="flex items-center gap-2">
          <Button
            role="tab"
            aria-selected={tab === 'all'}
            variant={tab === 'all' ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setTab('all')
              resetVisible()
            }}
          >
            All
          </Button>
          <Button
            role="tab"
            aria-selected={tab === 'watching'}
            variant={tab === 'watching' ? 'default' : 'outline'}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => {
              setTab('watching')
              resetVisible()
            }}
          >
            <Eye size={12} />
            Watching
          </Button>
          <Button
            role="tab"
            aria-selected={tab === 'unwatched'}
            variant={tab === 'unwatched' ? 'default' : 'outline'}
            size="sm"
            className={cn('h-8 gap-1.5 text-xs', showUnwatchedBadge && tab !== 'unwatched' && 'border-amber-400/70 text-amber-600')}
            onClick={() => {
              setTab('unwatched')
              resetVisible()
            }}
          >
            <EyeOff size={12} />
            Not watching
            {showUnwatchedBadge && (
              <span className="ml-1 rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 leading-none">
                {unwatched.length}
              </span>
            )}
          </Button>
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        <Input
          placeholder={tab === 'watching' ? 'Filter authors…' : 'Search…'}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            resetVisible()
          }}
          className="h-8 w-48 text-sm"
        />

        {(tab === 'watching') && (
          <>
            <Button
              variant={favoritesOnly ? 'default' : 'outline'}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                setFavoritesOnly((v) => !v)
                resetVisible()
              }}
            >
              <Star size={12} className={cn(favoritesOnly && 'fill-current')} />
              Favorites
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
              onClick={() => {
                setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
                resetVisible()
              }}
            >
              <ArrowUpDown size={12} />
              {sortDir === 'asc' ? 'A → Z' : 'Z → A'}
            </Button>
          </>
        )}

        {tab === 'unwatched' && filteredUnwatched.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleWatchAll}
            disabled={watch.isPending || watchMany.isPending}
          >
            <Eye size={12} />
            {watchMany.isPending ? 'Watching…' : `Watch all (${filteredUnwatched.length})`}
          </Button>
        )}
      </div>

      {/* Errors */}
      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load authors. Is BookScout running?
        </div>
      )}
      {remove.isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          Failed to remove author: {remove.error instanceof Error ? remove.error.message : 'Unknown error'}
        </div>
      )}
      {scan.isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          Scan failed: {scan.error instanceof Error ? scan.error.message : 'Unknown error'}
        </div>
      )}
      {watchMany.isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          Bulk watch failed: {watchMany.error instanceof Error ? watchMany.error.message : 'Unknown error'}
        </div>
      )}

      {/* ── All tab ── */}
      {tab === 'all' && (
        <>
          {(isLoading || unwatchedLoading) && (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          )}

          {!isLoading && !unwatchedLoading && allAuthors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Users size={32} className="opacity-30" />
              <p className="text-sm">No authors found.</p>
            </div>
          )}

          {!isLoading && !unwatchedLoading && allAuthors.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {visibleAllAuthors.map((author) => {
                  const isWatched = watchedIds.has(author.id)
                  return isWatched ? (
                    <AuthorCard
                      key={author.id}
                      author={author}
                      isFavorite={favorites.has(author.id)}
                      isScanning={scanningId === author.id}
                      onFavorite={() => toggleFavorite(author.id)}
                      onScan={() => handleScan(author)}
                      onCoauthors={() => setCoauthorTarget({ id: author.id, name: author.name })}
                      onRemove={() => setRemoveTarget(author)}
                    />
                  ) : (
                    <AuthorCard
                      key={author.id}
                      author={author}
                      isFavorite={false}
                      isScanning={false}
                      onFavorite={() => {}}
                      onScan={() => {}}
                      onCoauthors={() => {}}
                      onRemove={() => setRemoveTarget(author)}
                      onWatch={() => handleWatch(author)}
                      isWatching={watchingId === author.id}
                    />
                  )
                })}
              </div>
              {allAuthors.length > visibleAllAuthors.length && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllVisible((v) => Math.min(v + RENDER_STEP, allAuthors.length))}
                  >
                    Show more ({allAuthors.length - visibleAllAuthors.length} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Watching tab ── */}
      {tab === 'watching' && (
        <>
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          )}

          {!isLoading && !isError && authors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Users size={32} className="opacity-30" />
              <p className="text-sm">No authors being watched yet.</p>
              <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                Add your first author
              </Button>
            </div>
          )}

          {!isLoading && authors.length > 0 && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No authors match your filters.</p>
          )}

          {!isLoading && filtered.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {visibleWatchingAuthors.map((author) => (
                  <AuthorCard
                    key={author.id}
                    author={author}
                    isFavorite={favorites.has(author.id)}
                    isScanning={scanningId === author.id}
                    onFavorite={() => toggleFavorite(author.id)}
                    onScan={() => handleScan(author)}
                    onCoauthors={() => setCoauthorTarget({ id: author.id, name: author.name })}
                    onRemove={() => setRemoveTarget(author)}
                  />
                ))}
              </div>
              {filtered.length > visibleWatchingAuthors.length && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWatchingVisible((v) => Math.min(v + RENDER_STEP, filtered.length))}
                  >
                    Show more ({filtered.length - visibleWatchingAuthors.length} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Not watching tab ── */}
      {tab === 'unwatched' && (
        <>
          {unwatchedLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          )}

          {!unwatchedLoading && unwatched.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <EyeOff size={28} className="opacity-30" />
              <p className="text-sm">No unmatched authors — everyone is being watched.</p>
            </div>
          )}

          {!unwatchedLoading && filteredUnwatched.length === 0 && unwatched.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No authors match your search.</p>
          )}

          {!unwatchedLoading && filteredUnwatched.length > 0 && (
            <>
              <div className="rounded-md border border-border divide-y divide-border">
                {visibleUnwatchedAuthors.map((author) => (
                  <UnwatchedRow
                    key={author.id}
                    author={author}
                    isWatching={watchingId === author.id}
                    onWatch={() => handleWatch(author)}
                    onDismiss={() => setRemoveTarget(author)}
                  />
                ))}
              </div>
              {filteredUnwatched.length > visibleUnwatchedAuthors.length && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUnwatchedVisible((v) => Math.min(v + RENDER_STEP, filteredUnwatched.length))}
                  >
                    Show more ({filteredUnwatched.length - visibleUnwatchedAuthors.length} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Dialogs / drawers */}
      <AddAuthorDialog
        open={addOpen}
        onOpenChange={handleAddOpenChange}
        onSubmit={handleAdd}
        isPending={add.isPending}
        error={add.isError ? (add.error instanceof Error ? add.error.message : 'Failed to add author') : null}
      />

      <CoauthorsDrawer
        authorId={coauthorTarget?.id ?? null}
        authorName={coauthorTarget?.name ?? null}
        onClose={() => setCoauthorTarget(null)}
      />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null) }}
        title="Remove author"
        description={`Remove "${removeTarget?.name}" and all their tracked books? This cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleRemoveConfirm}
        isPending={remove.isPending}
      />
    </div>
  )
}
