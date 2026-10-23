import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

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
