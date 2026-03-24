import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useBooks, useBookAction, bookKeys } from '@/features/books/useBooks'
import BooksFilterBar, { type BooksFilter } from '@/features/books/BooksFilterBar'
import BooksTable from '@/features/books/BooksTable'
import { useBookScoutSSE } from '@/lib/sse/useBookScoutSSE'
import type { BooksParams } from '@/lib/api/books'
import type { BookScoutEvent } from '@/types'
import { Loader2 } from 'lucide-react'

const DEFAULT_FILTER: BooksFilter = {
  search: '',
  owned: 'all',
  ignored: 'no',  // sensible default: hide ignored books
  wanted: 'all',
}

function filterToParams(f: BooksFilter): BooksParams {
  return {
    search: f.search || undefined,
    owned:   f.owned   === 'all' ? undefined : f.owned   === 'yes',
    ignored: f.ignored === 'all' ? undefined : f.ignored === 'yes',
    wanted:  f.wanted  === 'all' ? undefined : f.wanted  === 'yes',
  }
}

export default function MissingBooksPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<BooksFilter>(DEFAULT_FILTER)
  const [activeId, setActiveId] = useState<string | null>(null)

  const params = filterToParams(filter)
  const { data, isLoading, isError } = useBooks(params)
  const actions = useBookAction()

  // Live updates: invalidate books list when a relevant event arrives
  useBookScoutSSE((event: BookScoutEvent) => {
    const relevant: BookScoutEvent['event_type'][] = [
      'missing_book_found',
      'download_completed',
      'scan_completed',
    ]
    if (relevant.includes(event.event_type)) {
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
              {data.total} book{data.total !== 1 ? 's' : ''}
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

      {data && (
        <BooksTable
          books={data.items}
          actions={{
            search:    { isPending: actions.search.isPending,    mutate: actions.search.mutate },
            download:  { isPending: actions.download.isPending,  mutate: actions.download.mutate },
            ignore:    { isPending: actions.ignore.isPending,    mutate: actions.ignore.mutate },
            markOwned: { isPending: actions.markOwned.isPending, mutate: actions.markOwned.mutate },
          }}
          activeId={activeId}
          onActiveIdChange={setActiveId}
        />
      )}
    </div>
  )
}
