import { useEffect, useRef, useState } from 'react'
import { Bell, CalendarClock, CheckSquare, Flame, Check, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNotificationStore } from '@/store/useNotificationStore'
import { cn } from '@/lib/utils'

const TYPE_ICON = { event: CalendarClock, task: CheckSquare, habit: Flame }
const TYPE_LINK = { event: '/calendar', task: '/tasks', habit: '/habits' }

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000
  if (diff < 1) return 'just now'
  if (diff < 60) return `${Math.floor(diff)}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

export default function NotificationCenter() {
  const { items, markRead, markAllRead, clearAll } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const unread = items.filter((n) => !n.read).length

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 relative"
        aria-label="Notifications"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-canvas-light dark:ring-canvas-dark" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 max-h-[26rem] flex flex-col glass-solid rounded-2xl shadow-2xl overflow-hidden z-30 animate-pop">
          <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-border-light dark:border-border-dark">
            <p className="font-display font-semibold text-sm">Notifications</p>
            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <>
                  <button onClick={markAllRead} title="Mark all read" className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"><Check size={13} /></button>
                  <button onClick={clearAll} title="Clear all" className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={13} /></button>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-muted-light dark:text-muted-dark text-center py-10 px-4">You're all caught up. Reminders for events, due tasks, and habits will show up here.</p>
            ) : (
              items.map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell
                return (
                  <Link
                    key={n.id}
                    to={TYPE_LINK[n.type] || '/'}
                    onClick={() => { markRead(n.id); setOpen(false) }}
                    className={cn('flex items-start gap-3 px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] border-b border-border-light dark:border-border-dark last:border-b-0', !n.read && 'bg-primary-500/5')}
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0 mt-0.5"><Icon size={14} className="text-primary-500" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-light dark:text-muted-dark truncate">{n.body}</p>}
                      <p className="text-[10px] text-muted-light dark:text-muted-dark mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />}
                  </Link>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
