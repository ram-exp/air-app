// Firestore-backed implementation, used automatically when the app is
// connected to a real Firebase project (see lib/firebase.js). Every document
// is scoped under users/{uid}/{collection} so this remains a single-user app
// per authenticated account.
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { useAuthStore } from '@/store/useAuthStore'

function colRef(name) {
  const uid = useAuthStore.getState().user?.uid || 'guest'
  return collection(db, 'users', uid, name)
}

export const firestoreData = {
  async getAll(name) {
    const snap = await getDocs(colRef(name))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  async create(name, item) {
    const ref = await addDoc(colRef(name), { ...item, createdAt: serverTimestamp() })
    return { id: ref.id, ...item }
  },
  async update(name, id, patch) {
    const uid = useAuthStore.getState().user?.uid || 'guest'
    await updateDoc(doc(db, 'users', uid, name, id), { ...patch, updatedAt: serverTimestamp() })
    return { id, ...patch }
  },
  async remove(name, id) {
    const uid = useAuthStore.getState().user?.uid || 'guest'
    await deleteDoc(doc(db, 'users', uid, name, id))
    return id
  },
}
