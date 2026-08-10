import { useState } from 'react'
import { Plus, Copy, Trash2, Star, Code2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCollection } from '@/hooks/useCollection'
import { Button, Card, Badge, Modal, Input, Textarea, Select, EmptyState, Skeleton } from '@/components/ui'

const empty = { title: '', language: 'javascript', code: '', tags: '' }

export default function SnippetsTool() {
  const { items, isLoading, createItem, updateItem, removeItem } = useCollection('snippets')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.code.trim()) return
    await createItem({ ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean), favorite: false })
    toast.success('Snippet saved')
    setForm(empty); setOpen(false)
  }
  const copy = (code) => { navigator.clipboard.writeText(code); toast.success('Copied to clipboard') }
  const del = async (s) => { if (confirm(`Delete "${s.title}"?`)) { await removeItem(s.id); toast.success('Snippet deleted') } }

  return (
    <div>
      <div className="flex justify-end mb-4"><Button size="sm" onClick={() => setOpen(true)}><Plus size={14} /> New snippet</Button></div>
      {isLoading ? <Skeleton className="h-32" /> : items.length === 0 ? (
        <EmptyState icon={Code2} title="No snippets saved" description="Save reusable pieces of code for later." actionLabel="New snippet" onAction={() => setOpen(true)} />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map((s) => (
            <Card key={s.id} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{s.title}</p>
                  <Badge>{s.language}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateItem(s.id, { favorite: !s.favorite })} className={s.favorite ? 'text-amber-500' : 'text-muted-light dark:text-muted-dark'}><Star size={13} className={s.favorite ? 'fill-amber-500' : ''} /></button>
                  <button onClick={() => copy(s.code)} className="hover:text-primary-500"><Copy size={13} /></button>
                  <button onClick={() => del(s)} className="hover:text-rose-500"><Trash2 size={13} /></button>
                </div>
              </div>
              <pre className="text-xs font-mono bg-black/[0.04] dark:bg-white/[0.06] rounded-xl p-3 overflow-x-auto max-h-40">{s.code}</pre>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="New snippet" size="lg" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Save</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <Select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}>
            {['javascript','typescript','python','css','html','bash','json','other'].map((l) => <option key={l} value={l}>{l}</option>)}
          </Select>
          <Textarea rows={8} className="font-mono" placeholder="Paste your code..." value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required />
          <Input placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
        </form>
      </Modal>
    </div>
  )
}
