import { cn } from '@/lib/utils'

export default function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-xl bg-black/[0.06] dark:bg-white/[0.08]', className)} />
}
