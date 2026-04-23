import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { nav } from './Sidebar'

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-card/80 backdrop-blur-md pb-safe">
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] sm:text-xs font-medium transition-colors',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  'flex items-center justify-center rounded-2xl w-11 h-7 transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )}
              >
                <Icon size={18} />
              </div>
              <span className={cn('hidden sm:block', isActive && 'font-semibold')}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
