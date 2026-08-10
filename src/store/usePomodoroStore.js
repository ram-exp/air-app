import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_DURATIONS = { focus: 25, short_break: 5, long_break: 15 } // minutes
const DEFAULT_DAILY_GOAL = 8 // focus sessions/day

export const usePomodoroStore = create(
  persist(
    (set, get) => ({
      mode: 'focus', // focus | short_break | long_break
      secondsLeft: DEFAULT_DURATIONS.focus * 60,
      isRunning: false,
      cyclesCompleted: 0,
      label: 'Deep work',

      // --- customizable settings ---
      durations: { ...DEFAULT_DURATIONS }, // minutes per mode
      soundEnabled: true,
      autoStart: false, // auto-start the next mode when one finishes
      dailyGoal: DEFAULT_DAILY_GOAL,

      setLabel: (label) => set({ label }),

      setDuration: (mode, minutes) => {
        const clamped = Math.max(1, Math.min(180, Math.round(minutes)))
        const durations = { ...get().durations, [mode]: clamped }
        const patch = { durations }
        // if we're editing the mode currently shown (and it's not running), reflect immediately
        if (get().mode === mode && !get().isRunning) patch.secondsLeft = clamped * 60
        set(patch)
      },
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setAutoStart: (autoStart) => set({ autoStart }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal: Math.max(1, Math.min(20, Math.round(dailyGoal))) }),

      tick: () => {
        const { secondsLeft, isRunning } = get()
        if (!isRunning) return
        if (secondsLeft <= 1) {
          get().advance()
        } else {
          set({ secondsLeft: secondsLeft - 1 })
        }
      },
      start: () => set({ isRunning: true }),
      pause: () => set({ isRunning: false }),
      reset: () => set({ secondsLeft: get().durationFor(get().mode), isRunning: false }),
      durationFor: (mode) => (get().durations[mode] || DEFAULT_DURATIONS[mode] || DEFAULT_DURATIONS.focus) * 60,

      // Skip straight to a fresh countdown for the given mode without waiting.
      skipTo: (mode) => set({ mode, secondsLeft: get().durationFor(mode), isRunning: false }),

      advance: () => {
        const { mode, cyclesCompleted, autoStart } = get()
        if (mode === 'focus') {
          const nextCycles = cyclesCompleted + 1
          const nextMode = nextCycles % 4 === 0 ? 'long_break' : 'short_break'
          set({ mode: nextMode, secondsLeft: get().durationFor(nextMode), cyclesCompleted: nextCycles, isRunning: autoStart })
          return { finishedMode: 'focus', cyclesCompleted: nextCycles }
        }
        set({ mode: 'focus', secondsLeft: get().durationFor('focus'), isRunning: autoStart })
        return { finishedMode: mode }
      },
      setMode: (mode) => set({ mode, secondsLeft: get().durationFor(mode), isRunning: false }),
    }),
    {
      name: 'meridian_pomodoro',
      // Never persist the live countdown/running state — always resume paused & fresh.
      partialize: (s) => ({
        durations: s.durations,
        soundEnabled: s.soundEnabled,
        autoStart: s.autoStart,
        dailyGoal: s.dailyGoal,
        label: s.label,
        cyclesCompleted: s.cyclesCompleted,
      }),
    }
  )
)
