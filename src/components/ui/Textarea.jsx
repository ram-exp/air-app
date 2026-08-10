import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-xl px-3.5 py-2.5 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-transparent',
        'placeholder:text-muted-light dark:placeholder:text-muted-dark',
        'focus:bg-white dark:focus:bg-surface-dark focus:border-primary-500/50 outline-none transition-colors resize-none',
        className
      )}
      {...props}
    />
  )
})
export default Textarea
