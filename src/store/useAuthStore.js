import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured } from '@/lib/supabase'

// Auth state. In local mode (no Supabase keys configured) the app signs the
// person in as a local guest profile automatically so every feature is
// immediately usable. Once Supabase is configured, real auth takes over.
export const useAuthStore = create(
  persist(
    (set) => ({
      user: isSupabaseConfigured ? null : { uid: 'guest', displayName: 'You', email: 'you@local', photoURL: '' },
      initialized: !isSupabaseConfigured,
      isLocalMode: !isSupabaseConfigured,
      setUser: (user) => set({ user, initialized: true }),
      updateProfile: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),
      signOutLocal: () => set({ user: null }),
    }),
    { name: 'meridian_auth' }
  )
)
