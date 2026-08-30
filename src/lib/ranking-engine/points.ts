import { POINTS_GRID } from './constants'
import type { Discipline, MatchOutcome } from './types'

export function pointsForOpponentClassement(classement: number): number {
  const points = POINTS_GRID[classement]
  if (points === undefined) throw new RangeError(`Classement invalide : ${classement}`)
  return points
}

/**
 * Article 715.2 : points gagnés par un joueur pour un match donné.
 * Une défaite ne rapporte jamais de points. En double/mixte, une victoire rapporte
 * la moyenne des points correspondant aux classements des deux adversaires.
 */
export function computeMatchPoints(
  discipline: Discipline,
  outcome: MatchOutcome,
  opponent1Classement: number,
  opponent2Classement?: number,
): number {
  if (outcome === 'defaite') return 0

  if (discipline === 'simple') return pointsForOpponentClassement(opponent1Classement)

  if (opponent2Classement === undefined) {
    throw new Error(`Un second classement adverse est requis pour la discipline "${discipline}"`)
  }
  return (pointsForOpponentClassement(opponent1Classement) + pointsForOpponentClassement(opponent2Classement)) / 2
}
