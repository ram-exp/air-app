import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// In-app notification center + browser push permission state.
// `seenKeys` prevents the same event/task reminder from firing twice.
export const useNotificationStore = create(
  persist(
    (set, get) => ({
      items: [],
      seenKeys: [],
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
      preferences: { events: true, tasks: true, habits: true },

      setPreference: (key, value) => set((s) => ({ preferences: { ...s.preferences, [key]: value } })),

      requestPermission: async () => {
        if (typeof Notification === 'undefined') return 'unsupported'
        const result = await Notification.requestPermission()
        set({ permission: result })
        return result
      },

      hasSeen: (key) => get().seenKeys.includes(key),

      push: (notification) => {
        const { seenKeys, items, permission } = get()
        if (seenKeys.includes(notification.key)) return
        const entry = { id: notification.key, read: false, createdAt: new Date().toISOString(), ...notification }
        set({ items: [entry, ...items].slice(0, 100), seenKeys: [...seenKeys, notification.key].slice(-500) })
        if (permission === 'granted' && typeof Notification !== 'undefined') {
          try { new Notification(notification.title, { body: notification.body, tag: notification.key }) } catch { /* noop */ }
        }
      },

      markRead: (id) => set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () => set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
      clearAll: () => set({ items: [] }),
    }),
    { name: 'meridian_notifications' }
  )
)
