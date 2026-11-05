import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { Layout } from '@/components/Layout'
import { AuthProvider, useAuth } from '@/core/auth'
import { Credentials } from '@/pages/Credentials'
import { Galleries } from '@/pages/Galleries'
import { GalleryDetail } from '@/pages/GalleryDetail'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Verify } from '@/pages/Verify'

function RequireSession({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  return token ? <Navigate to="/galleries" replace /> : children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<Register />} />
      <Route element={<RequireSession><Layout /></RequireSession>}>
        <Route path="/galleries" element={<Galleries />} />
        <Route path="/galleries/:galleryId" element={<GalleryDetail />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/credentials" element={<Credentials />} />
      </Route>
      <Route path="*" element={<Navigate to="/galleries" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
