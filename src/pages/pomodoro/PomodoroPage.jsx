import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Timer as TimerIcon, Settings2, Plus, Minus, Volume2, VolumeX, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePomodoroStore } from '@/store/usePomodoroStore'
import { useCollection } from '@/hooks/useCollection'
import { PageHeader, Card, Button, Input, Tabs, Badge, Skeleton, Modal, Switch, Progress } from '@/components/ui'
import { formatDate, isSameDay, cn } from '@/lib/utils'
import { weeklyFocusMinutes } from '@/lib/stats'
import { playChime } from '@/lib/sound'
import WeeklyFocusChart from '@/components/charts/WeeklyFocusChart'

const MODE_LABEL = { focus: 'Focus', short_break: 'Short break', long_break: 'Long break' }
const MODE_TONE = { focus: 'primary', short_break: 'teal', long_break: 'amber' }
const MODE_COLOR = { focus: '#5A4FFF', short_break: '#1EC4B0', long_break: '#F7A331' }

function notify(title, body) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: '/favicon.svg' }) } catch { /* noop */ }
  }
}

export default function PomodoroPage() {
  const {
    mode, secondsLeft, isRunning, cyclesCompleted, label, setLabel,
    tick, start, pause, reset, setMode, skipTo, durationFor,
    durations, setDuration, soundEnabled, setSoundEnabled,
    autoStart, setAutoStart, dailyGoal, setDailyGoal,
  } = usePomodoroStore()
  const { items: sessions, isLoading, createItem } = useCollection('pomodoros')
  const intervalRef = useRef()
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const prevMode = usePomodoroStore.getState().mode
      const prevSeconds = usePomodoroStore.getState().secondsLeft
      tick()
      const nowMode = usePomodoroStore.getState().mode
      if (prevSeconds === 1 && prevMode !== nowMode) {
        createItem({
          label: prevMode === 'focus' ? label : MODE_LABEL[prevMode],
          minutes: Math.round(durationFor(prevMode) / 60),
          completedAt: new Date().toISOString(),
          type: prevMode === 'focus' ? 'focus' : 'break',
        })
        const finishedFocus = prevMode === 'focus'
        if (usePomodoroStore.getState().soundEnabled) playChime(finishedFocus ? 'focus-done' : 'break-done')
        const msg = finishedFocus ? 'Focus session complete — take a break' : 'Break over — back to it'
        toast.success(msg)
        notify('AIR Pomodoro', msg)
      }
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [tick, createItem, label, durationFor])

  // Spacebar toggles start/pause, unless the user is typing somewhere.
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space') return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return
      e.preventDefault()
      if (isRunning) pause(); else start()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isRunning, pause, start])

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const total = durationFor(mode)
  const pct = ((total - secondsLeft) / total) * 100
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  const todaySessions = sessions.filter((s) => isSameDay(s.completedAt, new Date()) && s.type === 'focus')
  const goalPct = Math.min(100, (todaySessions.length / dailyGoal) * 100)
  const focusData = weeklyFocusMinutes(sessions)

  const recentLabels = useMemo(() => {
    const seen = new Set()
    const out = []
    for (const s of sessions) {
      if (s.type !== 'focus' || !s.label || seen.has(s.label)) continue
      seen.add(s.label)
      out.push(s.label)
      if (out.length >= 5) break
    }
    return out
  }, [sessions])

  const r = 88
  const circumference = 2 * Math.PI * r

  const adjustMinutes = (delta) => {
    if (isRunning) return
    const next = Math.max(1, Math.min(180, Math.round(secondsLeft / 60) + delta))
    setDuration(mode, next)
  }

  const handleSkip = () => {
    const nextMode = mode === 'focus' ? 'short_break' : 'focus'
    skipTo(nextMode)
    toast('Skipped to ' + MODE_LABEL[nextMode], { icon: '⏭️' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pomodoro"
        description="Focused sprints with tracked history."
        actions={
          <Button variant="secondary" size="icon" onClick={() => setSettingsOpen(true)} title="Timer settings">
            <Settings2 size={16} />
          </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 flex flex-col items-center py-10">
          <Tabs
            tabs={[{ value: 'focus', label: 'Focus' }, { value: 'short_break', label: 'Short break' }, { value: 'long_break', label: 'Long break' }]}
            active={mode} onChange={setMode} className="mb-8"
          />

          <button
            type="button"
            onClick={() => (isRunning ? pause() : start())}
            className={cn('relative h-56 w-56 mb-6 rounded-full transition-transform active:scale-[0.98]', isRunning && 'animate-pulse-slow')}
            title={isRunning ? 'Pause (Space)' : 'Start (Space)'}
          >
            <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
              <circle cx="100" cy="100" r={r} fill="none" strokeWidth="10" className="stroke-black/[0.06] dark:stroke-white/[0.08]" />
              <circle
                cx="100" cy="100" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
                stroke={MODE_COLOR[mode]}
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (pct / 100) * circumference}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display text-5xl font-semibold tabular-nums">{mm}:{ss}</span>
              <Badge tone={MODE_TONE[mode]} className="mt-2">{MODE_LABEL[mode]}</Badge>
            </div>
          </button>

          {!isRunning && (
            <div className="flex items-center gap-3 mb-4 -mt-1">
              <button onClick={() => adjustMinutes(-1)} className="h-7 w-7 rounded-lg flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1]"><Minus size={13} /></button>
              <span className="text-xs text-muted-light dark:text-muted-dark w-24 text-center">adjust minutes</span>
              <button onClick={() => adjustMinutes(1)} className="h-7 w-7 rounded-lg flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1]"><Plus size={13} /></button>
            </div>
          )}

          {mode === 'focus' && (
            <div className="w-full max-w-xs mb-5">
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What are you focusing on?" className="text-center" />
              {recentLabels.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                  {recentLabels.map((l) => (
                    <button
                      key={l}
                      onClick={() => setLabel(l)}
                      className={cn(
                        'text-[11px] px-2.5 py-1 rounded-full transition-colors',
                        l === label ? 'bg-primary-500/15 text-primary-600 dark:text-primary-300' : 'bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1]'
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="icon" onClick={reset} title="Reset"><RotateCcw size={16} /></Button>
            <Button size="lg" onClick={isRunning ? pause : start} className="w-32 justify-center">
              {isRunning ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start</>}
            </Button>
            <Button variant="secondary" size="icon" onClick={handleSkip} title="Skip to next"><SkipForward size={16} /></Button>
          </div>

          <p className="text-xs text-muted-light dark:text-muted-dark mt-3">Space to start/pause</p>

          <div className="w-full max-w-xs mt-6">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1 text-muted-light dark:text-muted-dark"><Target size={12} /> Daily goal</span>
              <span className="font-medium">{todaySessions.length} / {dailyGoal}</span>
            </div>
            <Progress value={goalPct} tone={goalPct >= 100 ? 'teal' : 'primary'} />
          </div>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-3">{cyclesCompleted} focus sessions completed this session</p>
        </Card>

        <Card>
          <h3 className="font-display font-semibold mb-1">This week</h3>
          <p className="text-xs text-muted-light dark:text-muted-dark mb-2">Focus minutes</p>
          <WeeklyFocusChart data={focusData} />
        </Card>
      </div>

      <Card>
        <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><TimerIcon size={16} /> Session history</h3>
        {isLoading ? <Skeleton className="h-24" /> : sessions.length === 0 ? (
          <p className="text-sm text-muted-light dark:text-muted-dark text-center py-6">No sessions logged yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {sessions.slice(0, 20).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05]">
                <span className="truncate flex-1">{s.label}</span>
                <Badge tone={s.type === 'focus' ? 'primary' : 'teal'}>{s.minutes}m</Badge>
                <span className="text-xs text-muted-light dark:text-muted-dark ml-3 w-32 text-right">{formatDate(s.completedAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Timer settings" size="sm">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium mb-2">Durations (minutes)</p>
            <div className="grid grid-cols-3 gap-2">
              {['focus', 'short_break', 'long_break'].map((m) => (
                <div key={m}>
                  <label className="text-[11px] text-muted-light dark:text-muted-dark block mb-1">{MODE_LABEL[m]}</label>
                  <Input
                    type="number" min={1} max={180}
                    value={durations[m]}
                    onChange={(e) => setDuration(m, Number(e.target.value) || 1)}
                    className="text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5">{soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} Sound on completion</p>
              <p className="text-xs text-muted-light dark:text-muted-dark">Play a chime when a session ends</p>
            </div>
            <Switch checked={soundEnabled} onChange={setSoundEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-start next session</p>
              <p className="text-xs text-muted-light dark:text-muted-dark">Skip the manual "Start" between sessions</p>
            </div>
            <Switch checked={autoStart} onChange={setAutoStart} />
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1"><Target size={14} /> Daily goal (focus sessions)</label>
            <Input type="number" min={1} max={20} value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value) || 1)} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
