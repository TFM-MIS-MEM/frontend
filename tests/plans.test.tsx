import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { render, screen, within } from '@testing-library/react'
import yaml from 'js-yaml'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { LOCAL_COPY } from '@/api/sphere'
import { Plans } from '@/pages/Plans'

// Una tarifa mínima en Pricing2Yaml 3.1: lo que se comprueba es que la vista
// pinta lo que trae la tarifa, sea cual sea, y no unos planes escritos en ella.
const TARIFA = `
saasName: Prueba
syntaxVersion: "3.1"
version: "9.9"
createdAt: "2026-10-22"
currency: EUR
features:
  deteccion:
    description: Localiza rostros. Consume 1 unidad.
    valueType: BOOLEAN
    defaultValue: true
    type: DOMAIN
  busqueda:
    description: Identificación 1:N.
    valueType: BOOLEAN
    defaultValue: false
    type: DOMAIN
usageLimits:
  maxFaces:
    description: Rostros de la cuenta.
    valueType: NUMERIC
    defaultValue: 100
    unit: face
    type: NON_RENEWABLE
    trackable: true
    linkedFeatures:
      - deteccion
plans:
  BASICO:
    description: Para probar.
    price: 0
    unit: account/month
    features: null
    usageLimits: null
  GRANDE:
    description: Para trabajar.
    price: 12.38
    unit: account/month
    features:
      busqueda:
        value: true
    usageLimits:
      maxFaces:
        value: 50000
addOns:
  pack:
    description: Más rostros.
    availableFor:
      - GRANDE
    price: 1.21
    unit: pack/month
    subscriptionConstraints:
      minQuantity: 1
      maxQuantity: 3
      quantityStep: 1
    usageLimitsExtensions:
      maxFaces:
        value: 5000
`

function stubSphere(status = 200) {
  const calls: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      calls.push(url)
      return new Response(status === 200 ? TARIFA : 'no', { status })
    }),
  )
  return calls
}

function renderPlans() {
  render(
    <MemoryRouter>
      <Plans />
    </MemoryRouter>,
  )
}

describe('vista de planes', () => {
  it('pide a SPHERE la versión fijada, nunca la última', async () => {
    vi.stubEnv('VITE_SPHERE_PRICING_ID', 'familia')
    vi.stubEnv('VITE_SPHERE_PRICING_VERSION_ID', 'version-fijada')
    const calls = stubSphere()

    renderPlans()
    await screen.findByText('Para trabajar.')

    expect(calls).toEqual([
      'https://sphere.score.us.es/api/v1/public/pricings/familia/versions/version-fijada/yaml',
    ])
  })

  it('pinta planes, precios, funcionalidades, límites y complementos de la tarifa', async () => {
    vi.stubEnv('VITE_SPHERE_PRICING_ID', 'familia')
    vi.stubEnv('VITE_SPHERE_PRICING_VERSION_ID', 'version-fijada')
    stubSphere()

    renderPlans()

    expect(await screen.findByText(/Tarifa Prueba, versión 9\.9/)).toBeInTheDocument()
    expect(screen.getByText('BASICO')).toBeInTheDocument()
    expect(screen.getAllByText('GRANDE')).toHaveLength(2) // el plan y la insignia del complemento
    expect(screen.getByText('12,38 €')).toBeInTheDocument()

    const search = screen.getByText('Identificación 1:N.').closest('tr')!
    expect(within(search).getAllByLabelText('no incluida')).toHaveLength(1)
    expect(within(search).getAllByLabelText('incluida')).toHaveLength(1)

    const faces = screen.getByText('Rostros de la cuenta.').closest('tr')!
    expect(within(faces).getByText('100')).toBeInTheDocument()
    expect(within(faces).getByText('50.000')).toBeInTheDocument()

    expect(screen.getByText('pack')).toBeInTheDocument()
    expect(screen.getByText('Cantidad: de 1 a 3')).toBeInTheDocument()
    expect(screen.getByText(/\+5000 · Rostros de la cuenta\./)).toBeInTheDocument()
  })

  it('sin la versión fijada en el build, lo dice en lugar de pedir la última', async () => {
    vi.stubEnv('VITE_SPHERE_PRICING_ID', '')
    vi.stubEnv('VITE_SPHERE_PRICING_VERSION_ID', '')
    const calls = stubSphere()

    renderPlans()

    expect(await screen.findByText(/sin la versión fijada/)).toBeInTheDocument()
    expect(calls).toEqual([])
  })

  it('si SPHERE no responde bien, lo dice', async () => {
    vi.stubEnv('VITE_SPHERE_PRICING_ID', 'familia')
    vi.stubEnv('VITE_SPHERE_PRICING_VERSION_ID', 'version-fijada')
    stubSphere(503)

    renderPlans()

    expect(await screen.findByText(/SPHERE respondió 503/)).toBeInTheDocument()
  })
})


