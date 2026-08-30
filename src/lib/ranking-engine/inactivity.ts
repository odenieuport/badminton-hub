import {
  EVALUATION_WINDOW_WEEKS,
  INACTIVE_MATCH_THRESHOLD,
  INACTIVITY_DEMOTE_CAP,
  INACTIVITY_DEMOTE_STEPS,
  INACTIVITY_WEEKS_DEMOTE,
  INACTIVITY_WEEKS_FREEZE,
} from './constants'
import type { Discipline, RawMatch } from './types'

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

function weeksBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / MS_PER_WEEK
}

export interface InactivityStatus {
  isInactive: boolean
  /** Semaines écoulées depuis le dernier match réellement joué (null si jamais joué). */
  weeksSinceLastMatch: number | null
}

/** Article 716.1 : un joueur ayant joué moins de 3 matchs sur 52 semaines est "inactif" pour la discipline. */
export function getInactivityStatus(matches: RawMatch[], discipline: Discipline, referenceDate: Date): InactivityStatus {
  const playedInWindow = matches.filter((m) => {
    if (m.discipline !== discipline || m.isWalkover) return false
    const date = new Date(m.date)
    return date <= referenceDate && weeksBetween(date, referenceDate) <= EVALUATION_WINDOW_WEEKS
  })

  if (playedInWindow.length >= INACTIVE_MATCH_THRESHOLD) {
    return { isInactive: false, weeksSinceLastMatch: null }
  }

  const lastMatchDate = matches
    .filter((m) => m.discipline === discipline && !m.isWalkover && new Date(m.date) <= referenceDate)
    .map((m) => new Date(m.date))
    .sort((a, b) => b.getTime() - a.getTime())[0]

  return {
    isInactive: true,
    weeksSinceLastMatch: lastMatchDate ? weeksBetween(lastMatchDate, referenceDate) : Infinity,
  }
}

export interface InactivityState {
  /** Vrai si la descente pour inactivité (art. 716.2, 104 semaines) a déjà été appliquée. */
  alreadyDemoted: boolean
}

export interface InactivityOutcome {
  classement: number
  /** Vrai si le classement doit rester figé cette évaluation, quelles que soient les moyennes. */
  frozen: boolean
  alreadyDemoted: boolean
}

/**
 * Article 716.2 : au-delà de 52 semaines d'inactivité, le classement est gelé (aucune
 * moyenne prise en compte). Au-delà de 104 semaines consécutives, le joueur descend de
 * deux classements (plafonné à 11), une seule fois, puis reste gelé jusqu'au retour à l'activité.
 */
export function applyInactivityRule(classement: number, status: InactivityStatus, state: InactivityState): InactivityOutcome {
  if (!status.isInactive || status.weeksSinceLastMatch === null) {
    return { classement, frozen: false, alreadyDemoted: false }
  }

  if (status.weeksSinceLastMatch >= INACTIVITY_WEEKS_DEMOTE) {
    if (state.alreadyDemoted) {
      return { classement, frozen: true, alreadyDemoted: true }
    }
    return { classement: Math.min(classement + INACTIVITY_DEMOTE_STEPS, INACTIVITY_DEMOTE_CAP), frozen: true, alreadyDemoted: true }
  }

  if (status.weeksSinceLastMatch >= INACTIVITY_WEEKS_FREEZE) {
    return { classement, frozen: true, alreadyDemoted: state.alreadyDemoted }
  }

  return { classement, frozen: false, alreadyDemoted: false }
}
