import { EVALUATION_WINDOW_WEEKS, MAX_VALID_MATCHES, MOYENNE_MONTEE_MIN_DIVISOR } from './constants'
import { computeMatchPoints } from './points'
import { isBaseValidMatch, isValidForDescente } from './validity'
import type { Discipline, RawMatch } from './types'

export interface MoyenneResult {
  average: number
  matchCount: number
  totalPoints: number
  /** Ids des matchs effectivement retenus dans le calcul (défaites + victoires qui améliorent la moyenne). */
  includedMatchIds: string[]
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

function weeksBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / MS_PER_WEEK
}

function selectRecentMatches(
  matches: RawMatch[],
  discipline: Discipline,
  referenceDate: Date,
  isValid: (match: RawMatch) => boolean,
): RawMatch[] {
  return matches
    .filter((m) => m.discipline === discipline)
    .filter((m) => {
      const date = new Date(m.date)
      return date <= referenceDate && weeksBetween(date, referenceDate) <= EVALUATION_WINDOW_WEEKS
    })
    .filter(isValid)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, MAX_VALID_MATCHES)
}

/**
 * Article 715.4/715.5 : construit la moyenne à partir des matchs déjà sélectionnés
 * (fenêtre de 52 semaines, 20 matchs max, filtrés par validité) en suivant l'ordre imposé :
 * 1) toutes les défaites valides, 2) les victoires par points décroissants qui améliorent
 * la moyenne, 3) les victoires qui la feraient baisser sont ignorées.
 */
function computeAverage(selected: RawMatch[], useMinDivisor: boolean): MoyenneResult {
  const withPoints = selected.map((match) => ({
    match,
    points: computeMatchPoints(match.discipline, match.outcome, match.opponent1Classement, match.opponent2Classement),
  }))

  const losses = withPoints.filter((m) => m.match.outcome === 'defaite')
  const winsByPointsDesc = withPoints.filter((m) => m.match.outcome === 'victoire').sort((a, b) => b.points - a.points)

  const divisorFor = (count: number) => (useMinDivisor && count < MOYENNE_MONTEE_MIN_DIVISOR ? MOYENNE_MONTEE_MIN_DIVISOR : count)
  const averageFor = (total: number, count: number) => (count === 0 ? 0 : total / divisorFor(count))

  let total = 0
  let count = losses.length
  const includedMatchIds = losses.map((m) => m.match.id)

  for (const win of winsByPointsDesc) {
    const currentAverage = averageFor(total, count)
    const candidateAverage = averageFor(total + win.points, count + 1)
    if (candidateAverage > currentAverage) {
      total += win.points
      count += 1
      includedMatchIds.push(win.match.id)
    }
  }

  return { average: averageFor(total, count), matchCount: count, totalPoints: total, includedMatchIds }
}

/** Article 715.4 : moyenne de montée (primaire), avec plancher de diviseur à 7 matchs. */
export function computeMoyenneMontee(matches: RawMatch[], discipline: Discipline, referenceDate: Date): MoyenneResult {
  const selected = selectRecentMatches(matches, discipline, referenceDate, isBaseValidMatch)
  return computeAverage(selected, true)
}

/** Article 715.5 : moyenne de descente (secondaire), toujours divisée par le nombre réel de matchs. */
export function computeMoyenneDescente(matches: RawMatch[], discipline: Discipline, referenceDate: Date): MoyenneResult {
  const selected = selectRecentMatches(matches, discipline, referenceDate, isValidForDescente)
  return computeAverage(selected, false)
}
