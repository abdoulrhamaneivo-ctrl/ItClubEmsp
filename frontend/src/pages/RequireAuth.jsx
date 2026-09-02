import { Navigate } from 'react-router-dom'
import { useAuth, hasRole } from '../stores/auth'

/** Garde de route : exige d'être connecté (et optionnellement un rôle). */
export default function RequireAuth({ children, roles }) {
  const user = useAuth((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (roles && !hasRole(user, roles)) return <Navigate to="/espace" replace />
  return children
}
