import { GATEWAY_URL } from '@/core/config'
import type { ErrorReport } from './types'

// Error de la API con el cuerpo ERROR REPORT del contrato. Las respuestas de la
// pasarela lo cumplen igual que las de los servicios, salvo el 429 del
// limitador de Kong, que no trae `code` (docs#82): se rellena con el estado.
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: Record<string, unknown>

  constructor(status: number, report: Partial<ErrorReport>) {
    super(report.message ?? `HTTP ${status}`)
    this.status = status
    this.code = report.code ?? `HTTP_${status}`
    this.details = report.details
  }
}

interface RequestOptions {
  method?: string
  token?: string | null
  json?: unknown
  form?: FormData
}

let onUnauthorized: (() => void) | null = null

// La aplicación registra aquí qué hacer con un 401 en una petición con sesión:
// el JWT ha caducado o ya no es válido, y la única salida es volver a entrar.
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

// Única puerta de salida del panel hacia la pasarela. Solo envía
// `Authorization: Bearer`, el canal web: X-API-Key no está en las cabeceras
// permitidas del CORS de la pasarela, y aunque lo estuviera no debe salir de un
// navegador (CLAUDE.md, «Seguridad»).
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`

  let body: BodyInit | undefined
  if (opts.form) {
    // Sin Content-Type: lo pone el navegador, con el boundary del multipart.
    body = opts.form
  } else if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.json)
  }

  const res = await fetch(`${GATEWAY_URL}${path}`, { method: opts.method ?? 'GET', headers, body })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let data: unknown = undefined
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  if (!res.ok) {
    if (res.status === 401 && opts.token && onUnauthorized) onUnauthorized()
    throw new ApiError(res.status, (data ?? {}) as Partial<ErrorReport>)
  }
  return data as T
}
