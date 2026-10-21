import { describe, expect, it, vi } from 'vitest'

import { ApiError, request, setUnauthorizedHandler } from '@/api/client'
import * as fr from '@/api/fr'
import { mockFetch } from './helpers'

describe('cliente de la pasarela', () => {
  it('envía el JWT como Bearer y nunca X-API-Key', async () => {
    const calls = mockFetch({ status: 200, body: { items: [], page: 1, pageSize: 20, total: 0 } })
    await fr.listGalleries('jwt-1')
    expect(calls[0].url).toBe('http://localhost:8000/v1/fr/commercial/galleries?page=1&pageSize=20')
    expect(calls[0].headers.authorization).toBe('Bearer jwt-1')
    expect(calls[0].headers).not.toHaveProperty('x-api-key')
  })

  it('el multipart sale sin Content-Type, para que el navegador ponga el boundary', async () => {
    const calls = mockFetch({ status: 200, body: { isTheSame: true, confidence: 0.9 } })
    await fr.verifyPair('jwt-1', new Blob(['a']), new Blob(['b']))
    expect(calls[0].method).toBe('POST')
    expect(calls[0].url).toBe('http://localhost:8000/v1/fr/commercial/verification')
    expect(calls[0].headers).not.toHaveProperty('content-type')
    const form = calls[0].body as FormData
    expect([...form.keys()]).toEqual(['image1', 'image2'])
  })

  it('createGallery omite los opcionales vacíos: el cuerpo está cerrado en el contrato', async () => {
    const calls = mockFetch({ status: 201, body: {} }, { status: 201, body: {} })
    await fr.createGallery('t', { name: 'ACME', description: '', model: undefined })
    await fr.createGallery('t', { name: 'ACME', description: 'd', model: 's' })
    expect(JSON.parse(calls[0].body as string)).toEqual({ name: 'ACME' })
    expect(JSON.parse(calls[1].body as string)).toEqual({ name: 'ACME', description: 'd', model: 's' })
    expect(calls[0].headers['content-type']).toBe('application/json')
  })

  it('convierte un ERROR REPORT en ApiError con su código', async () => {
    mockFetch({ status: 403, body: { code: 'GALLERY_FROZEN_MODEL_NOT_IN_PLAN', message: 'congelada' } })
    const err = (await request('/x', { token: 't' }).catch((e) => e)) as ApiError
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(403)
    expect(err.code).toBe('GALLERY_FROZEN_MODEL_NOT_IN_PLAN')
  })

  it('el 429 de Kong no trae code (docs#82): se rellena con el estado', async () => {
    mockFetch({ status: 429, body: { message: 'API rate limit exceeded' } })
    const err = (await request('/x').catch((e) => e)) as ApiError
    expect(err.code).toBe('HTTP_429')
  })

  it('un 401 con sesión avisa al manejador; sin sesión, no', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    mockFetch({ status: 401, body: { code: 'INVALID_TOKEN', message: 'x' } }, { status: 401, body: { code: 'INVALID_CREDENTIALS', message: 'x' } })
    await request('/con', { token: 't' }).catch(() => {})
    await request('/sin').catch(() => {})
    expect(handler).toHaveBeenCalledTimes(1)
    setUnauthorizedHandler(null)
  })
})
