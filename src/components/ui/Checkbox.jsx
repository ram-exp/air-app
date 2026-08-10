import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Checkbox({ checked, onChange, className }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-colors',
        checked ? 'bg-primary-500 border-primary-500' : 'border-border-light dark:border-border-dark bg-transparent',
        className
      )}
    >
      {checked && <Check size={13} strokeWidth={3} className="text-white" />}
    </button>
  )
}
