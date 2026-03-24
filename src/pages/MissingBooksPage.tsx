import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useBooks, bookKeys } from '@/features/books/useBooks'
import BooksFilterBar, { type BooksFilter, DEFAULT_BOOKS_FILTER } from '@/features/books/BooksFilterBar'
import BooksTable from '@/features/books/BooksTable'
import { useBookScoutSSE } from '@/lib/sse/useBookScoutSSE'
import type { BooksParams } from '@/lib/api/books'
import type { BookScoutEvent } from '@/types'
import { Loader2 } from 'lucide-react'

function filterToParams(f: BooksFilter): BooksParams {
  return {
    q: f.q || undefined,
    confidence_band: f.confidence_band === 'all' ? undefined : f.confidence_band,
    missing_only: f.missing_only || undefined,
  }
}

export default function MissingBooksPage() {
  const qc = useQueryClient()
  // Start with missing_only:true (page intent). Clear button resets to
  // DEFAULT_BOOKS_FILTER which has missing_only:false, showing all books.
  const [filter, setFilter] = useState<BooksFilter>({ ...DEFAULT_BOOKS_FILTER, missing_only: true })

  const params = filterToParams(filter)
  const { data, isLoading, isError } = useBooks(params)

  // Live updates: invalidate books list when a scan completes
  useBookScoutSSE((event: BookScoutEvent) => {
    if (event.event_type === 'scan.complete') {
      qc.invalidateQueries({ queryKey: bookKeys.all })
    }
  })

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Missing Books</h1>
          {data && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.length} book{data.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <BooksFilterBar filter={filter} onChange={setFilter} />

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load books. Is BookScout running?
        </div>
      )}

      {data && <BooksTable books={data} />}
    </div>
  )
}
