import { Link } from 'react-router-dom'
import { CabeceraPagina, Tarjeta } from '@/components/ui'
import { useAuth } from '@/auth/AuthProvider'
import { useTema, type Tema } from '@/lib/tema'
import {
  IconoSol,
  IconoLuna,
  IconoSistema,
  IconoFlechaIzq,
} from '@/components/iconos'

const OPCIONES_TEMA: { valor: Tema; etiqueta: string; Icono: typeof IconoSol }[] = [
  { valor: 'sistema', etiqueta: 'Sistema', Icono: IconoSistema },
  { valor: 'light', etiqueta: 'Claro', Icono: IconoSol },
  { valor: 'dark', etiqueta: 'Oscuro', Icono: IconoLuna },
]

export function Ajustes() {
  const { user } = useAuth()
  const [tema, fijarTema] = useTema()

  return (
    <>
      <Link
        to="/mas"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <IconoFlechaIzq className="size-4" /> Más
      </Link>
      <CabeceraPagina titulo="Ajustes" />

      <div className="flex flex-col gap-4">
        <Tarjeta>
          <h2 className="font-display text-base font-semibold text-ink">Apariencia</h2>
          <p className="mt-1 text-sm text-muted">Tema de la interfaz.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {OPCIONES_TEMA.map(({ valor, etiqueta, Icono }) => {
              const activo = tema === valor
              return (
                <button
                  key={valor}
                  onClick={() => fijarTema(valor)}
                  aria-pressed={activo}
                  className={[
                    'flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium transition-colors',
                    activo
                      ? 'border-accent bg-accent-soft text-accent-ink'
                      : 'border-line text-muted hover:bg-surface-2',
                  ].join(' ')}
                >
                  <Icono className="size-5" />
                  {etiqueta}
                </button>
              )
            })}
          </div>
        </Tarjeta>

        <Tarjeta>
          <h2 className="font-display text-base font-semibold text-ink">Cuenta</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Correo</dt>
              <dd className="text-ink">{user?.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Idioma</dt>
              <dd className="text-ink">Español · DD/MM/AAAA · semana en lunes</dd>
            </div>
          </dl>
        </Tarjeta>

        <Tarjeta>
          <h2 className="font-display text-base font-semibold text-ink">Copias de seguridad</h2>
          <p className="mt-1 text-sm text-muted">
            Exportar e importar todos tus datos en JSON. Disponible en la Fase 08. Mientras tanto,
            Supabase guarda una copia automática cada día.
          </p>
        </Tarjeta>

        <Tarjeta>
          <h2 className="font-display text-base font-semibold text-ink">Recordatorios</h2>
          <p className="mt-1 text-sm text-muted">
            Avisos antes de cada clase y de los exámenes. Disponible en la Fase 07.
          </p>
        </Tarjeta>
      </div>
    </>
  )
}
