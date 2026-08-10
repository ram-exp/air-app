import { useEffect, useState } from 'react'
import { Modal, Button, Input, Textarea, Select } from '@/components/ui'

const empty = { title: '', category: 'Product', tags: '', status: 'new', notes: '', favorite: false }

export default function BrainstormFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(empty)
  useEffect(() => {
    if (initial) setForm({ ...initial, tags: (initial.tags || []).join(', ') })
    else setForm(empty)
  }, [initial, open])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit({ ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) })
  }
  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit idea' : 'New idea'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>{initial ? 'Save' : 'Create'}</Button></>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Title</label><Input autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Category</label>
            <Input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Product, Engineering..." />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Status</label>
            <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="new">New</option>
              <option value="exploring">Exploring</option>
              <option value="validated">Validated</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
        </div>
        <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Tags</label><Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="comma, separated" /></div>
        <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Notes</label><Textarea rows={4} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
      </form>
    </Modal>
  )
}
