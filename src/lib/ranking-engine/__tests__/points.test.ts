import { describe, expect, it } from 'vitest'
import { computeMatchPoints } from '../points'

describe('computeMatchPoints', () => {
  it('rapporte 0 point en cas de défaite, quelle que soit la discipline', () => {
    expect(computeMatchPoints('simple', 'defaite', 1)).toBe(0)
    expect(computeMatchPoints('double', 'defaite', 3, 5)).toBe(0)
  })

  it('applique la grille officielle en simple selon le classement adverse', () => {
    expect(computeMatchPoints('simple', 'victoire', 1)).toBe(2831)
    expect(computeMatchPoints('simple', 'victoire', 6)).toBe(452)
    expect(computeMatchPoints('simple', 'victoire', 12)).toBe(50)
  })

  it('moyenne les points des deux adversaires en double/mixte', () => {
    // (1359 + 652) / 2
    expect(computeMatchPoints('double', 'victoire', 3, 5)).toBe(1005.5)
    expect(computeMatchPoints('mixte', 'victoire', 12, 12)).toBe(50)
  })

  it('rejette un classement adverse hors bornes', () => {
    expect(() => computeMatchPoints('simple', 'victoire', 13)).toThrow(RangeError)
  })

  it('exige un second adversaire en double', () => {
    expect(() => computeMatchPoints('double', 'victoire', 3)).toThrow()
  })
})
