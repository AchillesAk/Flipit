import { Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, init } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    void init()
  }, [init])

  if (loading) return null
  if (!user)
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />

  return children
}
