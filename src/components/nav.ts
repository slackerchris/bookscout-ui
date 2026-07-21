import {
  Activity,
  CalendarDays,
  Download,
  Library,
  LayoutDashboard,
  Plug,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const nav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/authors', label: 'Authors', icon: Users },
  { to: '/releases', label: 'Releases', icon: CalendarDays },
  { to: '/series', label: 'Series', icon: Library },
  { to: '/downloads', label: 'Downloads', icon: Download },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/co-authors', label: 'Co-authors', icon: UsersRound },
  { to: '/settings', label: 'Settings', icon: Settings },
]
