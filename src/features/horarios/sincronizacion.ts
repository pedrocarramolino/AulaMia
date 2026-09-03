import { useEffect } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { useGenerarClases } from './api'

let yaSincronizado = false

/**
 * Al abrir la app (una vez por carga), pide al servidor que materialice las
 * clases recurrentes del horizonte móvil. El resto del tiempo lo hace pg_cron
 * y los triggers de `horario_recurrente`.
 */
export function useSincronizarClasesAlEntrar() {
  const { session } = useAuth()
  const generar = useGenerarClases()

  useEffect(() => {
    if (!session || yaSincronizado) return
    yaSincronizado = true
    generar.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])
}
