import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AccordionItem({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border-light dark:border-border-dark last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 py-3.5 text-left"
      >
        {Icon && <Icon size={16} className="text-primary-500 shrink-0" />}
        <span className="flex-1 text-sm font-medium">{title}</span>
        <ChevronDown size={15} className={cn('shrink-0 transition-transform text-muted-light dark:text-muted-dark', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="pb-4 pl-0 text-sm text-muted-light dark:text-muted-dark leading-relaxed animate-fade-in space-y-1.5">
          {children}
        </div>
      )}
    </div>
  )
}

export default function Accordion({ children }) {
  return <div>{children}</div>
}
