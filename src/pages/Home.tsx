import { Link } from 'react-router-dom'
import { Calculator, ListOrdered, Users } from 'lucide-react'
import { Card } from '../components/ui/Card'

const links = [
  { to: '/rankings', icon: ListOrdered, title: 'Rankings', subtitle: 'Classements par discipline et par sexe' },
  { to: '/simulateur', icon: Calculator, title: 'Simulateur', subtitle: 'Combien de victoires pour monter ?' },
  { to: '/admin', icon: Users, title: 'Espace admin', subtitle: 'Gestion des joueurs et saisie des matchs' },
]

export function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[var(--color-text)] mb-2">Badminton Hub</h1>
        <p className="text-[var(--color-text-muted)] max-w-2xl">
          Classements et rankings calculés selon le règlement fédéral C700 (FRBB/LFBB/BV) : 12 niveaux, du
          classement 12 (le plus bas) au classement 1 (le plus élevé), sur base des points gagnés en tête-à-tête
          lors des tournois, interclubs et championnats.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {links.map(({ to, icon: Icon, title, subtitle }) => (
          <Link key={to} to={to}>
            <Card className="p-5 h-full hover:border-[var(--color-primary)] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center mb-3">
                <Icon className="text-[var(--color-primary-dark)]" size={20} />
              </div>
              <p className="font-medium text-[var(--color-text)] mb-1">{title}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
