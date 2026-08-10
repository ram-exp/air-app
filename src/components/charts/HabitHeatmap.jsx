import { cn } from '@/lib/utils'

const colorMap = {
  primary: 'bg-primary-500',
  teal: 'bg-teal-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
}

export default function HabitHeatmap({ history = {}, color = 'primary', weeks = 12 }) {
  const days = []
  const today = new Date()
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1 w-max" style={{ gridAutoColumns: 'min-content' }}>
      {days.map((d) => {
        const key = d.toISOString().slice(0, 10)
        const done = history[key]
        return (
          <div
            key={key}
            title={`${d.toDateString()}${done ? ' — done' : ''}`}
            className={cn('h-2.5 w-2.5 rounded-[3px]', done ? colorMap[color] : 'bg-black/[0.06] dark:bg-white/[0.08]')}
          />
        )
      })}
    </div>
  )
}
