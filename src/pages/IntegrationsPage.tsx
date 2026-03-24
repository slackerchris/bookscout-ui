import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Search,
  Download,
  Webhook,
  Server,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { audiobookshelfApi, type AbsImportResult } from '@/lib/api/audiobookshelf'

const STORAGE_KEY = 'abs_import_result'

interface StoredResult extends AbsImportResult {
  imported_at: string
}

function loadStored(): StoredResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredResult) : null
  } catch {
    return null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const otherServices = [
  { id: 'prowlarr',    label: 'Prowlarr',      description: 'Indexer manager — used to search for audiobooks',    Icon: Search },
  { id: 'downloader', label: 'Downloader',     description: 'Download client — handles queued downloads',          Icon: Download },
  { id: 'bookscout',  label: 'BookScout API',  description: 'Core API — scan, match, and orchestrate',            Icon: Server },
  { id: 'n8n',        label: 'n8n',            description: 'Workflow automation — webhooks and notifications',     Icon: Webhook },
]

export default function IntegrationsPage() {
  const [stored, setStored] = useState<StoredResult | null>(loadStored)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runImport() {
    setLoading(true)
    setError(null)
    try {
      const result = await audiobookshelfApi.importAuthors()
      const stored: StoredResult = { ...result, imported_at: new Date().toISOString() }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
      setStored(stored)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Services used by BookScout</p>
      </div>

      {/* ABS import card — special setup action */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
              <BookOpen size={15} className="text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">Audiobookshelf</CardTitle>
              <p className="text-xs text-muted-foreground">Library server — source of truth for owned books</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex flex-col gap-3">
          {stored ? (
            <>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-foreground font-medium">Authors imported</span>
                  <span className="text-xs text-muted-foreground">
                    {stored.imported} added, {stored.skipped} skipped
                    {stored.total_from_abs > 0 && ` of ${stored.total_from_abs} total`}
                    {' — '}{formatDate(stored.imported_at)}
                  </span>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={loading}
                  onClick={runImport}
                >
                  {loading && <Loader2 size={12} className="animate-spin" />}
                  Re-import
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Pull all authors from your Audiobookshelf library into the BookScout watchlist.
                Only needs to be done once during initial setup.
              </p>
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}
              <div>
                <Button size="sm" disabled={loading} onClick={runImport}>
                  {loading ? (
                    <><Loader2 size={13} className="animate-spin" />Importing…</>
                  ) : (
                    'Import authors from Audiobookshelf'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Other services — status not yet available */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {otherServices.map(({ id, label, description, Icon }) => (
          <Card key={id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                  <Icon size={15} className="text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-xs text-muted-foreground/60">Status unavailable</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
