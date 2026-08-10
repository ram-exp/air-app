import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

export default function ProtectedRoute({ children }) {
  const { user, initialized, isLocalMode } = useAuthStore()
  if (isLocalMode) return children
  if (!initialized) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}
