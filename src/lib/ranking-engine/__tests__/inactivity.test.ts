import { describe, expect, it } from 'vitest'
import { applyInactivityRule, getInactivityStatus } from '../inactivity'
import type { RawMatch } from '../types'

const REFERENCE = new Date('2026-06-01')

function daysAgo(days: number): string {
  return new Date(REFERENCE.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

function match(id: string, date: string): RawMatch {
  return {
    id,
    discipline: 'simple',
    date,
    outcome: 'defaite',
    isWalkover: false,
    ownClassement: 6,
    opponent1Classement: 6,
  }
}

describe('getInactivityStatus', () => {
  it("n'est pas inactif avec au moins 3 matchs sur 52 semaines", () => {
    const matches = [match('a', daysAgo(10)), match('b', daysAgo(20)), match('c', daysAgo(30))]
    expect(getInactivityStatus(matches, 'simple', REFERENCE).isInactive).toBe(false)
  })

  it('est inactif avec moins de 3 matchs, et calcule les semaines depuis le dernier match', () => {
    const matches = [match('a', daysAgo(70))]
    const status = getInactivityStatus(matches, 'simple', REFERENCE)
    expect(status.isInactive).toBe(true)
    expect(status.weeksSinceLastMatch).toBeCloseTo(10, 1)
  })
})

describe('applyInactivityRule', () => {
  it('ne change rien avant 52 semaines', () => {
    const result = applyInactivityRule(6, { isInactive: true, weeksSinceLastMatch: 30 }, { alreadyDemoted: false })
    expect(result).toMatchObject({ classement: 6, frozen: false })
  })

  it('gèle le classement entre 52 et 104 semaines', () => {
    const result = applyInactivityRule(6, { isInactive: true, weeksSinceLastMatch: 60 }, { alreadyDemoted: false })
    expect(result).toMatchObject({ classement: 6, frozen: true, alreadyDemoted: false })
  })

  it('fait descendre de 2 classements au-delà de 104 semaines, une seule fois', () => {
    const first = applyInactivityRule(6, { isInactive: true, weeksSinceLastMatch: 110 }, { alreadyDemoted: false })
    expect(first).toMatchObject({ classement: 8, frozen: true, alreadyDemoted: true })

    const second = applyInactivityRule(8, { isInactive: true, weeksSinceLastMatch: 120 }, { alreadyDemoted: true })
    expect(second).toMatchObject({ classement: 8, frozen: true, alreadyDemoted: true })
  })

  it('plafonne la descente pour inactivité au classement 11', () => {
    const result = applyInactivityRule(11, { isInactive: true, weeksSinceLastMatch: 110 }, { alreadyDemoted: false })
    expect(result.classement).toBe(11)
  })
})
