import { clsx } from 'clsx'

export function cn(...inputs) {
  return clsx(inputs)
}

export function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  )
}

export function formatDate(d, opts) {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('en-US', opts || { month: 'short', day: 'numeric' }).format(date)
}

export function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const now = new Date(); now.setHours(0,0,0,0)
  const target = new Date(dateStr); target.setHours(0,0,0,0)
  return Math.round((target - now) / 86400000)
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export function debounce(fn, wait = 250) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}

export const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 }
