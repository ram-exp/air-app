import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, FileText, Image as ImageIcon, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCollection } from '@/hooks/useCollection'
import { Card, Badge, Progress, Button, Textarea, Skeleton } from '@/components/ui'
import ProjectFormModal from './ProjectFormModal'
import { formatDate, daysUntil, uid } from '@/lib/utils'

const statusTone = { active: 'primary', on_hold: 'amber', completed: 'teal' }

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { items, isLoading, updateItem, removeItem } = useCollection('projects')
  const [modalOpen, setModalOpen] = useState(false)
  const [fileName, setFileName] = useState('')

  const project = items.find((p) => p.id === id)

  if (isLoading) return <Skeleton className="h-64" />
  if (!project) return (
    <div className="text-center py-16">
      <p className="text-muted-light dark:text-muted-dark mb-4">Project not found.</p>
      <Link to="/projects"><Button size="sm">Back to projects</Button></Link>
    </div>
  )

  const dleft = daysUntil(project.deadline)

  const save = async (data) => { await updateItem(project.id, data); toast.success('Project updated'); setModalOpen(false) }
  const del = async () => { if (confirm(`Delete "${project.name}"?`)) { await removeItem(project.id); toast.success('Project deleted'); navigate('/projects') } }
  const saveNotes = (notes) => updateItem(project.id, { notes })

  const addFile = () => {
    if (!fileName.trim()) return
    const ext = fileName.split('.').pop()?.toLowerCase()
    const type = ['png','jpg','jpeg','gif','webp'].includes(ext) ? 'image' : 'doc'
    updateItem(project.id, { files: [...(project.files || []), { id: uid(), name: fileName, type }] })
    setFileName('')
  }
  const removeFile = (fid) => updateItem(project.id, { files: (project.files || []).filter((f) => f.id !== fid) })

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/projects')} className="flex items-center gap-1.5 text-sm text-muted-light dark:text-muted-dark hover:text-inherit">
        <ArrowLeft size={15} /> Back to projects
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-display text-2xl font-semibold">{project.name}</h1>
            <Badge tone={statusTone[project.status]}>{project.status.replace('_', ' ')}</Badge>
          </div>
          <p className="text-sm text-muted-light dark:text-muted-dark max-w-xl">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}><Pencil size={14} /> Edit</Button>
          <Button variant="danger" size="sm" onClick={del}><Trash2 size={14} /> Delete</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">Progress</span>
              <span className="text-muted-light dark:text-muted-dark">{project.progress}%</span>
            </div>
            <Progress value={project.progress} tone={project.status === 'completed' ? 'teal' : 'primary'} className="h-2.5" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-muted-light dark:text-muted-dark mb-0.5">Deadline</p><p className="font-medium">{project.deadline ? formatDate(project.deadline, { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</p></div>
            <div><p className="text-xs text-muted-light dark:text-muted-dark mb-0.5">Time left</p><p className="font-medium">{dleft !== null ? (dleft >= 0 ? `${dleft} days` : 'Overdue') : '—'}</p></div>
          </div>
          {project.tags?.length > 0 && <div className="flex flex-wrap gap-1.5">{project.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>}
        </Card>

        <Card>
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><FileText size={16} /> Files</h3>
          <div className="flex gap-2 mb-3">
            <input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="filename.pdf" className="flex-1 h-9 rounded-lg px-3 text-sm bg-black/[0.03] dark:bg-white/[0.05] outline-none" />
            <Button size="icon" onClick={addFile}><Plus size={15} /></Button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {(project.files || []).length === 0 && <p className="text-xs text-muted-light dark:text-muted-dark">No files attached yet.</p>}
            {(project.files || []).map((f) => (
              <div key={f.id} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05]">
                {f.type === 'image' ? <ImageIcon size={14} /> : <FileText size={14} />}
                <span className="flex-1 truncate">{f.name}</span>
                <button onClick={() => removeFile(f.id)}><X size={13} className="text-muted-light dark:text-muted-dark hover:text-rose-500" /></button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-display font-semibold mb-3">Notes</h3>
        <Textarea rows={6} defaultValue={project.notes} onBlur={(e) => saveNotes(e.target.value)} placeholder="Project notes, decisions, links..." />
      </Card>

      <ProjectFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={save} initial={project} />
    </div>
  )
}
