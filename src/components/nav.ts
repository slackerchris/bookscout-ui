import {
  Activity,
  CalendarDays,
  Download,
  LayoutDashboard,
  Plug,
  Settings,
  Users,
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
  { to: '/downloads', label: 'Downloads', icon: Download },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/settings', label: 'Settings', icon: Settings },
]
