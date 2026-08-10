import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// scores: { [gameId]: { best: number, runs: number, mode: 'max'|'min' } }
export const useArcadeStore = create(
  persist(
    (set, get) => ({
      scores: {},

      getBest: (gameId) => get().scores[gameId]?.best,
      getRuns: (gameId) => get().scores[gameId]?.runs || 0,

      // mode 'max' = higher is better (points), 'min' = lower is better (time/reaction ms)
      registerRun: (gameId, value, mode = 'max') => {
        const prev = get().scores[gameId]
        const prevBest = prev?.best
        const isNewBest = prevBest === undefined || (mode === 'max' ? value > prevBest : value < prevBest)
        const best = isNewBest ? value : prevBest
        set({
          scores: {
            ...get().scores,
            [gameId]: { best, runs: (prev?.runs || 0) + 1, mode },
          },
        })
        return isNewBest
      },
    }),
    { name: 'meridian_arcade_v2' }
  )
)
