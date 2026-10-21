import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AppRoutes } from '@/App'
import { AuthProvider } from '@/core/auth'
import { mockRoutes } from './helpers'

const KEY = 'sk_live_la-clave-que-solo-se-ve-una-vez'

function storageText() {
  const dump = (s: Storage) => Array.from({ length: s.length }, (_, i) => `${s.key(i)}=${s.getItem(s.key(i)!)}`).join('\n')
  return dump(sessionStorage) + dump(localStorage)
}

describe('registro', () => {
  it('muestra la API KEY una vez, no la guarda en el navegador y entra con la sesión', async () => {
    const calls = mockRoutes({
      'POST /v1/auth/register': { status: 201, body: { accountId: 'acc-1', email: 'c@example.com', apiKey: KEY } },
      'POST /v1/auth/login': { status: 200, body: { token: 'jwt-1', expiresIn: 3600 } },
      'GET /v1/fr/commercial/galleries': { status: 200, body: { items: [], page: 1, pageSize: 20, total: 0 } },
      'GET /v1/auth/me': {
        status: 200,
        body: { accountId: 'acc-1', email: 'c@example.com', status: 'ACTIVE', role: 'CUSTOMER', createdAt: '2026-10-21T00:00:00Z' },
      },
    })
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/register']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    )

    await user.type(screen.getByLabelText('Correo'), 'c@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Passw0rd!23')
    await user.click(screen.getByRole('button', { name: 'Registrarme' }))

    expect(await screen.findByTestId('api-key')).toHaveTextContent(KEY)
    expect(storageText()).not.toContain(KEY)

    await user.click(screen.getByRole('button', { name: 'La he guardado' }))

    expect(await screen.findByText('Aún no hay galerías.')).toBeInTheDocument()
    expect(screen.queryByText(KEY)).not.toBeInTheDocument()
    expect(storageText()).not.toContain(KEY)
    expect(storageText()).toContain('jwt-1')

    const seen = calls.map((c) => `${c.method} ${new URL(c.url).pathname}`)
    expect(seen.slice(0, 2)).toEqual(['POST /v1/auth/register', 'POST /v1/auth/login'])
    expect(seen.slice(2).sort()).toEqual(['GET /v1/auth/me', 'GET /v1/fr/commercial/galleries'])
    for (const c of calls) expect(c.headers).not.toHaveProperty('x-api-key')
  })
})
