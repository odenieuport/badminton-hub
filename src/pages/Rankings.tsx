import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ListOrdered } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { formatAverage, genderLabel } from '../lib/utils'
import type { Discipline } from '../lib/ranking-engine'

interface RankingRow {
  player_id: string
  classement: number
  moyenne_montee: number
  moyenne_descente: number
  players: {
    id: string
    first_name: string
    last_name: string
    gender: string
    club: string | null
  }
}

const DISCIPLINE_OPTIONS: { value: Discipline; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'double', label: 'Double' },
  { value: 'mixte', label: 'Mixte' },
]

export function Rankings() {
  const [params, setParams] = useSearchParams()
  const discipline = (params.get('discipline') as Discipline) || 'simple'
  const gender = params.get('gender') === 'F' ? 'F' : 'M'

  const [rows, setRows] = useState<RankingRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setRows(null)
    setError(null)

    supabase
      .from('player_rankings')
      .select('player_id, classement, moyenne_montee, moyenne_descente, players!inner(id, first_name, last_name, gender, club)')
      .eq('discipline', discipline)
      .eq('players.gender', gender)
      .order('classement', { ascending: true })
      .order('moyenne_montee', { ascending: false })
      .order('moyenne_descente', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) setError(error.message)
        else setRows((data as unknown as RankingRow[]) ?? [])
      })

    return () => {
      active = false
    }
  }, [discipline, gender])

  const title = useMemo(
    () => `${DISCIPLINE_OPTIONS.find((o) => o.value === discipline)?.label} ${genderLabel(gender)}`,
    [discipline, gender],
  )

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next, { replace: true })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Rankings</h1>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-surface-2)]">
            {DISCIPLINE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setParam('discipline', opt.value)}
                className={
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors ' +
                  (discipline === opt.value ? 'bg-[var(--color-surface)] shadow-sm' : 'text-[var(--color-text-muted)]')
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-surface-2)]">
            {(['M', 'F'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setParam('gender', g)}
                className={
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors ' +
                  (gender === g ? 'bg-[var(--color-surface)] shadow-sm' : 'text-[var(--color-text-muted)]')
                }
              >
                {genderLabel(g)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)]">
          {title}
        </div>

        {rows === null && !error && (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        )}

        {error && <div className="p-6 text-sm text-[var(--color-down)]">Erreur : {error}</div>}

        {rows && rows.length === 0 && (
          <EmptyState icon={ListOrdered} title="Aucun joueur classé" subtitle="Aucun joueur ne correspond à ce filtre pour l'instant." />
        )}

        {rows && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="px-5 py-2.5 font-medium">#</th>
                  <th className="px-5 py-2.5 font-medium">Joueur</th>
                  <th className="px-5 py-2.5 font-medium">Club</th>
                  <th className="px-5 py-2.5 font-medium text-center">Classement</th>
                  <th className="px-5 py-2.5 font-medium text-right">Moy. montée</th>
                  <th className="px-5 py-2.5 font-medium text-right">Moy. descente</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.player_id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]">
                    <td className="px-5 py-2.5 text-[var(--color-text-muted)]">{i + 1}</td>
                    <td className="px-5 py-2.5">
                      <Link to={`/joueurs/${row.player_id}`} className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]">
                        {row.players.first_name} {row.players.last_name}
                      </Link>
                    </td>
                    <td className="px-5 py-2.5 text-[var(--color-text-muted)]">{row.players.club ?? '—'}</td>
                    <td className="px-5 py-2.5 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] font-semibold text-xs">
                        {row.classement}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{formatAverage(row.moyenne_montee)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-[var(--color-text-muted)]">{formatAverage(row.moyenne_descente)}</td>
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
