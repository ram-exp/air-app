import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import AuroraField from './AuroraField'
import CommandPalette from '@/components/command/CommandPalette'
import FloatingAssistant from '@/components/assistant/FloatingAssistant'
import { NAV_SECTIONS, SETTINGS_ITEM } from './navConfig'
import { startNotificationScheduler, stopNotificationScheduler } from '@/lib/notificationScheduler'

function currentTitle(pathname) {
  const all = NAV_SECTIONS.flatMap((s) => s.items).concat(SETTINGS_ITEM)
  const match = all.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to) && i.to !== '/'))
  return match?.label || 'Dashboard'
}

export default function AppLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    startNotificationScheduler()
    return () => stopNotificationScheduler()
  }, [])

  return (
    <div className="flex min-h-screen relative">
      <AuroraField />
      <Sidebar />
      <div className="flex-1 min-w-0 relative z-[1]">
        <Topbar title={currentTitle(pathname)} />
        <main className="p-4 md:p-6 max-w-[1600px] mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      {pathname !== '/assistant' && <FloatingAssistant />}
    </div>
  )
}
