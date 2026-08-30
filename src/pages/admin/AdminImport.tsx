import { useState, type ChangeEvent } from 'react'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabase'
import { recalculateMoyennes } from '../../lib/rankingService'
import { Card } from '../../components/ui/Card'
import type { Discipline } from '../../lib/ranking-engine'
import type { Database } from '../../types/database'

type MatchInsert = Database['public']['Tables']['matches']['Insert']

interface CsvRow {
  discipline?: string
  match_date?: string
  competition_type?: string
  side_a_player1_licence?: string
  side_a_player2_licence?: string
  side_b_player1_licence?: string
  side_b_player2_licence?: string
  winner_side?: string
  score?: string
  is_walkover?: string
}

const DISCIPLINES = new Set(['simple', 'double', 'mixte'])
const COMPETITIONS = new Set(['tournoi', 'interclub', 'championnat'])

export function AdminImport() {
  const [rowErrors, setRowErrors] = useState<string[]>([])
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessing(true)
    setRowErrors([])
    setImportedCount(null)

    const parsed = await new Promise<CsvRow[]>((resolve, reject) => {
      Papa.parse<CsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => resolve(result.data),
        error: reject,
      })
    })

    const { data: players } = await supabase.from('players').select('id, license_number')
    const licenceToId = new Map((players ?? []).filter((p) => p.license_number).map((p) => [p.license_number as string, p.id]))

    const { data: rankings } = await supabase.from('player_rankings').select('player_id, discipline, classement')
    const classementFor = (playerId: string, discipline: string) =>
      rankings?.find((r) => r.player_id === playerId && r.discipline === discipline)?.classement ?? 12

    const errors: string[] = []
    const toInsert: MatchInsert[] = []
    const touched = new Set<string>()

    parsed.forEach((row, index) => {
      const line = index + 2 // +1 header, +1 pour un index 1-based
      const discipline = row.discipline?.trim()
      if (!discipline || !DISCIPLINES.has(discipline)) return errors.push(`Ligne ${line} : discipline invalide "${row.discipline}"`)

      const competitionType = row.competition_type?.trim()
      if (!competitionType || !COMPETITIONS.has(competitionType))
        return errors.push(`Ligne ${line} : type de compétition invalide "${row.competition_type}"`)

      if (!row.match_date) return errors.push(`Ligne ${line} : date manquante`)

      const winnerSide = row.winner_side?.trim().toUpperCase()
      if (winnerSide !== 'A' && winnerSide !== 'B') return errors.push(`Ligne ${line} : winner_side doit être "A" ou "B"`)

      const isDouble = discipline !== 'simple'

      const a1 = licenceToId.get(row.side_a_player1_licence?.trim() ?? '')
      const b1 = licenceToId.get(row.side_b_player1_licence?.trim() ?? '')
      if (!a1 || !b1) return errors.push(`Ligne ${line} : joueur introuvable (vérifie les numéros d'affiliation)`)

      let a2: string | undefined
      let b2: string | undefined
      if (isDouble) {
        a2 = licenceToId.get(row.side_a_player2_licence?.trim() ?? '')
        b2 = licenceToId.get(row.side_b_player2_licence?.trim() ?? '')
        if (!a2 || !b2) return errors.push(`Ligne ${line} : partenaire introuvable pour un double/mixte`)
      }

      const isWalkover = row.is_walkover?.trim().toLowerCase() === 'true'

      toInsert.push({
        discipline,
        match_date: row.match_date.trim(),
        competition_type: competitionType,
        is_walkover: isWalkover,
        source: 'import',
        side_a_player1: a1,
        side_a_player2: a2 ?? null,
        side_b_player1: b1,
        side_b_player2: b2 ?? null,
        winner_side: winnerSide,
        classement_a1: classementFor(a1, discipline),
        classement_a2: a2 ? classementFor(a2, discipline) : null,
        classement_b1: classementFor(b1, discipline),
        classement_b2: b2 ? classementFor(b2, discipline) : null,
        score: row.score?.trim() || null,
      })

      touched.add(`${a1}:${discipline}`)
      if (a2) touched.add(`${a2}:${discipline}`)
      touched.add(`${b1}:${discipline}`)
      if (b2) touched.add(`${b2}:${discipline}`)
    })

    if (toInsert.length > 0) {
      const { error } = await supabase.from('matches').insert(toInsert)
      if (error) errors.push(`Erreur d'insertion : ${error.message}`)
      else {
        setImportedCount(toInsert.length)
        await Promise.all(
          Array.from(touched).map((key) => {
            const [playerId, discipline] = key.split(':')
            return recalculateMoyennes(playerId, discipline as Discipline)
          }),
        )
      }
    }

    setRowErrors(errors)
    setProcessing(false)
    e.target.value = ''
  }

  return (
    <div className="max-w-2xl">
      <Card className="p-6">
        <h2 className="font-semibold text-[var(--color-text)] mb-2">Import CSV de matchs</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Colonnes attendues : <code>discipline</code> (simple/double/mixte), <code>match_date</code> (AAAA-MM-JJ),{' '}
          <code>competition_type</code> (tournoi/interclub/championnat), <code>side_a_player1_licence</code>,{' '}
          <code>side_a_player2_licence</code> (double/mixte), <code>side_b_player1_licence</code>,{' '}
          <code>side_b_player2_licence</code>, <code>winner_side</code> (A/B), <code>score</code>,{' '}
          <code>is_walkover</code> (true/false). Les joueurs sont identifiés par leur numéro d'affiliation, déjà
          présent dans la fiche joueur.
        </p>

        <label className="inline-block">
          <span className="sr-only">Choisir un fichier CSV</span>
          <input type="file" accept=".csv" onChange={handleFile} disabled={processing} className="text-sm" />
        </label>

        {processing && <p className="text-sm text-[var(--color-text-muted)] mt-4">Traitement en cours…</p>}

        {importedCount !== null && (
          <p className="text-sm text-[var(--color-up)] mt-4">{importedCount} match(s) importé(s) avec succès.</p>
        )}

        {rowErrors.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-[var(--color-down-bg)] text-[var(--color-down)] text-sm space-y-1 max-h-60 overflow-y-auto">
            {rowErrors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
