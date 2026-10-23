import type { Pricing } from 'pricing4ts'

import localYaml from '@/assets/fr-commercial-pricing-1.1.yaml?raw'
import { SPHERE_API_URL, spherePricing } from '@/core/config'

export class SphereError extends Error {}

// Copia local de la tarifa, en el bundle, para que la vista de planes no dependa
// de la red en la demo. Es la versión 1.1, la fijada hoy: se usa SOLO si la
// versión fijada del build es esta y SPHERE falla o tarda más de
// SPHERE_TIMEOUT_MS. Con otra versión fijada no se usa: enseñaría una tarifa
// distinta de la que aplica SPACE. tests/plans.test.tsx comprueba que su huella
// funcional es la de la versión fijada.
export const LOCAL_COPY = { version: '1.1', versionId: '6ada81594b2b5b01c587d1f0' }
export const SPHERE_TIMEOUT_MS = 3000

export interface LoadedPricing {
  pricing: Pricing
  permanentUrl: string
  // `true` si viene de la copia local porque SPHERE no estaba disponible.
  local: boolean
}

// La tarifa en la versión fijada, interpretada con pricing4ts (la misma
// biblioteca y versión que usa SPACE). La API pública de SPHERE admite CORS
// desde cualquier origen (medido en la sesión 22), así que el panel la lee
// directamente, sin pasar por la pasarela. pricing4ts se carga bajo demanda:
// solo la necesita esta vista, y en el bundle principal lo pasaba de 500 kB.
export async function loadPinnedPricing(): Promise<LoadedPricing> {
  const pinned = spherePricing()
  if (!pinned) {
    throw new SphereError('El panel se construyó sin la versión fijada de la tarifa (VITE_SPHERE_PRICING_VERSION_ID).')
  }
  const permanentUrl = `https://sphere.score.us.es/p/${pinned.pricingId}`
  const { retrievePricingFromYaml } = await import('pricing4ts')

  let failure: string
  try {
    const res = await fetch(`${SPHERE_API_URL}/public/pricings/${pinned.pricingId}/versions/${pinned.versionId}/yaml`, {
      signal: AbortSignal.timeout(SPHERE_TIMEOUT_MS),
    })
    if (res.ok) {
      return { pricing: retrievePricingFromYaml(await res.text()), permanentUrl, local: false }
    }
    failure = `SPHERE respondió ${res.status} al pedir la tarifa.`
  } catch {
    failure = 'No se ha podido contactar con SPHERE.'
  }

  if (pinned.versionId !== LOCAL_COPY.versionId) {
    throw new SphereError(`${failure} La copia local es de la versión ${LOCAL_COPY.version}, no de la fijada.`)
  }
  return { pricing: retrievePricingFromYaml(localYaml), permanentUrl, local: true }
}
