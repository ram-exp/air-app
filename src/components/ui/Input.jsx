import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full h-10 rounded-xl px-3.5 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-transparent',
        'placeholder:text-muted-light dark:placeholder:text-muted-dark',
        'focus:bg-white dark:focus:bg-surface-dark focus:border-primary-500/50 outline-none transition-colors',
        className
      )}
      {...props}
    />
  )
})
export default Input
