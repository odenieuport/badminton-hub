import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'

const DISCIPLINES = ['simple', 'double', 'mixte'] as const

export function AdminPlayerForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState<'M' | 'F'>('M')
  const [club, setClub] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [isForeign, setIsForeign] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setFirstName(data.first_name)
        setLastName(data.last_name)
        setGender(data.gender as 'M' | 'F')
        setClub(data.club ?? '')
        setLicenseNumber(data.license_number ?? '')
        setIsForeign(data.is_foreign)
      })
  }, [id])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      first_name: firstName,
      last_name: lastName,
      gender,
      club: club || null,
      license_number: licenseNumber || null,
      is_foreign: isForeign,
      updated_at: new Date().toISOString(),
    }

    if (isEditing && id) {
      const { error } = await supabase.from('players').update(payload).eq('id', id)
      setLoading(false)
      if (error) return setError(error.message)
      navigate('/admin/joueurs')
      return
    }

    const { data: player, error } = await supabase.from('players').insert(payload).select().single()
    if (error || !player) {
      setLoading(false)
      return setError(error?.message ?? 'Erreur inconnue')
    }

    // Article 707.3 : un joueur débute avec le classement 12 dans chaque discipline.
    const { error: rankingsError } = await supabase
      .from('player_rankings')
      .insert(DISCIPLINES.map((discipline) => ({ player_id: player.id, discipline, classement: 12 })))

    setLoading(false)
    if (rankingsError) return setError(rankingsError.message)
    navigate('/admin/joueurs')
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{isEditing ? 'Modifier le joueur' : 'Nouveau joueur'}</h2>
      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom">
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </Field>
            <Field label="Nom">
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </Field>
          </div>
          <Field label="Sexe">
            <Select value={gender} onChange={(e) => setGender(e.target.value as 'M' | 'F')}>
              <option value="M">Messieurs</option>
              <option value="F">Dames</option>
            </Select>
          </Field>
          <Field label="Club">
            <Input value={club} onChange={(e) => setClub(e.target.value)} />
          </Field>
          <Field label="Numéro d'affiliation">
            <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 mb-5 text-sm text-[var(--color-text)]">
            <input type="checkbox" checked={isForeign} onChange={(e) => setIsForeign(e.target.checked)} />
            Joueur étranger
          </label>

          {error && <p className="text-sm text-[var(--color-down)] mb-4">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {isEditing ? 'Enregistrer' : 'Créer le joueur'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/joueurs')}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
