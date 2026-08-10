import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark', // 'light' | 'dark' | 'system'
      accent: 'primary', // preset id, a gradient id, or 'custom'
      customHex: '#5A4FFF', // used when accent === 'custom'
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setCustomHex: (hex) => set({ accent: 'custom', customHex: hex }),
      toggle: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    { name: 'meridian_theme' }
  )
)

// Solid presets: id -> representative color used for --color-primary-500.
export const ACCENT_PRESETS = [
  { id: 'primary', label: 'Indigo', color: '#5A4FFF' },
  { id: 'purple', label: 'Purple', color: '#8B5CF6' },
  { id: 'pink', label: 'Pink', color: '#EC4899' },
  { id: 'rose', label: 'Rose', color: '#F4506A' },
  { id: 'amber', label: 'Amber', color: '#F7A331' },
  { id: 'teal', label: 'Teal', color: '#1EC4B0' },
  { id: 'sky', label: 'Sky', color: '#3B82F6' },
  { id: 'emerald', label: 'Emerald', color: '#10B981' },
]

// Gradient presets: two stops used to build --accent-gradient, with the
// first stop doubling as the flat --color-primary-500 fallback.
export const GRADIENT_PRESETS = [
  { id: 'sunset', label: 'Sunset', from: '#F472B6', to: '#F7A331' },
  { id: 'candy', label: 'Candy', from: '#EC4899', to: '#8B5CF6' },
  { id: 'aurora', label: 'Aurora', from: '#8B5CF6', to: '#1EC4B0' },
  { id: 'ocean', label: 'Ocean', from: '#3B82F6', to: '#1EC4B0' },
  { id: 'berry', label: 'Berry', from: '#8B5CF6', to: '#F4506A' },
]

function hexToRgb(hex) {
  const m = hex.replace('#', '')
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const num = parseInt(full, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}
function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}
export function shade(hex, amount) {
  // amount negative = darker, positive = lighter
  const { r, g, b } = hexToRgb(hex)
  const t = amount < 0 ? 0 : 255
  const p = Math.abs(amount)
  return rgbToHex({ r: r + (t - r) * p, g: g + (t - g) * p, b: b + (t - b) * p })
}

export function applyTheme() {
  const { theme, accent, customHex } = useThemeStore.getState()
  const root = document.documentElement
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const resolved = theme === 'system' ? system : theme
  root.classList.toggle('dark', resolved === 'dark')

  let base500
  let gradientCss

  const gradientPreset = GRADIENT_PRESETS.find((g) => g.id === accent)
  const solidPreset = ACCENT_PRESETS.find((p) => p.id === accent)

  if (gradientPreset) {
    base500 = gradientPreset.from
    gradientCss = `linear-gradient(135deg, ${gradientPreset.from}, ${gradientPreset.to})`
  } else if (accent === 'custom') {
    base500 = customHex
    gradientCss = `linear-gradient(135deg, ${shade(customHex, 0.18)}, ${shade(customHex, -0.18)})`
  } else {
    base500 = solidPreset?.color || ACCENT_PRESETS[0].color
    gradientCss = `linear-gradient(135deg, ${shade(base500, 0.14)}, ${shade(base500, -0.16)})`
  }

  root.style.setProperty('--color-primary-500', base500)
  root.style.setProperty('--color-primary-600', shade(base500, -0.16))
  root.style.setProperty('--color-primary-300', shade(base500, 0.28))
  root.style.setProperty('--accent-gradient', gradientCss)
}
