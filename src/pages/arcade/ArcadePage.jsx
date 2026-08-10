import { useState } from 'react'
import { ArrowLeft, Gamepad2, Brain, Zap, Hammer, Calculator, Trophy } from 'lucide-react'
import { PageHeader, Card, Button, Badge } from '@/components/ui'
import { useArcadeStore } from '@/store/useArcadeStore'
import FocusDodger from './games/FocusDodger'
import MemoryMatch from './games/MemoryMatch'
import ReflexTap from './games/ReflexTap'
import WhackDistraction from './games/WhackDistraction'
import QuickMath from './games/QuickMath'

const TONE_ICON_BG = {
  primary: 'bg-primary-500/10 text-primary-500',
  teal: 'bg-teal-500/10 text-teal-500',
  amber: 'bg-amber-500/10 text-amber-500',
  rose: 'bg-rose-500/10 text-rose-500',
}

const GAMES = [
  { id: 'focus-dodger', name: 'Focus Dodger', tagline: 'Catch tomatoes, dodge distractions', icon: Gamepad2, tone: 'primary', Component: FocusDodger, format: (v) => v ?? 0 },
  { id: 'memory-match', name: 'Memory Match', tagline: 'Flip cards, find every pair', icon: Brain, tone: 'teal', Component: MemoryMatch, format: (v) => (v !== undefined ? `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}` : '—') },
  { id: 'reflex-tap', name: 'Reflex Tap', tagline: 'Test your reaction speed', icon: Zap, tone: 'amber', Component: ReflexTap, format: (v) => (v !== undefined ? `${Math.round(v)}ms` : '—') },
  { id: 'whack-distraction', name: 'Whack-a-Distraction', tagline: 'Whack notifications, skip decoys', icon: Hammer, tone: 'rose', Component: WhackDistraction, format: (v) => v ?? 0 },
  { id: 'quick-math', name: 'Quick Math', tagline: '30-second arithmetic sprint', icon: Calculator, tone: 'primary', Component: QuickMath, format: (v) => v ?? 0 },
]

export default function ArcadePage() {
  const [activeId, setActiveId] = useState(null)
  const scores = useArcadeStore((s) => s.scores)
  const active = GAMES.find((g) => g.id === activeId)

  if (active) {
    const ActiveGame = active.Component
    return (
      <div className="space-y-4">
        <PageHeader
          title={active.name}
          description={active.tagline}
          actions={
            <Button variant="secondary" onClick={() => setActiveId(null)}>
              <ArrowLeft size={16} /> All games
            </Button>
          }
        />
        <Card className="flex justify-center py-6">
          <ActiveGame />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Arcade" description="Take a break — five quick games to reset your brain." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((g) => {
          const best = scores[g.id]?.best
          const runs = scores[g.id]?.runs || 0
          return (
            <Card key={g.id} hover className="cursor-pointer" onClick={() => setActiveId(g.id)}>
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center mb-3 ${TONE_ICON_BG[g.tone]}`}>
                <g.icon size={20} />
              </div>
              <h3 className="font-display font-semibold mb-1">{g.name}</h3>
              <p className="text-sm text-muted-light dark:text-muted-dark mb-3">{g.tagline}</p>
              <div className="flex items-center justify-between">
                <Badge tone={g.tone} className="gap-1"><Trophy size={11} /> {g.format(best)}</Badge>
                <span className="text-xs text-muted-light dark:text-muted-dark">{runs} run{runs !== 1 ? 's' : ''}</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
