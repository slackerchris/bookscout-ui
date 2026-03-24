import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'

export interface BooksFilter {
  confidence_band: 'all' | 'high' | 'medium' | 'low'
  missing_only: boolean
}

// "Cleared" state — no filters applied. Pages set their own initial state.
export const DEFAULT_BOOKS_FILTER: BooksFilter = {
  confidence_band: 'all',
  missing_only: false,
}

interface Props {
  filter: BooksFilter
  onChange: (f: BooksFilter) => void
  /** Override what Clear resets to (default: DEFAULT_BOOKS_FILTER) */
  defaultFilter?: BooksFilter
}

export default function BooksFilterBar({ filter, onChange, defaultFilter }: Props) {
  const set = <K extends keyof BooksFilter>(k: K, v: BooksFilter[K]) =>
    onChange({ ...filter, [k]: v })

  const clearTarget = defaultFilter ?? DEFAULT_BOOKS_FILTER
  const isDirty =
    filter.confidence_band !== clearTarget.confidence_band ||
    filter.missing_only !== clearTarget.missing_only

  return (
    <div className="flex flex-wrap items-center gap-2">
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
