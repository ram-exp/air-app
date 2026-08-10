import { useEffect, useState } from 'react'
import { Modal, Button, Input, Select } from '@/components/ui'

const empty = { title: '', category: 'Personal', progress: 0, deadline: '', status: 'active', milestones: '' }

export default function GoalFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(empty)
  useEffect(() => {
    if (initial) setForm({ ...initial, deadline: initial.deadline ? initial.deadline.slice(0, 10) : '', milestones: (initial.milestones || []).join(', ') })
    else setForm(empty)
  }, [initial, open])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit({
      ...form,
      progress: Number(form.progress) || 0,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      milestones: form.milestones.split(',').map((m) => m.trim()).filter(Boolean),
    })
  }
  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit goal' : 'New goal'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>{initial ? 'Save' : 'Create'}</Button></>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Title</label><Input autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Category</label><Input value={form.category} onChange={(e) => set('category', e.target.value)} /></div>
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Status</label>
            <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Progress %</label><Input type="number" min="0" max="100" value={form.progress} onChange={(e) => set('progress', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Deadline</label><Input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} /></div>
        </div>
        <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Milestones (comma separated)</label><Input value={form.milestones} onChange={(e) => set('milestones', e.target.value)} /></div>
      </form>
    </Modal>
  )
}
