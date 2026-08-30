import { supabase } from './supabase'
import { toRawMatchForPlayer } from './matches'
import {
  applyInactivityRule,
  computeMoyenneDescente,
  computeMoyenneMontee,
  enforceDisciplineLimit,
  evaluateClassement,
  getInactivityStatus,
  type Discipline,
  type RawMatch,
} from './ranking-engine'
import type { Database } from '../types/database'

const DISCIPLINES: Discipline[] = ['simple', 'double', 'mixte']

type PlayerRankingRow = Database['public']['Tables']['player_rankings']['Row']

async function fetchPlayerMatches(playerId: string, discipline: Discipline): Promise<RawMatch[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('discipline', discipline)
    .or(`side_a_player1.eq.${playerId},side_a_player2.eq.${playerId},side_b_player1.eq.${playerId},side_b_player2.eq.${playerId}`)
    .order('match_date', { ascending: false })
    .limit(200)

  if (error) throw error
  return (data ?? []).map((m) => toRawMatchForPlayer(m, playerId)).filter((m): m is RawMatch => m !== null)
}

/**
 * Recalcule les moyennes courantes d'un joueur pour une discipline, sans toucher
 * à son classement officiel (celui-ci ne change qu'à l'évaluation mensuelle, art. 713).
 * À appeler après la saisie d'un nouveau match, pour un retour d'information immédiat.
 */
export async function recalculateMoyennes(playerId: string, discipline: Discipline, referenceDate = new Date()) {
  const matches = await fetchPlayerMatches(playerId, discipline)
  const montee = computeMoyenneMontee(matches, discipline, referenceDate)
  const descente = computeMoyenneDescente(matches, discipline, referenceDate)

  const { error } = await supabase
    .from('player_rankings')
    .update({
      moyenne_montee: montee.average,
      moyenne_descente: descente.average,
      match_count_montee: montee.matchCount,
      match_count_descente: descente.matchCount,
      updated_at: new Date().toISOString(),
    })
    .eq('player_id', playerId)
    .eq('discipline', discipline)

  if (error) throw error
  return { montee, descente }
}

export interface EvaluationSummary {
  playersEvaluated: number
  changes: number
}

interface DisciplineOutcome {
  classement: number
  moyenneMontee: number
  moyenneDescente: number
  matchCountMontee: number
  matchCountDescente: number
  protectedUntil: string | null
  alreadyDemoted: boolean
}

/**
 * Article 713 : lance l'évaluation mensuelle (date pivot) pour tous les joueurs :
 * inactivité (art. 716), moyennes, montée/descente (art. 710/711), puis limite
 * entre disciplines (art. 712). Écrit le nouvel état et un instantané dans
 * `ranking_history`.
 */
export async function runMonthlyEvaluation(evaluationDate = new Date()): Promise<EvaluationSummary> {
  const { data: rankings, error } = await supabase.from('player_rankings').select('*')
  if (error) throw error

  const byPlayer = new Map<string, PlayerRankingRow[]>()
  for (const row of rankings ?? []) {
    const list = byPlayer.get(row.player_id) ?? []
    list.push(row)
    byPlayer.set(row.player_id, list)
  }

  let changes = 0
  const evaluationDateStr = evaluationDate.toISOString().slice(0, 10)

  for (const [playerId, rows] of byPlayer) {
    const outcomes: Partial<Record<Discipline, DisciplineOutcome>> = {}

    for (const discipline of DISCIPLINES) {
      const row = rows.find((r) => r.discipline === discipline)
      if (!row) continue

      const matches = await fetchPlayerMatches(playerId, discipline)
      const inactivity = getInactivityStatus(matches, discipline, evaluationDate)
      const inactivityResult = applyInactivityRule(row.classement, inactivity, { alreadyDemoted: row.inactivity_already_demoted })

      if (inactivityResult.frozen) {
        outcomes[discipline] = {
          classement: inactivityResult.classement,
          moyenneMontee: row.moyenne_montee,
          moyenneDescente: row.moyenne_descente,
          matchCountMontee: row.match_count_montee,
          matchCountDescente: row.match_count_descente,
          protectedUntil: row.protected_until,
          alreadyDemoted: inactivityResult.alreadyDemoted,
        }
        continue
      }

      const montee = computeMoyenneMontee(matches, discipline, evaluationDate)
      const descente = computeMoyenneDescente(matches, discipline, evaluationDate)
      const evaluation = evaluateClassement({
        classement: row.classement,
        moyenneMontee: montee.average,
        moyenneDescente: descente.average,
        protectedUntil: row.protected_until,
        evaluationDate,
      })

      outcomes[discipline] = {
        classement: evaluation.classement,
        moyenneMontee: montee.average,
        moyenneDescente: descente.average,
        matchCountMontee: montee.matchCount,
        matchCountDescente: descente.matchCount,
        protectedUntil: evaluation.protectedUntil,
        alreadyDemoted: false,
      }
    }

    const limited = enforceDisciplineLimit({
      simple: outcomes.simple?.classement ?? 12,
      double: outcomes.double?.classement ?? 12,
      mixte: outcomes.mixte?.classement ?? 12,
    })

    for (const discipline of DISCIPLINES) {
      const outcome = outcomes[discipline]
      const row = rows.find((r) => r.discipline === discipline)
      if (!outcome || !row) continue

      const finalClassement = limited[discipline]
      if (finalClassement !== row.classement) changes++

      const { error: updateError } = await supabase
        .from('player_rankings')
        .update({
          classement: finalClassement,
          moyenne_montee: outcome.moyenneMontee,
          moyenne_descente: outcome.moyenneDescente,
          match_count_montee: outcome.matchCountMontee,
          match_count_descente: outcome.matchCountDescente,
          protected_until: outcome.protectedUntil,
          last_evaluation_date: evaluationDateStr,
          inactivity_already_demoted: outcome.alreadyDemoted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
      if (updateError) throw updateError

      const { error: historyError } = await supabase.from('ranking_history').upsert(
        {
          player_id: playerId,
          discipline,
          classement: finalClassement,
          moyenne_montee: outcome.moyenneMontee,
          moyenne_descente: outcome.moyenneDescente,
          evaluation_date: evaluationDateStr,
        },
        { onConflict: 'player_id,discipline,evaluation_date' },
      )
      if (historyError) throw historyError
    }
  }

  return { playersEvaluated: byPlayer.size, changes }
}

export { fetchPlayerMatches }
