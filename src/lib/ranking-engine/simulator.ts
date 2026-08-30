import { PALIER_MONTEE } from './constants'
import { computeMoyenneMontee } from './moyennes'
import type { Discipline, RawMatch } from './types'

export interface SimulationInput {
  matches: RawMatch[]
  discipline: Discipline
  classement: number
  referenceDate: Date
  /** Classement du prochain adversaire hypothétique (le même à chaque victoire simulée). */
  hypotheticalOpponentClassement: number
  /** Discipline double/mixte uniquement : second adversaire hypothétique. */
  hypotheticalOpponent2Classement?: number
}

export interface SimulationResult {
  currentAverage: number
  seuil: number | null
  alreadyQualifies: boolean
  /** Nombre de victoires hypothétiques nécessaires, null si non atteignable (classement 1, ou > 30 victoires). */
  winsNeeded: number | null
}

const SEARCH_BOUND = 30

/**
 * Simulateur "combien de victoires me faut-il pour monter ?" : rejoue le moteur de
 * moyennes en ajoutant des victoires hypothétiques (contre un adversaire de classement
 * donné) jusqu'à atteindre le palier de montée du classement supérieur.
 */
export function simulateWinsNeededToPromote(input: SimulationInput): SimulationResult {
  const { matches, discipline, classement, referenceDate, hypotheticalOpponentClassement, hypotheticalOpponent2Classement } = input

  const seuil = classement > 1 ? PALIER_MONTEE[classement - 1] : null
  const current = computeMoyenneMontee(matches, discipline, referenceDate)

  if (seuil === null) {
    return { currentAverage: current.average, seuil: null, alreadyQualifies: false, winsNeeded: null }
  }
  if (current.average >= seuil) {
    return { currentAverage: current.average, seuil, alreadyQualifies: true, winsNeeded: 0 }
  }

  for (let n = 1; n <= SEARCH_BOUND; n++) {
    const hypotheticalMatches: RawMatch[] = [
      ...matches,
      ...Array.from({ length: n }, (_, i): RawMatch => ({
        id: `simulation-${i}`,
        discipline,
        date: referenceDate.toISOString(),
        outcome: 'victoire',
        isWalkover: false,
        ownClassement: classement,
        opponent1Classement: hypotheticalOpponentClassement,
        opponent2Classement: hypotheticalOpponent2Classement,
      })),
    ]
    const projected = computeMoyenneMontee(hypotheticalMatches, discipline, referenceDate)
    if (projected.average >= seuil) {
      return { currentAverage: current.average, seuil, alreadyQualifies: false, winsNeeded: n }
    }
  }

  return { currentAverage: current.average, seuil, alreadyQualifies: false, winsNeeded: null }
}
