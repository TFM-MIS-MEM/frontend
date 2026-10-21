import { useState, type FormEvent } from 'react'

import * as authApi from '@/api/auth'
import { ApiKeyDialog } from '@/components/ApiKeyDialog'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToken } from '@/core/auth'

// POST /v1/auth/rotate-key (rotateKey)
export function Credentials() {
  const token = useToken()
  const [password, setPassword] = useState('')
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await authApi.rotateKey(token, password)
      setPassword('')
      setApiKey(res.apiKey)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>API KEY</CardTitle>
        <CardDescription>
          El servicio solo guarda su hash, así que no puede volver a enseñártela. Si la has perdido o se ha expuesto,
          rótala: la anterior deja de valer y la pasarela tarda hasta 60 s en notarlo, lo que dura su caché.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña actual</Label>
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
          <Button type="submit" variant="destructive" disabled={busy}>
            Rotar la API KEY
          </Button>
        </form>
      </CardContent>
      <ApiKeyDialog apiKey={apiKey} onClose={() => setApiKey(null)} />
    </Card>
  )
}
