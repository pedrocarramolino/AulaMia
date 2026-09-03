import { Link } from 'react-router-dom'
import { CabeceraPagina, ConfirmarDialogo } from '@/components/ui'
import { useState } from 'react'
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
  { a: '/mas/planificador', etiqueta: 'Planificador inteligente', Icono: IconoPlanificador },
  { a: '/mas/disponibilidad', etiqueta: 'Disponibilidad', Icono: IconoDisponibilidad },
  { a: '/mas/estadisticas', etiqueta: 'Estadísticas', Icono: IconoEstadisticas },
  { a: '/mas/materias', etiqueta: 'Materias', Icono: IconoMateria },
  { a: '/mas/ajustes', etiqueta: 'Ajustes', Icono: IconoAjustes },
]

export function Mas() {
  const { user, cerrarSesion } = useAuth()
  const [confirmar, setConfirmar] = useState(false)

  return (
    <>
      <CabeceraPagina titulo="Más" subtitulo={user?.email ?? undefined} />

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {SECCIONES.map(({ a, etiqueta, Icono }) => (
          <li key={a}>
            <Link
              to={a}
              className="flex min-h-14 items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-2"
            >
              <Icono className="size-5 shrink-0 text-muted" />
              <span className="flex-1 font-medium text-ink">{etiqueta}</span>
              <IconoFlechaDer className="size-4 shrink-0 text-line-strong" />
            </Link>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setConfirmar(true)}
        className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-crit transition-colors hover:bg-crit-soft"
      >
        <IconoSalir className="size-5" />
        Cerrar sesión
      </button>

      <ConfirmarDialogo
        abierto={confirmar}
        titulo="¿Cerrar sesión?"
        texto="Tendrás que volver a entrar con tu correo."
        confirmar="Cerrar sesión"
        peligro
        onCancelar={() => setConfirmar(false)}
        onConfirmar={cerrarSesion}
      />
    </>
  )
}
