import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuthors, useAuthorMutations } from '@/features/authors/useAuthors'
import { useFavoriteAuthors } from '@/features/authors/useFavoriteAuthors'
import AddAuthorDialog from '@/features/authors/AddAuthorDialog'
import CoauthorsDrawer from '@/features/authors/CoauthorsDrawer'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Author } from '@/types'
import { Plus, ScanLine, Trash2, Users, Loader2, AlertCircle, Star, ArrowUpDown } from 'lucide-react'

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

// ── Author card ─────────────────────────────────────────────────────────────

interface AuthorCardProps {
  author: Author
  isFavorite: boolean
  isScanning: boolean
  onFavorite: () => void
  onScan: () => void
  onCoauthors: () => void
  onRemove: () => void
}

function AuthorCard({ author, isFavorite, isScanning, onFavorite, onScan, onCoauthors, onRemove }: AuthorCardProps) {
  return (
    <Card className={cn(
      'relative flex flex-col overflow-hidden transition-shadow hover:shadow-md',
      isFavorite && 'ring-1 ring-amber-400/70',
    )}>
      {/* Favorite toggle */}
      <button
        className="absolute top-2.5 right-2.5 z-10 text-muted-foreground/30 hover:text-amber-400 transition-colors"
        onClick={onFavorite}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star size={13} className={cn(isFavorite && 'fill-amber-400 text-amber-400')} />
      </button>

      <CardContent className="flex flex-col gap-3 p-4">
        {/* Avatar + name — clickable link to detail page */}
        <Link
          to={`/authors/${author.id}`}
          className="flex items-center gap-3 pr-5 group"
        >
          <div className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold select-none',
            avatarColor(author.name),
          )}>
            {initials(author.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground leading-snug group-hover:underline">{author.name}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {author.active ? 'Watching' : 'Inactive'}
            </p>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1 border-t border-border pt-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 flex-1 text-xs gap-1.5"
                disabled={isScanning}
                onClick={onScan}
              >
                {isScanning
                  ? <Loader2 size={12} className="animate-spin" />
                  : <ScanLine size={12} />}
                Scan
              </Button>
            </TooltipTrigger>
            <TooltipContent>Scan for new books</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onCoauthors}>
                <Users size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View coauthors</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                onClick={onRemove}
              >
                <Trash2 size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove author</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function AuthorsPage() {
  const { data: authors = [], isLoading, isError } = useAuthors()
  const { add, remove, scan } = useAuthorMutations()
  const { favorites, toggle: toggleFavorite } = useFavoriteAuthors()

  const [search, setSearch] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [coauthorTarget, setCoauthorTarget] = useState<{ id: number; name: string } | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Author | null>(null)
  const [scanningId, setScanningId] = useState<number | null>(null)

  const filtered = useMemo(() =>
    authors
      .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
      .filter((a) => !favoritesOnly || favorites.has(a.id))
      .sort((a, b) => {
        // Favorites always first
        const aFav = favorites.has(a.id) ? 0 : 1
        const bFav = favorites.has(b.id) ? 0 : 1
        if (aFav !== bFav) return aFav - bFav
        const cmp = a.name.localeCompare(b.name)
        return sortDir === 'asc' ? cmp : -cmp
      }),
  [authors, search, favoritesOnly, favorites, sortDir])

  function handleAddOpenChange(open: boolean) {
    if (!open) add.reset()
    setAddOpen(open)
  }

  function handleAdd(name: string) {
    add.mutate(name, { onSuccess: () => setAddOpen(false) })
  }

  function handleScan(author: Author) {
    setScanningId(author.id)
    scan.mutate(author.id, { onSettled: () => setScanningId(null) })
  }

  function handleRemoveConfirm() {
    if (!removeTarget) return
    const id = removeTarget.id
    setRemoveTarget(null)
    remove.mutate(id)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Authors</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {authors.length} tracked{favorites.size > 0 && ` · ${favorites.size} favorited`}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          Add author
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Filter authors…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-48 text-sm"
        />
        <Button
          variant={favoritesOnly ? 'default' : 'outline'}
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setFavoritesOnly((v) => !v)}
        >
          <Star size={12} className={cn(favoritesOnly && 'fill-current')} />
          Favorites
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-muted-foreground"
          onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
        >
          <ArrowUpDown size={12} />
          {sortDir === 'asc' ? 'A → Z' : 'Z → A'}
        </Button>
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

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && authors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Users size={32} className="opacity-30" />
          <p className="text-sm">No authors tracked yet.</p>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            Add your first author
          </Button>
        </div>
      )}

      {/* No filter results */}
      {!isLoading && authors.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No authors match your filters.
        </p>
      )}

      {/* Card grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((author) => (
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
