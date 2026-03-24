import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { integrationsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { IntegrationStatus, IntegrationService } from '@/types'
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  BookOpen,
  Search,
  Download,
  Webhook,
  Server,
} from 'lucide-react'

const serviceConfig: Record<IntegrationService, { label: string; description: string; Icon: React.ElementType }> = {
  audiobookshelf: { label: 'Audiobookshelf', description: 'Library server — source of truth for owned books', Icon: BookOpen },
  prowlarr:       { label: 'Prowlarr',       description: 'Indexer manager — used to search for audiobooks', Icon: Search },
  downloader:     { label: 'Downloader',     description: 'Download client — handles queued downloads', Icon: Download },
  bookscout:      { label: 'BookScout',      description: 'Core API — scan, match, and orchestrate', Icon: Server },
  n8n:            { label: 'n8n',            description: 'Workflow automation — webhooks and notifications', Icon: Webhook },
}

function ServiceCard({ integration, onCheck, isChecking }: {
  integration: IntegrationStatus
  onCheck: (service: string) => void
  isChecking: boolean
}) {
  const cfg = serviceConfig[integration.service] ?? {
    label: integration.service,
    description: '',
    Icon: Server,
  }

  const lastChecked = integration.last_checked_at
    ? new Date(integration.last_checked_at).toLocaleString()
    : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
              <cfg.Icon size={15} className="text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{cfg.label}</CardTitle>
              <p className="text-xs text-muted-foreground">{cfg.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {integration.connected ? (
              <CheckCircle2 size={16} className="text-green-500" />
            ) : (
              <XCircle size={16} className="text-red-500" />
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onCheck(integration.service)}
              disabled={isChecking}
            >
              {isChecking
                ? <Loader2 size={13} className="animate-spin" />
                : <RefreshCw size={13} />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <span className={cn(
            'text-xs font-medium',
            integration.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
          )}>
            {integration.connected ? 'Connected' : 'Disconnected'}
          </span>
          {lastChecked && (
            <span className="text-xs text-muted-foreground/60">Checked {lastChecked}</span>
          )}
        </div>
        {integration.message && (
          <p className={cn(
            'mt-1.5 text-xs',
            integration.connected ? 'text-muted-foreground' : 'text-red-500',
          )}>
            {integration.message}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function IntegrationsPage() {
  const qc = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsApi.list,
    refetchInterval: 60_000,
  })

  const check = useMutation({
    mutationFn: integrationsApi.check,
    onSuccess: (updated) => {
      qc.setQueryData<IntegrationStatus[]>(['integrations'], (prev) =>
        prev?.map((s) => s.service === updated.service ? updated : s) ?? [updated],
      )
    },
  })

  function checkAll() {
    if (!data) return
    data.forEach((s) => check.mutate(s.service))
  }

  const allConnected = data?.every((s) => s.connected)

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Integrations</h1>
          {data && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.filter((s) => s.connected).length} / {data.length} connected
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={checkAll}
          disabled={isLoading || check.isPending}
        >
          {check.isPending
            ? <Loader2 size={13} className="animate-spin" />
            : <RefreshCw size={13} />}
          Check all
        </Button>
      </div>

      {/* Overall status banner */}
      {data && (
        <div className={cn(
          'flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm',
          allConnected
            ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
            : 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400',
        )}>
          {allConnected
            ? <><CheckCircle2 size={14} /> All services connected</>
            : <><XCircle size={14} /> {data.filter((s) => !s.connected).length} service{data.filter((s) => !s.connected).length !== 1 ? 's' : ''} unreachable</>}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 size={16} className="animate-spin" /><span className="text-sm">Loading…</span>
        </div>
      )}

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load integration status. Is BookScout running?
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((integration) => (
            <ServiceCard
              key={integration.service}
              integration={integration}
              onCheck={(s) => check.mutate(s)}
              isChecking={check.isPending && check.variables === integration.service}
            />
          ))}
        </div>
      )}
    </div>
  )
}
