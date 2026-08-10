import { useCallback, useEffect, useRef, useState } from 'react'
import { Hammer } from 'lucide-react'
import { Badge } from '@/components/ui'
import { useArcadeStore } from '@/store/useArcadeStore'
import { playCatch, playHit, playHighScore } from '@/lib/sound'
import { cn } from '@/lib/utils'
import GameFrame from '../GameFrame'

const GAME_ID = 'whack-distraction'
const GRID = 9
const ROUND_SECONDS = 30
const DISTRACTIONS = ['📱', '🔔', '💬', '📧']
const DECOYS = ['🍅', '⭐']

export default function WhackDistraction() {
  const best = useArcadeStore((s) => s.getBest(GAME_ID))
  const runs = useArcadeStore((s) => s.getRuns(GAME_ID))
  const registerRun = useArcadeStore((s) => s.registerRun)

  const [phase, setPhase] = useState('idle')
  const [cells, setCells] = useState(Array(GRID).fill(null))
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [result, setResult] = useState({ score: 0, isNewHigh: false })
  const spawnTimeoutRef = useRef(null)
  const clearTimeoutsRef = useRef({})
  const roundTimerRef = useRef(null)
  const speedRef = useRef(1)

  const clearAllTimers = () => {
    clearTimeout(spawnTimeoutRef.current)
    clearInterval(roundTimerRef.current)
    Object.values(clearTimeoutsRef.current).forEach(clearTimeout)
    clearTimeoutsRef.current = {}
  }

  const spawnOne = useCallback(() => {
    setCells((prev) => {
      const emptyIdx = prev.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0)
      if (emptyIdx.length === 0) return prev
      const idx = emptyIdx[Math.floor(Math.random() * emptyIdx.length)]
      const isDecoy = Math.random() < 0.28
      const emoji = isDecoy ? DECOYS[Math.floor(Math.random() * DECOYS.length)] : DISTRACTIONS[Math.floor(Math.random() * DISTRACTIONS.length)]
      const next = [...prev]
      next[idx] = { emoji, isDecoy, id: Math.random() }
      const life = Math.max(600, 1200 - speedRef.current * 40)
      clearTimeoutsRef.current[idx] = setTimeout(() => {
        setCells((p2) => { const n2 = [...p2]; if (n2[idx]?.id === next[idx].id) n2[idx] = null; return n2 })
      }, life)
      return next
    })
    speedRef.current += 1
    const nextDelay = Math.max(320, 700 - speedRef.current * 8)
    spawnTimeoutRef.current = setTimeout(spawnOne, nextDelay)
  }, [])

  const endGame = useCallback((finalScore) => {
    clearAllTimers()
    const isNewHigh = registerRun(GAME_ID, finalScore, 'max')
    setResult({ score: finalScore, isNewHigh })
    setPhase('gameover')
    if (isNewHigh) playHighScore()
  }, [registerRun])

  const startGame = useCallback(() => {
    clearAllTimers()
    setCells(Array(GRID).fill(null))
    setScore(0)
    setTimeLeft(ROUND_SECONDS)
    speedRef.current = 1
    setPhase('playing')
    spawnTimeoutRef.current = setTimeout(spawnOne, 500)
    roundTimerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(roundTimerRef.current)
          setScore((s) => { endGame(s); return s })
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [spawnOne, endGame])

  useEffect(() => () => clearAllTimers(), [])

  const whack = (idx) => {
    if (phase !== 'playing') return
    const cell = cells[idx]
    if (!cell) return
    clearTimeout(clearTimeoutsRef.current[idx])
    setCells((prev) => { const n = [...prev]; n[idx] = null; return n })
    if (cell.isDecoy) {
      setScore((s) => Math.max(0, s - 5))
      playHit()
    } else {
      setScore((s) => s + 10)
      playCatch(1)
    }
  }

  return (
    <GameFrame
      icon={Hammer}
      title="Whack-a-Distraction"
      description="Whack 📱🔔💬 notifications before they vanish. Leave 🍅⭐ alone!"
      instructions="Tap the distractions, skip the decoys"
      phase={phase}
      onStart={startGame}
      bestValue={best ?? 0}
      runs={runs}
      resultLabel="Score"
      resultValue={result.score}
      resultExtra="30-second round complete"
      isNewHigh={result.isNewHigh}
      aspect="380 / 480"
      hud={
        <div className="flex items-center justify-between">
          <span className="font-display text-2xl font-semibold tabular-nums">{score}</span>
          <Badge tone={timeLeft <= 10 ? 'rose' : 'primary'}>{timeLeft}s</Badge>
        </div>
      }
    >
      <div className="w-full h-full rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-border-light dark:border-border-dark p-3">
        <div className="grid grid-cols-3 gap-3 h-full">
          {cells.map((cell, i) => (
            <button
              key={i}
              onClick={() => whack(i)}
              disabled={phase !== 'playing'}
              className="relative rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] overflow-hidden"
            >
              {cell && (
                <span className={cn('absolute inset-0 flex items-center justify-center text-3xl animate-pop', cell.isDecoy && 'opacity-90')}>
                  {cell.emoji}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </GameFrame>
  )
}