// La huella funcional que SPHERE publica para la versión 1.1 (contentHash del
// manifiesto; pricing-microservice/pricing/sphere.env): SHA-256 del YAML
// canonizado, claves ordenadas, sin `saasName`. El algoritmo es el de SPHERE y
// SPACE (`functionalHash`).
const PINNED_HASH = '18880387519a85a9b3ec86827a5b4a4222e8e1fefc9d5684c9da325c72923817'

function functionalHash(text: string): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { saasName, ...functional } = yaml.load(text) as Record<string, unknown>
  const canonical = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(canonical)
      : v && typeof v === 'object' && !(v instanceof Date)
        ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical((v as Record<string, unknown>)[k])]))
        : v
  return createHash('sha256').update(JSON.stringify(canonical(functional))).digest('hex')
}

describe('copia local de la tarifa (sin red)', () => {
  it('es la versión 1.1 fijada: su huella funcional es la que publica SPHERE', () => {
    const local = readFileSync(resolve(__dirname, '../src/assets/fr-commercial-pricing-1.1.yaml'), 'utf8')

    expect(functionalHash(local)).toBe(PINNED_HASH)
    expect((yaml.load(local) as { version: string }).version).toBe(LOCAL_COPY.version)
  })

  it('con SPHERE caído, pinta la copia local y lo dice', async () => {
    vi.stubEnv('VITE_SPHERE_PRICING_ID', 'familia')
    vi.stubEnv('VITE_SPHERE_PRICING_VERSION_ID', LOCAL_COPY.versionId)
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))))

    renderPlans()

    expect(await screen.findByText('Copia local de la versión 1.1; SPHERE no disponible')).toBeInTheDocument()
    expect(screen.getByText(/Tarifa FRSaaS, versión 1\.1/)).toBeInTheDocument()
    expect(screen.getByText('12,38 €')).toBeInTheDocument()
  })

  it('con SPHERE colgado, a los 3 s pinta la copia local', async () => {
    vi.stubEnv('VITE_SPHERE_PRICING_ID', 'familia')
    vi.stubEnv('VITE_SPHERE_PRICING_VERSION_ID', LOCAL_COPY.versionId)
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(init.signal?.reason))),
      ),
    )
    const started = Date.now()

    renderPlans()

    expect(await screen.findByText(/SPHERE no disponible/, {}, { timeout: 6000 })).toBeInTheDocument()
    expect(Date.now() - started).toBeGreaterThanOrEqual(2900)
  }, 10000)

  it('si la versión fijada no es la de la copia, no la usa', async () => {
    vi.stubEnv('VITE_SPHERE_PRICING_ID', 'familia')
    vi.stubEnv('VITE_SPHERE_PRICING_VERSION_ID', 'otra-version')
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))))

    renderPlans()

    expect(await screen.findByText(/La copia local es de la versión 1\.1, no de la fijada/)).toBeInTheDocument()
    expect(screen.queryByText(/Tarifa FRSaaS/)).not.toBeInTheDocument()
  })
})
