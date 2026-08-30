// Valeurs issues du règlement fédéral C700 (FRBB/LFBB/BV), version 2024.

/** Palier de montée par classement : moyenne de montée minimale requise pour ATTEINDRE ce classement. */
export const PALIER_MONTEE: Record<number, number> = {
  1: 1373,
  2: 951,
  3: 659,
  4: 457,
  5: 316,
  6: 219,
  7: 152,
  8: 105,
  9: 73,
  10: 51,
  11: 35,
}

/** Palier de descente par classement : moyenne de descente maximale tolérée avant de TOMBER à ce classement. */
export const PALIER_DESCENTE: Record<number, number> = {
  2: 991,
  3: 686,
  4: 476,
  5: 330,
  6: 228,
  7: 158,
  8: 110,
  9: 76,
  10: 53,
  11: 36,
  12: 25,
}

/** Points de classement gagnés en cas de victoire, selon le classement de l'adversaire. */
export const POINTS_GRID: Record<number, number> = {
  1: 2831,
  2: 1961,
  3: 1359,
  4: 942,
  5: 652,
  6: 452,
  7: 313,
  8: 217,
  9: 150,
  10: 104,
  11: 72,
  12: 50,
}

export const MIN_CLASSEMENT = 1
export const MAX_CLASSEMENT = 12

/** Article 715.1 : fenêtre glissante prise en compte pour les moyennes. */
export const EVALUATION_WINDOW_WEEKS = 52

/** Article 715.4 : nombre maximum de matchs valides pris en compte pour une moyenne. */
export const MAX_VALID_MATCHES = 20

/** Article 715.4 : en dessous de 7 matchs valides, la moyenne de montée est divisée par 7 (et non par le nombre réel). */
export const MOYENNE_MONTEE_MIN_DIVISOR = 7

/** Article 710.4 / 711.4 : durée de protection contre une descente après un changement de classement. */
export const PROTECTION_WEEKS = 26

/** Article 716.1 : nombre de matchs en dessous duquel un joueur est "inactif" pour une discipline. */
export const INACTIVE_MATCH_THRESHOLD = 3

/** Article 716.2 : au-delà de cette inactivité, plus aucune moyenne n'est prise en compte (classement gelé). */
export const INACTIVITY_WEEKS_FREEZE = 52

/** Article 716.2 : au-delà de cette inactivité consécutive, le joueur descend de classement. */
export const INACTIVITY_WEEKS_DEMOTE = 104

export const INACTIVITY_DEMOTE_STEPS = 2

/** Article 716.2 : la descente pour inactivité est plafonnée au classement 11. */
export const INACTIVITY_DEMOTE_CAP = 11

/** Article 712.1 : écart maximum toléré entre les classements des 3 disciplines d'un même joueur. */
export const MAX_DISCIPLINE_GAP = 2
