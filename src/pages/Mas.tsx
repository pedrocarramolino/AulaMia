import { Link } from 'react-router-dom'
import { CabeceraPagina } from '@/components/ui'
import { useAuth } from '@/auth/AuthProvider'
import {
  IconoPlanificador,
  IconoDisponibilidad,
  IconoEstadisticas,
  IconoMateria,
  IconoAjustes,
  IconoSalir,
  IconoFlechaDer,
} from '@/components/iconos'

const SECCIONES = [
  { a: '/mas/planificador', etiqueta: 'Planificador inteligente', nota: 'Fase 07', Icono: IconoPlanificador },
  { a: '/mas/disponibilidad', etiqueta: 'Disponibilidad', nota: 'Fase 03', Icono: IconoDisponibilidad },
  { a: '/mas/estadisticas', etiqueta: 'Estadísticas', nota: 'Fase 07', Icono: IconoEstadisticas },
  { a: '/mas/materias', etiqueta: 'Materias', nota: 'Disponible', Icono: IconoMateria },
  { a: '/mas/ajustes', etiqueta: 'Ajustes', nota: 'Disponible', Icono: IconoAjustes },
]

export function Mas() {
  const { user, cerrarSesion } = useAuth()

  return (
    <>
      <CabeceraPagina titulo="Más" subtitulo={user?.email ?? undefined} />

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {SECCIONES.map(({ a, etiqueta, nota, Icono }) => (
          <li key={a}>
            <Link
              to={a}
              className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-2"
            >
              <Icono className="size-5 shrink-0 text-muted" />
              <span className="font-medium text-ink">{etiqueta}</span>
              <span className="ml-auto font-mono text-[11px] text-muted">{nota}</span>
              <IconoFlechaDer className="size-4 text-line-strong" />
            </Link>
          </li>
        ))}
      </ul>

      <button
        onClick={cerrarSesion}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-crit transition-colors hover:bg-crit-soft"
      >
        <IconoSalir className="size-5" />
        Cerrar sesión
      </button>
    </>
  )
}
