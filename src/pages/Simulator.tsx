import { useEffect, useState } from 'react'
import { Calculator } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchPlayerMatches } from '../lib/rankingService'
import { simulateWinsNeededToPromote, type Discipline, type SimulationResult } from '../lib/ranking-engine'
import { Card } from '../components/ui/Card'
import { Field, Input, Select } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { formatAverage } from '../lib/utils'
import type { Database } from '../types/database'

type Player = Database['public']['Tables']['players']['Row']

export function Simulator() {
  const [players, setPlayers] = useState<Player[]>([])
  const [search, setSearch] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [discipline, setDiscipline] = useState<Discipline>('simple')
  const [opponentClassement, setOpponentClassement] = useState(6)
  const [opponent2Classement, setOpponent2Classement] = useState(6)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [classement, setClassement] = useState<number | null>(null)

  useEffect(() => {
    supabase
      .from('players')
      .select('*')
      .order('last_name')
      .then(({ data }) => setPlayers(data ?? []))
  }, [])

  const filteredPlayers = players.filter((p) =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()),
  )

  async function runSimulation() {
    if (!playerId) return
    setLoading(true)
    setResult(null)

    const { data: ranking } = await supabase
      .from('player_rankings')
      .select('classement')
      .eq('player_id', playerId)
      .eq('discipline', discipline)
      .single()

    const currentClassement = ranking?.classement ?? 12
    setClassement(currentClassement)

    const matches = await fetchPlayerMatches(playerId, discipline)
    const simulation = simulateWinsNeededToPromote({
      matches,
      discipline,
      classement: currentClassement,
      referenceDate: new Date(),
      hypotheticalOpponentClassement: opponentClassement,
      hypotheticalOpponent2Classement: discipline === 'simple' ? undefined : opponent2Classement,
    })

    setResult(simulation)
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-1">Simulateur de progression</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Estime combien de victoires, contre un adversaire d'un classement donné, sont nécessaires pour atteindre le
        palier de montée du classement supérieur.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <Card className="p-5">
          <Field label="Rechercher un joueur">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, prénom…" />
          </Field>
          <Field label="Joueur">
            <Select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              <option value="">Sélectionner…</option>
              {filteredPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Discipline">
            <Select value={discipline} onChange={(e) => setDiscipline(e.target.value as Discipline)}>
              <option value="simple">Simple</option>
              <option value="double">Double</option>
              <option value="mixte">Mixte</option>
            </Select>
          </Field>
          <Field label="Classement de l'adversaire hypothétique">
            <Select value={opponentClassement} onChange={(e) => setOpponentClassement(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          {discipline !== 'simple' && (
            <Field label="Classement du second adversaire">
              <Select value={opponent2Classement} onChange={(e) => setOpponent2Classement(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Button fullWidth onClick={runSimulation} disabled={!playerId || loading}>
            {loading ? <Spinner className="text-white" /> : 'Simuler'}
          </Button>
        </Card>

        <Card className="p-6">
          {!result && !loading && (
            <EmptyState icon={Calculator} title="Aucune simulation" subtitle="Choisis un joueur et lance une simulation pour voir sa projection." />
          )}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Spinner />
            </div>
          )}
          {result && classement !== null && (
            <div>
              <p className="text-sm text-[var(--color-text-muted)] mb-1">Classement actuel</p>
              <p className="text-3xl font-semibold text-[var(--color-text)] mb-6">{classement}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-[var(--color-text-muted)] mb-1">Moyenne de montée actuelle</p>
                  <p className="text-xl font-medium tabular-nums">{formatAverage(result.currentAverage)}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-muted)] mb-1">Palier à atteindre</p>
                  <p className="text-xl font-medium tabular-nums">{result.seuil !== null ? formatAverage(result.seuil) : '—'}</p>
                </div>
              </div>

              {result.seuil === null && (
                <p className="text-[var(--color-text-muted)]">Ce joueur est déjà au classement 1, la montée maximale.</p>
              )}
              {result.alreadyQualifies && (
                <p className="text-[var(--color-up)] font-medium">Le palier de montée est déjà atteint pour la prochaine évaluation.</p>
              )}
              {result.seuil !== null && !result.alreadyQualifies && result.winsNeeded !== null && (
                <p className="text-[var(--color-text)]">
                  Il faudrait environ{' '}
                  <span className="font-semibold text-[var(--color-primary)]">{result.winsNeeded} victoire{result.winsNeeded > 1 ? 's' : ''}</span>{' '}
                  supplémentaire{result.winsNeeded > 1 ? 's' : ''} contre un adversaire classé {opponentClassement}
                  {discipline !== 'simple' ? ` / ${opponent2Classement}` : ''} pour atteindre le palier.
                </p>
              )}
              {result.seuil !== null && !result.alreadyQualifies && result.winsNeeded === null && (
                <p className="text-[var(--color-text-muted)]">
                  Même avec de nombreuses victoires contre ce niveau d'adversaire, le palier ne serait pas atteint : choisis un
                  adversaire mieux classé.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
