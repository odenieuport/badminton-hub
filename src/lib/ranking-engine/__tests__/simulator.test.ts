import { describe, expect, it } from 'vitest'
import { simulateWinsNeededToPromote } from '../simulator'
import type { RawMatch } from '../types'

const REFERENCE = new Date('2026-06-01')

describe('simulateWinsNeededToPromote', () => {
  it('indique 0 victoire nécessaire si le palier est déjà atteint', () => {
    const matches: RawMatch[] = [
      { id: 'w', discipline: 'simple', date: '2026-05-01', outcome: 'victoire', isWalkover: false, ownClassement: 6, opponent1Classement: 1 },
    ]
    const result = simulateWinsNeededToPromote({
      matches,
      discipline: 'simple',
      classement: 6,
      referenceDate: REFERENCE,
      hypotheticalOpponentClassement: 6,
    })
    expect(result.alreadyQualifies).toBe(true)
    expect(result.winsNeeded).toBe(0)
  })

  it('calcule un nombre de victoires positif quand le palier n’est pas atteint', () => {
    const result = simulateWinsNeededToPromote({
      matches: [],
      discipline: 'simple',
      classement: 6,
      referenceDate: REFERENCE,
      hypotheticalOpponentClassement: 6, // 452 points par victoire
    })
    expect(result.alreadyQualifies).toBe(false)
    expect(result.winsNeeded).not.toBeNull()
    expect(result.winsNeeded!).toBeGreaterThan(0)
  })

  it('retourne null pour un joueur déjà classement 1', () => {
    const result = simulateWinsNeededToPromote({
      matches: [],
      discipline: 'simple',
      classement: 1,
      referenceDate: REFERENCE,
      hypotheticalOpponentClassement: 6,
    })
    expect(result.seuil).toBeNull()
    expect(result.winsNeeded).toBeNull()
  })
})
