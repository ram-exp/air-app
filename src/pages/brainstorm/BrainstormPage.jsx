import { useMemo, useState } from 'react'
import { Plus, Star, Pencil, Trash2, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCollection } from '@/hooks/useCollection'
import { PageHeader, Button, Card, Badge, EmptyState, Skeleton } from '@/components/ui'
import FilterChip from '@/components/ui/FilterChip'
import BrainstormFormModal from './BrainstormFormModal'

const statusTone = { new: 'default', exploring: 'primary', validated: 'teal', archived: 'default' }

export default function BrainstormPage() {
  const { items, isLoading, createItem, updateItem, removeItem } = useCollection('brainstorm')
  const [status, setStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => items.filter((i) => status === 'all' || i.status === status), [items, status])

  const save = async (data) => {
    if (editing) { await updateItem(editing.id, data); toast.success('Idea updated') }
    else { await createItem(data); toast.success('Idea captured') }
    setModalOpen(false); setEditing(null)
  }
  const del = async (i) => { if (confirm(`Delete "${i.title}"?`)) { await removeItem(i.id); toast.success('Idea deleted') } }

  return (
    <div>
      <PageHeader title="Brainstorm" description="Capture ideas before they slip away." actions={<Button onClick={() => { setEditing(null); setModalOpen(true) }}><Plus size={16} /> New idea</Button>} />

      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'new', 'exploring', 'validated', 'archived'].map((s) => (
          <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>{s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}</FilterChip>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No ideas yet" description="Jot down anything worth exploring later." actionLabel="New idea" onAction={() => setModalOpen(true)} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((i) => (
            <Card key={i.id} hover className="group flex flex-col cursor-pointer" onClick={() => { setEditing(i); setModalOpen(true) }}>
              <div className="flex items-start justify-between mb-2">
                <Badge tone="primary">{i.category}</Badge>
                <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                  <button onClick={() => updateItem(i.id, { favorite: !i.favorite })} className={i.favorite ? 'text-amber-500' : 'text-muted-light dark:text-muted-dark opacity-0 group-hover:opacity-100'}><Star size={14} className={i.favorite ? 'fill-amber-500' : ''} /></button>
                  <button onClick={() => { setEditing(i); setModalOpen(true) }} className="opacity-0 group-hover:opacity-100"><Pencil size={13} /></button>
                  <button onClick={() => del(i)} className="opacity-0 group-hover:opacity-100 hover:text-rose-500"><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 className="font-display font-semibold mb-1">{i.title}</h3>
              {i.notes && <p className="text-xs text-muted-light dark:text-muted-dark line-clamp-3 mb-3">{i.notes}</p>}
              <div className="mt-auto flex items-center justify-between">
                <Badge tone={statusTone[i.status]}>{i.status}</Badge>
                <div className="flex gap-1">{i.tags?.slice(0, 2).map((t) => <Badge key={t}>{t}</Badge>)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <BrainstormFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSubmit={save} initial={editing} />
    </div>
  )
}
