import { NavLink, Outlet } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { cx } from '../../lib/utils'

const links = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/rankings', label: 'Rankings' },
  { to: '/simulateur', label: 'Simulateur' },
  { to: '/admin', label: 'Admin' },
]

export function Layout() {
  return (
    <div className="min-h-svh flex flex-col bg-[var(--color-bg)]">
      <header className="sticky top-0 z-30 bg-[var(--color-bg)]/90 backdrop-blur border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl flex items-center gap-6 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
              <Trophy className="text-white" size={18} />
            </div>
            <span className="font-semibold text-[var(--color-text)] leading-tight">Badminton Hub</span>
          </NavLink>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--color-border)] py-6 text-center text-xs text-[var(--color-text-muted)]">
        Classements calculés selon le règlement fédéral C700 (FRBB/LFBB/BV).
      </footer>
    </div>
  )
}
