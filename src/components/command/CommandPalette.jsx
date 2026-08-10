import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, CheckSquare, FolderKanban, StickyNote, Target, Flame, Library } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { dataService } from '@/lib/dataService'

const ICONS = { tasks: CheckSquare, projects: FolderKanban, notes: StickyNote, goals: Target, habits: Flame, library: Library }

export default function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUIStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen(!commandOpen)
      }
      if (e.key === 'Escape') setCommandOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [commandOpen, setCommandOpen])

  useEffect(() => {
    if (!commandOpen) { setQuery(''); setResults([]); return }
    let active = true
    async function run() {
      const collections = ['tasks', 'projects', 'notes', 'goals', 'habits', 'library']
      const all = await Promise.all(collections.map(async (c) => {
        const items = await dataService.getAll(c)
        return items.map((i) => ({ ...i, __collection: c }))
      }))
      if (active) setResults(all.flat())
    }
    run()
    return () => { active = false }
  }, [commandOpen])

  const filtered = useMemo(() => {
    if (!query.trim()) return results.slice(0, 8)
    const q = query.toLowerCase()
    return results.filter((r) => (r.title || r.name || '').toLowerCase().includes(q)).slice(0, 12)
  }, [query, results])

  if (!commandOpen) return null

  const go = (collection) => {
    setCommandOpen(false)
    navigate(`/${collection === 'library' ? 'library' : collection}`)
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setCommandOpen(false)} />
      <div className="relative w-full max-w-xl glass-solid rounded-2xl shadow-2xl animate-pop overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border-light dark:border-border-dark">
          <Search size={18} className="text-muted-light dark:text-muted-dark" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, notes, goals..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="text-sm text-center text-muted-light dark:text-muted-dark py-8">No results found</p>
          )}
          {filtered.map((r) => {
            const Icon = ICONS[r.__collection] || Search
            return (
              <button
                key={r.id}
                onClick={() => go(r.__collection)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-left"
              >
                <Icon size={16} className="text-primary-500 shrink-0" />
                <span className="flex-1 text-sm truncate">{r.title || r.name}</span>
                <span className="text-xs text-muted-light dark:text-muted-dark capitalize">{r.__collection}</span>
                <ArrowRight size={13} className="opacity-40" />
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}
