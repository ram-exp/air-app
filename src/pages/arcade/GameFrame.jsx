import { Sparkles, MousePointer2 } from 'lucide-react'
import { Button, Badge } from '@/components/ui'

export default function GameFrame({
  icon: Icon,
  title,
  description,
  instructions,
  phase, // 'idle' | 'playing' | 'gameover'
  hud, // node shown in the top HUD row while playing
  resultLabel = 'Score',
  resultValue,
  resultExtra,
  isNewHigh,
  bestValue,
  runs = 0,
  onStart,
  aspect = '380 / 560',
  maxWidth = 380,
  children,
}) {
  return (
    <div className="flex flex-col items-center w-full">
      {phase === 'playing' && hud && (
        <div className="w-full px-1 mb-3" style={{ maxWidth }}>{hud}</div>
      )}

      <div className="relative w-full mx-auto" style={{ aspectRatio: aspect, maxWidth }}>
        {children}

        {phase === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 rounded-2xl bg-white/70 dark:bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
            {Icon && (
              <div className="h-14 w-14 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mb-4">
                <Icon size={26} />
              </div>
            )}
            <h3 className="font-display text-lg font-semibold mb-1.5">{title}</h3>
            <p className="text-sm text-muted-light dark:text-muted-dark mb-5 max-w-[240px]">{description}</p>
            {instructions && (
              <div className="flex items-center gap-1.5 text-xs text-muted-light dark:text-muted-dark mb-6">
                <MousePointer2 size={13} /> {instructions}
              </div>
            )}
            <Button size="lg" onClick={onStart}>Start game</Button>
            {runs > 0 && (
              <p className="text-xs text-muted-light dark:text-muted-dark mt-4">Best: {bestValue} · {runs} run{runs > 1 ? 's' : ''} so far</p>
            )}
          </div>
        )}

        {phase === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 rounded-2xl bg-white/85 dark:bg-neutral-950/85 backdrop-blur-sm animate-fade-in">
            {isNewHigh && (
              <Badge tone="amber" className="mb-3 animate-pop gap-1"><Sparkles size={12} /> New best!</Badge>
            )}
            <p className="text-xs uppercase tracking-wider text-muted-light dark:text-muted-dark mb-1">{resultLabel}</p>
            <span className="font-display text-4xl font-semibold mb-3">{resultValue}</span>
            {resultExtra && <div className="text-sm text-muted-light dark:text-muted-dark mb-6 max-w-[260px]">{resultExtra}</div>}
            <Button onClick={onStart}>Play again</Button>
          </div>
        )}
      </div>
    </div>
  )
}
