import { describe, expect, it } from 'vitest'
import { computeMoyenneDescente, computeMoyenneMontee } from '../moyennes'
import type { RawMatch } from '../types'

const REFERENCE = new Date('2026-06-01')

function daysAgo(days: number): string {
  return new Date(REFERENCE.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

function match(id: string, overrides: Partial<RawMatch>): RawMatch {
  return {
    id,
    discipline: 'simple',
    date: daysAgo(10),
    outcome: 'defaite',
    isWalkover: false,
    ownClassement: 6,
    opponent1Classement: 6,
    ...overrides,
  }
}

describe('computeMoyenneMontee', () => {
  it('divise par 7 quand moins de 7 matchs valides ont été joués', () => {
    const matches = [
      match('l1', { outcome: 'defaite' }),
      match('l2', { outcome: 'defaite' }),
      match('w1', { outcome: 'victoire', opponent1Classement: 6 }), // 452 points
    ]
    const result = computeMoyenneMontee(matches, 'simple', REFERENCE)
    expect(result.matchCount).toBe(3)
    expect(result.average).toBeCloseTo(452 / 7, 5)
  })

  it('écarte les victoires qui feraient baisser la moyenne une fois 7 matchs atteints', () => {
    const losses = Array.from({ length: 7 }, (_, i) => match(`l${i}`, { outcome: 'defaite' }))
    const bigWin = match('w-big', { outcome: 'victoire', opponent1Classement: 1 }) // 2831 pts
    const smallWin = match('w-small', { outcome: 'victoire', opponent1Classement: 12 }) // 50 pts

    const result = computeMoyenneMontee([...losses, bigWin, smallWin], 'simple', REFERENCE)

    expect(result.matchCount).toBe(8)
    expect(result.average).toBeCloseTo(2831 / 8, 5)
    expect(result.includedMatchIds).toContain('w-big')
    expect(result.includedMatchIds).not.toContain('w-small')
  })

  it('ignore les matchs de plus de 52 semaines', () => {
    const old = match('old', { outcome: 'victoire', opponent1Classement: 1, date: daysAgo(400) })
    const recent = match('recent', { outcome: 'victoire', opponent1Classement: 12, date: daysAgo(5) })

    const result = computeMoyenneMontee([old, recent], 'simple', REFERENCE)

    expect(result.includedMatchIds).toEqual(['recent'])
  })

  it('plafonne à 20 matchs valides, en gardant les plus récents', () => {
    const matches = Array.from({ length: 25 }, (_, i) =>
      match(`m${i}`, { outcome: 'defaite', date: daysAgo(i) }),
    )
    const result = computeMoyenneMontee(matches, 'simple', REFERENCE)
    expect(result.matchCount).toBe(20)
    expect(result.includedMatchIds).toContain('m0')
    expect(result.includedMatchIds).not.toContain('m24')
  })

  it('exclut du calcul les défaites contre un adversaire trop fort en simple', () => {
    const tooStrong = match('too-strong', { ownClassement: 6, opponent1Classement: 3 })
    const result = computeMoyenneMontee([tooStrong], 'simple', REFERENCE)
    expect(result.matchCount).toBe(0)
  })
})

describe('computeMoyenneDescente', () => {
  it('divise toujours par le nombre réel de matchs, même sous 7', () => {
    const matches = [match('l1', { outcome: 'defaite' }), match('l2', { outcome: 'defaite' })]
    const result = computeMoyenneDescente(matches, 'simple', REFERENCE)
    expect(result.matchCount).toBe(2)
    expect(result.average).toBe(0)
  })

  it('exclut aussi les défaites contre un adversaire exactement un classement au-dessus', () => {
    const closeLoss = match('close', { ownClassement: 6, opponent1Classement: 5 })
    const win = match('w', { outcome: 'victoire', opponent1Classement: 6 })
    const result = computeMoyenneDescente([closeLoss, win], 'simple', REFERENCE)
    expect(result.matchCount).toBe(1)
    expect(result.average).toBe(452)
  })
})
