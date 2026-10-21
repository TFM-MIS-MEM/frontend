import { AlertCircle } from 'lucide-react'

import { ApiError } from '@/api/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Muestra un ERROR REPORT tal como llega: el `code` es lo que distingue, por
// ejemplo, una cuota agotada de una denegación por plan, ambas 403.
export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null
  const title = error instanceof ApiError ? `${error.status} · ${error.code}` : 'Error'
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof TypeError
        ? 'No se ha podido contactar con la pasarela.'
        : String(error)
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
