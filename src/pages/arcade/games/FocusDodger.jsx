import { useCallback, useEffect, useRef, useState } from 'react'
import { Heart, Gamepad2 } from 'lucide-react'
import { Badge } from '@/components/ui'
import { useArcadeStore } from '@/store/useArcadeStore'
import { playCatch, playHit, playHighScore } from '@/lib/sound'
import GameFrame from '../GameFrame'

const GAME_ID = 'focus-dodger'
const ITEM_TYPES = [
  { type: 'tomato', emoji: '🍅', weight: 58, points: 10, penalty: false },
  { type: 'star', emoji: '⭐', weight: 8, points: 30, penalty: false },
  { type: 'phone', emoji: '📱', weight: 16, points: 0, penalty: true },
  { type: 'bell', emoji: '🔔', weight: 11, points: 0, penalty: true },
  { type: 'chat', emoji: '💬', weight: 7, points: 0, penalty: true },
]
const TOTAL_WEIGHT = ITEM_TYPES.reduce((s, t) => s + t.weight, 0)
function pickItemType() {
  let r = Math.random() * TOTAL_WEIGHT
  for (const t of ITEM_TYPES) { r -= t.weight; if (r <= 0) return t }
  return ITEM_TYPES[0]
}

const START_LIVES = 3
const PADDLE_W = 74
const PADDLE_H = 16
const ITEM_SIZE = 30
const QUIPS = [
  'Nice reflexes! Even real tomatoes appreciate the hustle.',
  'Focus level: elite. The notifications never stood a chance.',
  'That combo streak deserves an actual break.',
  'Distractions: dodged. Deadlines: still there, sadly.',
  'You caught more tomatoes than a Pomodoro veteran.',
]

