import { useEffect, useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { Modal, Button, Input, Select } from '@/components/ui'

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatEntryDate(iso) {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const empty = { title: '', date: '', end: '', category: 'work', reminder: false }

// Doubles as both the create/edit form AND the event's detail view — once an
// event exists, a Notes & Journal section appears below the fields so you
// can jot reflections/updates tied to that specific event over time.
export default function EventFormModal({ open, onClose, onSubmit, initial, defaultDate, onAddJournalEntry, onDeleteJournalEntry }) {
  const [form, setForm] = useState(empty)
  const [journalDraft, setJournalDraft] = useState('')

  useEffect(() => {
    if (initial) setForm({ ...initial, date: toLocalInput(initial.date), end: toLocalInput(initial.end) })
    else setForm({ ...empty, date: defaultDate ? toLocalInput(defaultDate) : '' })
    setJournalDraft('')
  }, [initial, open, defaultDate])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return
    onSubmit({ ...form, date: new Date(form.date).toISOString(), end: form.end ? new Date(form.end).toISOString() : null })
  }

  const addEntry = () => {
    const text = journalDraft.trim()
    if (!text || !initial?.id) return
    onAddJournalEntry?.(initial.id, text)
    setJournalDraft('')
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit event' : 'New event'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>{initial ? 'Save' : 'Create event'}</Button></>}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Title</label>
          <Input autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Starts</label>
            <Input type="datetime-local" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Ends</label>
            <Input type="datetime-local" value={form.end} onChange={(e) => set('end', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Category</label>
          <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="health">Health</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.reminder} onChange={(e) => set('reminder', e.target.checked)} className="h-4 w-4 rounded accent-primary-500" />
          Set a reminder
        </label>
      </form>

      <div className="mt-5 pt-4 border-t border-border-light dark:border-border-dark">
        <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-2 flex items-center gap-1.5">
          <BookOpen size={13} /> Notes & Journal
        </label>

        {!initial?.id ? (
          <p className="text-xs text-muted-light dark:text-muted-dark">Simpan event ini dulu untuk mulai menulis notes/journal.</p>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <textarea
                value={journalDraft}
                onChange={(e) => setJournalDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addEntry() } }}
                placeholder="Tulis catatan atau refleksi soal event ini..."
                rows={2}
                className="flex-1 rounded-xl border border-border-light dark:border-border-dark bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              />
              <Button type="button" size="sm" onClick={addEntry} disabled={!journalDraft.trim()}>Tambah</Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(form.journal || []).length === 0 && (
                <p className="text-xs text-muted-light dark:text-muted-dark">Belum ada catatan untuk event ini.</p>
              )}
              {(form.journal || []).map((j) => (
                <div key={j.id} className="p-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="whitespace-pre-wrap flex-1">{j.text}</p>
                    <button
                      type="button"
                      onClick={() => onDeleteJournalEntry?.(initial.id, j.id)}
                      className="text-muted-light dark:text-muted-dark hover:text-rose-500 shrink-0"
                      title="Hapus catatan"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-light dark:text-muted-dark mt-1">{formatEntryDate(j.createdAt)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
