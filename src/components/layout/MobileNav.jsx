import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_SECTIONS, SETTINGS_ITEM } from './navConfig'

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden h-9 w-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Open menu"
      >
        <Menu size={19} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 glass-solid animate-pop flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary-500 flex items-center justify-center text-white">
                  <Sparkles size={16} />
                </div>
                <span className="font-display font-semibold">AIR</span>
              </div>
              <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-light dark:text-muted-dark">{section.label}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) => cn(
                          'flex items-center gap-3 px-2.5 h-10 rounded-xl text-sm font-medium',
                          isActive ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                        )}
                      >
                        <item.icon size={17} />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
              <NavLink to={SETTINGS_ITEM.to} onClick={() => setOpen(false)} className="flex items-center gap-3 px-2.5 h-10 rounded-xl text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
                <SETTINGS_ITEM.icon size={17} /> <span>Settings</span>
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
