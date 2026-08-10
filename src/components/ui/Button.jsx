import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'text-white shadow-sm shadow-primary-500/30 bg-primary-500 [background-image:var(--accent-gradient)] hover:brightness-105',
  secondary: 'glass-solid hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-inherit',
  ghost: 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-inherit',
  danger: 'bg-rose-500 text-white hover:opacity-90',
  outline: 'border border-border-light dark:border-border-dark hover:bg-black/[0.03] dark:hover:bg-white/[0.05]',
}

const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-9 w-9 p-0 justify-center',
}

export default function Button({
  variant = 'primary', size = 'md', className, children, loading, disabled, ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center rounded-xl font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none',
        variants[variant], sizes[size], className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={16} />}
      {children}
    </button>
  )
}
