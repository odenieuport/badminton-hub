export type Discipline = 'simple' | 'double' | 'mixte'
export type MatchOutcome = 'victoire' | 'defaite'
export type Sexe = 'M' | 'F'

/**
 * Un match tel que consommé par le moteur de calcul : uniquement les
 * informations nécessaires aux règles du C700, du point de vue d'UN joueur.
 * Pour un double/mixte, `partnerClassement` et `opponent2Classement` sont requis.
 */
export interface RawMatch {
  id: string
  discipline: Discipline
  /** Date ISO du match. */
  date: string
  outcome: MatchOutcome
  /** Victoire ou défaite actée sans réel jeu (forfait, absence d'adversaire...). */
  isWalkover: boolean
  /** Classement du joueur, dans cette discipline, au moment du match. */
  ownClassement: number
  /** Classement du partenaire au moment du match (double/mixte uniquement). */
  partnerClassement?: number
  opponent1Classement: number
  /** Classement du second adversaire (double/mixte uniquement). */
  opponent2Classement?: number
}
