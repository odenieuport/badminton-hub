import { describe, expect, it } from 'vitest'
import { isBaseValidMatch, isValidForDescente } from '../validity'
import type { RawMatch } from '../types'

function match(overrides: Partial<RawMatch>): RawMatch {
  return {
    id: 'm1',
    discipline: 'simple',
    date: '2026-01-05',
    outcome: 'defaite',
    isWalkover: false,
    ownClassement: 6,
    opponent1Classement: 6,
    ...overrides,
  }
}

describe('isBaseValidMatch', () => {
  it('exclut les résultats non joués (walkover)', () => {
    expect(isBaseValidMatch(match({ isWalkover: true, outcome: 'victoire' }))).toBe(false)
  })

  it('valide toujours une victoire', () => {
    expect(isBaseValidMatch(match({ outcome: 'victoire', opponent1Classement: 1 }))).toBe(true)
  })

  it('valide une défaite contre un adversaire de même niveau ou un classement supérieur', () => {
    expect(isBaseValidMatch(match({ ownClassement: 6, opponent1Classement: 6 }))).toBe(true)
    expect(isBaseValidMatch(match({ ownClassement: 6, opponent1Classement: 5 }))).toBe(true)
  })

  it('exclut une défaite contre un adversaire de plus d’un classement supérieur en simple', () => {
    expect(isBaseValidMatch(match({ ownClassement: 6, opponent1Classement: 4 }))).toBe(false)
  })

  it('applique la même règle sur le total des classements en double', () => {
    const base = { discipline: 'double' as const, ownClassement: 6, partnerClassement: 6 }
    // total adverse 11, total joueur 12 => écart de 1, toujours valide
    expect(isBaseValidMatch(match({ ...base, opponent1Classement: 5, opponent2Classement: 6 }))).toBe(true)
    // total adverse 10, écart de 2 => invalide
    expect(isBaseValidMatch(match({ ...base, opponent1Classement: 5, opponent2Classement: 5 }))).toBe(false)
  })
})

describe('isValidForDescente', () => {
  it('exclut en plus les défaites contre un adversaire exactement un classement au-dessus', () => {
    expect(isValidForDescente(match({ ownClassement: 6, opponent1Classement: 5 }))).toBe(false)
  })

  it('reste valide pour une défaite contre un adversaire de même niveau', () => {
    expect(isValidForDescente(match({ ownClassement: 6, opponent1Classement: 6 }))).toBe(true)
  })

  it('reste invalide pour les cas déjà exclus en base', () => {
    expect(isValidForDescente(match({ ownClassement: 6, opponent1Classement: 4 }))).toBe(false)
  })
})
