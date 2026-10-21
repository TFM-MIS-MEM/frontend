import { useEffect, useState, type FormEvent } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

import * as fr from '@/api/fr'
import type { VerificationResult } from '@/api/types'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToken } from '@/core/auth'

function ImageInput({ id, label, file, onFile }: { id: string; label: string; file: File | null; onFile: (f: File | null) => void }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="file" accept="image/*" required onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      <div className="bg-muted flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md">
        {url ? <img src={url} alt={label} className="h-full w-full object-cover" /> : <span className="text-muted-foreground text-sm">Sin imagen</span>}
      </div>
    </div>
  )
}

// POST /v1/fr/commercial/verification (verifyPair)
export function Verify() {
  const token = useToken()
  const [image1, setImage1] = useState<File | null>(null)
  const [image2, setImage2] = useState<File | null>(null)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!image1 || !image2) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      setResult(await fr.verifyPair(token, image1, image2))
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificación de dos imágenes</CardTitle>
        <CardDescription>¿Es la misma persona? Compara el rostro principal de cada imagen. No guarda nada.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <ImageInput id="image1" label="Imagen 1" file={image1} onFile={setImage1} />
            <ImageInput id="image2" label="Imagen 2" file={image2} onFile={setImage2} />
          </div>
          <Button type="submit" disabled={busy || !image1 || !image2}>
            {busy ? 'Verificando…' : 'Verificar'}
          </Button>
          <ErrorAlert error={error} />
          {result && (
            <div data-testid="result" className="flex items-center gap-4 rounded-lg border p-4">
              {result.isTheSame ? (
                <CheckCircle2 className="text-success size-8" />
              ) : (
                <XCircle className="text-destructive size-8" />
              )}
              <div className="grid gap-1">
                <p className="font-semibold">{result.isTheSame ? 'La misma persona' : 'Personas distintas'}</p>
                <p className="text-muted-foreground text-sm">
                  Confianza {(result.confidence * 100).toFixed(1)} %
                  {result.thresholdUsed !== undefined && ` · umbral ${(result.thresholdUsed * 100).toFixed(1)} %`}
                  {result.model && ` · modelo ${result.model}`}
                </p>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
