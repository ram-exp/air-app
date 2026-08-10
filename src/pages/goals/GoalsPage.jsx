import { useState } from 'react'
import { Plus, Target, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCollection } from '@/hooks/useCollection'
import { PageHeader, Button, Card, Badge, Progress, EmptyState, Skeleton } from '@/components/ui'
import GoalFormModal from './GoalFormModal'
import { daysUntil, formatDate } from '@/lib/utils'

const statusTone = { active: 'primary', completed: 'teal', paused: 'amber' }

export default function GoalsPage() {
  const { items, isLoading, createItem, updateItem, removeItem } = useCollection('goals')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const save = async (data) => {
    if (editing) { await updateItem(editing.id, data); toast.success('Goal updated') }
    else { await createItem(data); toast.success('Goal created') }
    setModalOpen(false); setEditing(null)
  }
  const del = async (g) => { if (confirm(`Delete "${g.title}"?`)) { await removeItem(g.id); toast.success('Goal deleted') } }

  return (
    <div>
      <PageHeader title="Goals" description="The bigger picture, broken into progress." actions={<Button onClick={() => { setEditing(null); setModalOpen(true) }}><Plus size={16} /> New goal</Button>} />

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Target} title="No goals set" description="Set a goal and track it to the finish line." actionLabel="New goal" onAction={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-3">
          {items.map((g) => {
            const dleft = daysUntil(g.deadline)
            return (
              <Card key={g.id} hover className="group cursor-pointer" onClick={() => { setEditing(g); setModalOpen(true) }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold">{g.title}</h3>
                      <Badge tone={statusTone[g.status]}>{g.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-light dark:text-muted-dark">{g.category} {g.deadline && `· due ${formatDate(g.deadline, { month: 'short', day: 'numeric', year: 'numeric' })}`} {dleft !== null && `(${dleft >= 0 ? dleft + 'd left' : 'overdue'})`}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(ev) => ev.stopPropagation()}>
                    <button onClick={() => { setEditing(g); setModalOpen(true) }} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"><Pencil size={13} /></button>
                    <button onClick={() => del(g)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={13} /></button>
                  </div>
                </div>
                <Progress value={g.progress} tone={g.status === 'completed' ? 'teal' : 'primary'} className="mb-2" />
                <div className="flex items-center justify-between text-xs text-muted-light dark:text-muted-dark mb-2">
                  <span>{g.progress}% complete</span>
                </div>
                {g.milestones?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">{g.milestones.map((m) => <Badge key={m}>{m}</Badge>)}</div>
                )}
              </Card>
            )
          })}
        </div>
      )}
      <GoalFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSubmit={save} initial={editing} />
    </div>
  )
}
