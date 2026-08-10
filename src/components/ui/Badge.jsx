import { cn } from '@/lib/utils'

const tones = {
  default: 'bg-black/[0.05] dark:bg-white/[0.08] text-inherit',
  primary: 'bg-primary-500/15 text-primary-600 dark:text-primary-300',
  amber: 'bg-amber-400/15 text-amber-500',
  teal: 'bg-teal-400/15 text-teal-500',
  rose: 'bg-rose-400/15 text-rose-500',
}

export default function Badge({ tone = 'default', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  )
}
