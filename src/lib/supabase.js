// Supabase bootstrap. The app runs fully in "local mode" (localStorage-backed)
// out of the box. To connect a real Supabase project, fill in a .env file
// (copy .env.example) with your project's URL + anon key — the app will
// automatically switch to Supabase Auth + Postgres + Storage once real
// values are present.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
