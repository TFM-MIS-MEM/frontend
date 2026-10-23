import type { Pricing } from 'pricing4ts'

import { SPHERE_API_URL, spherePricing } from '@/core/config'

export class SphereError extends Error {}

// La tarifa en la versión fijada, interpretada con pricing4ts (la misma
// biblioteca y versión que usa SPACE). La API pública de SPHERE admite CORS
// desde cualquier origen (medido en la sesión 22), así que el panel la lee
// directamente, sin pasar por la pasarela. pricing4ts se carga bajo demanda:
// solo la necesita esta vista, y en el bundle principal lo pasaba de 500 kB.
export async function loadPinnedPricing(): Promise<{ pricing: Pricing; permanentUrl: string }> {
  const pinned = spherePricing()
  if (!pinned) {
    throw new SphereError('El panel se construyó sin la versión fijada de la tarifa (VITE_SPHERE_PRICING_VERSION_ID).')
  }
  const res = await fetch(`${SPHERE_API_URL}/public/pricings/${pinned.pricingId}/versions/${pinned.versionId}/yaml`)
  if (!res.ok) {
    throw new SphereError(`SPHERE respondió ${res.status} al pedir la tarifa.`)
  }
  return {
    pricing: (await import('pricing4ts')).retrievePricingFromYaml(await res.text()),
    permanentUrl: `https://sphere.score.us.es/p/${pinned.pricingId}`,
  }
}
