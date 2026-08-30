import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'

export function AdminDashboard() {
  const [counts, setCounts] = useState<{ players: number; matches: number; pendingProfiles: number } | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('players').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'pending'),
    ]).then(([players, matches, pending]) => {
      setCounts({ players: players.count ?? 0, matches: matches.count ?? 0, pendingProfiles: pending.count ?? 0 })
    })
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="p-5">
        <p className="text-sm text-[var(--color-text-muted)] mb-1">Joueurs enregistrés</p>
        <p className="text-3xl font-semibold text-[var(--color-text)]">{counts?.players ?? '—'}</p>
        <Link to="/admin/joueurs" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
          Gérer les joueurs →
        </Link>
      </Card>
      <Card className="p-5">
        <p className="text-sm text-[var(--color-text-muted)] mb-1">Matchs enregistrés</p>
        <p className="text-3xl font-semibold text-[var(--color-text)]">{counts?.matches ?? '—'}</p>
        <Link to="/admin/matchs" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
          Saisir un match →
        </Link>
      </Card>
      <Card className="p-5">
        <p className="text-sm text-[var(--color-text-muted)] mb-1">Comptes en attente d'approbation</p>
        <p className="text-3xl font-semibold text-[var(--color-text)]">{counts?.pendingProfiles ?? '—'}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">À approuver directement en base (table profiles).</p>
      </Card>
    </div>
  )
}
