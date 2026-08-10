import { cn } from '@/lib/utils'

export default function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={cn('inline-flex gap-1 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.05]', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'px-3.5 h-8 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
            active === t.value ? 'bg-white dark:bg-surface-dark shadow-sm' : 'text-muted-light dark:text-muted-dark hover:text-inherit'
          )}
        >
          {t.icon && <t.icon size={14} />}
          {t.label}
        </button>
      ))}
    </div>
  )
}
