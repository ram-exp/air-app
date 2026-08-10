import { useMemo, useState } from 'react'
import { Plus, Star, Trash2, ExternalLink, Bookmark as BookmarkIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCollection } from '@/hooks/useCollection'
import { PageHeader, Button, Card, Badge, Input, Modal, EmptyState, Skeleton } from '@/components/ui'

const empty = { title: '', url: '', tags: '', folder: 'General' }

export default function BookmarksPage() {
  const { items, isLoading, createItem, updateItem, removeItem } = useCollection('bookmarks')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [folder, setFolder] = useState('All')

  const folders = useMemo(() => ['All', ...new Set(items.map((b) => b.folder).filter(Boolean))], [items])
  const filtered = useMemo(() => items.filter((b) => folder === 'All' || b.folder === folder), [items, folder])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.url.trim()) return
    await createItem({ ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean), favorite: false })
    toast.success('Bookmark saved')
    setForm(empty); setModalOpen(false)
  }
  const del = async (b) => { if (confirm(`Delete "${b.title}"?`)) { await removeItem(b.id); toast.success('Bookmark deleted') } }

  return (
    <div>
      <PageHeader title="Bookmarks" description="Links worth keeping." actions={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add bookmark</Button>} />

      <div className="flex flex-wrap gap-1.5 mb-4">
        {folders.map((f) => (
          <button key={f} onClick={() => setFolder(f)} className={`h-7 px-2.5 rounded-full text-xs font-medium ${folder === f ? 'bg-primary-500 text-white' : 'bg-black/[0.04] dark:bg-white/[0.06]'}`}>{f}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookmarkIcon} title="No bookmarks saved" description="Save links you want to find again quickly." actionLabel="Add bookmark" onAction={() => setModalOpen(true)} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((b) => (
            <Card key={b.id} hover className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0"><ExternalLink size={15} className="text-primary-500" /></div>
              <div className="flex-1 min-w-0">
                <a href={b.url} target="_blank" rel="noreferrer" className="text-sm font-medium hover:text-primary-500 truncate block">{b.title}</a>
                <p className="text-xs text-muted-light dark:text-muted-dark truncate">{b.url}</p>
                <div className="flex gap-1 mt-1">{b.tags?.map((t) => <Badge key={t}>{t}</Badge>)}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => updateItem(b.id, { favorite: !b.favorite })} className={b.favorite ? 'text-amber-500' : 'text-muted-light dark:text-muted-dark opacity-0 group-hover:opacity-100'}><Star size={14} className={b.favorite ? 'fill-amber-500' : ''} /></button>
                <button onClick={() => del(b)} className="opacity-0 group-hover:opacity-100 hover:text-rose-500"><Trash2 size={14} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add bookmark" footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={submit}>Save</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Title</label><Input autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required /></div>
          <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">URL</label><Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Folder</label><Input value={form.folder} onChange={(e) => setForm((f) => ({ ...f, folder: e.target.value }))} /></div>
            <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Tags</label><Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} /></div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
