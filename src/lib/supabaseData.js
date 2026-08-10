// Supabase-backed implementation, used automatically when the app is
// connected to a real Supabase project (see lib/supabase.js). Every row
// lives in a single generic `records` table (id, user_id, collection, data
// jsonb) scoped by Row Level Security to auth.uid() — see supabase.sql for
// the schema + policies. This mirrors the "collection of JSON blobs" shape
// the local (localStorage) and previous Firestore implementations already
// used, so every page in the app keeps working unmodified.
import { supabase } from './supabase'
import { useAuthStore } from '@/store/useAuthStore'

const TABLE = 'records'

function currentUid() {
  const uid = useAuthStore.getState().user?.uid
  if (!uid) throw new Error('Not signed in')
  return uid
}

function rowToItem(row) {
  return { id: row.id, ...row.data, createdAt: row.created_at, updatedAt: row.updated_at }
}

export const supabaseData = {
  async getAll(collectionName) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, data, created_at, updated_at')
      .eq('user_id', currentUid())
      .eq('collection', collectionName)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(rowToItem)
  },

  async create(collectionName, item) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ user_id: currentUid(), collection: collectionName, data: item })
      .select('id, data, created_at, updated_at')
      .single()
    if (error) throw error
    return rowToItem(data)
  },

  async update(collectionName, id, patch) {
    // `data` is stored as one jsonb blob, so a partial update has to merge
    // client-side rather than relying on Postgres to merge columns for us.
    const { data: existing, error: selectError } = await supabase
      .from(TABLE)
      .select('data')
      .eq('id', id)
      .eq('user_id', currentUid())
      .single()
    if (selectError) throw selectError

    const merged = { ...existing.data, ...patch }
    const { data, error } = await supabase
      .from(TABLE)
      .update({ data: merged, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', currentUid())
      .select('id, data, created_at, updated_at')
      .single()
    if (error) throw error
    return rowToItem(data)
  },

  async remove(collectionName, id) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', currentUid())
    if (error) throw error
    return id
  },
}
