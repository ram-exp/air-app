import { useMemo, useState } from 'react'
import { Plus, Search, Archive, Trash2, Pencil, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCollection } from '@/hooks/useCollection'
import { PageHeader, Button, Input, Card, Badge, Checkbox, EmptyState, Skeleton } from '@/components/ui'
import FilterChip from '@/components/ui/FilterChip'
import TaskFormModal from './TaskFormModal'
import { formatDate, PRIORITY_ORDER } from '@/lib/utils'

const priorityTone = { urgent: 'rose', high: 'amber', medium: 'primary', low: 'default' }
const STATUS_LABEL = { todo: 'To do', in_progress: 'In progress', done: 'Done' }

export default function TasksPage() {
  const { items, isLoading, createItem, updateItem, removeItem } = useCollection('tasks')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => {
    return items
      .filter((t) => (showArchived ? t.archived : !t.archived))
      .filter((t) => status === 'all' || t.status === status)
      .filter((t) => !query.trim() || t.title.toLowerCase().includes(query.toLowerCase()) || (t.tags || []).some((tag) => tag.includes(query.toLowerCase())))
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  }, [items, status, query, showArchived])

  const toggleDone = (t) => updateItem(t.id, { status: t.status === 'done' ? 'todo' : 'done' })

  const save = async (data) => {
    if (editing) {
      await updateItem(editing.id, data)
      toast.success('Task updated')
    } else {
      await createItem(data)
      toast.success('Task created')
    }
    setModalOpen(false); setEditing(null)
  }

  const archive = async (t) => { await updateItem(t.id, { archived: !t.archived }); toast.success(t.archived ? 'Restored' : 'Archived') }
  const del = async (t) => { if (confirm('Delete this task?')) { await removeItem(t.id); toast.success('Task deleted') } }

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Everything on your plate, prioritized."
        actions={<Button onClick={() => { setEditing(null); setModalOpen(true) }}><Plus size={16} /> New task</Button>}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." className="pl-9" />
        </div>
        <FilterChip active={status === 'all'} onClick={() => setStatus('all')}>All</FilterChip>
        <FilterChip active={status === 'todo'} onClick={() => setStatus('todo')}>To do</FilterChip>
        <FilterChip active={status === 'in_progress'} onClick={() => setStatus('in_progress')}>In progress</FilterChip>
        <FilterChip active={status === 'done'} onClick={() => setStatus('done')}>Done</FilterChip>
        <div className="ml-auto">
          <FilterChip active={showArchived} onClick={() => setShowArchived(!showArchived)}>
            <Archive size={13} className="inline mr-1 -mt-0.5" /> Archived
          </FilterChip>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks here" description="Try a different filter, or create a new task to get started." actionLabel="New task" onAction={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <Card
              key={t.id}
              glass={false}
              className="flex items-start gap-3 group cursor-pointer"
              hover
              onClick={() => { setEditing(t); setModalOpen(true) }}
            >
              <div className="pt-0.5" onClick={(ev) => ev.stopPropagation()}>
                <Checkbox checked={t.status === 'done'} onChange={() => toggleDone(t)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through opacity-50' : ''}`}>{t.title}</p>
                  <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                  <Badge>{STATUS_LABEL[t.status]}</Badge>
                  {t.tags?.map((tag) => <Badge key={tag} tone="primary">{tag}</Badge>)}
                </div>
                {t.notes && <p className="text-xs text-muted-light dark:text-muted-dark mt-1 line-clamp-2">{t.notes}</p>}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-light dark:text-muted-dark">
                  {t.dueDate && <span>Due {formatDate(t.dueDate)}</span>}
                  {t.checklist?.length > 0 && <span>{t.checklist.filter((c) => c.done).length}/{t.checklist.length} checklist</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(ev) => ev.stopPropagation()}>
                <button onClick={() => { setEditing(t); setModalOpen(true) }} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"><Pencil size={14} /></button>
                <button onClick={() => archive(t)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"><Archive size={14} /></button>
                <button onClick={() => del(t)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TaskFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSubmit={save} initial={editing} />
    </div>
  )
}
