import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal, Button, Input, Textarea, Select } from '@/components/ui'
import { storeImage } from '@/lib/image'

const empty = { type: 'book', title: '', creator: '', tags: '', rating: 4, status: 'in_progress', favorite: false, review: '', cover: '' }

export default function LibraryFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(empty)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    if (initial) setForm({ ...initial, tags: (initial.tags || []).join(', ') })
    else setForm(empty)
  }, [initial, open])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const onPickCover = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await storeImage(file, 'library-covers')
      set('cover', url)
    } catch {
      toast.error('Gagal memuat gambar')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit({ ...form, rating: Number(form.rating), tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) })
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit item' : 'Add to library'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>{initial ? 'Save' : 'Add'}</Button></>}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Cover / poster</label>
          <div className="flex items-start gap-3">
            <div className="relative h-28 w-20 shrink-0 rounded-xl overflow-hidden bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
              {uploading ? (
                <Loader2 size={18} className="animate-spin text-muted-light dark:text-muted-dark" />
              ) : form.cover ? (
                <>
                  <img src={form.cover} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => set('cover', '')} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                    <X size={11} />
                  </button>
                </>
              ) : (
                <ImagePlus size={20} className="text-muted-light dark:text-muted-dark" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickCover} />
              <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                <ImagePlus size={14} /> Upload image
              </Button>
              <Input
                placeholder="or paste an image URL..."
                value={form.cover?.startsWith('data:') ? '' : form.cover}
                onChange={(e) => set('cover', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Type</label>
            <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="book">Book</option><option value="movie">Movie</option><option value="game">Game</option><option value="music">Music</option><option value="course">Course</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Status</label>
            <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="dropped">Dropped</option>
            </Select>
          </div>
        </div>
        <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Title</label><Input autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} required /></div>
        <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Creator / Author / Studio</label><Input value={form.creator} onChange={(e) => set('creator', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Rating (1-5)</label><Input type="number" min="1" max="5" value={form.rating} onChange={(e) => set('rating', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Tags</label><Input value={form.tags} onChange={(e) => set('tags', e.target.value)} /></div>
        </div>
        <div><label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Review / notes</label><Textarea rows={3} value={form.review} onChange={(e) => set('review', e.target.value)} /></div>
      </form>
    </Modal>
  )
}
