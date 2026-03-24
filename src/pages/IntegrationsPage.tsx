import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BookOpen,
  Search,
  Download,
  Webhook,
  Server,
  Info,
} from 'lucide-react'

const services = [
  { id: 'audiobookshelf', label: 'Audiobookshelf', description: 'Library server — source of truth for owned books', Icon: BookOpen },
  { id: 'prowlarr',       label: 'Prowlarr',       description: 'Indexer manager — used to search for audiobooks', Icon: Search },
  { id: 'downloader',     label: 'Downloader',     description: 'Download client — handles queued downloads', Icon: Download },
  { id: 'bookscout',      label: 'BookScout API',  description: 'Core API — scan, match, and orchestrate', Icon: Server },
  { id: 'n8n',            label: 'n8n',            description: 'Workflow automation — webhooks and notifications', Icon: Webhook },
]

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Services used by BookScout</p>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-2.5 rounded-md border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        <Info size={15} className="mt-0.5 shrink-0" />
        <span>Live health check API is not yet available. Integration status will appear here once the <code className="font-mono text-xs">/api/v1/integrations</code> endpoint is implemented in BookScout.</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {services.map(({ id, label, description, Icon }) => (
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
