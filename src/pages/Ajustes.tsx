import { Link } from 'react-router-dom'
import { CabeceraPagina, Tarjeta } from '@/components/ui'
import { Select } from '@/components/campos'
import { useAuth } from '@/auth/AuthProvider'
import { useTema, type Tema } from '@/lib/tema'
import {
  IconoSol,
  IconoLuna,
  IconoSistema,
  IconoFlechaIzq,
} from '@/components/iconos'
import { usePreferencias, useGuardarPreferencias } from '@/features/recordatorios/api'

const DIAS_EXAMEN = [1, 3, 7, 14]

function ConfigRecordatorios() {
  const { data: pref } = usePreferencias()
  const guardar = useGuardarPreferencias()

  if (!pref) return null

  const toggleDia = (d: number) => {
    const dias = pref.examen_dias.includes(d)
      ? pref.examen_dias.filter((x) => x !== d)
      : [...pref.examen_dias, d].sort((a, b) => b - a)
    guardar.mutate({ examen_dias: dias })
  }

  return (
    <Tarjeta>
      <h2 className="font-display text-base font-semibold text-ink">Recordatorios</h2>
      <p className="mt-1 text-sm text-muted">
        Los avisos aparecen en la pantalla de Hoy. Las notificaciones al móvil llegan
        en la Fase 08.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Antes de cada clase
          <Select
            value={pref.clase_antelacion_min}
            onChange={(e) => guardar.mutate({ clase_antelacion_min: Number(e.target.value) })}
            className="sm:max-w-[12rem]"
          >
            <option value={0}>Desactivado</option>
            <option value={15}>15 minutos antes</option>
            <option value={30}>30 minutos antes</option>
            <option value={60}>1 hora antes</option>
          </Select>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Antes de un examen</span>
          <div className="flex flex-wrap gap-2">
            {DIAS_EXAMEN.map((d) => {
              const activo = pref.examen_dias.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDia(d)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    activo
                      ? 'border-accent bg-accent-soft text-accent-ink'
                      : 'border-line text-muted hover:bg-surface-2'
                  }`}
                >
                  {d} {d === 1 ? 'día' : 'días'}
                </button>
              )
            })}
          </div>
        </div>

        <label className="flex items-center justify-between gap-4 text-sm font-medium text-ink">
          Avisar de clases pendientes de recuperar
          <input
            type="checkbox"
            checked={pref.avisar_recuperaciones}
            onChange={(e) => guardar.mutate({ avisar_recuperaciones: e.target.checked })}
            className="size-4 rounded border-line-strong"
          />
        </label>
      </div>
    </Tarjeta>
  )
}

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

        <ConfigRecordatorios />
      </div>
    </>
  )
}
