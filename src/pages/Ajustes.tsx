import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CabeceraPagina, Tarjeta, Boton } from '@/components/ui'
import { Select, Input } from '@/components/campos'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthProvider'
import { useTema, type Tema } from '@/lib/tema'
import {
  IconoSol,
  IconoLuna,
  IconoSistema,
  IconoFlechaIzq,
} from '@/components/iconos'
import { usePreferencias, useGuardarPreferencias } from '@/features/recordatorios/api'
import { CopiasSeguridad } from '@/features/copias/CopiasSeguridad'
import { NotificacionesPush } from '@/features/copias/NotificacionesPush'

const DIAS_EXAMEN = [1, 3, 7, 14]

function CambiarContrasena() {
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [estado, setEstado] = useState<'idle' | 'guardando' | 'hecho'>('idle')
  const [error, setError] = useState('')

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (p1.length < 8) return setError('Mínimo 8 caracteres.')
    if (p1 !== p2) return setError('No coinciden.')
    setError('')
    setEstado('guardando')
    const { error } = await supabase.auth.updateUser({ password: p1 })
    if (error) {
      setEstado('idle')
      setError(error.message)
    } else {
      setEstado('hecho')
      setP1('')
      setP2('')
      setTimeout(() => {
        setEstado('idle')
        setAbierto(false)
      }, 2000)
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="mt-3 text-sm font-medium text-accent-ink hover:underline"
      >
        Cambiar contraseña
      </button>
    )
  }

  return (
    <form onSubmit={guardar} className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
      <Input
        type="password"
        placeholder="Nueva contraseña (mín. 8)"
        autoComplete="new-password"
        minLength={8}
        value={p1}
        onChange={(e) => setP1(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Repite la contraseña"
        autoComplete="new-password"
        value={p2}
        onChange={(e) => setP2(e.target.value)}
        required
      />
      {error && <p role="alert" className="text-xs text-crit">{error}</p>}
      {estado === 'hecho' && <p className="text-xs text-good">Contraseña actualizada.</p>}
      <div className="flex gap-2">
        <Boton type="submit" cargando={estado === 'guardando'} className="px-3 py-1.5 text-sm">
          Guardar
        </Boton>
        <Boton
          type="button"
          variante="secundario"
          className="px-3 py-1.5 text-sm"
          onClick={() => {
            setAbierto(false)
            setError('')
          }}
        >
          Cancelar
        </Boton>
      </div>
    </form>
  )
}

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
          <CambiarContrasena />
        </Tarjeta>

        <CopiasSeguridad />

        <ConfigRecordatorios />

        <NotificacionesPush />
      </div>
    </>
  )
}
