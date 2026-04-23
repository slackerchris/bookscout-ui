import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function AppShell() {
  return (
    <div className="flex h-svh bg-background text-foreground flex-col md:flex-row">
      <div className="hidden md:block h-full">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
