import { MAX_DISCIPLINE_GAP } from './constants'

export interface DisciplineClassements {
  simple: number
  double: number
  mixte: number
}

/**
 * Article 712.1 : le classement le plus élevé (le meilleur) d'un joueur détermine la
 * limite basse — c'est-à-dire la pire valeur tolérée — de ses deux autres classements,
 * qui ne peuvent s'en écarter de plus de 2.
 */
export function enforceDisciplineLimit(classements: DisciplineClassements): DisciplineClassements {
  const best = Math.min(classements.simple, classements.double, classements.mixte)
  const worstAllowed = best + MAX_DISCIPLINE_GAP

  return {
    simple: Math.min(classements.simple, worstAllowed),
    double: Math.min(classements.double, worstAllowed),
    mixte: Math.min(classements.mixte, worstAllowed),
  }
}
