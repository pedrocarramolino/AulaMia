import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { aISO, fechaCorta, franja, duracionLegible, aMinutos } from '@/lib/fechas'
import { useClasesDeAlumno, type ClaseHistorial } from '@/features/agenda/api'
import { PillEstado } from '@/features/agenda/componentes'
import { TareasPendientesAlumno } from '@/features/plan/Tareas'

function Fila({ clase, onClick }: { clase: ClaseHistorial; onClick: () => void }) {
  const tema = clase.plan_sesion?.tema
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-line py-2.5 text-left last:border-0"
    >
      <span
        className="h-8 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: clase.materia?.color ?? clase.alumno.color }}
      />
      <div className="w-16 shrink-0">
        <p className="text-xs font-medium text-ink">{fechaCorta(clase.fecha).slice(0, 5)}</p>
        <p className="font-mono text-[11px] text-muted">{franja(clase.hora_inicio, clase.hora_fin).split('–')[0]}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          {tema || clase.materia?.nombre || 'Sin materia'}
        </p>
        {tema && clase.materia?.nombre && (
          <p className="truncate text-xs text-muted">{clase.materia.nombre}</p>
        )}
      </div>
      {clase.estado !== 'programada' && <PillEstado estado={clase.estado} />}
    </button>
  )
}

function Grupo({
  titulo,
  clases,
  onClase,
}: {
  titulo: string
  clases: ClaseHistorial[]
  onClase: (id: string) => void
}) {
  if (!clases.length) return null
  return (
    <div>
      <h3 className="mb-1.5 text-sm font-semibold text-ink">
        {titulo} <span className="font-normal text-muted">({clases.length})</span>
      </h3>
      <div className="rounded-2xl border border-line bg-surface px-4">
        {clases.map((c) => (
          <Fila key={c.id} clase={c} onClick={() => onClase(c.id)} />
        ))}
      </div>
    </div>
  )
}

export function HistorialAlumno({ alumnoId }: { alumnoId: string }) {
  const navigate = useNavigate()
  const { data: clases, isLoading } = useClasesDeAlumno(alumnoId)

  const { proximas, realizadas, canceladas, horas } = useMemo(() => {
    const hoy = aISO(new Date())
    const lista = clases ?? []
    const realizadas = lista.filter((c) => c.estado === 'realizada')
    const minutos = realizadas.reduce(
      (t, c) => t + (aMinutos(c.hora_fin) - aMinutos(c.hora_inicio)),
      0,
    )
    return {
      proximas: lista
        .filter((c) => c.fecha >= hoy && ['programada', 'pendiente_recuperar'].includes(c.estado))
        .reverse(),
      realizadas,
      canceladas: lista.filter((c) => c.estado === 'cancelada'),
      horas: minutos / 60,
    }
  }, [clases])

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />

  return (
    <div className="flex flex-col gap-4">
      <TareasPendientesAlumno alumnoId={alumnoId} />

      <div className="grid grid-cols-3 gap-2">
        {[
          ['Clases dadas', realizadas.length.toString()],
          ['Horas', horas ? duracionLegible(Math.round(horas * 60)) : '0'],
          ['Canceladas', canceladas.length.toString()],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line bg-surface p-3 text-center">
            <p className="font-display text-lg font-bold text-ink">{v}</p>
            <p className="text-[11px] text-muted">{k}</p>
          </div>
        ))}
      </div>

      {!clases?.length && (
        <p className="py-6 text-center text-sm text-muted">
          Todavía no hay clases para este alumno.
        </p>
      )}

      <Grupo titulo="Próximas" clases={proximas} onClase={(id) => navigate(`/agenda/clase/${id}`)} />
      <Grupo titulo="Realizadas" clases={realizadas} onClase={(id) => navigate(`/agenda/clase/${id}`)} />
      <Grupo titulo="Canceladas" clases={canceladas} onClase={(id) => navigate(`/agenda/clase/${id}`)} />
    </div>
  )
}
