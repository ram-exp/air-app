import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FolderKanban, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCollection } from '@/hooks/useCollection'
import { PageHeader, Button, Card, Badge, Progress, EmptyState, Skeleton } from '@/components/ui'
import FilterChip from '@/components/ui/FilterChip'
import ProjectFormModal from './ProjectFormModal'
import { daysUntil } from '@/lib/utils'

const statusTone = { active: 'primary', on_hold: 'amber', completed: 'teal' }

export default function ProjectsPage() {
  const { items, isLoading, createItem, updateItem, removeItem } = useCollection('projects')
  const [status, setStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => items.filter((p) => status === 'all' || p.status === status), [items, status])

  const save = async (data) => {
    if (editing) { await updateItem(editing.id, data); toast.success('Project updated') }
    else { await createItem(data); toast.success('Project created') }
    setModalOpen(false); setEditing(null)
  }
  const del = async (p) => { if (confirm(`Delete "${p.name}"?`)) { await removeItem(p.id); toast.success('Project deleted') } }

  return (
    <div>
      <PageHeader title="Projects" description="Bigger efforts, tracked to completion."
        actions={<Button onClick={() => { setEditing(null); setModalOpen(true) }}><Plus size={16} /> New project</Button>} />

      <div className="flex flex-wrap gap-2 mb-4">
        <FilterChip active={status === 'all'} onClick={() => setStatus('all')}>All</FilterChip>
        <FilterChip active={status === 'active'} onClick={() => setStatus('active')}>Active</FilterChip>
        <FilterChip active={status === 'on_hold'} onClick={() => setStatus('on_hold')}>On hold</FilterChip>
        <FilterChip active={status === 'completed'} onClick={() => setStatus('completed')}>Completed</FilterChip>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project to start tracking progress." actionLabel="New project" onAction={() => setModalOpen(true)} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const dleft = daysUntil(p.deadline)
            return (
              <Card key={p.id} hover className="group relative flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-9 w-9 rounded-xl bg-primary-500/15 flex items-center justify-center text-primary-500"><FolderKanban size={16} /></div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(p); setModalOpen(true) }} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"><Pencil size={13} /></button>
                    <button onClick={() => del(p)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={13} /></button>
                  </div>
                </div>
                <Link to={`/projects/${p.id}`} className="flex-1">
                  <h3 className="font-display font-semibold mb-1">{p.name}</h3>
                  <p className="text-xs text-muted-light dark:text-muted-dark line-clamp-2 mb-3">{p.description}</p>
                </Link>
                <Progress value={p.progress} tone={p.status === 'completed' ? 'teal' : 'primary'} className="mb-2" />
                <div className="flex items-center justify-between text-xs text-muted-light dark:text-muted-dark">
                  <Badge tone={statusTone[p.status]}>{p.status.replace('_', ' ')}</Badge>
                  <span>{dleft !== null ? (dleft >= 0 ? `${dleft}d left` : 'overdue') : 'no deadline'}</span>
                </div>
                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {p.tags.map((t) => <Badge key={t}>{t}</Badge>)}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <ProjectFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSubmit={save} initial={editing} />
    </div>
  )
}
