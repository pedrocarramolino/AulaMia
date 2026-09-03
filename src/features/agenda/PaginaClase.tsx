import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Cargando, EstadoVacio, Boton, ConfirmarDialogo } from '@/components/ui'
import { Textarea } from '@/components/campos'
import { IconoFlechaIzq } from '@/components/iconos'
import { AvatarAlumno } from '@/features/alumnos/componentes'
import { fechaCorta, fechaLarga, franja, duracionLegible, aMinutos } from '@/lib/fechas'
import {
  useClase,
  useActualizarClase,
  useReactivarClase,
  type ClaseDetalle,
} from './api'
import { PillEstado } from './componentes'
import { ORIGEN } from './estado'
import { CancelarDialogo, MoverDialogo, RecuperarDialogo } from './dialogos'
import { HistorialCambios } from './HistorialCambios'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function Notas({ clase }: { clase: ClaseDetalle }) {
  const actualizar = useActualizarClase()
  const [texto, setTexto] = useState(clase.notas_profesor ?? '')

  useEffect(() => setTexto(clase.notas_profesor ?? ''), [clase.notas_profesor])

  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      Notas del profesor
      <Textarea
        rows={3}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => {
          if ((texto.trim() || null) !== (clase.notas_profesor ?? null))
            actualizar.mutate({ id: clase.id, cambios: { notas_profesor: texto.trim() || null } })
        }}
        placeholder="Cómo ha ido la clase, qué queda pendiente…"
      />
    </label>
  )
}

export function PaginaClase() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: clase, isLoading, error } = useClase(id)
  const actualizar = useActualizarClase()
  const reactivar = useReactivarClase()

  const [dialogo, setDialogo] = useState<'mover' | 'cancelar' | 'recuperar' | null>(null)
  const [confirmarRealizada, setConfirmarRealizada] = useState(false)

  if (isLoading) return <Cargando />
  if (error || !clase) {
    return (
      <EstadoVacio
        titulo="No se encuentra la clase"
        accion={<Boton onClick={() => navigate('/agenda')}>Volver a la agenda</Boton>}
      />
    )
  }

  const dur = aMinutos(clase.hora_fin) - aMinutos(clase.hora_inicio)
  const cancelada = clase.estado === 'cancelada'
  const pendienteRecuperar = clase.estado === 'pendiente_recuperar'
  const puedeReactivar = cancelada || pendienteRecuperar || clase.estado === 'aplazada'

  const marcarRealizada = () =>
    actualizar.mutate({
      id: clase.id,
      cambios: { estado: clase.estado === 'realizada' ? 'programada' : 'realizada' },
    })

  return (
    <>
      <Link
        to="/agenda"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <IconoFlechaIzq className="size-4" /> Agenda
      </Link>

      <header className="flex items-start gap-3">
        <AvatarAlumno
          nombre={clase.alumno.nombre}
          apellidos={clase.alumno.apellidos}
          color={clase.alumno.color}
          tam="lg"
        />
        <div className="min-w-0 flex-1">
          <Link
            to={`/alumnos/${clase.alumno_id}`}
            className="font-display text-xl font-bold tracking-tight text-ink hover:underline"
          >
            {clase.alumno.nombre} {clase.alumno.apellidos}
          </Link>
          <p className="text-sm text-muted">{clase.materia?.nombre ?? 'Sin materia'}</p>
          <div className="mt-1.5">
            <PillEstado estado={clase.estado} />
          </div>
        </div>
      </header>

      <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
        <dl className="divide-y divide-line text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted">Fecha</dt>
            <dd className="text-right font-medium text-ink">{cap(fechaLarga(clase.fecha))}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted">Hora</dt>
            <dd className="text-right font-medium text-ink">
              {franja(clase.hora_inicio, clase.hora_fin)} · {duracionLegible(dur)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted">Origen</dt>
            <dd className="text-right font-medium text-ink">{ORIGEN[clase.origen]}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-muted">Cobro</dt>
            <dd className="flex items-center gap-2 text-right font-medium text-ink">
              {clase.precio != null ? `${clase.precio} €` : '—'}
              {clase.precio != null && (
                <label className="flex items-center gap-1.5 text-xs font-normal text-muted">
                  <input
                    type="checkbox"
                    checked={clase.cobrada}
                    onChange={(e) =>
                      actualizar.mutate({ id: clase.id, cambios: { cobrada: e.target.checked } })
                    }
                    className="size-4 rounded border-line-strong"
                  />
                  cobrada
                </label>
              )}
            </dd>
          </div>
        </dl>

        {clase.recupera_a_clase_id && (
          <p className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-ink">
            Es la recuperación de otra clase.{' '}
            <Link className="font-medium underline" to={`/agenda/clase/${clase.recupera_a_clase_id}`}>
              Ver la original
            </Link>
          </p>
        )}

        <div className="mt-4">
          <Notas clase={clase} />
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {!cancelada && (
          <Boton
            variante={clase.estado === 'realizada' ? 'secundario' : 'primario'}
            onClick={() => (clase.estado === 'realizada' ? marcarRealizada() : setConfirmarRealizada(true))}
          >
            {clase.estado === 'realizada' ? 'Quitar "realizada"' : 'Marcar realizada'}
          </Boton>
        )}
        {!cancelada && (
          <Boton variante="secundario" onClick={() => setDialogo('mover')}>
            Cambiar horario
          </Boton>
        )}
        {!cancelada && (
          <Boton variante="secundario" onClick={() => setDialogo('cancelar')}>
            Cancelar
          </Boton>
        )}
        {puedeReactivar && (
          <Boton variante="secundario" onClick={() => reactivar.mutate(clase.id)}>
            Reactivar
          </Boton>
        )}
        {(cancelada || pendienteRecuperar) && (
          <Boton variante="secundario" onClick={() => setDialogo('recuperar')}>
            Recuperar
          </Boton>
        )}
        <Boton
          variante="secundario"
          onClick={() => navigate(`/agenda/nueva?duplicar=${clase.id}`)}
        >
          Duplicar
        </Boton>
        <Boton variante="secundario" onClick={() => navigate(`/agenda/clase/${clase.id}/editar`)}>
          Editar datos
        </Boton>
      </div>

      {clase.horario_recurrente && (
        <p className="mt-3 text-center text-xs text-muted">
          Del horario habitual ·{' '}
          <Link className="underline" to={`/alumnos/${clase.alumno_id}`}>
            gestionar en la ficha
          </Link>
        </p>
      )}

      <HistorialCambios claseId={clase.id} />

      <MoverDialogo
        clase={clase}
        abierto={dialogo === 'mover'}
        onCerrar={() => setDialogo(null)}
        onHecho={() => setDialogo(null)}
      />
      <CancelarDialogo
        clase={clase}
        abierto={dialogo === 'cancelar'}
        onCerrar={() => setDialogo(null)}
        onHecho={() => setDialogo(null)}
      />
      <RecuperarDialogo
        clase={clase}
        abierto={dialogo === 'recuperar'}
        onCerrar={() => setDialogo(null)}
        onCreada={(nuevaId) => {
          setDialogo(null)
          navigate(`/agenda/clase/${nuevaId}`)
        }}
      />
      <ConfirmarDialogo
        abierto={confirmarRealizada}
        titulo="¿Marcar como realizada?"
        texto={`Clase de ${clase.alumno.nombre} del ${fechaCorta(clase.fecha)}.`}
        confirmar="Sí, marcar"
        onCancelar={() => setConfirmarRealizada(false)}
        onConfirmar={() => {
          marcarRealizada()
          setConfirmarRealizada(false)
        }}
      />
    </>
  )
}
