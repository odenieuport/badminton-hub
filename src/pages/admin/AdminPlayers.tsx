import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { EmptyState } from '../../components/ui/EmptyState'
import { genderLabel } from '../../lib/utils'
import type { Database } from '../../types/database'

type Player = Database['public']['Tables']['players']['Row']

export function AdminPlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [search, setSearch] = useState('')

  async function load() {
    const { data } = await supabase.from('players').select('*').order('last_name')
    setPlayers(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = players.filter((p) => `${p.first_name} ${p.last_name} ${p.club ?? ''}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un joueur…" className="max-w-xs" />
        <Link to="/admin/joueurs/nouveau">
          <Button>
            <Plus size={16} /> Nouveau joueur
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="Aucun joueur" subtitle="Ajoute ton premier joueur pour commencer." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="px-5 py-2.5 font-medium">Nom</th>
                  <th className="px-5 py-2.5 font-medium">Sexe</th>
                  <th className="px-5 py-2.5 font-medium">Club</th>
                  <th className="px-5 py-2.5 font-medium">N° affiliation</th>
                  <th className="px-5 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]">
                    <td className="px-5 py-2.5 font-medium text-[var(--color-text)]">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="px-5 py-2.5 text-[var(--color-text-muted)]">{genderLabel(p.gender)}</td>
                    <td className="px-5 py-2.5 text-[var(--color-text-muted)]">{p.club ?? '—'}</td>
                    <td className="px-5 py-2.5 text-[var(--color-text-muted)]">{p.license_number ?? '—'}</td>
                    <td className="px-5 py-2.5 text-right">
                      <Link to={`/admin/joueurs/${p.id}/modifier`} className="text-[var(--color-primary)] hover:underline">
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
