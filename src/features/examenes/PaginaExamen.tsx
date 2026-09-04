import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Cargando, EstadoVacio, Boton, ConfirmarDialogo, Tarjeta } from '@/components/ui'
import { Input, InputFecha } from '@/components/campos'
import { IconoFlechaIzq, IconoMas1 } from '@/components/iconos'
import { fechaCorta, fechaLarga } from '@/lib/fechas'
import { AvatarAlumno } from '@/features/alumnos/componentes'
import { useClasesDeAlumno } from '@/features/agenda/api'
import { DiasBadge, NivelPreparacion } from './componentes'
import { generarPasosRepaso } from './generador'
import {
  useExamen,
  useActualizarExamen,
  useEliminarExamen,
  usePlanExamen,
  useReemplazarPlanExamen,
  useActualizarPaso,
  useCrearPaso,
  useEliminarPaso,
  type PasoPlan,
} from './api'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function Paso({ examenId, paso }: { examenId: string; paso: PasoPlan }) {
  const actualizar = useActualizarPaso(examenId)
  const eliminar = useEliminarPaso(examenId)
  return (
    <div className="flex items-center gap-3 py-2.5">
      <input
        type="checkbox"
        checked={paso.completado}
        onChange={(e) => actualizar.mutate({ id: paso.id, cambios: { completado: e.target.checked } })}
        className="size-4 shrink-0 rounded border-line-strong"
      />
      <div className="w-14 shrink-0 font-mono text-xs text-muted">
        {fechaCorta(paso.fecha).slice(0, 5)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${paso.completado ? 'text-muted line-through' : 'text-ink'}`}>
          {paso.descripcion}
        </p>
        {paso.clase_id && (
          <Link
            to={`/agenda/clase/${paso.clase_id}`}
            className="text-[11px] font-medium text-accent-ink hover:underline"
          >
            En una clase programada
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={() => eliminar.mutate(paso.id)}
        aria-label="Quitar paso"
        className="shrink-0 text-xs font-medium text-crit hover:underline"
      >
        ✕
      </button>
    </div>
  )
}

export function PaginaExamen() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: examen, isLoading, error } = useExamen(id)
  const { data: pasos } = usePlanExamen(id)
  const { data: clases } = useClasesDeAlumno(examen?.alumno_id)

  const actualizar = useActualizarExamen()
  const eliminar = useEliminarExamen()
  const reemplazar = useReemplazarPlanExamen(id ?? '')
  const crearPaso = useCrearPaso(id ?? '')

  const [confirmarGenerar, setConfirmarGenerar] = useState(false)
  const [confirmarBorrar, setConfirmarBorrar] = useState(false)
  const [nuevoPaso, setNuevoPaso] = useState({ fecha: '', descripcion: '' })

  if (isLoading) return <Cargando />
  if (error || !examen) {
    return (
      <EstadoVacio
        titulo="No se encuentra el examen"
        accion={<Boton onClick={() => navigate('/examenes')}>Volver a Exámenes</Boton>}
      />
    )
  }

  const generar = () => {
    const nuevos = generarPasosRepaso(
      examen.temario,
      examen.fecha,
      (clases ?? []).map((c) => ({ id: c.id, fecha: c.fecha })),
    )
    reemplazar.mutate(nuevos)
    setConfirmarGenerar(false)
  }

  async function anadirPaso(e: FormEvent) {
    e.preventDefault()
    if (!nuevoPaso.fecha || !nuevoPaso.descripcion.trim()) return
    await crearPaso.mutateAsync({
      fecha: nuevoPaso.fecha,
      descripcion: nuevoPaso.descripcion.trim(),
      orden: (pasos?.length ?? 0) + 1,
    })
    setNuevoPaso({ fecha: '', descripcion: '' })
  }

  return (
    <>
      <Link
        to="/examenes"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <IconoFlechaIzq className="size-4" /> Exámenes
      </Link>

      <header className="flex items-start gap-3">
        <AvatarAlumno
          nombre={examen.alumno.nombre}
          apellidos={examen.alumno.apellidos}
          color={examen.alumno.color}
          tam="lg"
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold tracking-tight text-ink">{examen.titulo}</h1>
          <Link to={`/alumnos/${examen.alumno_id}`} className="text-sm text-muted hover:underline">
            {examen.alumno.nombre} {examen.alumno.apellidos}
          </Link>
          <div className="mt-1.5">
            <DiasBadge fecha={examen.fecha} />
          </div>
        </div>
      </header>

      <Tarjeta className="mt-5">
        <dl className="divide-y divide-line text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted">Fecha</dt>
            <dd className="text-right font-medium text-ink">{cap(fechaLarga(examen.fecha))}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted">Materia</dt>
            <dd className="text-right font-medium text-ink">{examen.materia?.nombre ?? '—'}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-muted">Preparación</dt>
            <dd>
              <NivelPreparacion
                valor={examen.nivel_preparacion}
                onChange={(v) =>
                  actualizar.mutate({ id: examen.id, cambios: { nivel_preparacion: v } })
                }
              />
            </dd>
          </div>
        </dl>
        {examen.temario && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted">Temario</p>
            <p className="mt-1 whitespace-pre-line text-sm text-ink">{examen.temario}</p>
          </div>
        )}
      </Tarjeta>

      {/* Plan de repaso */}
      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Plan de repaso</h2>
          {(pasos?.length ?? 0) > 0 && (
            <button
              onClick={() => setConfirmarGenerar(true)}
              className="text-sm font-medium text-accent-ink hover:underline"
            >
              Regenerar
            </button>
          )}
        </div>

        {pasos?.length ? (
          <div className="rounded-2xl border border-line bg-surface px-4">
            {pasos.map((p) => (
              <div key={p.id} className="border-b border-line last:border-0">
                <Paso examenId={examen.id} paso={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-5 py-8 text-center">
            <p className="text-sm text-muted">
              Aún no hay plan. Genéralo a partir del temario y de las clases que tienes
              con {examen.alumno.nombre} antes del examen.
            </p>
            <Boton className="mt-4" onClick={generar} disabled={reemplazar.isPending}>
              Generar plan de repaso
            </Boton>
          </div>
        )}

        <form onSubmit={anadirPaso} className="mt-3 flex gap-2">
          <InputFecha
            value={nuevoPaso.fecha}
            onChange={(v) => setNuevoPaso((p) => ({ ...p, fecha: v }))}
            className="w-36 shrink-0"
          />
          <Input
            value={nuevoPaso.descripcion}
            onChange={(e) => setNuevoPaso((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Añadir un paso a mano"
          />
          <Boton type="submit" className="shrink-0 px-3" disabled={crearPaso.isPending}>
            <IconoMas1 className="size-4" />
          </Boton>
        </form>
      </section>

      <div className="mt-6 flex gap-2">
        <Boton variante="secundario" onClick={() => navigate(`/examenes/${examen.id}/editar`)}>
          Editar
        </Boton>
        <Boton variante="peligro" onClick={() => setConfirmarBorrar(true)}>
          Eliminar
        </Boton>
      </div>

      <ConfirmarDialogo
        abierto={confirmarGenerar}
        titulo="¿Regenerar el plan?"
        texto="Se borran los pasos actuales y se crea uno nuevo. Perderás las marcas de completado."
        confirmar="Regenerar"
        onCancelar={() => setConfirmarGenerar(false)}
        onConfirmar={generar}
      />
      <ConfirmarDialogo
        abierto={confirmarBorrar}
        titulo="¿Eliminar este examen?"
        texto="Se borra el examen y su plan de repaso."
        confirmar="Eliminar"
        peligro
        onCancelar={() => setConfirmarBorrar(false)}
        onConfirmar={async () => {
          await eliminar.mutateAsync({ id: examen.id, alumnoId: examen.alumno_id })
          navigate('/examenes')
        }}
      />
    </>
  )
}
