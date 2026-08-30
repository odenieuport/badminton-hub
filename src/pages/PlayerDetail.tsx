import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { DISCIPLINE_LABELS, formatAverage, formatDate, genderLabel } from '../lib/utils'
import type { Database } from '../types/database'

type Player = Database['public']['Tables']['players']['Row']
type PlayerRanking = Database['public']['Tables']['player_rankings']['Row']
type Match = Database['public']['Tables']['matches']['Row']

const DISCIPLINES = ['simple', 'double', 'mixte'] as const

export function PlayerDetail() {
  const { id } = useParams<{ id: string }>()
  const [player, setPlayer] = useState<Player | null>(null)
  const [rankings, setRankings] = useState<PlayerRanking[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)

    Promise.all([
      supabase.from('players').select('*').eq('id', id).single(),
      supabase.from('player_rankings').select('*').eq('player_id', id),
      supabase
        .from('matches')
        .select('*')
        .or(`side_a_player1.eq.${id},side_a_player2.eq.${id},side_b_player1.eq.${id},side_b_player2.eq.${id}`)
        .order('match_date', { ascending: false })
        .limit(20),
    ]).then(([playerRes, rankingsRes, matchesRes]) => {
      if (!active) return
      setPlayer(playerRes.data ?? null)
      setRankings(rankingsRes.data ?? [])
      setMatches(matchesRes.data ?? [])
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (!player) {
    return <p className="text-[var(--color-text-muted)]">Joueur introuvable.</p>
  }

  return (
    <div>
      <Link to="/rankings" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4">
        <ArrowLeft size={16} /> Retour aux rankings
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
          <User className="text-[var(--color-primary-dark)]" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            {player.first_name} {player.last_name}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {genderLabel(player.gender)}
            {player.club && ` · ${player.club}`}
            {player.is_foreign && ' · Joueur étranger'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {DISCIPLINES.map((discipline) => {
          const ranking = rankings.find((r) => r.discipline === discipline)
          return (
            <Card key={discipline} className="p-5">
              <p className="text-sm font-medium text-[var(--color-text-muted)] mb-2">{DISCIPLINE_LABELS[discipline]}</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-semibold text-[var(--color-text)]">{ranking?.classement ?? '—'}</span>
                <span className="text-sm text-[var(--color-text-muted)]">classement</span>
              </div>
              {ranking && (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Moy. montée</span>
                    <span className="tabular-nums">{formatAverage(ranking.moyenne_montee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Moy. descente</span>
                    <span className="tabular-nums">{formatAverage(ranking.moyenne_descente)}</span>
                  </div>
                  {ranking.protected_until && new Date(ranking.protected_until) > new Date() && (
                    <Badge tone="warn">Protégé jusqu'au {formatDate(ranking.protected_until)}</Badge>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)]">
          Derniers matchs
        </div>
        {matches.length === 0 ? (
          <p className="p-5 text-sm text-[var(--color-text-muted)]">Aucun match enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Discipline</th>
                  <th className="px-5 py-2.5 font-medium">Résultat</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const isSideA = m.side_a_player1 === id || m.side_a_player2 === id
                  const won = (isSideA && m.winner_side === 'A') || (!isSideA && m.winner_side === 'B')
                  return (
                    <tr key={m.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-5 py-2.5 text-[var(--color-text-muted)]">{formatDate(m.match_date)}</td>
                      <td className="px-5 py-2.5">{DISCIPLINE_LABELS[m.discipline]}</td>
                      <td className="px-5 py-2.5">
                        <Badge tone={won ? 'up' : 'down'}>{won ? 'Victoire' : 'Défaite'}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
