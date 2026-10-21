// URL pública de la pasarela. El panel solo habla con ella: nunca con un
// microservicio directamente. No es un secreto, así que puede ir en el bundle.
export const GATEWAY_URL: string = (import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:8000').replace(/\/$/, '')
