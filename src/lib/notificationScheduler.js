import { dataService } from './dataService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { isSameDay, formatDate } from './utils'

const CHECK_INTERVAL = 30 * 1000 // 30s
const EVENT_LEAD_MINUTES = 15

let intervalId = null

async function checkEvents() {
  const { preferences, push } = useNotificationStore.getState()
  if (!preferences.events) return
  const events = await dataService.getAll('events')
  const now = new Date()
  events.forEach((e) => {
    if (!e.reminder) return
    const eventTime = new Date(e.date)
    const diffMinutes = (eventTime - now) / 60000
    if (diffMinutes <= EVENT_LEAD_MINUTES && diffMinutes > -2) {
      push({
        key: `event:${e.id}:${e.date}`,
        type: 'event',
        title: diffMinutes > 1 ? `Upcoming: ${e.title}` : `Starting now: ${e.title}`,
        body: `${formatDate(e.date, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`,
      })
    }
  })
}

async function checkTasksDueToday() {
  const { preferences, push } = useNotificationStore.getState()
  if (!preferences.tasks) return
  const todayKey = new Date().toISOString().slice(0, 10)
  const tasks = await dataService.getAll('tasks')
  const dueToday = tasks.filter((t) => !t.archived && t.status !== 'done' && t.dueDate && isSameDay(t.dueDate, new Date()))
  if (dueToday.length === 0) return
  push({
    key: `tasks-digest:${todayKey}`,
    type: 'task',
    title: `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} due today`,
    body: dueToday.slice(0, 3).map((t) => t.title).join(', '),
  })
}

async function checkHabitsEvening() {
  const { preferences, push } = useNotificationStore.getState()
  if (!preferences.habits) return
  const hour = new Date().getHours()
  if (hour < 20) return
  const todayKey = new Date().toISOString().slice(0, 10)
  const habits = await dataService.getAll('habits')
  const pending = habits.filter((h) => h.cadence === 'daily' && !h.history?.[todayKey])
  if (pending.length === 0) return
  push({
    key: `habits-nudge:${todayKey}`,
    type: 'habit',
    title: `${pending.length} habit${pending.length > 1 ? 's' : ''} left today`,
    body: pending.slice(0, 3).map((h) => h.name).join(', '),
  })
}

async function runChecks() {
  await Promise.all([checkEvents(), checkTasksDueToday(), checkHabitsEvening()])
}

export function startNotificationScheduler() {
  if (intervalId) return
  runChecks()
  intervalId = setInterval(runChecks, CHECK_INTERVAL)
}

export function stopNotificationScheduler() {
  if (intervalId) clearInterval(intervalId)
  intervalId = null
}
