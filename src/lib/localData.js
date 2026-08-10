import { uid } from './utils'
import { SEED } from './seed'

const NS = 'meridian_os_v1'

function readAll(collection) {
  const key = `${NS}:${collection}`
  const raw = localStorage.getItem(key)
  if (raw) {
    try { return JSON.parse(raw) } catch { /* fallthrough */ }
  }
  const seeded = SEED[collection] ? [...SEED[collection]] : []
  localStorage.setItem(key, JSON.stringify(seeded))
  return seeded
}

function writeAll(collection, items) {
  localStorage.setItem(`${NS}:${collection}`, JSON.stringify(items))
}

const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms))

export const localData = {
  async getAll(collection) {
    await delay()
    return readAll(collection)
  },
  async create(collection, item) {
    await delay(120)
    const items = readAll(collection)
    const withId = { id: uid(), createdAt: new Date().toISOString(), ...item }
    items.unshift(withId)
    writeAll(collection, items)
    return withId
  },
  async update(collection, id, patch) {
    await delay(120)
    const items = readAll(collection)
    const idx = items.findIndex((i) => i.id === id)
    if (idx === -1) throw new Error('Not found')
    items[idx] = { ...items[idx], ...patch, updatedAt: new Date().toISOString() }
    writeAll(collection, items)
    return items[idx]
  },
  async remove(collection, id) {
    await delay(120)
    const items = readAll(collection).filter((i) => i.id !== id)
    writeAll(collection, items)
    return id
  },
  async setAll(collection, items) {
    await delay(80)
    writeAll(collection, items)
    return items
  },
}
