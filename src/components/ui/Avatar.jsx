import { cn } from '@/lib/utils'

export default function Avatar({ name = '', src, size = 36, className }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size }} className={cn('rounded-full object-cover', className)} />
  ) : (
    <div
      style={{ width: size, height: size }}
      className={cn('rounded-full bg-primary-500/15 text-primary-600 dark:text-primary-300 flex items-center justify-center text-sm font-semibold', className)}
    >
      {initials || '?'}
    </div>
  )
}
