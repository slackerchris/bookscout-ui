import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Download,
  Activity,
  Plug,
  Moon,
  Sun,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useHealth } from '@/hooks/useHealth'

const APP_VERSION = __APP_VERSION__

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/authors', label: 'Authors', icon: Users },
  { to: '/downloads', label: 'Downloads', icon: Download },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/integrations', label: 'Integrations', icon: Plug },
]

export default function Sidebar() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') return true
    if (stored === 'light') return false
    return document.documentElement.classList.contains('dark')
  })
  const { data: health } = useHealth()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <aside className="flex flex-col w-56 shrink-0 border-r border-border bg-card h-full">
      <div className="px-4 py-5 border-b border-border">
        <span className="text-sm font-semibold tracking-wide text-foreground">
          BookScout
        </span>
      </div>
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-2">
        <button
          onClick={() => setDark((d) => !d)}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
        <div className="px-3 pt-1 pb-0.5 flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground/50">UI v{APP_VERSION}</span>
          {health?.version && (
            <span className="text-[10px] text-muted-foreground/50">API v{health.version}</span>
          )}
        </div>
      </div>
    </aside>
  )
}
