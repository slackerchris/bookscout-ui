import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { X, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react'
import type { Author } from '@/types'
import { DEFAULT_BOOKS_FILTER, type BooksFilter } from './booksFilter'
import { useLocalStorage } from '@/hooks/useLocalStorage'

interface Preset {
  name: string
  filter: BooksFilter
}

const BUILT_IN_PRESETS: Preset[] = [
  { name: 'Upcoming', filter: { ...DEFAULT_BOOKS_FILTER, missing_only: true, english_only: true } },
  { name: 'High confidence missing', filter: { ...DEFAULT_BOOKS_FILTER, missing_only: true, confidence_band: 'high', english_only: true } },
  { name: 'Owned only', filter: { ...DEFAULT_BOOKS_FILTER, missing_only: false } },
  { name: 'Needs cleanup', filter: { ...DEFAULT_BOOKS_FILTER, confidence_band: 'low' } },
]

interface Props {
  filter: BooksFilter
  onChange: (f: BooksFilter) => void
  defaultFilter?: BooksFilter
  authors?: Author[]
}

export default function BooksFilterBar({ filter, onChange, defaultFilter, authors }: Props) {
  const set = <K extends keyof BooksFilter>(k: K, v: BooksFilter[K]) =>
    onChange({ ...filter, [k]: v })

  const [savedPresets, setSavedPresets] = useLocalStorage<Preset[]>('books-filter-presets', [])
  const [presetsOpen, setPresetsOpen] = useState(false)

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

  function savePreset() {
    const name = prompt('Preset name:')
    if (!name?.trim()) return
    setSavedPresets([...savedPresets, { name: name.trim(), filter }])
  }

  function deletePreset(index: number) {
    setSavedPresets(savedPresets.filter((_, i) => i !== index))
  }

  const allPresets = [...BUILT_IN_PRESETS, ...savedPresets]

  return (
    <div className="flex flex-col gap-2">
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

        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-muted-foreground"
          onClick={() => setPresetsOpen((o) => !o)}
        >
          {presetsOpen ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          Presets
        </Button>

        {isDirty && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-muted-foreground"
            onClick={savePreset}
          >
            <Bookmark size={13} />
            Save
          </Button>
        )}
      </div>

      {presetsOpen && (
        <div className="flex flex-wrap gap-1.5">
          {allPresets.map((preset, i) => {
            const isBuiltIn = i < BUILT_IN_PRESETS.length
            return (
              <div key={`${preset.name}-${i}`} className="flex items-center gap-0.5">
                <button
                  className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  onClick={() => { onChange(preset.filter); setPresetsOpen(false) }}
                >
                  {preset.name}
                </button>
                {!isBuiltIn && (
                  <button
                    className="text-muted-foreground/50 hover:text-destructive transition-colors"
                    onClick={() => deletePreset(i - BUILT_IN_PRESETS.length)}
                    title="Delete preset"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
