import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCollection } from '@/hooks/useCollection'
import { PageHeader, Button, Card, Badge, Tabs } from '@/components/ui'
import EventFormModal from './EventFormModal'
import { cn, formatDate, isSameDay, uid } from '@/lib/utils'

const categoryDot = { work: 'bg-primary-500', personal: 'bg-amber-500', health: 'bg-teal-500' }

function startOfWeek(d) { const x = new Date(d); const day = x.getDay(); x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x }

export default function CalendarPage() {
  const { items: events, createItem, updateItem, removeItem } = useCollection('events')
  const location = useLocation()
  const navigate = useNavigate()
  const [view, setView] = useState(location.state?.view || 'month')
  const [cursor, setCursor] = useState(location.state?.date ? new Date(location.state.date) : new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [defaultDate, setDefaultDate] = useState(null)
  const pendingEventId = useRef(location.state?.eventId || null)

  // Jump to a specific date/view when arriving from another page (e.g. dashboard "Upcoming events").
  useEffect(() => {
    if (!location.state) return
    if (location.state.date) setCursor(new Date(location.state.date))
    if (location.state.view) setView(location.state.view)
    // Clear the navigation state so a page refresh or back-nav doesn't re-trigger this.
    navigate(location.pathname, { replace: true, state: {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-open the event modal once its data is loaded, if we arrived here targeting a specific event.
  useEffect(() => {
    if (!pendingEventId.current) return
    const match = events.find((e) => e.id === pendingEventId.current)
    if (match) {
      setEditing(match)
      setModalOpen(true)
      pendingEventId.current = null
    }
  }, [events])

  const monthGrid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = startOfWeek(first)
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [cursor])

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [cursor])

  const eventsFor = (day) => events.filter((e) => isSameDay(e.date, day)).sort((a, b) => new Date(a.date) - new Date(b.date))

  const stepCursor = (dir) => {
    const x = new Date(cursor)
    if (view === 'month') x.setMonth(x.getMonth() + dir)
    else if (view === 'week') x.setDate(x.getDate() + dir * 7)
    else x.setDate(x.getDate() + dir)
    setCursor(x)
  }

  const openNew = (day) => { setEditing(null); setDefaultDate(day || cursor); setModalOpen(true) }
  const openEdit = (e) => { setEditing(e); setModalOpen(true) }

  const save = async (data) => {
    if (editing) { await updateItem(editing.id, data); toast.success('Event updated') }
    else { await createItem(data); toast.success('Event created') }
    setModalOpen(false); setEditing(null)
  }
  const del = async (e) => { if (confirm(`Delete "${e.title}"?`)) { await removeItem(e.id); toast.success('Event deleted') } }

  // Notes/journal entries live on the event itself (event.journal), so they
  // save immediately as you type — independent from the main "Save" button,
  // so nothing's lost if the modal gets closed without saving other fields.
  const addJournalEntry = async (eventId, text) => {
    const ev = events.find((e) => e.id === eventId)
    if (!ev) return
    const entry = { id: uid(), text, createdAt: new Date().toISOString() }
    const journal = [entry, ...(ev.journal || [])]
    await updateItem(eventId, { journal })
    setEditing((cur) => (cur && cur.id === eventId ? { ...cur, journal } : cur))
  }
  const deleteJournalEntry = async (eventId, entryId) => {
    const ev = events.find((e) => e.id === eventId)
    if (!ev) return
    const journal = (ev.journal || []).filter((j) => j.id !== entryId)
    await updateItem(eventId, { journal })
    setEditing((cur) => (cur && cur.id === eventId ? { ...cur, journal } : cur))
  }

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Your schedule at a glance."
        actions={<Button onClick={() => openNew(new Date())}><Plus size={16} /> New event</Button>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => stepCursor(-1)} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"><ChevronLeft size={17} /></button>
          <h2 className="font-display font-semibold w-44 text-center">
            {view === 'month' && formatDate(cursor, { month: 'long', year: 'numeric' })}
            {view === 'week' && `${formatDate(weekDays[0])} – ${formatDate(weekDays[6])}`}
            {view === 'day' && formatDate(cursor, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          <button onClick={() => stepCursor(1)} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"><ChevronRight size={17} /></button>
          <Button variant="secondary" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
        </div>
        <Tabs tabs={[{ value: 'month', label: 'Month' }, { value: 'week', label: 'Week' }, { value: 'day', label: 'Day' }]} active={view} onChange={setView} />
      </div>

      {view === 'month' && (
        <Card glass={false} className="p-0 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border-light dark:border-border-dark">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-light dark:text-muted-dark py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthGrid.map((day, i) => {
              const inMonth = day.getMonth() === cursor.getMonth()
              const isToday = isSameDay(day, new Date())
              const dayEvents = eventsFor(day)
              return (
                <div
                  key={i}
                  onClick={() => openNew(day)}
                  className={cn(
                    'min-h-[92px] p-1.5 border-b border-r border-border-light dark:border-border-dark cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors',
                    !inMonth && 'opacity-40'
                  )}
                >
                  <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full text-xs', isToday && 'bg-primary-500 text-white font-semibold')}>
                    {day.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div key={e.id} onClick={(ev) => { ev.stopPropagation(); openEdit(e) }} className="flex items-center gap-1 text-[11px] px-1 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] truncate">
                        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', categoryDot[e.category])} />
                        <span className="truncate">{e.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && <p className="text-[10px] text-muted-light dark:text-muted-dark px-1">+{dayEvents.length - 3} more</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {view === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDays.map((day) => (
            <Card key={day.toISOString()} glass={false} className={cn(isSameDay(day, new Date()) && 'ring-2 ring-primary-500/40')}>
              <p className="text-xs font-medium text-muted-light dark:text-muted-dark mb-2">{formatDate(day, { weekday: 'short', day: 'numeric' })}</p>
              <div className="space-y-1.5 min-h-[60px]">
                {eventsFor(day).map((e) => (
                  <button key={e.id} onClick={() => openEdit(e)} className="w-full text-left flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06]">
                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', categoryDot[e.category])} />
                    <span className="truncate flex-1">{e.title}</span>
                  </button>
                ))}
                {eventsFor(day).length === 0 && <p className="text-[11px] text-muted-light dark:text-muted-dark">No events</p>}
              </div>
              <button onClick={() => openNew(day)} className="mt-2 text-xs text-primary-500 flex items-center gap-1"><Plus size={12} /> Add</button>
            </Card>
          ))}
        </div>
      )}

      {view === 'day' && (
        <Card glass={false}>
          <div className="space-y-2">
            {eventsFor(cursor).length === 0 && <p className="text-sm text-muted-light dark:text-muted-dark text-center py-8">No events scheduled.</p>}
            {eventsFor(cursor).map((e) => (
              <div key={e.id} onClick={() => openEdit(e)} className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors">
                <div className="w-16 shrink-0 text-sm font-medium">{formatDate(e.date, { hour: 'numeric', minute: '2-digit' })}</div>
                <span className={cn('h-2 w-2 rounded-full shrink-0', categoryDot[e.category])} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge>{e.category}</Badge>
                    {e.reminder && <Badge tone="amber"><Bell size={10} className="inline mr-0.5" /> Reminder</Badge>}
                  </div>
                </div>
                <button onClick={(ev) => { ev.stopPropagation(); openEdit(e) }} className="text-xs text-primary-500">Edit</button>
                <button onClick={(ev) => { ev.stopPropagation(); del(e) }} className="text-xs text-rose-500">Delete</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <EventFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSubmit={save}
        initial={editing}
        defaultDate={defaultDate}
        onAddJournalEntry={addJournalEntry}
        onDeleteJournalEntry={deleteJournalEntry}
      />
    </div>
  )
}
