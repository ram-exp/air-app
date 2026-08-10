import { cn } from '@/lib/utils'

export default function Card({ className, children, glass = true, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5',
        glass ? 'glass' : 'glass-solid',
        hover && 'transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
