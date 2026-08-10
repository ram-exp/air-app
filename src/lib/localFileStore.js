// Stores actual file/image bytes in IndexedDB so uploads work fully in
// "local mode" (no Supabase configured). Supabase mode never touches this
// — it keeps using real Storage URLs instead.
const DB_NAME = 'meridian_os_files'
const STORE = 'blobs'
const VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveBlob(key, blob) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, key)
    tx.oncomplete = () => resolve(key)
    tx.onerror = () => reject(tx.error)
  })
}

export async function getBlob(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteBlob(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Simple in-memory cache so we don't re-read + re-create object URLs
// every render for the same file.
const urlCache = new Map()

export async function getObjectUrl(key) {
  if (urlCache.has(key)) return urlCache.get(key)
  const blob = await getBlob(key)
  if (!blob) return null
  const url = URL.createObjectURL(blob)
  urlCache.set(key, url)
  return url
}

export function revokeObjectUrl(key) {
  const url = urlCache.get(key)
  if (url) URL.revokeObjectURL(url)
  urlCache.delete(key)
}
