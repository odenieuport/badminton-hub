import { MAX_CLASSEMENT, MIN_CLASSEMENT, PALIER_DESCENTE, PALIER_MONTEE, PROTECTION_WEEKS } from './constants'

export type ChangeDirection = 'montee' | 'descente' | null

export interface EvaluationInput {
  classement: number
  moyenneMontee: number
  moyenneDescente: number
  /** ISO date : tant que cette date n'est pas dépassée, aucune descente n'est appliquée. */
  protectedUntil: string | null
  evaluationDate: Date
}

export interface EvaluationResult {
  classement: number
  direction: ChangeDirection
  protectedUntil: string | null
}

function addWeeks(date: Date, weeks: number): Date {
  return new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
}

/**
 * Articles 710/711/713 : évalue un classement à la date pivot. Un joueur ne peut
 * monter/descendre que d'un seul classement par évaluation, et toute descente
 * consécutive à un changement récent est bloquée pendant 26 semaines (art. 710.4/711.4).
 */
export function evaluateClassement(input: EvaluationInput): EvaluationResult {
  const { classement, moyenneMontee, moyenneDescente, protectedUntil, evaluationDate } = input

  const seuilMontee = classement > MIN_CLASSEMENT ? PALIER_MONTEE[classement - 1] : undefined
  if (seuilMontee !== undefined && moyenneMontee >= seuilMontee) {
    return {
      classement: classement - 1,
      direction: 'montee',
      protectedUntil: addWeeks(evaluationDate, PROTECTION_WEEKS).toISOString(),
    }
  }

  const isProtected = protectedUntil !== null && new Date(protectedUntil) > evaluationDate
  if (!isProtected) {
    const seuilDescente = classement < MAX_CLASSEMENT ? PALIER_DESCENTE[classement + 1] : undefined
    if (seuilDescente !== undefined && moyenneDescente <= seuilDescente) {
      return {
        classement: classement + 1,
        direction: 'descente',
        protectedUntil: addWeeks(evaluationDate, PROTECTION_WEEKS).toISOString(),
      }
    }
  }

  return { classement, direction: null, protectedUntil }
}
