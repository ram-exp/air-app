import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/routes'
import { applyTheme, useThemeStore } from '@/store/useThemeStore'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'

function mapSupabaseUser(user) {
  if (!user) return null
  return {
    uid: user.id,
    displayName: user.user_metadata?.display_name || user.email,
    email: user.email,
    photoURL: user.user_metadata?.avatar_url || '',
  }
}

export default function App() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    applyTheme()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => theme === 'system' && applyTheme()
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [theme])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      useAuthStore.getState().setUser(mapSupabaseUser(data.session?.user))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.getState().setUser(mapSupabaseUser(session?.user))
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" toastOptions={{
        className: 'text-sm',
        style: { borderRadius: '14px' },
      }} />
    </QueryClientProvider>
  )
}
