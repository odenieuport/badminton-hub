import type { Database } from '../types/database'
import type { RawMatch } from './ranking-engine'

export type MatchRow = Database['public']['Tables']['matches']['Row']

/**
 * Traduit un match stocké en base (deux camps A/B) en `RawMatch` du point de vue
 * d'un joueur donné, tel qu'attendu par le moteur de calcul. Renvoie `null` si ce
 * joueur ne participe pas au match.
 */
export function toRawMatchForPlayer(match: MatchRow, playerId: string): RawMatch | null {
  const discipline = match.discipline as RawMatch['discipline']

  let ownClassement: number
  let partnerClassement: number | undefined
  let opponent1Classement: number
  let opponent2Classement: number | undefined
  let won: boolean

  if (match.side_a_player1 === playerId) {
    ownClassement = match.classement_a1
    partnerClassement = match.classement_a2 ?? undefined
    opponent1Classement = match.classement_b1
    opponent2Classement = match.classement_b2 ?? undefined
    won = match.winner_side === 'A'
  } else if (match.side_a_player2 === playerId) {
    ownClassement = match.classement_a2 ?? match.classement_a1
    partnerClassement = match.classement_a1
    opponent1Classement = match.classement_b1
    opponent2Classement = match.classement_b2 ?? undefined
    won = match.winner_side === 'A'
  } else if (match.side_b_player1 === playerId) {
    ownClassement = match.classement_b1
    partnerClassement = match.classement_b2 ?? undefined
    opponent1Classement = match.classement_a1
    opponent2Classement = match.classement_a2 ?? undefined
    won = match.winner_side === 'B'
  } else if (match.side_b_player2 === playerId) {
    ownClassement = match.classement_b2 ?? match.classement_b1
    partnerClassement = match.classement_b1
    opponent1Classement = match.classement_a1
    opponent2Classement = match.classement_a2 ?? undefined
    won = match.winner_side === 'B'
  } else {
    return null
  }

  return {
    id: match.id,
    discipline,
    date: match.match_date,
    outcome: won ? 'victoire' : 'defaite',
    isWalkover: match.is_walkover,
    ownClassement,
    partnerClassement,
    opponent1Classement,
    opponent2Classement,
  }
}
