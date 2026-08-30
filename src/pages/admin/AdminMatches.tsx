import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { recalculateMoyennes } from '../../lib/rankingService'
import { Card } from '../../components/ui/Card'
import { Field, Select, Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { DISCIPLINE_LABELS, COMPETITION_LABELS, formatDate } from '../../lib/utils'
import type { Database } from '../../types/database'
import type { Discipline } from '../../lib/ranking-engine'

type Player = Database['public']['Tables']['players']['Row']
type Match = Database['public']['Tables']['matches']['Row']

export function AdminMatches() {
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])

  const [discipline, setDiscipline] = useState<Discipline>('simple')
  const [competitionType, setCompetitionType] = useState('tournoi')
  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [isWalkover, setIsWalkover] = useState(false)
  const [sideA1, setSideA1] = useState('')
  const [sideA2, setSideA2] = useState('')
  const [sideB1, setSideB1] = useState('')
  const [sideB2, setSideB2] = useState('')
  const [winnerSide, setWinnerSide] = useState<'A' | 'B'>('A')
  const [score, setScore] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isDouble = discipline !== 'simple'

  async function loadAll() {
    const [playersRes, matchesRes] = await Promise.all([
      supabase.from('players').select('*').order('last_name'),
      supabase.from('matches').select('*').order('match_date', { ascending: false }).limit(30),
    ])
    setPlayers(playersRes.data ?? [])
    setMatches(matchesRes.data ?? [])
  }

  useEffect(() => {
    loadAll()
  }, [])

  function playerLabel(id: string) {
    const p = players.find((pl) => pl.id === id)
    return p ? `${p.first_name} ${p.last_name}` : '—'
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!sideA1 || !sideB1) return setError('Sélectionne au moins un joueur de chaque côté.')
    if (isDouble && (!sideA2 || !sideB2)) return setError('Sélectionne les deux joueurs de chaque paire.')

    setSaving(true)

    const involvedIds = [sideA1, sideA2, sideB1, sideB2].filter(Boolean)
    const { data: rankings, error: rankingsError } = await supabase
      .from('player_rankings')
      .select('player_id, classement')
      .eq('discipline', discipline)
      .in('player_id', involvedIds)

    if (rankingsError) {
      setSaving(false)
      return setError(rankingsError.message)
    }

    const classementFor = (playerId: string) => rankings?.find((r) => r.player_id === playerId)?.classement ?? 12

    const { error: insertError } = await supabase.from('matches').insert({
      discipline,
      match_date: matchDate,
      competition_type: competitionType,
      is_walkover: isWalkover,
      side_a_player1: sideA1,
      side_a_player2: isDouble ? sideA2 : null,
      side_b_player1: sideB1,
      side_b_player2: isDouble ? sideB2 : null,
      winner_side: winnerSide,
      classement_a1: classementFor(sideA1),
      classement_a2: isDouble ? classementFor(sideA2) : null,
      classement_b1: classementFor(sideB1),
      classement_b2: isDouble ? classementFor(sideB2) : null,
      score: score || null,
    })

    if (insertError) {
      setSaving(false)
      return setError(insertError.message)
    }

    await Promise.all(involvedIds.map((playerId) => recalculateMoyennes(playerId, discipline)))

    setSaving(false)
    setScore('')
    setSideA1('')
    setSideA2('')
    setSideB1('')
    setSideB2('')
    loadAll()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
      <Card className="p-5 h-fit">
        <h2 className="font-semibold text-[var(--color-text)] mb-4">Saisir un match</h2>
        <form onSubmit={handleSubmit}>
          <Field label="Discipline">
            <Select value={discipline} onChange={(e) => setDiscipline(e.target.value as Discipline)}>
              <option value="simple">Simple</option>
              <option value="double">Double</option>
              <option value="mixte">Mixte</option>
            </Select>
          </Field>
          <Field label="Type de compétition">
            <Select value={competitionType} onChange={(e) => setCompetitionType(e.target.value)}>
              <option value="tournoi">Tournoi</option>
              <option value="interclub">Interclub</option>
              <option value="championnat">Championnat</option>
            </Select>
          </Field>
          <Field label="Date du match">
            <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} required />
          </Field>

          <Field label={isDouble ? 'Camp A — joueur 1' : 'Joueur'}>
            <Select value={sideA1} onChange={(e) => setSideA1(e.target.value)} required>
              <option value="">Sélectionner…</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </Select>
          </Field>
          {isDouble && (
            <Field label="Camp A — joueur 2">
              <Select value={sideA2} onChange={(e) => setSideA2(e.target.value)} required>
                <option value="">Sélectionner…</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label={isDouble ? 'Camp B — joueur 1' : 'Adversaire'}>
            <Select value={sideB1} onChange={(e) => setSideB1(e.target.value)} required>
              <option value="">Sélectionner…</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </Select>
          </Field>
          {isDouble && (
            <Field label="Camp B — joueur 2">
              <Select value={sideB2} onChange={(e) => setSideB2(e.target.value)} required>
                <option value="">Sélectionner…</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Vainqueur">
            <Select value={winnerSide} onChange={(e) => setWinnerSide(e.target.value as 'A' | 'B')}>
              <option value="A">Camp A</option>
              <option value="B">Camp B</option>
            </Select>
          </Field>

          <Field label="Score (optionnel)">
            <Input value={score} onChange={(e) => setScore(e.target.value)} placeholder="21-15, 18-21, 21-19" />
          </Field>

          <label className="flex items-center gap-2 mb-5 text-sm text-[var(--color-text)]">
            <input type="checkbox" checked={isWalkover} onChange={(e) => setIsWalkover(e.target.checked)} />
            Résultat non joué (w-o / forfait)
          </label>

          {error && <p className="text-sm text-[var(--color-down)] mb-4">{error}</p>}

          <Button type="submit" fullWidth disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer le match'}
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden h-fit">
        <div className="px-5 py-3 border-b border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)]">
          Derniers matchs
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-5 py-2.5 font-medium">Discipline</th>
                <th className="px-5 py-2.5 font-medium">Camp A</th>
                <th className="px-5 py-2.5 font-medium">Camp B</th>
                <th className="px-5 py-2.5 font-medium">Compétition</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-5 py-2.5 text-[var(--color-text-muted)]">{formatDate(m.match_date)}</td>
                  <td className="px-5 py-2.5">{DISCIPLINE_LABELS[m.discipline]}</td>
                  <td className={'px-5 py-2.5 ' + (m.winner_side === 'A' ? 'font-medium text-[var(--color-up)]' : '')}>
                    {playerLabel(m.side_a_player1)}
                    {m.side_a_player2 && ` / ${playerLabel(m.side_a_player2)}`}
                  </td>
                  <td className={'px-5 py-2.5 ' + (m.winner_side === 'B' ? 'font-medium text-[var(--color-up)]' : '')}>
                    {playerLabel(m.side_b_player1)}
                    {m.side_b_player2 && ` / ${playerLabel(m.side_b_player2)}`}
                  </td>
                  <td className="px-5 py-2.5 text-[var(--color-text-muted)]">{COMPETITION_LABELS[m.competition_type]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
