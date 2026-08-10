import { cn } from '@/lib/utils'

const toneMap = {
  primary: 'bg-primary-500',
  teal: 'bg-teal-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
}

export default function Progress({ value = 0, tone = 'primary', className }) {
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', toneMap[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
