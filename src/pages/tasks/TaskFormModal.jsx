import { useEffect, useState } from 'react'
import { Modal, Button, Input, Textarea, Select, Checkbox } from '@/components/ui'
import { Plus, Trash2 } from 'lucide-react'
import { uid } from '@/lib/utils'

const empty = {
  title: '', notes: '', status: 'todo', priority: 'medium', dueDate: '', tags: '', checklist: [], archived: false,
}

export default function TaskFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (initial) {
      setForm({ ...initial, tags: (initial.tags || []).join(', '), dueDate: initial.dueDate ? initial.dueDate.slice(0, 10) : '' })
    } else {
      setForm(empty)
    }
  }, [initial, open])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const addChecklistItem = () => set('checklist', [...(form.checklist || []), { id: uid(), text: '', done: false }])
  const updateChecklistItem = (id, patch) => set('checklist', form.checklist.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  const removeChecklistItem = (id) => set('checklist', form.checklist.filter((c) => c.id !== id))

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit({
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit task' : 'New task'} size="lg"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit}>{initial ? 'Save changes' : 'Create task'}</Button>
      </>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Title</label>
          <Input autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="What needs to get done?" required />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Notes</label>
          <Textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Add more detail..." />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Status</label>
            <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Priority</label>
            <Select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Due date</label>
            <Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Tags (comma separated)</label>
          <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="design, urgent" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark">Checklist</label>
            <button type="button" onClick={addChecklistItem} className="text-xs text-primary-500 flex items-center gap-1"><Plus size={12} /> Add item</button>
          </div>
          <div className="space-y-1.5">
            {(form.checklist || []).map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <Checkbox checked={c.done} onChange={(v) => updateChecklistItem(c.id, { done: v })} />
                <Input value={c.text} onChange={(e) => updateChecklistItem(c.id, { text: e.target.value })} placeholder="Checklist item" className="h-8" />
                <button type="button" onClick={() => removeChecklistItem(c.id)} className="text-muted-light dark:text-muted-dark hover:text-rose-500"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
