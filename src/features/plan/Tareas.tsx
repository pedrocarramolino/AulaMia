import { useState, type FormEvent } from 'react'
import { Input, Select } from '@/components/campos'
import { Boton } from '@/components/ui'
import { IconoMas1 } from '@/components/iconos'
import { fechaCorta } from '@/lib/fechas'
import {
  useTareasDeClase,
  useTareasPendientesDeAlumno,
  useCrearTarea,
  useActualizarTarea,
  useEliminarTarea,
  type Tarea,
} from './api'

type Ctx = { clase_id?: string | null; alumno_id: string }

function FilaTarea({
  tarea,
  ctx,
  extra,
}: {
  tarea: Tarea
  ctx: Ctx
  extra?: string | null
}) {
  const actualizar = useActualizarTarea()
  const eliminar = useEliminarTarea()

  return (
    <div className="flex items-center gap-2.5 py-2">
      <input
        type="checkbox"
        checked={tarea.completada}
        onChange={(e) =>
          actualizar.mutate({ id: tarea.id, cambios: { completada: e.target.checked }, _ctx: ctx })
        }
        className="size-4 shrink-0 rounded border-line-strong"
      />
      <span
        className={`min-w-0 flex-1 text-sm ${
          tarea.completada ? 'text-muted line-through' : 'text-ink'
        }`}
      >
        {tarea.descripcion}
      </span>
      {extra && (
        <span className="hidden shrink-0 text-[11px] text-muted sm:inline">{extra}</span>
      )}
      {tarea.fecha_limite && (
        <span className="shrink-0 font-mono text-[11px] text-muted">
          {fechaCorta(tarea.fecha_limite)}
        </span>
      )}
      <button
        type="button"
        onClick={() => eliminar.mutate({ id: tarea.id, _ctx: ctx })}
        aria-label="Quitar tarea"
        className="shrink-0 text-xs font-medium text-crit hover:underline"
      >
        ✕
      </button>
    </div>
  )
}

export function TareasDeClase({
  claseId,
  alumnoId,
}: {
  claseId: string
  alumnoId: string
}) {
  const { data: tareas, isLoading } = useTareasDeClase(claseId)
  const crear = useCrearTarea()
  const [desc, setDesc] = useState('')
  const [tipo, setTipo] = useState<Tarea['tipo']>('deberes')

  const ctx: Ctx = { clase_id: claseId, alumno_id: alumnoId }

  async function anadir(e: FormEvent) {
    e.preventDefault()
    if (!desc.trim()) return
    await crear.mutateAsync({
      alumno_id: alumnoId,
      clase_id: claseId,
      descripcion: desc.trim(),
      tipo,
    })
    setDesc('')
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-2 font-display text-base font-semibold text-ink">Tareas</h2>

      {isLoading ? (
        <div className="h-10 animate-pulse rounded bg-surface-2" />
      ) : tareas?.length ? (
        <div className="divide-y divide-line">
          {tareas.map((t) => (
            <FilaTarea key={t.id} tarea={t} ctx={ctx} extra={t.tipo === 'en_clase' ? 'En clase' : null} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">Sin tareas para esta clase.</p>
      )}

      <form onSubmit={anadir} className="mt-3 flex gap-2">
        <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Nueva tarea" />
        <Select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as Tarea['tipo'])}
          className="w-32 shrink-0"
        >
          <option value="deberes">Deberes</option>
          <option value="en_clase">En clase</option>
        </Select>
        <Boton type="submit" disabled={crear.isPending} className="shrink-0 px-3">
          <IconoMas1 className="size-4" />
        </Boton>
      </form>
    </section>
  )
}

export function TareasPendientesAlumno({ alumnoId }: { alumnoId: string }) {
  const { data: tareas } = useTareasPendientesDeAlumno(alumnoId)

  if (!tareas?.length) return null

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="mb-1 text-sm font-semibold text-ink">
        Tareas pendientes ({tareas.length})
      </h3>
      <div className="divide-y divide-line">
        {tareas.map((t) => (
          <FilaTarea
            key={t.id}
            tarea={t}
            ctx={{ clase_id: t.clase_id, alumno_id: alumnoId }}
            extra={t.materia?.nombre ?? null}
          />
        ))}
      </div>
    </div>
  )
}
