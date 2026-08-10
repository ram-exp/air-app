import { dataService } from './dataService'
import { habitStreak } from './stats'
import { isSameDay } from './utils'

// PERFORMANCE: buildContextSummary fans out 9 parallel reads to the data
// backend (Firestore/Supabase/local) on every single call. Re-running that
// on every chat message adds real, avoidable latency to each reply — so the
// result is cached for a short window and reused for back-to-back messages
// in the same conversation. Pass { force: true } to bypass the cache (e.g.
// after the user just edited their tasks/habits/etc and wants the assistant
// to see the change immediately).
const CONTEXT_CACHE_TTL_MS = 20000
let contextCache = { summary: null, at: 0 }

// Builds a compact, privacy-conscious snapshot of the user's current data so
// the assistant can give grounded, personalized advice instead of generic
// answers. Only summaries/counts and titles are included — not full note
// content or journal entries.
export async function buildContextSummary({ force = false } = {}) {
  if (!force && contextCache.summary && Date.now() - contextCache.at < CONTEXT_CACHE_TTL_MS) {
    return contextCache.summary
  }

  const [tasks, projects, habits, goals, events, notes, brainstorm, library, bookmarks] = await Promise.all([
    dataService.getAll('tasks'),
    dataService.getAll('projects'),
    dataService.getAll('habits'),
    dataService.getAll('goals'),
    dataService.getAll('events'),
    dataService.getAll('notes'),
    dataService.getAll('brainstorm'),
    dataService.getAll('library'),
    dataService.getAll('bookmarks'),
  ])

  const todayTasks = tasks.filter((t) => !t.archived && t.status !== 'done' && t.dueDate && isSameDay(t.dueDate, new Date()))
  const overdueTasks = tasks.filter((t) => !t.archived && t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)))
  const activeProjects = projects.filter((p) => p.status === 'active')
  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5)

  const lines = [
    `Hari ini: ${new Date().toDateString()}.`,
    `Task jatuh tempo hari ini (${todayTasks.length}): ${todayTasks.map((t) => `${t.title} [${t.priority}]`).join('; ') || '-'}.`,
    `Task overdue (${overdueTasks.length}): ${overdueTasks.map((t) => t.title).join('; ') || '-'}.`,
    `Project aktif (${activeProjects.length}): ${activeProjects.map((p) => `${p.name} (${p.progress}%)`).join('; ') || '-'}.`,
    `Habit & streak saat ini: ${habits.map((h) => `${h.name}=${habitStreak(h.history)}d`).join('; ') || '-'}.`,
    `Goals aktif: ${goals.filter((g) => g.status === 'active').map((g) => `${g.title} (${g.progress}%)`).join('; ') || '-'}.`,
    `Acara mendatang: ${upcomingEvents.map((e) => `${e.title} @ ${new Date(e.date).toLocaleString()}`).join('; ') || '-'}.`,
    `Jumlah catatan tersimpan: ${notes.length} (${notes.filter((n) => n.pinned).length} disematkan). Judul terbaru: ${notes.slice(0, 5).map((n) => n.title).join('; ') || '-'}.`,
    `Ide brainstorm (${brainstorm.length}): ${brainstorm.slice(0, 5).map((b) => `${b.title} [${b.status}]`).join('; ') || '-'}.`,
    `Item Library (${library.length}): ${library.slice(0, 5).map((l) => `${l.title} (${l.type}, ${l.status})`).join('; ') || '-'}.`,
    `Bookmark tersimpan (${bookmarks.length}): ${bookmarks.slice(0, 5).map((b) => b.title).join('; ') || '-'}.`,
  ]
  const summary = lines.join('\n')
  contextCache = { summary, at: Date.now() }
  return summary
}
