import { useMemo, useState } from 'react'
import { Plus, Search, Star, Pin, Trash2, Eye, Edit3, StickyNote } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCollection } from '@/hooks/useCollection'
import { PageHeader, Button, Input, Card, Badge, EmptyState, Skeleton } from '@/components/ui'
import { cn, formatDate } from '@/lib/utils'
import { renderSafeMarkdown } from '@/lib/safeMarkdown'

export default function NotesPage() {
  const { items, isLoading, createItem, updateItem, removeItem } = useCollection('notes')
  const [query, setQuery] = useState('')
  const [folder, setFolder] = useState('All')
  const [activeId, setActiveId] = useState(null)
  const [preview, setPreview] = useState(false)

  const folders = useMemo(() => ['All', ...new Set(items.map((n) => n.folder).filter(Boolean))], [items])

  const filtered = useMemo(() => items
    .filter((n) => folder === 'All' || n.folder === folder)
    .filter((n) => !query.trim() || n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (b.pinned - a.pinned) || (new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))),
    [items, folder, query])

  const active = items.find((n) => n.id === activeId) || filtered[0]

  const createNote = async () => {
    const note = await createItem({ title: 'Untitled note', content: '', folder: folder === 'All' ? 'General' : folder, tags: [], pinned: false, favorite: false })
    setActiveId(note.id)
    toast.success('Note created')
  }

  const del = async (n) => {
    if (!confirm(`Delete "${n.title}"?`)) return
    await removeItem(n.id)
    if (activeId === n.id) setActiveId(null)
    toast.success('Note deleted')
  }

  return (
    <div>
      <PageHeader title="Notes" description="Markdown notes, organized by folder." actions={<Button onClick={createNote}><Plus size={16} /> New note</Button>} />

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <div>
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes..." className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {folders.map((f) => (
              <button key={f} onClick={() => setFolder(f)} className={cn('h-7 px-2.5 rounded-full text-xs font-medium', folder === f ? 'bg-primary-500 text-white' : 'bg-black/[0.04] dark:bg-white/[0.06]')}>{f}</button>
            ))}
          </div>
          {isLoading ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div> : (
            <div className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-1">
              {filtered.map((n) => (
                <button key={n.id} onClick={() => setActiveId(n.id)} className={cn('w-full text-left p-3 rounded-xl transition-colors', active?.id === n.id ? 'bg-primary-500/10' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05]')}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {n.pinned && <Pin size={11} className="text-primary-500" />}
                    {n.favorite && <Star size={11} className="text-amber-500 fill-amber-500" />}
                    <p className="text-sm font-medium truncate flex-1">{n.title}</p>
                  </div>
                  <p className="text-xs text-muted-light dark:text-muted-dark line-clamp-2">{n.content || 'No content yet'}</p>
                  <p className="text-[10px] text-muted-light dark:text-muted-dark mt-1">{formatDate(n.updatedAt || n.createdAt)}</p>
                </button>
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted-light dark:text-muted-dark text-center py-8">No notes found.</p>}
            </div>
          )}
        </div>

        <Card className="min-h-[65vh]">
          {!active ? (
            <EmptyState icon={StickyNote} title="No note selected" description="Create a note or pick one from the list." actionLabel="New note" onAction={createNote} />
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between gap-3 mb-3">
                <input
                  value={active.title}
                  onChange={(e) => updateItem(active.id, { title: e.target.value })}
                  className="font-display text-xl font-semibold bg-transparent outline-none flex-1 min-w-0"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => updateItem(active.id, { pinned: !active.pinned })} className={cn('h-8 w-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10', active.pinned && 'text-primary-500')}><Pin size={15} /></button>
                  <button onClick={() => updateItem(active.id, { favorite: !active.favorite })} className={cn('h-8 w-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10', active.favorite && 'text-amber-500')}><Star size={15} className={active.favorite ? 'fill-amber-500' : ''} /></button>
                  <button onClick={() => setPreview(!preview)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10">{preview ? <Edit3 size={15} /> : <Eye size={15} />}</button>
                  <button onClick={() => del(active)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <input
                  defaultValue={active.folder}
                  onBlur={(e) => updateItem(active.id, { folder: e.target.value })}
                  className="text-xs px-2 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] outline-none w-28"
                  placeholder="Folder"
                />
                {active.tags?.map((t) => <Badge key={t}>{t}</Badge>)}
              </div>
              <div className="flex-1 min-h-0">
                {preview ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none h-full overflow-y-auto text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(active.content || '*Nothing to preview*') }}
                  />
                ) : (
                  <textarea
                    key={active.id}
                    defaultValue={active.content}
                    onBlur={(e) => updateItem(active.id, { content: e.target.value })}
                    placeholder="Write in Markdown..."
                    className="w-full h-full min-h-[300px] resize-none outline-none bg-transparent font-mono text-sm leading-relaxed"
                  />
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
