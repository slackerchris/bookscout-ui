import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import { useHealth } from '@/hooks/useHealth'
import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'

function HealthBanner() {
  const { data, isError } = useHealth()
  const [dismissed, setDismissed] = useState(false)

  const degraded = isError || (data && data.status !== 'ok')
  if (!degraded || dismissed) return null

  const failedComponents = data
    ? Object.entries(data.components)
        .filter(([, v]) => v !== 'ok')
        .map(([k]) => k)
    : []

  const message = failedComponents.length
    ? `Degraded: ${failedComponents.join(', ')} unavailable`
    : 'BookScout API is unreachable'

  return (
    <div className="flex items-center justify-between gap-2 bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-xs text-destructive shrink-0">
      <span className="flex items-center gap-1.5">
        <AlertCircle size={12} className="shrink-0" />
        {message}
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="text-destructive/60 hover:text-destructive transition-colors"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  )
}

export default function AppShell() {
  return (
    <div className="flex h-svh bg-background text-foreground flex-col md:flex-row">
      <div className="hidden md:block h-full">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <HealthBanner />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
