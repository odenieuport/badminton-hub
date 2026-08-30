import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../lib/utils'
import { Button } from '../../components/ui/Button'

const tabs = [
  { to: '/admin', label: 'Tableau de bord', end: true },
  { to: '/admin/joueurs', label: 'Joueurs' },
  { to: '/admin/matchs', label: 'Matchs' },
  { to: '/admin/import', label: 'Import CSV' },
  { to: '/admin/evaluation', label: 'Évaluation mensuelle' },
]

export function AdminLayout() {
  const { role, signOut } = useAuth()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Administration</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Rôle : {role}</p>
        </div>
        <Button variant="secondary" onClick={signOut}>
          Se déconnecter
        </Button>
      </div>

      <div className="flex gap-1 border-b border-[var(--color-border)] mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cx(
                'px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                isActive ? 'border-[var(--color-primary)] text-[var(--color-primary-dark)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
