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
  Circle,
  RefreshCw,
  UserPlus,
} from 'lucide-react'
import { useAbsImport, useAbsImportResult } from '@/features/integrations/useAbsImport'
import { useSearchStatus } from '@/features/integrations/useSearchStatus'
import type { ServiceStatus } from '@/lib/api/search'
import { useMutation } from '@tanstack/react-query'
import { scansApi } from '@/lib/api/scans'
import { useHealth } from '@/hooks/useHealth'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function ServiceStatusBadge({ svc, loading }: { svc?: ServiceStatus; loading: boolean }) {
  if (loading) {
    return <Loader2 size={12} className="animate-spin text-muted-foreground" />
  }
  if (!svc || !svc.configured) {
    return <span className="text-xs text-muted-foreground/60">Not configured</span>
  }
  if (svc.status === 'ok') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-500">
        <Circle size={7} className="fill-emerald-500" />
        Connected{svc.version ? ` · v${svc.version}` : ''}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-destructive">
      <Circle size={7} className="fill-destructive" />
      {svc.detail ?? 'Unreachable'}
    </span>
  )
}

export default function IntegrationsPage() {
  const { data: stored } = useAbsImportResult()
  const importMutation = useAbsImport()
  const { data: searchStatus, isLoading: statusLoading } = useSearchStatus()
  const { data: health, isLoading: healthLoading } = useHealth()

  const bookscoutStatus: ServiceStatus | undefined = health
    ? { configured: true, status: health.status === 'ok' ? 'ok' : 'error', version: health.version }
    : undefined

  const scanAllMutation = useMutation({
    mutationFn: () => scansApi.scanAll(),
  })

  function runImport() {
    importMutation.mutate()
  }

  const loading = importMutation.isPending
  const error = importMutation.isError
    ? (importMutation.error instanceof Error ? importMutation.error.message : 'Import failed')
    : null

  const scanError = scanAllMutation.isError
    ? (scanAllMutation.error instanceof Error ? scanAllMutation.error.message : 'Scan failed')
    : null

  const prowlarr = searchStatus?.indexers.prowlarr
  const jackett = searchStatus?.indexers.jackett
  const n8n = searchStatus?.automation.n8n
  // download_client is a Record with a single key (sabnzbd | qbittorrent | transmission)
  const dlEntry = searchStatus?.download_client
    ? Object.entries(searchStatus.download_client)[0]
    : null
  const dlLabel = dlEntry
    ? { sabnzbd: 'SABnzbd', qbittorrent: 'qBittorrent', transmission: 'Transmission' }[dlEntry[0]] ?? dlEntry[0]
    : 'Downloader'
  const dlStatus = dlEntry?.[1]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
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
                    {' — '}{formatDate(stored.imported_at!)}
                  </span>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  disabled={loading}
                  onClick={runImport}
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  Re-import
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  disabled={scanAllMutation.isPending || scanAllMutation.isSuccess}
                  onClick={() => scanAllMutation.mutate()}
                >
                  {scanAllMutation.isPending ? (
                    <><Loader2 size={12} className="animate-spin" />Queuing…</>
                  ) : scanAllMutation.isSuccess ? (
                    <><CheckCircle2 size={12} />Scan queued</>
                  ) : (
                    'Scan all authors'
                  )}
                </Button>
              </div>
              {scanError && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle size={13} />
                  {scanError}
                </div>
              )}
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
                <Button size="sm" className="gap-1.5" disabled={loading} onClick={runImport}>
                  {loading ? (
                    <><Loader2 size={13} className="animate-spin" />Importing…</>
                  ) : (
                    <><UserPlus size={13} />Import authors from Audiobookshelf</>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Service integrations — live status */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Prowlarr */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <Search size={15} className="text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Prowlarr</CardTitle>
                <p className="text-xs text-muted-foreground">Indexer manager — used to search for audiobooks</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ServiceStatusBadge svc={prowlarr} loading={statusLoading} />
          </CardContent>
        </Card>

        {/* Jackett */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <Search size={15} className="text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Jackett</CardTitle>
                <p className="text-xs text-muted-foreground">Indexer proxy — alternative to Prowlarr</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ServiceStatusBadge svc={jackett} loading={statusLoading} />
          </CardContent>
        </Card>

        {/* Download client — label resolves dynamically from config */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <Download size={15} className="text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{dlLabel}</CardTitle>
                <p className="text-xs text-muted-foreground">Download client — handles queued downloads</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ServiceStatusBadge svc={dlStatus} loading={statusLoading} />
          </CardContent>
        </Card>

        {/* BookScout API — live status via /health */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <Webhook size={15} className="text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">n8n</CardTitle>
                <p className="text-xs text-muted-foreground">Workflow automation — webhooks and notifications</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ServiceStatusBadge svc={n8n} loading={statusLoading} />
          </CardContent>
        </Card>

        {/* BookScout API — live status via /health */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <Server size={15} className="text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">BookScout API</CardTitle>
                <p className="text-xs text-muted-foreground">Core API — scan, match, and orchestrate</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ServiceStatusBadge svc={bookscoutStatus} loading={healthLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
