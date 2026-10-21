import { describe, expect, it } from 'vitest'

import { clearSession, loadSession, saveSession } from '@/core/session'

describe('sesión del canal web', () => {
  it('guarda el JWT con su caducidad y lo devuelve mientras vale', () => {
    saveSession('jwt', 60, 1_000)
    expect(loadSession(30_000)).toEqual({ token: 'jwt', expiresAt: 61_000 })
  })

  it('descarta el JWT caducado', () => {
    saveSession('jwt', 60, 1_000)
    expect(loadSession(61_000)).toBeNull()
    expect(sessionStorage.length).toBe(0)
  })

  it('clearSession la borra', () => {
    saveSession('jwt', 60)
    clearSession()
    expect(loadSession()).toBeNull()
  })
})
