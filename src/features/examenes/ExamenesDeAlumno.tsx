import { Link, useNavigate } from 'react-router-dom'
import { Boton } from '@/components/ui'
import { IconoMas1, IconoExamenes } from '@/components/iconos'
import { fechaCorta } from '@/lib/fechas'
import { useExamenesDeAlumno } from './api'
import { DiasBadge, NivelPreparacion } from './componentes'

export function ExamenesDeAlumno({ alumnoId }: { alumnoId: string }) {
  const navigate = useNavigate()
  const { data: examenes, isLoading } = useExamenesDeAlumno(alumnoId)

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-surface-2" />

  return (
    <div className="flex flex-col gap-3">
      {examenes?.length ? (
        examenes.map((e) => (
          <Link
            key={e.id}
            to={`/examenes/${e.id}`}
            className="rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-surface-2"
          >
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-ink">{e.titulo}</p>
              <DiasBadge fecha={e.fecha} />
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {e.materia?.nombre ?? 'Sin materia'} · {fechaCorta(e.fecha)}
            </p>
            <div className="mt-1.5">
              <NivelPreparacion valor={e.nivel_preparacion} editable={false} />
            </div>
          </Link>
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-5 py-8 text-center">
          <IconoExamenes className="mx-auto size-7 text-muted" />
          <p className="mt-2 text-sm text-muted">Sin exámenes registrados.</p>
        </div>
      )}

      <Boton
        variante="secundario"
        onClick={() => navigate(`/examenes/nuevo?alumno=${alumnoId}`)}
        className="self-start"
      >
        <IconoMas1 className="size-4" /> Nuevo examen
      </Boton>
    </div>
  )
}
