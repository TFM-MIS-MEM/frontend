import { NavLink, Outlet } from 'react-router'
import { LogOut, ScanFace } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/core/auth'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/galleries', label: 'Galerías' },
  { to: '/verify', label: 'Verificación' },
  { to: '/credentials', label: 'Credenciales' },
  { to: '/plans', label: 'Planes' },
]

export function Layout() {
  const { account, logout } = useAuth()
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="flex items-center gap-2 font-semibold">
            <ScanFace className="size-5" /> Panel
          </span>
          <nav className="flex gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn('rounded-md px-3 py-1.5 text-sm', isActive ? 'bg-secondary font-medium' : 'hover:bg-accent')
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{account?.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut /> Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
