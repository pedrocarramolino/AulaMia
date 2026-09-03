import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { Cargando } from './ui'

export function RutaProtegida({ children }: { children: ReactNode }) {
  const { session, cargando } = useAuth()
  const location = useLocation()

  if (cargando) return <Cargando />
  if (!session) return <Navigate to="/acceso" replace state={{ desde: location.pathname }} />

  return <>{children}</>
}
