import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { ErrorAlert } from '@/components/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/core/auth'
import { AuthCard } from './AuthCard'

// POST /v1/auth/login (login)
export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/galleries')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Iniciar sesión" description="Panel del cliente del servicio de reconocimiento facial.">
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <ErrorAlert error={error} />
        <Button type="submit" disabled={busy}>
          Entrar
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          ¿Sin cuenta? <Link className="underline" to="/register">Regístrate</Link>
        </p>
      </form>
    </AuthCard>
  )
}
