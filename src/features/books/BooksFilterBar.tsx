import { Input } from '@/components/ui/input'
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
  search: string
  owned: 'all' | 'no' | 'yes'
  ignored: 'all' | 'no' | 'yes'
  wanted: 'all' | 'no' | 'yes'
}

interface Props {
  filter: BooksFilter
  onChange: (f: BooksFilter) => void
}

export default function BooksFilterBar({ filter, onChange }: Props) {
  const set = <K extends keyof BooksFilter>(k: K, v: BooksFilter[K]) =>
    onChange({ ...filter, [k]: v })

  const isDirty =
    filter.search !== '' ||
    filter.owned !== 'all' ||
    filter.ignored !== 'all' ||
    filter.wanted !== 'all'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search title or author…"
        value={filter.search}
        onChange={(e) => set('search', e.target.value)}
        className="h-8 w-56 text-sm"
      />

      <Select value={filter.owned} onValueChange={(v) => set('owned', v as BooksFilter['owned'])}>
        <SelectTrigger className="h-8 w-32 text-sm">
          <SelectValue placeholder="Owned" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="no">Not owned</SelectItem>
          <SelectItem value="yes">Owned</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filter.ignored} onValueChange={(v) => set('ignored', v as BooksFilter['ignored'])}>
        <SelectTrigger className="h-8 w-32 text-sm">
          <SelectValue placeholder="Ignored" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="no">Not ignored</SelectItem>
          <SelectItem value="yes">Ignored</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filter.wanted} onValueChange={(v) => set('wanted', v as BooksFilter['wanted'])}>
        <SelectTrigger className="h-8 w-32 text-sm">
          <SelectValue placeholder="Wanted" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="no">Unwanted</SelectItem>
          <SelectItem value="yes">Wanted</SelectItem>
        </SelectContent>
      </Select>

      {isDirty && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground"
          onClick={() =>
            onChange({ search: '', owned: 'all', ignored: 'all', wanted: 'all' })
          }
        >
          <X size={13} />
          Clear
        </Button>
      )}
    </div>
  )
}
