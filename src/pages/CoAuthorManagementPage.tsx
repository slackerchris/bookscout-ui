import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, AlertCircle, Users, CheckCircle2, Info, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useCoAuthorConflicts, useUpdateBook } from '@/features/books/useBooks'
import type { CoAuthorConflict, CoAuthorEntry } from '@/lib/api/books'
import { cn } from '@/lib/utils'

function AuthorOrderBadge({ order }: { order: number | null }) {
  if (order === null) return <span className="text-xs text-muted-foreground">unknown order</span>
  return (
    <span className={cn(
      'rounded px-1.5 py-0.5 text-xs font-medium',
      order === 0 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground',
    )}>
      #{order + 1} billed
    </span>
  )
}

function ConflictCard({ conflict }: { conflict: CoAuthorConflict }) {
  const { mutate: updateBook, isPending } = useUpdateBook()
  const [optimisticPrimary, setOptimisticPrimary] = useState<number | null>(null)

  const effectivePrimary = optimisticPrimary ?? conflict.primary_author_id

  function setPrimary(authorId: number) {
    if (authorId === effectivePrimary || isPending) return
    setOptimisticPrimary(authorId)
    updateBook(
      { id: conflict.id, patch: { primary_author_id: authorId } },
      {
        onSuccess: () => {
          const name = conflict.all_authors.find((a) => a.author_id === authorId)?.author_name ?? ''
          toast.success(`Primary author set to ${name}`)
        },
        onError: () => {
          setOptimisticPrimary(null)
          toast.error('Failed to update primary author')
        },
      },
    )
  }

  // Sort authors: first-billed first, unknown order last
  const sorted = [...conflict.all_authors].sort((a, b) => {
    if (a.author_order === null && b.author_order === null) return 0
    if (a.author_order === null) return 1
    if (b.author_order === null) return -1
    return a.author_order - b.author_order
  })

  const firstBilledId = sorted[0]?.author_order === 0 ? sorted[0].author_id : null
  const primaryMatchesBilling = effectivePrimary === firstBilledId

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{conflict.title}</p>
          {conflict.series_name && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {conflict.series_name}{conflict.series_position ? ` · #${conflict.series_position}` : ''}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {conflict.release_date && (
            <span className="text-xs text-muted-foreground">{conflict.release_date}</span>
          )}
          <span className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
            conflict.confidence_band === 'high' ? 'bg-emerald-500/15 text-emerald-500'
              : conflict.confidence_band === 'medium' ? 'bg-amber-500/15 text-amber-500'
              : 'bg-muted text-muted-foreground',
          )}>
            {conflict.confidence_band}
          </span>
        </div>
      </div>

      {!primaryMatchesBilling && firstBilledId !== null && (
        <div className="mb-3 flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          <Info size={12} className="shrink-0" />
          Primary author doesn't match first billing position — review suggested
        </div>
      )}

      <div className="space-y-1.5">
        {sorted.map((author: CoAuthorEntry) => {
          const isPrimary = author.author_id === effectivePrimary
          return (
            <div
              key={author.author_id}
              className={cn(
                'flex items-center justify-between gap-3 rounded-md border px-3 py-2',
                isPrimary ? 'border-primary/40 bg-primary/5' : 'border-border',
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                {isPrimary ? (
                  <CheckCircle2 size={14} className="shrink-0 text-primary" />
                ) : (
                  <div className="size-3.5 shrink-0" />
                )}
                <Link
                  to={`/authors/${author.author_id}`}
                  className="truncate text-sm font-medium text-foreground hover:text-primary"
                >
                  {author.author_name}
                </Link>
                <AuthorOrderBadge order={author.author_order} />
              </div>
              {!isPrimary && (
                <button
                  onClick={() => setPrimary(author.author_id)}
                  disabled={isPending}
                  className="shrink-0 rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={11} className="animate-spin" /> : 'Set primary'}
                </button>
              )}
              {isPrimary && (
                <span className="shrink-0 text-xs font-medium text-primary">Primary</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CoAuthorManagementPage() {
  const { data: conflicts = [], isLoading, isError } = useCoAuthorConflicts()

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Co-author Management</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Books where multiple watched authors are credited. Set the primary author to control
          where the book appears in Releases and other list views.
        </p>
      </div>

      {!isLoading && !isError && conflicts.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <Info size={14} className="shrink-0 text-blue-500" />
          <span>
            <strong className="text-foreground">{conflicts.length}</strong> book{conflicts.length !== 1 ? 's' : ''} with
            multiple tracked authors.{' '}
            <span className="text-amber-500">Amber warning</span> means the current primary doesn't match the
            first billing position from the source.
          </span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Loading…
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={14} className="shrink-0" />
          Failed to load co-author conflicts.
        </div>
      )}

      {!isLoading && !isError && conflicts.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-12 text-center">
          <Users size={28} className="text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">No co-author conflicts</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No books have multiple watched authors credited. As you add more authors to your
              watchlist, co-authored books will appear here.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && conflicts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {conflicts.map((conflict) => (
            <ConflictCard key={conflict.id} conflict={conflict} />
          ))}
        </div>
      )}

      {!isLoading && !isError && conflicts.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <ArrowRight size={12} className="mt-0.5 shrink-0" />
          <span>
            Billing order (#1, #2…) comes from the Audible/Audnexus authors array at scan time.
            It reflects how the source lists authors, but may be alphabetical rather than true
            billing order for some titles. Use the buttons above to override.
          </span>
        </div>
      )}
    </div>
  )
}
