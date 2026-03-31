import { memo } from 'react'
import type { Book } from '@/types'
import { CheckCircle2 } from 'lucide-react'

const ImportedRow = memo(function ImportedRow({ book }: { book: Book }) {
  // created_at is immutable (set on insert) and matches the actual import time.
  // updated_at changes on any subsequent book update, so is a poor proxy here.
  const when = new Date(book.created_at).toLocaleString(undefined, {
    dateStyle: 'medium', timeStyle: 'short',
  })
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
      <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">
          {book.title}
          {book.series_name && (
            <span className="text-muted-foreground">
              {' '}· {book.series_name}{book.series_position ? ` #${book.series_position}` : ''}
            </span>
          )}
        </p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{when}</span>
    </div>
  )
})

export default ImportedRow
