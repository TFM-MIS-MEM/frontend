import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import * as authApi from '@/api/auth'
import { ApiKeyDialog } from '@/components/ApiKeyDialog'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/core/auth'
import { AuthCard } from './AuthCard'

// POST /v1/auth/register (register) → muestra la API KEY una vez →
// POST /v1/auth/login (login) con las mismas credenciales.
export function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await authApi.register(email, password)
      setApiKey(res.apiKey)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function afterKey() {
    setApiKey(null)
    try {
      await login(email, password)
      setPassword('')
      navigate('/galleries')
    } catch (err) {
      setError(err)
    }
  }

  return (
    <AuthCard title="Crear cuenta" description="Al registrarte verás tu API KEY. Solo una vez.">
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <ErrorAlert error={error} />
        <Button type="submit" disabled={busy}>
          Registrarme
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          ¿Ya tienes cuenta? <Link className="underline" to="/login">Inicia sesión</Link>
        </p>
      </form>
      <ApiKeyDialog apiKey={apiKey} onClose={afterKey} />
    </AuthCard>
  )
}
