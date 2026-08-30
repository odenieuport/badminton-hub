import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from '../ui/Spinner'

export function AdminGuard() {
  const { session, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="font-medium text-[var(--color-text)] mb-2">Compte en attente d'approbation</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          Ton compte a bien été créé mais n'a pas encore les droits d'administration. Demande à un administrateur
          existant de t'ajouter (table <code>profiles</code>, rôle « admin »).
        </p>
      </div>
    )
  }

  return <Outlet />
}
