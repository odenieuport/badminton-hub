import { describe, expect, it } from 'vitest'
import { evaluateClassement } from '../evaluation'

const EVAL_DATE = new Date('2026-06-01')

describe('evaluateClassement', () => {
  it('fait monter un joueur qui atteint le palier de montée du classement supérieur', () => {
    const result = evaluateClassement({
      classement: 6,
      moyenneMontee: 320, // >= palier montée classement 5 (316)
      moyenneDescente: 0,
      protectedUntil: null,
      evaluationDate: EVAL_DATE,
    })
    expect(result).toMatchObject({ classement: 5, direction: 'montee' })
    expect(new Date(result.protectedUntil!).getTime()).toBeGreaterThan(EVAL_DATE.getTime())
  })

  it('fait descendre un joueur dont la moyenne de descente tombe sous le palier', () => {
    const result = evaluateClassement({
      classement: 6,
      moyenneMontee: 100, // < 219, la moyenne de descente est donc prise en compte
      moyenneDescente: 100, // <= palier descente classement 7 (158)
      protectedUntil: null,
      evaluationDate: EVAL_DATE,
    })
    expect(result).toMatchObject({ classement: 7, direction: 'descente' })
  })

  it("ne change rien si aucun des deux paliers n'est atteint", () => {
    const result = evaluateClassement({
      classement: 6,
      moyenneMontee: 200,
      moyenneDescente: 200,
      protectedUntil: null,
      evaluationDate: EVAL_DATE,
    })
    expect(result).toMatchObject({ classement: 6, direction: null })
  })

  it('bloque une descente tant que la protection de 26 semaines court', () => {
    const protectedUntil = new Date(EVAL_DATE.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString()
    const result = evaluateClassement({
      classement: 6,
      moyenneMontee: 100,
      moyenneDescente: 0, // qualifierait largement pour une descente
      protectedUntil,
      evaluationDate: EVAL_DATE,
    })
    expect(result).toMatchObject({ classement: 6, direction: null, protectedUntil })
  })

  it('autorise une nouvelle montée même pendant une protection contre la descente', () => {
    const protectedUntil = new Date(EVAL_DATE.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString()
    const result = evaluateClassement({
      classement: 6,
      moyenneMontee: 320,
      moyenneDescente: 0,
      protectedUntil,
      evaluationDate: EVAL_DATE,
    })
    expect(result.classement).toBe(5)
    expect(result.direction).toBe('montee')
  })

  it('ne fait jamais monter au-delà du classement 1, ni descendre en dessous de 12', () => {
    const top = evaluateClassement({
      classement: 1,
      moyenneMontee: 999999,
      moyenneDescente: 999999,
      protectedUntil: null,
      evaluationDate: EVAL_DATE,
    })
    expect(top.classement).toBe(1)

    const bottom = evaluateClassement({
      classement: 12,
      moyenneMontee: 0,
      moyenneDescente: 0,
      protectedUntil: null,
      evaluationDate: EVAL_DATE,
    })
    expect(bottom.classement).toBe(12)
  })
})
