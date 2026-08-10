import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export default function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(
          'w-full h-10 rounded-xl pl-3.5 pr-8 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-transparent',
          'focus:bg-white dark:focus:bg-surface-dark focus:border-primary-500/50 outline-none appearance-none transition-colors',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-50" />
    </div>
  )
}
