import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import type { Author } from '@/types'

export interface BooksFilter {
  confidence_band: 'all' | 'high' | 'medium' | 'low'
  missing_only: boolean
  author_id: number | 'all'
  english_only: boolean
}

// Matches titles that contain characters from non-Latin scripts.
const NON_LATIN_RE = /[\u0400-\u04FF\u0600-\u06FF\u0590-\u05FF\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u30FF\uAC00-\uD7AF\u0E00-\u0E7F\u0900-\u097F]/

export function isNonLatinTitle(title: string): boolean {
  return NON_LATIN_RE.test(title)
}

// "Cleared" state — no filters applied. Pages set their own initial state.
export const DEFAULT_BOOKS_FILTER: BooksFilter = {
  confidence_band: 'all',
  missing_only: false,
  author_id: 'all',
  english_only: false,
}

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      {authors && authors.length > 0 && (
        <Select
          value={String(filter.author_id)}
          onValueChange={(v) => set('author_id', v === 'all' ? 'all' : Number(v))}
        >
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="All authors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All authors</SelectItem>
            {authors.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={filter.confidence_band}
        onValueChange={(v) => set('confidence_band', v as BooksFilter['confidence_band'])}
      >
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="Confidence" />
        </SelectTrigger>
        <SelectContent>
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