export default function FocusDodger() {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const rafRef = useRef(null)
  const best = useArcadeStore((s) => s.getBest(GAME_ID))
  const runs = useArcadeStore((s) => s.getRuns(GAME_ID))
  const registerRun = useArcadeStore((s) => s.registerRun)

  const [phase, setPhase] = useState('idle')
  const [hud, setHud] = useState({ score: 0, lives: START_LIVES, combo: 1 })
  const [result, setResult] = useState({ score: 0, isNewHigh: false, quip: '' })

  const freshEngine = useCallback(() => ({
    state: 'idle', dims: { w: 380, h: 560 }, paddleX: 190, paddleTargetX: 190,
    entities: [], popups: [], keys: { left: false, right: false }, shake: { time: 0, mag: 0 },
    spawnTimer: 0, elapsed: 0, score: 0, lives: START_LIVES, combo: 1, comboTimer: 0, caught: 0,
  }), [])

  useEffect(() => { engineRef.current = freshEngine() }, [freshEngine])

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const engine = engineRef.current
    if (!canvas || !engine) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const w = Math.max(240, rect.width)
    const h = Math.max(320, rect.height)
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    engine.dims = { w, h }
    engine.paddleX = Math.min(engine.paddleX, w - PADDLE_W / 2)
    engine.paddleTargetX = engine.paddleX
  }, [])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const setTargetFromClientX = (clientX) => {
      const engine = engineRef.current
      if (!engine || engine.state !== 'playing') return
      const rect = canvas.getBoundingClientRect()
      const scaleX = engine.dims.w / rect.width
      engine.paddleTargetX = (clientX - rect.left) * scaleX
    }
    const onMouseMove = (e) => setTargetFromClientX(e.clientX)
    const onTouchMove = (e) => { if (e.touches[0]) setTargetFromClientX(e.touches[0].clientX); if (engineRef.current?.state === 'playing') e.preventDefault() }
    const onKeyDown = (e) => { const engine = engineRef.current; if (!engine) return; if (e.code === 'ArrowLeft') engine.keys.left = true; if (e.code === 'ArrowRight') engine.keys.right = true }
    const onKeyUp = (e) => { const engine = engineRef.current; if (!engine) return; if (e.code === 'ArrowLeft') engine.keys.left = false; if (e.code === 'ArrowRight') engine.keys.right = false }
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const endGame = useCallback(() => {
    const engine = engineRef.current
    engine.state = 'gameover'
    const isNewHigh = registerRun(GAME_ID, engine.score, 'max')
    setResult({ score: engine.score, isNewHigh, quip: QUIPS[Math.floor(Math.random() * QUIPS.length)] })
    setPhase('gameover')
    if (isNewHigh) playHighScore()
  }, [registerRun])

  const startGame = useCallback(() => {
    engineRef.current = { ...freshEngine(), dims: engineRef.current?.dims || { w: 380, h: 560 } }
    engineRef.current.state = 'playing'
    engineRef.current.paddleX = engineRef.current.dims.w / 2
    engineRef.current.paddleTargetX = engineRef.current.dims.w / 2
    setHud({ score: 0, lives: START_LIVES, combo: 1 })
    setPhase('playing')
  }, [freshEngine])

  useEffect(() => {
    if (phase !== 'playing') return
    let lastT = performance.now()
    const loop = (t) => {
      const dt = Math.min(0.05, (t - lastT) / 1000)
      lastT = t
      const engine = engineRef.current
      const canvas = canvasRef.current
      if (!engine || !canvas || engine.state !== 'playing') return
      const ctx = canvas.getContext('2d')
      const { w, h } = engine.dims

      engine.elapsed += dt
      const spawnInterval = Math.max(0.38, 0.95 - engine.elapsed * 0.012)
      const fallSpeed = 95 + engine.elapsed * 3.2 + engine.score * 0.4

      const keySpeed = 420
      if (engine.keys.left) engine.paddleTargetX -= keySpeed * dt
      if (engine.keys.right) engine.paddleTargetX += keySpeed * dt
      engine.paddleTargetX = Math.max(PADDLE_W / 2, Math.min(w - PADDLE_W / 2, engine.paddleTargetX))
      engine.paddleX += (engine.paddleTargetX - engine.paddleX) * Math.min(1, dt * 14)

      engine.spawnTimer += dt
      if (engine.spawnTimer >= spawnInterval) {
        engine.spawnTimer = 0
        const def = pickItemType()
        engine.entities.push({ id: Math.random(), ...def, x: ITEM_SIZE / 2 + Math.random() * (w - ITEM_SIZE), y: -ITEM_SIZE, vy: fallSpeed * (0.85 + Math.random() * 0.3), rot: Math.random() * Math.PI * 2, vrot: (Math.random() - 0.5) * 2 })
      }

      if (engine.comboTimer > 0) { engine.comboTimer -= dt; if (engine.comboTimer <= 0) engine.combo = 1 }

      const paddleY = h - 46
      const next = []
      let scoreChanged = false, livesChanged = false, comboChanged = false
      for (const e of engine.entities) {
        e.y += e.vy * dt
        e.rot += e.vrot * dt
        const withinX = Math.abs(e.x - engine.paddleX) < (PADDLE_W + ITEM_SIZE) / 2 - 6
        const withinY = e.y > paddleY - PADDLE_H / 2 - 6 && e.y < paddleY + PADDLE_H / 2 + 10
        if (withinX && withinY) {
          if (e.penalty) {
            engine.lives -= 1; engine.combo = 1; engine.comboTimer = 0
            livesChanged = true; comboChanged = true
            engine.shake = { time: 0.25, mag: 9 }
            playHit()
            engine.popups.push({ x: e.x, y: e.y, vy: -55, life: 0.7, maxLife: 0.7, text: 'OOPS', color: '#F4506A' })
          } else {
            engine.combo = Math.min(9, engine.combo + (engine.combo < 9 ? 0.34 : 0))
            engine.comboTimer = 2.4
            const gained = Math.round(e.points * Math.max(1, Math.floor(engine.combo)))
            engine.score += gained; engine.caught += 1
            scoreChanged = true; comboChanged = true
            playCatch(Math.floor(engine.combo))
            engine.popups.push({ x: e.x, y: e.y, vy: -60, life: 0.6, maxLife: 0.6, text: `+${gained}`, color: e.type === 'star' ? '#F7A331' : '#1EC4B0' })
          }
          continue
        }
        if (e.y - ITEM_SIZE / 2 > h) {
          if (!e.penalty) { engine.combo = 1; engine.comboTimer = 0; comboChanged = true }
          continue
        }
        next.push(e)
      }
      engine.entities = next

      const nextPopups = []
      for (const p of engine.popups) { p.y += p.vy * dt; p.life -= dt; if (p.life > 0) nextPopups.push(p) }
      engine.popups = nextPopups
      if (engine.shake.time > 0) engine.shake.time = Math.max(0, engine.shake.time - dt)

      ctx.clearRect(0, 0, w, h)
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, 'rgba(90,79,255,0.07)')
      grad.addColorStop(1, 'rgba(30,196,176,0.05)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      if (engine.shake.time > 0) {
        const mag = engine.shake.mag * (engine.shake.time / 0.25)
        ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag)
      }
      for (const e of engine.entities) {
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rot)
        ctx.font = `${ITEM_SIZE}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(e.emoji, 0, 0); ctx.restore()
      }
      ctx.save()
      ctx.translate(engine.paddleX, paddleY)
      const paddleGrad = ctx.createLinearGradient(-PADDLE_W / 2, 0, PADDLE_W / 2, 0)
      paddleGrad.addColorStop(0, '#5A4FFF'); paddleGrad.addColorStop(1, '#1EC4B0')
      ctx.fillStyle = paddleGrad
      ctx.shadowColor = 'rgba(90,79,255,0.5)'; ctx.shadowBlur = 14
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(-PADDLE_W / 2, -PADDLE_H / 2, PADDLE_W, PADDLE_H, 8)
      else ctx.rect(-PADDLE_W / 2, -PADDLE_H / 2, PADDLE_W, PADDLE_H)
      ctx.fill()
      ctx.restore()
      for (const p of engine.popups) {
        ctx.save(); ctx.globalAlpha = Math.max(0, p.life / p.maxLife); ctx.fillStyle = p.color
        ctx.font = '700 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(p.text, p.x, p.y); ctx.restore()
      }
      ctx.restore()

      if (scoreChanged || livesChanged || comboChanged) setHud({ score: engine.score, lives: engine.lives, combo: Math.floor(engine.combo) })
      if (engine.lives <= 0) { endGame(); return }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase, endGame])

  return (
    <GameFrame
      icon={Gamepad2}
      title="Focus Dodger"
      description="Catch 🍅 and ⭐, dodge 📱🔔💬. Speed ramps up the longer you survive."
      instructions="Drag, touch, or arrow keys to move"
      phase={phase}
      onStart={startGame}
      bestValue={best ?? 0}
      runs={runs}
      resultLabel="Score"
      resultValue={result.score}
      resultExtra={result.quip}
      isNewHigh={result.isNewHigh}
      hud={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-semibold tabular-nums">{hud.score}</span>
            {hud.combo > 1 && <Badge tone="teal" className="animate-pop">x{hud.combo} combo</Badge>}
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: START_LIVES }).map((_, i) => (
              <Heart key={i} size={17} className={i < hud.lives ? 'fill-rose-500 text-rose-500' : 'text-black/10 dark:text-white/10'} />
            ))}
          </div>
        </div>
      }
    >
      <canvas ref={canvasRef} className="w-full h-full rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-border-light dark:border-border-dark touch-none cursor-none" />
    </GameFrame>
  )
}
