import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Layout } from '@/components/Layout'
import { AuthProvider } from '@/core/auth'

function renderLayout() {
  render(
    <AuthProvider>
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    </AuthProvider>,
  )
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Pricing', () => {
  it('abre en SPHERE la versión fijada de la tarifa, nunca la última, en otra pestaña', () => {
    vi.stubEnv('VITE_SPHERE_PRICING_ID', 'familia')
    vi.stubEnv('VITE_SPHERE_PRICING_VERSION_ID', 'version-fijada')
    renderLayout()
    const link = screen.getByRole('link', { name: /pricing/i })
    expect(link).toHaveAttribute('href', 'https://sphere.score.us.es/p/familia?version=version-fijada')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('sin la versión fijada en el build no hay enlace: sin ella SPHERE abriría la última', () => {
    vi.stubEnv('VITE_SPHERE_PRICING_ID', 'familia')
    vi.stubEnv('VITE_SPHERE_PRICING_VERSION_ID', '')
    renderLayout()
    expect(screen.queryByRole('link', { name: /pricing/i })).toBeNull()
  })
})
