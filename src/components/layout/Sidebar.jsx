import { NavLink } from 'react-router-dom'
import { ChevronsLeft, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'
import { NAV_SECTIONS, SETTINGS_ITEM } from './navConfig'

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 h-screen sticky top-0 z-20 glass border-r border-border-light dark:border-border-dark transition-all duration-200',
        sidebarCollapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      <div className="flex items-center gap-2 px-4 h-16 shrink-0">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white shrink-0 bg-primary-500" style={{ backgroundImage: 'var(--accent-gradient)' }}>
          <Sparkles size={16} />
        </div>
        {!sidebarCollapsed && <span className="font-display font-semibold tracking-tight">AIR</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!sidebarCollapsed && (
              <p className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-light dark:text-muted-dark">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={item.label}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-2.5 h-9 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300'
                      : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-inherit/80'
                  )}
                >
                  <item.icon size={17} className="shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-border-light dark:border-border-dark space-y-0.5">
        <NavLink
          to={SETTINGS_ITEM.to}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-2.5 h-9 rounded-xl text-sm font-medium transition-colors',
            isActive ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
          )}
        >
          <SETTINGS_ITEM.icon size={17} />
          {!sidebarCollapsed && <span>Settings</span>}
        </NavLink>
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-2.5 h-9 rounded-xl text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-muted-light dark:text-muted-dark"
        >
          <ChevronsLeft size={17} className={cn('transition-transform', sidebarCollapsed && 'rotate-180')} />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
