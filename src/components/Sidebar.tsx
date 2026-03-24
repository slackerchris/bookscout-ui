import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  BookX,
  Activity,
  Plug,
} from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/authors', label: 'Authors', icon: Users },
  { to: '/missing-books', label: 'Missing Books', icon: BookX },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/integrations', label: 'Integrations', icon: Plug },
]

export default function Sidebar() {
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
    </aside>
  )
}
