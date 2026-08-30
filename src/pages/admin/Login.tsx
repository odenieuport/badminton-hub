import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Card } from '../../components/ui/Card'
import { Field, Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'

export function AdminLogin() {
  const { session, signInWithPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) {
    const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/admin'
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await signInWithPassword(email, password)
      setLoading(false)
      if (error) setError(error)
      else navigate('/admin')
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setInfo("Compte créé. Un administrateur doit t'accorder les droits avant que tu puisses gérer les données.")
  }

  return (
    <div className="max-w-sm mx-auto py-8">
      <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-1 text-center">Espace admin</h1>
      <p className="text-sm text-[var(--color-text-muted)] text-center mb-6">
        {mode === 'signin' ? 'Connecte-toi pour gérer joueurs et matchs.' : 'Crée un compte (approbation requise ensuite).'}
      </p>

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <Field label="Nom complet">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </Field>
          )}
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Mot de passe">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </Field>

          {error && <p className="text-sm text-[var(--color-down)] mb-4">{error}</p>}
          {info && <p className="text-sm text-[var(--color-up)] mb-4">{info}</p>}

          <Button type="submit" fullWidth disabled={loading}>
            {mode === 'signin' ? 'Se connecter' : 'Créer le compte'}
          </Button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setInfo(null)
          }}
          className="w-full text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mt-4"
        >
          {mode === 'signin' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
      </Card>
    </div>
  )
}
