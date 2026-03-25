import { useState } from 'react'
import { useAuthors, useAuthorMutations } from '@/features/authors/useAuthors'
import AddAuthorDialog from '@/features/authors/AddAuthorDialog'
import CoauthorsDrawer from '@/features/authors/CoauthorsDrawer'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Author } from '@/types'
import { Plus, ScanLine, Trash2, Users, Loader2, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react'

export default function AuthorsPage() {
  const { data: authors = [], isLoading, isError } = useAuthors()
  const { add, remove, scan } = useAuthorMutations()

  const [search, setSearch] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [addOpen, setAddOpen] = useState(false)
  const [coauthorTarget, setCoauthorTarget] = useState<{ id: number; name: string } | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Author | null>(null)
  const [scanningId, setScanningId] = useState<number | null>(null)

  const filtered = authors
    .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const cmp = a.name.localeCompare(b.name)
      return sortDir === 'asc' ? cmp : -cmp
    })

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
              {authors.length} tracked
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          Add author
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Filter authors…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 w-56 text-sm"
      />

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load authors. Is BookScout running?
        </div>
      )}

      {/* Mutation errors */}
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

      {/* Empty */}
      {!isLoading && !isError && authors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Users size={32} className="opacity-30" />
          <p className="text-sm">No authors tracked yet.</p>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            Add your first author
          </Button>
        </div>
      )}

      {/* Table */}
      {!isLoading && filtered.length > 0 && (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>
                  <button
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
                  >
                    Name
                    {sortDir === 'asc'
                      ? <ArrowUp size={12} />
                      : <ArrowDown size={12} />}
                  </button>
                </TableHead>
                <TableHead className="w-[100px] text-center">Coauthors</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((author) => (
                <TableRow key={author.id}>
                  <TableCell className="font-medium text-foreground">
                    {author.name}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setCoauthorTarget({ id: author.id, name: author.name })}
                      title="View coauthors"
                    >
                      <Users size={13} />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={scanningId === author.id}
                            onClick={() => handleScan(author)}
                          >
                            {scanningId === author.id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <ScanLine size={14} />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Scan now</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setCoauthorTarget({ id: author.id, name: author.name })}
                          >
                            <Users size={14} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View coauthors</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setRemoveTarget(author)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove author</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* No filter results */}
      {!isLoading && authors.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No authors match "{search}"
        </p>
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
