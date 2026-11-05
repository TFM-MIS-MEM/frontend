// URL pública de la pasarela. El panel solo habla con ella: nunca con un
// microservicio directamente. No es un secreto, así que puede ir en el bundle.
export const GATEWAY_URL: string = (import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:8000').replace(/\/$/, '')

// La tarifa no se pinta en el panel: «Pricing» abre su página en SPHERE, en la
// versión que el SaaS tiene FIJADA (pricing-microservice/pricing/sphere.env, la
// misma que carga SPACE). Nunca la última: en cuanto hubiera una versión nueva,
// el panel enseñaría una tarifa y SPACE aplicaría otra. SPHERE abre la versión
// que nombra `?version=` (por id) y, si no la encuentra, la más reciente sin
// avisar. Llegan al build desde dev-up.sh, que las exporta de sphere.env; no
// son secretos.
export const SPHERE_URL = 'https://sphere.score.us.es'

export function spherePricingUrl(): string | null {
  const pricingId = import.meta.env.VITE_SPHERE_PRICING_ID
  const versionId = import.meta.env.VITE_SPHERE_PRICING_VERSION_ID
  if (!pricingId || !versionId) return null
  return `${SPHERE_URL}/p/${encodeURIComponent(pricingId)}?version=${encodeURIComponent(versionId)}`
}
