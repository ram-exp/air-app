import { useMemo, useState } from 'react'
import { Plus, Trash2, Smile, BookOpen, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCollection } from '@/hooks/useCollection'
import { PageHeader, Button, Card, Textarea, EmptyState, Skeleton } from '@/components/ui'
import { formatDate, uid } from '@/lib/utils'

const MOODS = ['😞', '😕', '😐', '🙂', '😄']

export default function JournalPage() {
  const { items, isLoading, createItem, updateItem, removeItem } = useCollection('journal')
  const [activeId, setActiveId] = useState(null)
  const [gratitudeInput, setGratitudeInput] = useState('')

  const sorted = useMemo(() => [...items].sort((a, b) => new Date(b.date) - new Date(a.date)), [items])
  const active = items.find((j) => j.id === activeId) || sorted[0]

  const createEntry = async () => {
    const today = new Date().toISOString()
    const existing = sorted.find((j) => j.date.slice(0, 10) === today.slice(0, 10))
    if (existing) { setActiveId(existing.id); toast('Today\'s entry already exists'); return }
    const entry = await createItem({ date: today, mood: 3, gratitude: [], highlights: '', learning: '' })
    setActiveId(entry.id)
  }

  const addGratitude = () => {
    if (!gratitudeInput.trim() || !active) return
    updateItem(active.id, { gratitude: [...(active.gratitude || []), gratitudeInput.trim()] })
    setGratitudeInput('')
  }
  const removeGratitude = (i) => updateItem(active.id, { gratitude: active.gratitude.filter((_, idx) => idx !== i) })
  const del = async (j) => { if (confirm('Delete this entry?')) { await removeItem(j.id); if (activeId === j.id) setActiveId(null); toast.success('Entry deleted') } }

  return (
    <div>
      <PageHeader title="Journal" description="A daily record of mood, gratitude, and lessons." actions={<Button onClick={createEntry}><Plus size={16} /> Today's entry</Button>} />

      <div className="grid lg:grid-cols-[240px_1fr] gap-4">
        <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
          {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />) :
            sorted.map((j) => (
              <button key={j.id} onClick={() => setActiveId(j.id)} className={`w-full text-left p-3 rounded-xl transition-colors ${active?.id === j.id ? 'bg-primary-500/10' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{MOODS[j.mood - 1] || '😐'}</span>
                  <span className="text-sm font-medium">{formatDate(j.date, { month: 'short', day: 'numeric' })}</span>
                </div>
                <p className="text-xs text-muted-light dark:text-muted-dark line-clamp-1 mt-1">{j.highlights || 'No highlights yet'}</p>
              </button>
            ))}
        </div>

        <Card className="min-h-[60vh]">
          {!active ? (
            <EmptyState icon={BookOpen} title="No entry yet" description="Start today's journal entry to capture how the day went." actionLabel="Today's entry" onAction={createEntry} />
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-lg">{formatDate(active.date, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                <button onClick={() => del(active)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-light dark:text-muted-dark mb-2 flex items-center gap-1.5"><Smile size={13} /> How was your day?</p>
                <div className="flex gap-2">
                  {MOODS.map((m, i) => (
                    <button key={i} onClick={() => updateItem(active.id, { mood: i + 1 })} className={`h-11 w-11 rounded-xl text-xl flex items-center justify-center transition-transform ${active.mood === i + 1 ? 'bg-primary-500/15 scale-110' : 'bg-black/[0.03] dark:bg-white/[0.05] hover:scale-105'}`}>{m}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-light dark:text-muted-dark mb-2">Gratitude</p>
                <div className="flex gap-2 mb-2">
                  <input value={gratitudeInput} onChange={(e) => setGratitudeInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addGratitude()} placeholder="Something you're grateful for..." className="flex-1 h-9 rounded-lg px-3 text-sm bg-black/[0.03] dark:bg-white/[0.05] outline-none" />
                  <Button size="sm" onClick={addGratitude}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(active.gratitude || []).map((g, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-500">{g} <button onClick={() => removeGratitude(i)}><X size={11} /></button></span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-light dark:text-muted-dark mb-2">Highlights</p>
                <Textarea rows={2} defaultValue={active.highlights} onBlur={(e) => updateItem(active.id, { highlights: e.target.value })} placeholder="What went well today?" />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-light dark:text-muted-dark mb-2">Learning</p>
                <Textarea rows={2} defaultValue={active.learning} onBlur={(e) => updateItem(active.id, { learning: e.target.value })} placeholder="What did you learn?" />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
