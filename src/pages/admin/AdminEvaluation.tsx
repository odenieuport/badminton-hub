import { useState } from 'react'
import { runMonthlyEvaluation, type EvaluationSummary } from '../../lib/rankingService'
import { Card } from '../../components/ui/Card'
import { Field, Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'

export function AdminEvaluation() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<EvaluationSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setRunning(true)
    setError(null)
    setSummary(null)
    try {
      const result = await runMonthlyEvaluation(new Date(date))
      setSummary(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="max-w-lg">
      <Card className="p-6">
        <h2 className="font-semibold text-[var(--color-text)] mb-2">Évaluation mensuelle (date pivot)</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Article 713 du règlement C700 : recalcule les moyennes de tous les joueurs, applique les règles de
          montée/descente, d'inactivité et de limite entre disciplines, puis archive un instantané dans l'historique.
          En Belgique, cette évaluation a lieu chaque premier lundi du mois.
        </p>

        <Field label="Date d'évaluation (date pivot)">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Button onClick={handleRun} disabled={running}>
          {running ? 'Évaluation en cours…' : "Lancer l'évaluation"}
        </Button>

        {error && <p className="text-sm text-[var(--color-down)] mt-4">{error}</p>}

        {summary && (
          <div className="mt-4 p-4 rounded-lg bg-[var(--color-up-bg)] text-[var(--color-up)] text-sm">
            {summary.playersEvaluated} joueur{summary.playersEvaluated > 1 ? 's' : ''} évalué{summary.playersEvaluated > 1 ? 's' : ''}, dont{' '}
            {summary.changes} changement{summary.changes > 1 ? 's' : ''} de classement.
          </div>
        )}
      </Card>
    </div>
  )
}
