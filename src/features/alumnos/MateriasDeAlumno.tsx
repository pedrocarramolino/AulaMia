import { useState, type FormEvent } from 'react'
import { Boton, ConfirmarDialogo } from '@/components/ui'
import { Input } from '@/components/campos'
import { IconoMas1, IconoMateria } from '@/components/iconos'
import { useMaterias, useCrearMateria } from '@/features/materias/api'
import {
  useMateriasDeAlumno,
  useAsignarMateria,
  useActualizarAsignacion,
  useQuitarMateria,
  type AsignacionMateria,
} from './api'
import { SelectorPrioridad } from './componentes'

function Fila({
  alumnoId,
  asignacion,
}: {
  alumnoId: string
  asignacion: AsignacionMateria
}) {
  const actualizar = useActualizarAsignacion(alumnoId)
  const quitar = useQuitarMateria(alumnoId)
  const [confirmar, setConfirmar] = useState(false)
  const [nivel, setNivel] = useState(asignacion.nivel ?? '')
  const [dificultades, setDificultades] = useState(asignacion.dificultades ?? '')

  const guardar = (campo: 'nivel' | 'dificultades', valor: string) => {
    const actual = asignacion[campo] ?? ''
    if (valor.trim() === actual) return
    actualizar.mutate({ id: asignacion.id, cambios: { [campo]: valor.trim() || null } })
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: asignacion.materia.color ?? 'var(--muted)' }}
          />
          <span className="font-semibold text-ink">{asignacion.materia.nombre}</span>
        </div>
        <button
          type="button"
          onClick={() => setConfirmar(true)}
          className="-m-2 inline-flex min-h-9 items-center p-2 text-xs font-medium text-crit hover:underline"
        >
          Quitar
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Nivel
          <Input
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            onBlur={() => guardar('nivel', nivel)}
            placeholder="Ej. Aprobado justo"
            className="text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Dificultades
          <Input
            value={dificultades}
            onChange={(e) => setDificultades(e.target.value)}
            onBlur={() => guardar('dificultades', dificultades)}
            placeholder="Ej. Fracciones, problemas"
            className="text-sm"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-xs font-medium text-muted">Prioridad</span>
        <SelectorPrioridad
          valor={asignacion.prioridad}
          onChange={(v) => actualizar.mutate({ id: asignacion.id, cambios: { prioridad: v } })}
        />
      </div>

      <ConfirmarDialogo
        abierto={confirmar}
        titulo={`¿Quitar ${asignacion.materia.nombre}?`}
        texto="Se elimina de este alumno. La materia sigue en el catálogo."
        confirmar="Quitar"
        peligro
        onCancelar={() => setConfirmar(false)}
        onConfirmar={() => {
          quitar.mutate(asignacion.id)
          setConfirmar(false)
        }}
      />
    </div>
  )
}

export function MateriasDeAlumno({ alumnoId }: { alumnoId: string }) {
  const { data: asignaciones, isLoading } = useMateriasDeAlumno(alumnoId)
  const { data: catalogo } = useMaterias()
  const asignar = useAsignarMateria()
  const crearMateria = useCrearMateria()

  const [anadiendo, setAnadiendo] = useState(false)
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')

  const yaAsignadas = new Set(asignaciones?.map((a) => a.materia_id))
  const disponibles = catalogo?.filter((m) => !yaAsignadas.has(m.id)) ?? []

  async function anadir(e: FormEvent) {
    e.preventDefault()
    const limpio = nombre.trim()
    if (!limpio) return
    setError('')

    try {
      const existente = catalogo?.find(
        (m) => m.nombre.toLowerCase() === limpio.toLowerCase(),
      )
      if (existente && yaAsignadas.has(existente.id)) {
        setError('Ese alumno ya tiene esta materia.')
        return
      }
      const materia = existente ?? (await crearMateria.mutateAsync({ nombre: limpio }))
      await asignar.mutateAsync({ alumno_id: alumnoId, materia_id: materia.id, prioridad: 2 })
      setNombre('')
      setAnadiendo(false)
    } catch {
      setError('No se ha podido añadir la materia.')
    }
  }

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
  }

  return (
    <div className="flex flex-col gap-3">
      {asignaciones?.length ? (
        asignaciones.map((a) => <Fila key={a.id} alumnoId={alumnoId} asignacion={a} />)
      ) : (
        !anadiendo && (
          <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-5 py-8 text-center">
            <IconoMateria className="mx-auto size-7 text-muted" />
            <p className="mt-2 text-sm text-muted">
              Todavía no has añadido materias para este alumno.
            </p>
          </div>
        )
      )}

      {anadiendo ? (
        <form onSubmit={anadir} className="rounded-2xl border border-line bg-surface p-4">
          <label className="text-sm font-medium text-ink">Materia</label>
          <Input
            list="catalogo-materias"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              setError('')
            }}
            placeholder="Escribe una materia (o elige del catálogo)"
            autoFocus
            className="mt-1.5"
          />
          <datalist id="catalogo-materias">
            {disponibles.map((m) => (
              <option key={m.id} value={m.nombre} />
            ))}
          </datalist>
          {error && (
            <p role="alert" className="mt-2 text-xs text-crit">
              {error}
            </p>
          )}
          <p className="mt-2 text-xs text-muted">
            Si la materia no existe, se crea en el catálogo automáticamente.
          </p>
          <div className="mt-3 flex gap-2">
            <Boton type="submit" cargando={asignar.isPending || crearMateria.isPending}>
              Añadir
            </Boton>
            <Boton
              type="button"
              variante="secundario"
              onClick={() => {
                setAnadiendo(false)
                setNombre('')
                setError('')
              }}
            >
              Cancelar
            </Boton>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAnadiendo(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong py-3 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-soft"
        >
          <IconoMas1 className="size-4" /> Añadir materia
        </button>
      )}
    </div>
  )
}
