// Firebase bootstrap. The app runs fully in "local mode" (localStorage-backed)
// out of the box. To connect a real Firebase project, fill in a .env file
// (copy .env.example) with your project's config — the app will automatically
// switch to Firebase Auth + Firestore + Storage once real keys are present.
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(cfg.apiKey && cfg.projectId)

let app, auth, db, storage

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(cfg)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
}

export { app, auth, db, storage }
