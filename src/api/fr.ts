import { request } from './client'
import type { Gallery, Identity, ModelName, Page, VerificationResult } from './types'

// fr-commercial-microservice/openapi/fr-commercial.yaml, canal web.

const BASE = '/v1/fr/commercial'

export function listGalleries(token: string, page = 1, pageSize = 20) {
  return request<Page<Gallery>>(`${BASE}/galleries?page=${page}&pageSize=${pageSize}`, { token })
}

export interface NewGallery {
  name: string
  description?: string
  model?: ModelName
}

export function createGallery(token: string, g: NewGallery) {
  // Los opcionales vacíos se omiten: el contrato cierra el cuerpo y `model`
  // ausente significa «el modelo por defecto del plan».
  const json: NewGallery = { name: g.name }
  if (g.description) json.description = g.description
  if (g.model) json.model = g.model
  return request<Gallery>(`${BASE}/galleries`, { method: 'POST', token, json })
}

export function getGallery(token: string, galleryId: string) {
  return request<Gallery>(`${BASE}/galleries/${encodeURIComponent(galleryId)}`, { token })
}

export function listIdentities(token: string, galleryId: string, page = 1, pageSize = 20) {
  return request<Page<Identity>>(
    `${BASE}/galleries/${encodeURIComponent(galleryId)}/identities?page=${page}&pageSize=${pageSize}`,
    { token },
  )
}

export function verifyPair(token: string, image1: Blob, image2: Blob) {
  const form = new FormData()
  form.append('image1', image1)
  form.append('image2', image2)
  return request<VerificationResult>(`${BASE}/verification`, { method: 'POST', token, form })
}
