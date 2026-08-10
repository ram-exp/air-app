import { useEffect, useState } from 'react'
import { Modal, Button, Input, Select } from '@/components/ui'

const empty = { name: '', icon: '✅', color: 'primary', target: 7, cadence: 'daily' }
const EMOJIS = ['✅','🧘','📚','🏋️','🍬','💧','🧹','🎯','🎨','🌱','😴','🚭']

export default function HabitFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(empty)
  useEffect(() => { setForm(initial || empty) }, [initial, open])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e) => { e.preventDefault(); if (!form.name.trim()) return; onSubmit({ ...form, target: Number(form.target), history: initial?.history || {} }) }
  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit habit' : 'New habit'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>{initial ? 'Save' : 'Create'}</Button></>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Name</label><Input autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} required /></div>
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Icon</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button type="button" key={e} onClick={() => set('icon', e)} className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center ${form.icon === e ? 'bg-primary-500/15 ring-2 ring-primary-500' : 'bg-black/[0.04] dark:bg-white/[0.06]'}`}>{e}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Color</label>
            <Select value={form.color} onChange={(e) => set('color', e.target.value)}>
              <option value="primary">Indigo</option>
              <option value="teal">Teal</option>
              <option value="amber">Amber</option>
              <option value="rose">Rose</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Cadence</label>
            <Select value={form.cadence} onChange={(e) => set('cadence', e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Target /wk</label>
            <Input type="number" min="1" max="7" value={form.target} onChange={(e) => set('target', e.target.value)} />
          </div>
        </div>
      </form>
    </Modal>
  )
}
