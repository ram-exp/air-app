import { useEffect, useState } from 'react'
import { Modal, Button, Input, Textarea, Select } from '@/components/ui'

const empty = { name: '', description: '', status: 'active', progress: 0, deadline: '', tags: '', notes: '' }

export default function ProjectFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (initial) setForm({ ...initial, tags: (initial.tags || []).join(', '), deadline: initial.deadline ? initial.deadline.slice(0, 10) : '' })
    else setForm(empty)
  }, [initial, open])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit({
      ...form,
      progress: Number(form.progress) || 0,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit project' : 'New project'} size="lg"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit}>{initial ? 'Save changes' : 'Create project'}</Button>
      </>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Name</label>
          <Input autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Description</label>
          <Textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Status</label>
            <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Progress %</label>
            <Input type="number" min="0" max="100" value={form.progress} onChange={(e) => set('progress', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Deadline</label>
            <Input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Tags (comma separated)</label>
          <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Notes</label>
          <Textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </form>
    </Modal>
  )
}
