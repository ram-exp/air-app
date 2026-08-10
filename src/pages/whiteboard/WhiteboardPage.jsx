import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser, Download, Undo2, Trash2, PenTool, Palette } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'meridian_whiteboard_png'
const MAX_HISTORY = 25

const SWATCHES = [
  '#14151a', '#ffffff', '#5A4FFF', '#8B5CF6', '#EC4899',
  '#F472B6', '#1EC4B0', '#F7A331', '#F4506A', '#3B82F6',
]

export default function WhiteboardPage() {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const ctxRef = useRef(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef(null)
  const historyRef = useRef([])
  const saveTimeoutRef = useRef(null)

  const [color, setColor] = useState('#14151a')
  const [size, setSize] = useState(4)
  const [tool, setTool] = useState('pen') // pen | eraser
  const [canUndo, setCanUndo] = useState(false)

  // --- setup / resize ---------------------------------------------------
  const setupCanvas = useCallback((preserve = true) => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const dpr = window.devicePixelRatio || 1
    const rect = wrap.getBoundingClientRect()
    const prevData = preserve && canvas.width > 0 ? canvas.toDataURL('image/png') : null

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctxRef.current = ctx

    if (prevData) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height)
      img.src = prevData
    }
  }, [])

  // Load saved drawing (or blank) once, then wire up resize handling.
  useEffect(() => {
    setupCanvas(false)
    const saved = localStorage.getItem(STORAGE_KEY)
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (saved && canvas && ctx) {
      const img = new Image()
      img.onload = () => {
        const rect = wrapRef.current.getBoundingClientRect()
        ctx.drawImage(img, 0, 0, rect.width, rect.height)
      }
      img.src = saved
    }
    const onResize = () => setupCanvas(true)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persist = useCallback(() => {
    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      try { localStorage.setItem(STORAGE_KEY, canvas.toDataURL('image/png')) } catch { /* quota exceeded, ignore */ }
    }, 400)
  }, [])

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    historyRef.current.push(canvas.toDataURL('image/png'))
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift()
    setCanUndo(historyRef.current.length > 0)
  }, [])

  // --- drawing -----------------------------------------------------------
  const getPoint = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e) => {
    e.preventDefault()
    canvasRef.current.setPointerCapture?.(e.pointerId)
    pushHistory()
    drawingRef.current = true
    lastPointRef.current = getPoint(e)
    const ctx = ctxRef.current
    const p = lastPointRef.current
    ctx.beginPath()
    ctx.arc(p.x, p.y, (tool === 'eraser' ? size * 1.6 : size) / 2, 0, Math.PI * 2)
    ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color
    ctx.fill()
  }

  const onPointerMove = (e) => {
    if (!drawingRef.current) return
    e.preventDefault()
    const ctx = ctxRef.current
    const p = getPoint(e)
    const last = lastPointRef.current
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color
    ctx.lineWidth = tool === 'eraser' ? size * 1.6 : size
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastPointRef.current = p
  }

  const onPointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    persist()
  }

  const undo = () => {
    const prev = historyRef.current.pop()
    setCanUndo(historyRef.current.length > 0)
    if (!prev) return
    const ctx = ctxRef.current
    const img = new Image()
    img.onload = () => {
      const rect = wrapRef.current.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, rect.width, rect.height)
      ctx.drawImage(img, 0, 0, rect.width, rect.height)
      persist()
    }
    img.src = prev
  }

  const clearBoard = () => {
    if (!confirm('Clear the whole board? This can\'t be undone.')) return
    pushHistory()
    const ctx = ctxRef.current
    const rect = wrapRef.current.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    persist()
    toast.success('Board cleared')
  }

  const download = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `whiteboard-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('Downloaded as PNG')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Whiteboard"
        description="Sketch ideas, diagrams, or just doodle. Autosaves in your browser."
        actions={
          <>
            <Button variant="secondary" size="icon" onClick={undo} disabled={!canUndo} title="Undo"><Undo2 size={16} /></Button>
            <Button variant="secondary" size="icon" onClick={clearBoard} title="Clear board"><Trash2 size={16} /></Button>
            <Button onClick={download}><Download size={16} /> Download PNG</Button>
          </>
        }
      />

      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-4 mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <Palette size={14} className="text-muted-light dark:text-muted-dark mr-0.5" />
            {SWATCHES.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool('pen') }}
                className={cn(
                  'h-6 w-6 rounded-full border-2 transition-transform',
                  color === c && tool === 'pen' ? 'scale-110 border-primary-500' : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: c, boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.12)' : undefined }}
                title={c}
              />
            ))}
            <label className="relative h-6 w-6 rounded-full overflow-hidden border border-border-light dark:border-border-dark cursor-pointer" title="Custom color">
              <input
                type="color"
                value={color}
                onChange={(e) => { setColor(e.target.value); setTool('pen') }}
                className="absolute -inset-1 cursor-pointer"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <PenTool size={14} className="text-muted-light dark:text-muted-dark" />
            <input
              type="range" min={2} max={28} value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-24 accent-primary-500"
            />
            <span className="text-xs text-muted-light dark:text-muted-dark w-6 tabular-nums">{size}</span>
          </div>

          <button
            onClick={() => setTool(tool === 'eraser' ? 'pen' : 'eraser')}
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors',
              tool === 'eraser' ? 'bg-primary-500/15 border-primary-500/40 text-primary-600 dark:text-primary-300' : 'border-border-light dark:border-border-dark hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
            )}
          >
            <Eraser size={13} /> Eraser
          </button>
        </div>

        <div ref={wrapRef} className="w-full rounded-2xl overflow-hidden border border-border-light dark:border-border-dark" style={{ aspectRatio: '16 / 9' }}>
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className="w-full h-full touch-none cursor-crosshair block"
          />
        </div>
      </Card>
    </div>
  )
}
