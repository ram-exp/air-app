import { Search, Sun, Moon } from 'lucide-react'
import { useThemeStore, applyTheme } from '@/store/useThemeStore'
import { useUIStore } from '@/store/useUIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Avatar } from '@/components/ui'
import MobileNav from './MobileNav'
import NotificationCenter from './NotificationCenter'
import { Link } from 'react-router-dom'

export default function Topbar({ title }) {
  const { theme, toggle } = useThemeStore()
  const { setCommandOpen } = useUIStore()
  const { user, isLocalMode } = useAuthStore()

  const onToggle = () => { toggle(); setTimeout(applyTheme, 0) }

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 h-16 px-4 md:px-6 glass border-b border-border-light dark:border-border-dark">
      <MobileNav />
      <h1 className="font-display font-semibold text-base md:text-lg truncate">{title}</h1>

      <button
        onClick={() => setCommandOpen(true)}
        className="ml-2 hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-sm text-muted-light dark:text-muted-dark w-64 max-w-xs hover:bg-black/[0.06] dark:hover:bg-white/[0.09] transition-colors"
      >
        <Search size={15} />
        <span className="flex-1 text-left">Search anything...</span>
        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <button className="sm:hidden h-9 w-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10" aria-label="Search" onClick={() => setCommandOpen(true)}>
          <Search size={17} />
        </button>
        <button onClick={onToggle} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <NotificationCenter />
        <Link to="/settings" className="ml-1">
          <Avatar name={user?.displayName || 'You'} src={user?.photoURL} size={34} />
        </Link>
        {isLocalMode && (
          <span className="hidden lg:inline text-[11px] px-2 py-1 rounded-full bg-amber-400/15 text-amber-500 font-medium ml-1">Local mode</span>
        )}
      </div>
    </header>
  )
}
