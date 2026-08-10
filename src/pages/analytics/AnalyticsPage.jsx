import { useMemo } from 'react'
import { CheckSquare, Clock, Flame, Target } from 'lucide-react'
import { useCollection } from '@/hooks/useCollection'
import { PageHeader, Card } from '@/components/ui'
import { weeklyFocusMinutes, tasksCompletedTrend, habitStreak } from '@/lib/stats'
import WeeklyFocusChart from '@/components/charts/WeeklyFocusChart'
import TasksTrendChart from '@/components/charts/TasksTrendChart'
import GoalsBarChart from '@/components/charts/GoalsBarChart'
import HabitStreakChart from '@/components/charts/HabitStreakChart'

export default function AnalyticsPage() {
  const { items: tasks } = useCollection('tasks')
  const { items: pomodoros } = useCollection('pomodoros')
  const { items: habits } = useCollection('habits')
  const { items: goals } = useCollection('goals')

  const focusData = weeklyFocusMinutes(pomodoros)
  const tasksTrend = tasksCompletedTrend(tasks)
  const totalFocusMinutes = pomodoros.filter((p) => p.type === 'focus').reduce((s, p) => s + p.minutes, 0)
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const habitData = useMemo(() => habits.map((h) => ({ name: h.name, streak: habitStreak(h.history), color: h.color })), [habits])
  const goalData = useMemo(() => goals.map((g) => ({ title: g.title, progress: g.progress })), [goals])

  const summary = [
    { label: 'Total tasks completed', value: completedTasks, icon: CheckSquare, bg: 'bg-primary-500/15', color: 'text-primary-500' },
    { label: 'Total focus minutes', value: totalFocusMinutes, icon: Clock, bg: 'bg-teal-500/15', color: 'text-teal-500' },
    { label: 'Longest active streak', value: `${Math.max(0, ...habitData.map((h) => h.streak))}d`, icon: Flame, bg: 'bg-amber-500/15', color: 'text-amber-500' },
    { label: 'Goals tracked', value: goals.length, icon: Target, bg: 'bg-rose-500/15', color: 'text-rose-500' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Analytics" description="Your productivity, quantified." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((s) => (
          <Card key={s.label} className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}><s.icon size={18} className={s.color} /></div>
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold leading-tight">{s.value}</p>
              <p className="text-xs text-muted-light dark:text-muted-dark truncate">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card><h3 className="font-display font-semibold mb-1">Focus time</h3><p className="text-xs text-muted-light dark:text-muted-dark mb-2">Last 7 days</p><WeeklyFocusChart data={focusData} /></Card>
        <Card><h3 className="font-display font-semibold mb-1">Tasks completed</h3><p className="text-xs text-muted-light dark:text-muted-dark mb-2">Last 7 days</p><TasksTrendChart data={tasksTrend} /></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card><h3 className="font-display font-semibold mb-1">Habit streaks</h3><p className="text-xs text-muted-light dark:text-muted-dark mb-2">Current streak per habit</p>{habitData.length ? <HabitStreakChart data={habitData} /> : <p className="text-sm text-muted-light dark:text-muted-dark py-10 text-center">No habits yet.</p>}</Card>
        <Card><h3 className="font-display font-semibold mb-1">Goal progress</h3><p className="text-xs text-muted-light dark:text-muted-dark mb-2">Completion by goal</p>{goalData.length ? <GoalsBarChart data={goalData} /> : <p className="text-sm text-muted-light dark:text-muted-dark py-10 text-center">No goals yet.</p>}</Card>
      </div>
    </div>
  )
}
