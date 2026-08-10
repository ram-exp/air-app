import { useCallback, useEffect, useRef, useState } from 'react'
import { Zap } from 'lucide-react'
import { useArcadeStore } from '@/store/useArcadeStore'
import { playCatch, playHit, playHighScore } from '@/lib/sound'
import { cn } from '@/lib/utils'
import GameFrame from '../GameFrame'

const GAME_ID = 'reflex-tap'
const ROUNDS = 5

export default function ReflexTap() {
  const best = useArcadeStore((s) => s.getBest(GAME_ID))
  const runs = useArcadeStore((s) => s.getRuns(GAME_ID))
  const registerRun = useArcadeStore((s) => s.registerRun)

  const [phase, setPhase] = useState('idle')
  const [stage, setStage] = useState('waiting') // waiting | ready | tooSoon
  const [round, setRound] = useState(0)
  const [times, setTimes] = useState([])
  const [result, setResult] = useState({ avg: 0, isNewHigh: false })
  const timeoutRef = useRef(null)
  const readyAtRef = useRef(0)

  const scheduleRound = useCallback(() => {
    setStage('waiting')
    const delay = 900 + Math.random() * 2000
    timeoutRef.current = setTimeout(() => {
      readyAtRef.current = performance.now()
      setStage('ready')
    }, delay)
  }, [])

  const startGame = useCallback(() => {
    setTimes([])
    setRound(0)
    setResult({ avg: 0, isNewHigh: false })
    setPhase('playing')
    scheduleRound()
  }, [scheduleRound])

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const onTap = () => {
    if (phase !== 'playing') return
    if (stage === 'waiting') {
      clearTimeout(timeoutRef.current)
      setStage('tooSoon')
      playHit()
      return
    }
    if (stage === 'tooSoon') {
      scheduleRound()
      return
    }
    if (stage === 'ready') {
      const rt = performance.now() - readyAtRef.current
      const nextTimes = [...times, rt]
      setTimes(nextTimes)
      playCatch(1)
      if (nextTimes.length >= ROUNDS) {
        const avg = nextTimes.reduce((a, b) => a + b, 0) / nextTimes.length
        const isNewHigh = registerRun(GAME_ID, avg, 'min')
        setResult({ avg, isNewHigh })
        setPhase('gameover')
        if (isNewHigh) playHighScore()
      } else {
        setRound((r) => r + 1)
        scheduleRound()
      }
    }
  }

  const zoneClasses = {
    waiting: 'bg-rose-500/15 border-rose-500/30 text-rose-500',
    ready: 'bg-teal-500/20 border-teal-500/40 text-teal-600 dark:text-teal-300',
    tooSoon: 'bg-amber-500/15 border-amber-500/30 text-amber-600',
  }
  const zoneLabel = {
    waiting: 'Wait for green…',
    ready: 'TAP NOW',
    tooSoon: 'Too soon! Tap to retry',
  }

  return (
    <GameFrame
      icon={Zap}
      title="Reflex Tap"
      description={`React as fast as you can, ${ROUNDS} rounds. Lower average time wins.`}
      instructions="Tap the zone the instant it turns green"
      phase={phase}
      onStart={startGame}
      bestValue={best !== undefined ? `${Math.round(best)}ms` : '—'}
      runs={runs}
      resultLabel="Avg reaction"
      resultValue={`${Math.round(result.avg)}ms`}
      resultExtra={
        <div className="flex flex-wrap justify-center gap-1.5">
          {times.map((t, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08]">{Math.round(t)}ms</span>
          ))}
        </div>
      }
      isNewHigh={result.isNewHigh}
      aspect="380 / 480"
    >
      <button
        onClick={onTap}
        disabled={phase !== 'playing'}
        className={cn(
          'w-full h-full rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-colors duration-150 select-none',
          phase === 'playing' ? zoneClasses[stage] : 'bg-black/[0.02] dark:bg-white/[0.03] border-border-light dark:border-border-dark'
        )}
      >
        {phase === 'playing' && (
          <>
            <span className="font-display text-xl font-semibold">{zoneLabel[stage]}</span>
            <span className="text-xs opacity-70">Round {Math.min(round + 1, ROUNDS)} / {ROUNDS}</span>
          </>
        )}
      </button>
    </GameFrame>
  )
}
