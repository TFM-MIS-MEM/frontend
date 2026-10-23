// URL pública de la pasarela. El panel solo habla con ella: nunca con un
// microservicio directamente. No es un secreto, así que puede ir en el bundle.
export const GATEWAY_URL: string = (import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:8000').replace(/\/$/, '')

// La tarifa publicada en SPHERE, en la versión que el SaaS tiene FIJADA
// (pricing-microservice/pricing/sphere.env, la misma que carga SPACE). Nunca
// `latestVersionId`: en cuanto hubiera una versión nueva, el panel enseñaría
// una tarifa y SPACE aplicaría otra. Llegan al build desde dev-up.sh, que las
// exporta de sphere.env; no son secretos.
export const SPHERE_API_URL = 'https://sphere.score.us.es/api/v1'

export function spherePricing(): { pricingId: string; versionId: string } | null {
  const pricingId = import.meta.env.VITE_SPHERE_PRICING_ID
  const versionId = import.meta.env.VITE_SPHERE_PRICING_VERSION_ID
  return pricingId && versionId ? { pricingId, versionId } : null
}
