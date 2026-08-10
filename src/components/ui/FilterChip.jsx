import { cn } from '@/lib/utils'

export default function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-8 px-3 rounded-full text-sm font-medium border transition-colors whitespace-nowrap',
        active
          ? 'bg-primary-500 border-primary-500 text-white'
          : 'border-border-light dark:border-border-dark hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
      )}
    >
      {children}
    </button>
  )
}
