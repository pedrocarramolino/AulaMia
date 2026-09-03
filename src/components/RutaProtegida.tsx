import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { Cargando } from './ui'

export function RutaProtegida({ children }: { children: ReactNode }) {
  const { session, cargando } = useAuth()
  const location = useLocation()

  // Vista previa de desarrollo: permite recorrer la interfaz sin sesión.
  // Las llamadas a datos fallarán por RLS; solo sirve para revisar el diseño.
  const preview =
    import.meta.env.DEV &&
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('aulamia:preview') === '1'

  if (cargando) return <Cargando />
  if (!session && !preview)
    return <Navigate to="/acceso" replace state={{ desde: location.pathname }} />

  return <>{children}</>
}
