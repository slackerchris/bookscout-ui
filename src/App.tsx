import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SSEProvider } from '@/lib/sse/SSEContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import AppShell from '@/components/AppShell'
import DashboardPage from '@/pages/DashboardPage'
import AuthorsPage from '@/pages/AuthorsPage'
import AuthorDetailPage from '@/pages/AuthorDetailPage'
import ActivityPage from '@/pages/ActivityPage'
import IntegrationsPage from '@/pages/IntegrationsPage'
import DownloadsPage from '@/pages/DownloadsPage'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { useBookScoutSSE } from '@/lib/sse/useBookScoutSSE'
import type { ImportCompletePayload } from '@/types'

function isImportCompletePayload(p: unknown): p is ImportCompletePayload {
  return (
    typeof p === 'object' && p !== null &&
    typeof (p as Record<string, unknown>).book_title === 'string' &&
    typeof (p as Record<string, unknown>).author_name === 'string'
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function ImportNotifier() {
  const qc = useQueryClient()
  useBookScoutSSE((event) => {
    if (event.event_type !== 'import.complete') return
    if (!isImportCompletePayload(event.payload)) return
    const p = event.payload
    toast.success(`Imported: ${p.book_title}`, {
      description: p.author_name,
      duration: 6000,
    })
    qc.invalidateQueries({ queryKey: ['downloads', 'recently-imported'] })
  })
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SSEProvider>
          <Toaster position="bottom-right" richColors />
          <BrowserRouter>
            <ErrorBoundary>
              <ImportNotifier />
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="authors" element={<AuthorsPage />} />
                  <Route path="authors/:id" element={<AuthorDetailPage />} />
                  <Route path="downloads" element={<DownloadsPage />} />
                  <Route path="activity" element={<ActivityPage />} />
                  <Route path="integrations" element={<IntegrationsPage />} />
                </Route>
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </SSEProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
