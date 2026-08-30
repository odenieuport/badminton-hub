export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function formatAverage(value: number): string {
  return value.toLocaleString('fr-BE', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const DISCIPLINE_LABELS: Record<string, string> = {
  simple: 'Simple',
  double: 'Double',
  mixte: 'Mixte',
}

export const COMPETITION_LABELS: Record<string, string> = {
  tournoi: 'Tournoi',
  interclub: 'Interclub',
  championnat: 'Championnat',
}

export function genderLabel(gender: string): string {
  return gender === 'M' ? 'Messieurs' : 'Dames'
}
