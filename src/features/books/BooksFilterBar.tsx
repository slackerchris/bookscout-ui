import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { X } from 'lucide-react'
import type { Author } from '@/types'
import { DEFAULT_BOOKS_FILTER, type BooksFilter } from './booksFilter'

interface Props {
  filter: BooksFilter
  onChange: (f: BooksFilter) => void
  /** Override what Clear resets to (default: DEFAULT_BOOKS_FILTER) */
  defaultFilter?: BooksFilter
  authors?: Author[]
}

export default function BooksFilterBar({ filter, onChange, defaultFilter, authors }: Props) {
  const set = <K extends keyof BooksFilter>(k: K, v: BooksFilter[K]) =>
    onChange({ ...filter, [k]: v })

  const clearTarget = defaultFilter ?? DEFAULT_BOOKS_FILTER
  const isDirty =
    filter.confidence_band !== clearTarget.confidence_band ||
    filter.missing_only !== clearTarget.missing_only ||
    filter.author_id !== clearTarget.author_id ||
    filter.english_only !== clearTarget.english_only

  const authorOptions = useMemo(() => {
    if (!authors || authors.length === 0) return []
    return [
      { value: 'all', label: 'All authors' },
      ...[...authors]
        .sort((a, b) => a.name_sort.localeCompare(b.name_sort))
        .map((a) => ({ value: String(a.id), label: a.name_sort })),
    ]
  }, [authors])

  return (
    <div className="flex flex-wrap items-center gap-2">
      {authors && authors.length > 0 && (
        <Combobox
          options={authorOptions}
          value={String(filter.author_id)}
          onValueChange={(v) => set('author_id', v === 'all' ? 'all' : Number(v))}
          placeholder="All authors"
          searchPlaceholder="Search authors…"
        />
      )}

      <Select
        value={filter.confidence_band}
        onValueChange={(v) => set('confidence_band', v as BooksFilter['confidence_band'])}
      >
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="Confidence" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">All confidence</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filter.missing_only}
          onChange={(e) => set('missing_only', e.target.checked)}
          className="accent-primary"
        />
        <span className="text-sm text-muted-foreground">Missing only</span>
      </label>

      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filter.english_only}
          onChange={(e) => set('english_only', e.target.checked)}
          className="accent-primary"
        />
        <span className="text-sm text-muted-foreground">English only</span>
      </label>

      {isDirty && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground"
          onClick={() => onChange(clearTarget)}
        >
          <X size={13} />
          Clear
        </Button>
      )}
    </div>
  )
}
