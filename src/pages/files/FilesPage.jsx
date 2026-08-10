import { useEffect, useMemo, useRef, useState } from 'react'
import { Upload, FileText, Image as ImageIcon, File as FileIcon, Trash2, FolderOpen, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCollection } from '@/hooks/useCollection'
import { PageHeader, Button, Card, EmptyState, Skeleton } from '@/components/ui'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { saveBlob, deleteBlob, getObjectUrl } from '@/lib/localFileStore'
import { formatDate, cn } from '@/lib/utils'

const TYPE_ICON = { image: ImageIcon, doc: FileText, pdf: FileText }
const MAX_LOCAL_BYTES = 25 * 1024 * 1024 // 25MB per file when stored locally (IndexedDB)

function humanSize(bytes) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0, n = bytes
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

function typeFor(name) {
  const ext = name.split('.').pop()?.toLowerCase()
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext) ? 'image' : ext === 'pdf' ? 'pdf' : 'doc'
}

// Renders a thumbnail for locally-stored images by pulling the blob out of
// IndexedDB and turning it into an object URL.
function FileThumb({ file }) {
  const [url, setUrl] = useState(file.url || null)

  useEffect(() => {
    let cancelled = false
    if (!file.url && file.localKey) {
      getObjectUrl(file.localKey).then((u) => { if (!cancelled) setUrl(u) })
    }
    return () => { cancelled = true }
  }, [file.url, file.localKey])

  if (file.type === 'image' && url) {
    return <img src={url} alt={file.name} className="h-10 w-10 rounded-xl object-cover shrink-0" />
  }
  const Icon = TYPE_ICON[file.type] || FileIcon
  return (
    <div className="h-10 w-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
      <Icon size={17} className="text-primary-500" />
    </div>
  )
}

function FileLink({ file, children, className }) {
  const [url, setUrl] = useState(file.url || null)
  useEffect(() => {
    let cancelled = false
    if (!file.url && file.localKey) {
      getObjectUrl(file.localKey).then((u) => { if (!cancelled) setUrl(u) })
    }
    return () => { cancelled = true }
  }, [file.url, file.localKey])
  if (!url) return <p className={className}>{children}</p>
  return <a href={url} download={file.name} target="_blank" rel="noreferrer" className={className}>{children}</a>
}

export default function FilesPage() {
  const { items, isLoading, createItem, removeItem } = useCollection('files')
  const inputRef = useRef()
  const [folder] = useState('General')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const dragCounter = useRef(0)

  const grouped = useMemo(() => {
    const g = {}
    items.forEach((f) => { g[f.folder || 'General'] = [...(g[f.folder || 'General'] || []), f] })
    return g
  }, [items])

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || [])
    if (files.length === 0) return
    setUploading(true)
    let added = 0
    for (const file of files) {
      const type = typeFor(file.name)
      let url = null
      let localKey = null

      if (isSupabaseConfigured && supabase) {
        try {
          const uid = useAuthStore.getState().user?.uid || 'guest'
          // Scoped under the signed-in user's own folder — matches the
          // storage.objects policies in supabase.sql, so a user can only
          // write inside their own {uid}/... prefix.
          const path = `${uid}/files/${Date.now()}_${file.name}`
          const { error } = await supabase.storage.from('uploads').upload(path, file)
          if (error) throw error
          url = supabase.storage.from('uploads').getPublicUrl(path).data.publicUrl
        } catch {
          toast.error(`Gagal upload "${file.name}" ke Supabase Storage`)
          continue
        }
      } else {
        // Local mode: actually persist the file bytes in IndexedDB so it
        // can be previewed/downloaded later, instead of just saving a name.
        if (file.size > MAX_LOCAL_BYTES) {
          toast.error(`"${file.name}" terlalu besar untuk mode lokal (maks ${humanSize(MAX_LOCAL_BYTES)})`)
          continue
        }
        localKey = `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        try {
          await saveBlob(localKey, file)
        } catch {
          toast.error(`Gagal menyimpan "${file.name}" secara lokal`)
          continue
        }
      }

      await createItem({ name: file.name, type, size: file.size, folder, url, localKey })
      added++
    }
    setUploading(false)
    if (added > 0) toast.success(`${added} file${added > 1 ? 's' : ''} ditambahkan`)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onPick = (e) => handleFiles(e.target.files)

  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0
    handleFiles(e.dataTransfer.files)
  }

  const onDragEnter = (e) => {
    e.preventDefault()
    dragCounter.current += 1
    setIsDragging(true)
  }
  const onDragLeave = (e) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) setIsDragging(false)
  }
  const onDragOver = (e) => e.preventDefault()

  const del = async (f) => {
    if (!confirm(`Delete "${f.name}"?`)) return
    if (f.localKey) await deleteBlob(f.localKey)
    await removeItem(f.id)
    toast.success('File removed')
  }

  return (
    <div
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      className="relative"
    >
      <PageHeader
        title="Files"
        description={isSupabaseConfigured ? 'Uploaded to Supabase Storage.' : 'Local mode — files are stored in your browser (IndexedDB). Connect Supabase Storage to sync across devices.'}
        actions={<>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={onPick} />
          <Button onClick={() => inputRef.current?.click()} loading={uploading}><Upload size={16} /> Upload</Button>
        </>}
      />

      {/* Drag & drop overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-primary-500/10 backdrop-blur-sm pointer-events-none">
          <div className="rounded-3xl border-2 border-dashed border-primary-500 bg-white dark:bg-neutral-900 px-10 py-8 flex flex-col items-center gap-2 shadow-2xl">
            <Upload size={28} className="text-primary-500" />
            <p className="font-display font-semibold">Drop files to upload</p>
            <p className="text-xs text-muted-light dark:text-muted-dark">Images and documents supported</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No files yet" description="Upload documents and images to keep them organized, or drag & drop them anywhere on this page." actionLabel="Upload" onAction={() => inputRef.current?.click()} />
      ) : (
        Object.entries(grouped).map(([folderName, files]) => (
          <div key={folderName} className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-light dark:text-muted-dark mb-2">{folderName}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map((f) => (
                <Card key={f.id} hover className="flex items-center gap-3 group">
                  <FileThumb file={f} />
                  <div className="flex-1 min-w-0">
                    <FileLink file={f} className="text-sm font-medium truncate block hover:text-primary-500">{f.name}</FileLink>
                    <p className="text-xs text-muted-light dark:text-muted-dark">{humanSize(f.size)} · {formatDate(f.createdAt)}</p>
                  </div>
                  <div className={cn('flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0')}>
                    {(f.url || f.localKey) && (
                      <FileLink file={f} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 hover:text-primary-500">
                        <Download size={14} />
                      </FileLink>
                    )}
                    <button onClick={() => del(f)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 hover:text-rose-500"><Trash2 size={14} /></button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
