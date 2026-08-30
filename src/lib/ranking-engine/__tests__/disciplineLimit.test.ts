import { describe, expect, it } from 'vitest'
import { enforceDisciplineLimit } from '../disciplineLimit'

describe('enforceDisciplineLimit', () => {
  it("ne change rien si l'écart est déjà dans la limite", () => {
    const result = enforceDisciplineLimit({ simple: 4, double: 5, mixte: 6 })
    expect(result).toEqual({ simple: 4, double: 5, mixte: 6 })
  })

  it('plafonne les disciplines trop en retard par rapport à la meilleure', () => {
    const result = enforceDisciplineLimit({ simple: 2, double: 9, mixte: 5 })
    expect(result).toEqual({ simple: 2, double: 4, mixte: 4 })
  })
})
