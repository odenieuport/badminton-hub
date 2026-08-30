import type { RawMatch } from './types'

/** "Niveau" total engagé côté joueur : son classement seul en simple, ou la somme avec son partenaire en double/mixte. */
function ownLevel(match: RawMatch): number {
  return match.ownClassement + (match.discipline === 'simple' ? 0 : (match.partnerClassement ?? match.ownClassement))
}

/** "Niveau" total engagé côté adverse : classement seul en simple, ou somme des deux adversaires en double/mixte. */
function opponentLevel(match: RawMatch): number {
  return match.opponent1Classement + (match.discipline === 'simple' ? 0 : (match.opponent2Classement ?? match.opponent1Classement))
}

/**
 * Article 715.3 : validité de base d'un match, utilisée pour la moyenne de montée.
 * Exclut les résultats non réellement joués (w-o) et les défaites contre un(e)
 * adversaire/paire de plus d'un classement supérieur(e) au total.
 */
export function isBaseValidMatch(match: RawMatch): boolean {
  if (match.isWalkover) return false
  if (match.outcome === 'victoire') return true

  const diff = ownLevel(match) - opponentLevel(match) // > 0 si l'adversaire est mieux classé
  return diff <= 1
}

/**
 * Article 715.5 : validité utilisée pour la moyenne de descente. En plus des exclusions
 * de base, retire les défaites contre un(e) adversaire/paire exactement un classement
 * au-dessus (elles ne pénalisent pas le compteur de matchs valides pour la descente).
 */
export function isValidForDescente(match: RawMatch): boolean {
  if (!isBaseValidMatch(match)) return false
  if (match.outcome === 'defaite') {
    const diff = ownLevel(match) - opponentLevel(match)
    if (diff === 1) return false
  }
  return true
}
