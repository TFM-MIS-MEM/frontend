import { vi } from 'vitest'

export interface Call {
  url: string
  method: string
  headers: Record<string, string>
  body: BodyInit | null | undefined
}

// Sustituye fetch por una cola de respuestas y registra cada llamada.
export function mockFetch(...responses: Array<{ status: number; body?: unknown }>) {
  const calls: Call[] = []
  const queue = [...responses]
  const fn = vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({
      url,
      method: init.method ?? 'GET',
      headers: Object.fromEntries(Object.entries((init.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v])),
      body: init.body,
    })
    const r = queue.shift() ?? { status: 500, body: { code: 'NO_MOCK', message: 'sin respuesta preparada' } }
    const text = r.body === undefined ? '' : JSON.stringify(r.body)
    return new Response(r.status === 204 ? null : text, { status: r.status })
  })
  vi.stubGlobal('fetch', fn)
  return calls
}

// Igual, pero responde por «MÉTODO ruta»: para pantallas que lanzan varias
// peticiones en paralelo y cuyo orden no es parte de lo que se comprueba.
export function mockRoutes(routes: Record<string, { status: number; body?: unknown }>) {
  const calls: Call[] = []
  const fn = vi.fn(async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET'
    calls.push({
      url,
      method,
      headers: Object.fromEntries(Object.entries((init.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v])),
      body: init.body,
    })
    const r = routes[`${method} ${new URL(url).pathname}`] ?? { status: 500, body: { code: 'NO_MOCK', message: url } }
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), { status: r.status })
  })
  vi.stubGlobal('fetch', fn)
  return calls
}
