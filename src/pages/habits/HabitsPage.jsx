import { useState } from 'react'
import { Plus, Flame, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCollection } from '@/hooks/useCollection'
import { PageHeader, Button, Card, Badge, EmptyState, Skeleton, Checkbox } from '@/components/ui'
import HabitFormModal from './HabitFormModal'
import HabitHeatmap from '@/components/charts/HabitHeatmap'
import { habitStreak, habitCompletionRate } from '@/lib/stats'

export default function HabitsPage() {
  const { items, isLoading, createItem, updateItem, removeItem } = useCollection('habits')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const todayKey = new Date().toISOString().slice(0, 10)

  const toggleToday = (h) => {
    const history = { ...(h.history || {}) }
    history[todayKey] = !history[todayKey]
    updateItem(h.id, { history })
  }

  const save = async (data) => {
    if (editing) { await updateItem(editing.id, data); toast.success('Habit updated') }
    else { await createItem(data); toast.success('Habit created') }
    setModalOpen(false); setEditing(null)
  }
  const del = async (h) => { if (confirm(`Delete "${h.name}"?`)) { await removeItem(h.id); toast.success('Habit deleted') } }

  return (
    <div>
      <PageHeader title="Habits" description="Small daily wins, compounding over time." actions={<Button onClick={() => { setEditing(null); setModalOpen(true) }}><Plus size={16} /> New habit</Button>} />

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Flame} title="No habits tracked yet" description="Add a habit to start building your streak." actionLabel="New habit" onAction={() => setModalOpen(true)} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((h) => {
            const streak = habitStreak(h.history)
            const rate = habitCompletionRate(h.history)
            return (
              <Card key={h.id} hover className="group cursor-pointer" onClick={() => { setEditing(h); setModalOpen(true) }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{h.icon}</span>
                    <div>
                      <p className="font-display font-semibold">{h.name}</p>
                      <p className="text-xs text-muted-light dark:text-muted-dark capitalize">{h.cadence} · target {h.target}/wk</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                    <Checkbox checked={!!h.history?.[todayKey]} onChange={() => toggleToday(h)} />
                    <button onClick={() => { setEditing(h); setModalOpen(true) }} className="h-7 w-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"><Pencil size={13} /></button>
                    <button onClick={() => del(h)} className="h-7 w-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="overflow-x-auto pb-1 mb-3"><HabitHeatmap history={h.history} color={h.color} /></div>
                <div className="flex items-center gap-2">
                  <Badge tone="amber"><Flame size={11} className="inline mr-1 -mt-0.5" />{streak} day streak</Badge>
                  <Badge>{rate}% last 30d</Badge>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      <HabitFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSubmit={save} initial={editing} />
    </div>
  )
}
