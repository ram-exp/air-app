import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckSquare, Clock, Flame, Target, Plus, ArrowRight, CalendarDays, FolderKanban,
} from 'lucide-react'
import { useCollection } from '@/hooks/useCollection'
import { Card, Badge, Progress, Skeleton, Button } from '@/components/ui'
import { formatDate, isSameDay, daysUntil, PRIORITY_ORDER } from '@/lib/utils'
import { weeklyFocusMinutes, tasksCompletedTrend, habitStreak } from '@/lib/stats'
import WeeklyFocusChart from '@/components/charts/WeeklyFocusChart'
import TasksTrendChart from '@/components/charts/TasksTrendChart'

const priorityTone = { urgent: 'rose', high: 'amber', medium: 'primary', low: 'default' }

export default function Dashboard() {
  const navigate = useNavigate()
  const { items: tasks, isLoading: loadingTasks } = useCollection('tasks')
  const { items: events } = useCollection('events')
  const { items: projects } = useCollection('projects')
  const { items: habits } = useCollection('habits')
  const { items: pomodoros } = useCollection('pomodoros')
  const { items: goals } = useCollection('goals')

  const todayTasks = useMemo(
    () => tasks.filter((t) => !t.archived && t.status !== 'done' && t.dueDate && isSameDay(t.dueDate, new Date()))
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
    [tasks]
  )
  const completedToday = tasks.filter((t) => t.status === 'done' && t.updatedAt && isSameDay(t.updatedAt, new Date())).length
  const upcomingEvents = useMemo(
    () => [...events].filter((e) => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)))
      .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5),
    [events]
  )
  const activeProjects = projects.filter((p) => p.status === 'active').slice(0, 4)

  const focusMinutesToday = pomodoros
    .filter((p) => p.type === 'focus' && isSameDay(p.completedAt, new Date()))
    .reduce((s, p) => s + p.minutes, 0)

  const bestStreak = habits.reduce((max, h) => Math.max(max, habitStreak(h.history)), 0)
  const goalsOnTrack = goals.filter((g) => g.status === 'active').length

  const focusData = weeklyFocusMinutes(pomodoros)
  const tasksTrend = tasksCompletedTrend(tasks)

  const stats = [
    { label: 'Tasks completed today', value: completedToday, icon: CheckSquare, iconBg: 'bg-primary-500/15', iconColor: 'text-primary-500' },
    { label: 'Focus time today', value: `${focusMinutesToday}m`, icon: Clock, iconBg: 'bg-teal-500/15', iconColor: 'text-teal-500' },
    { label: 'Best habit streak', value: `${bestStreak}d`, icon: Flame, iconBg: 'bg-amber-500/15', iconColor: 'text-amber-500' },
    { label: 'Goals in progress', value: goalsOnTrack, icon: Target, iconBg: 'bg-rose-500/15', iconColor: 'text-rose-500' },
  ]

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 5) return 'Burning the midnight oil'
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-light dark:text-muted-dark mb-1">{formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{greeting}.</h1>
        </div>
        <Link to="/tasks"><Button size="sm"><Plus size={16} /> Quick add task</Button></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-${s.tone}-500/15`}>
              <s.icon size={18} className={`text-${s.tone}-500`} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold leading-tight">{s.value}</p>
              <p className="text-xs text-muted-light dark:text-muted-dark truncate">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">Today's tasks</h2>
            <Link to="/tasks" className="text-sm text-primary-500 flex items-center gap-1 hover:gap-1.5 transition-all">View all <ArrowRight size={14} /></Link>
          </div>
          {loadingTasks ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : todayTasks.length === 0 ? (
            <p className="text-sm text-muted-light dark:text-muted-dark py-8 text-center">Nothing due today — enjoy the clear runway.</p>
          ) : (
            <ul className="space-y-1.5">
              {todayTasks.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: t.priority === 'urgent' ? '#F4506A' : t.priority === 'high' ? '#F7A331' : t.priority === 'medium' ? '#5A4FFF' : '#8d919e' }} />
                  <span className="flex-1 text-sm truncate">{t.title}</span>
                  {t.tags?.[0] && <Badge tone="default">{t.tags[0]}</Badge>}
                  <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">Upcoming events</h2>
            <Link to="/calendar" className="text-sm text-primary-500"><CalendarDays size={16} /></Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-light dark:text-muted-dark py-8 text-center">No events on the horizon.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/calendar', { state: { date: e.date, view: 'day' } })}
                    className="w-12 shrink-0 text-center rounded-lg py-0.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <p className="text-[11px] uppercase text-muted-light dark:text-muted-dark font-medium">{formatDate(e.date, { month: 'short' })}</p>
                    <p className="font-display font-semibold text-lg leading-none">{formatDate(e.date, { day: 'numeric' })}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/calendar', { state: { date: e.date, view: 'day', eventId: e.id } })}
                    className="min-w-0 flex-1 text-left rounded-lg px-1 -mx-1 py-0.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-muted-light dark:text-muted-dark">{formatDate(e.date, { hour: 'numeric', minute: '2-digit' })}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-semibold">Active projects</h2>
            <Link to="/projects" className="text-sm text-primary-500 flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>
          {activeProjects.length === 0 ? (
            <p className="text-sm text-muted-light dark:text-muted-dark py-8 text-center">No active projects yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {activeProjects.map((p) => {
                const dleft = daysUntil(p.deadline)
                return (
                  <Link to={`/projects/${p.id}`} key={p.id} className="rounded-xl p-4 bg-black/[0.025] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] transition-colors block">
                    <div className="flex items-center gap-2 mb-2">
                      <FolderKanban size={15} className="text-primary-500" />
                      <p className="text-sm font-medium truncate flex-1">{p.name}</p>
                    </div>
                    <Progress value={p.progress} className="mb-2" />
                    <div className="flex justify-between text-xs text-muted-light dark:text-muted-dark">
                      <span>{p.progress}% complete</span>
                      {dleft !== null && <span>{dleft >= 0 ? `${dleft}d left` : 'overdue'}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-display font-semibold mb-3">Habit progress</h2>
          <div className="space-y-3">
            {habits.slice(0, 4).map((h) => {
              const streak = habitStreak(h.history)
              return (
                <div key={h.id} className="flex items-center gap-3">
                  <span className="text-lg">{h.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{h.name}</p>
                  </div>
                  <Badge tone="amber">{streak}d</Badge>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-display font-semibold mb-1">Pomodoro summary</h2>
          <p className="text-xs text-muted-light dark:text-muted-dark mb-2">Focus minutes, last 7 days</p>
          <WeeklyFocusChart data={focusData} />
        </Card>
        <Card>
          <h2 className="font-display font-semibold mb-1">Productivity trend</h2>
          <p className="text-xs text-muted-light dark:text-muted-dark mb-2">Tasks completed, last 7 days</p>
          <TasksTrendChart data={tasksTrend} />
        </Card>
      </div>
    </div>
  )
}
