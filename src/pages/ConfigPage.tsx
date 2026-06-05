import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Download, FileDown, Loader2, Settings, Trash2, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { booksApi } from '@/lib/api/books'
import type { DownloadPreferences } from '@/lib/api/books'
import { toast } from 'sonner'

function ExportCard() {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const blob = await booksApi.export()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'bookscout-export.json'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export downloaded')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <FileDown size={15} className="text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">Export data</CardTitle>
            <p className="text-xs text-muted-foreground">Download all books and authors as JSON</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1.5"
          disabled={exporting}
          onClick={handleExport}
        >
          {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          {exporting ? 'Exporting…' : 'Download bookscout-export.json'}
        </Button>
      </CardContent>
    </Card>
  )
}

function DownloadPrefsCard() {
  const qc = useQueryClient()
  const { data: prefs, isLoading } = useQuery({
    queryKey: ['settings', 'download-preferences'],
    queryFn: () => booksApi.getDownloadPreferences(),
  })

  const [local, setLocal] = useState<Partial<DownloadPreferences>>({})
  const effective: DownloadPreferences = { min_seeders: 1, preferred_format: '', language: 'en', require_unabridged: false, max_size_gb: 0, ...prefs, ...local }

  const updateMutation = useMutation({
    mutationFn: () => booksApi.updateDownloadPreferences(effective),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'download-preferences'] })
      setLocal({})
      toast.success('Preferences saved')
    },
    onError: () => toast.error('Failed to save preferences'),
  })

  if (isLoading) return null

  const set = (k: keyof DownloadPreferences, v: unknown) =>
    setLocal((prev) => ({ ...prev, [k]: v }))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <Settings size={15} className="text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">Download preferences</CardTitle>
            <p className="text-xs text-muted-foreground">Default quality and format settings used for scoring search results</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Minimum seeders</label>
            <Input
              type="number"
              min={0}
              value={effective.min_seeders}
              onChange={(e) => set('min_seeders', parseInt(e.target.value) || 0)}
              className="h-8 text-sm w-24"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Preferred format</label>
            <select
              value={effective.preferred_format}
              onChange={(e) => set('preferred_format', e.target.value)}
              className="h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
            >
              <option value="">Any</option>
              <option value="m4b">M4B</option>
              <option value="mp3">MP3</option>
              <option value="flac">FLAC</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Language filter</label>
            <Input
              value={effective.language}
              onChange={(e) => set('language', e.target.value)}
              className="h-8 text-sm w-24"
              placeholder="en"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Max file size (GB)</label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={effective.max_size_gb || ''}
              onChange={(e) => set('max_size_gb', parseFloat(e.target.value) || 0)}
              className="h-8 text-sm w-24"
              placeholder="0 = no limit"
            />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="unabridged"
              checked={effective.require_unabridged}
              onChange={(e) => set('require_unabridged', e.target.checked)}
              className="accent-primary"
            />
            <label htmlFor="unabridged" className="text-sm text-muted-foreground cursor-pointer">
              Require unabridged
            </label>
          </div>
        </div>
        <div>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            disabled={updateMutation.isPending || Object.keys(local).length === 0}
            onClick={() => updateMutation.mutate()}
          >
            {updateMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Save preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DownloadHistoryClearCard() {
  const qc = useQueryClient()
  const [confirm, setConfirm] = useState(false)

  const clearMutation = useMutation({
    mutationFn: () => booksApi.clearDownloadHistory(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['download-history'] })
      toast.success(`Cleared ${data.deleted} download history entries`)
      setConfirm(false)
    },
    onError: () => toast.error('Failed to clear history'),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <Trash2 size={15} className="text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">Download history</CardTitle>
            <p className="text-xs text-muted-foreground">Manage the record of past download attempts</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex items-center gap-2">
        {confirm ? (
          <>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 text-xs"
              disabled={clearMutation.isPending}
              onClick={() => clearMutation.mutate()}
            >
              {clearMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
              Confirm clear
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 text-destructive/70 hover:text-destructive border-destructive/30"
            onClick={() => setConfirm(true)}
          >
            <Trash2 size={12} />
            Clear all history
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function ConfigHintCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <Settings size={15} className="text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">Server configuration</CardTitle>
            <p className="text-xs text-muted-foreground">API keys and scan settings are managed in config.yaml</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-md bg-muted/40 border border-border px-3 py-2 text-xs text-muted-foreground font-mono space-y-1">
          <p># /data/config.yaml  (or set BOOKSCOUT_CONFIG env var)</p>
          <p>apis:</p>
          <p className="pl-4">google_books_key: "…"</p>
          <p className="pl-4">isbndb_key: "…"</p>
          <p>scan:</p>
          <p className="pl-4">language_filter: en</p>
          <p className="pl-4">cache_ttl_hours: 24</p>
          <p>server:</p>
          <p className="pl-4">secret_key: "change-me"</p>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Restart the BookScout service after editing config.yaml. Environment variables (e.g.{' '}
          <code className="font-mono">GOOGLE_BOOKS_API_KEY</code>) override YAML values.
        </p>
      </CardContent>
    </Card>
  )
}

export default function ConfigPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Data management and quality preferences</p>
      </div>
      <ExportCard />
      <DownloadPrefsCard />
      <DownloadHistoryClearCard />
      <ConfigHintCard />
    </div>
  )
}
