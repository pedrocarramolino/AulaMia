import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CabeceraPagina, Boton, EstadoVacio } from '@/components/ui'
import { IconoExamenes, IconoMas1, IconoFlechaDer } from '@/components/iconos'
import { fechaCorta } from '@/lib/fechas'
import { useExamenes, type Examen } from './api'
import { DiasBadge, NivelPreparacion } from './componentes'

function FilaExamen({ examen }: { examen: Examen }) {
  const pasos = examen.plan_examen[0]?.count ?? 0
  return (
    <Link
      to={`/examenes/${examen.id}`}
      className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-surface-2"
    >
      <span
        className="h-10 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: examen.alumno.color }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-ink">{examen.titulo}</p>
          <DiasBadge fecha={examen.fecha} />
        </div>
        <p className="truncate text-sm text-muted">
          {examen.alumno.nombre} {examen.alumno.apellidos ?? ''} ·{' '}
          {examen.materia?.nombre ?? 'Sin materia'} · {fechaCorta(examen.fecha)}
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          <NivelPreparacion valor={examen.nivel_preparacion} editable={false} />
          {pasos === 0 && (
            <span className="text-[11px] font-medium text-warn">Sin plan de repaso</span>
          )}
        </div>
      </div>
      <IconoFlechaDer className="size-4 shrink-0 text-line-strong" />
    </Link>
  )
}

export function PaginaExamenes() {
  const navigate = useNavigate()
  const [pasados, setPasados] = useState(false)
  const { data: examenes, isLoading } = useExamenes(pasados)

  return (
    <>
      <CabeceraPagina
        titulo="Exámenes"
        subtitulo="Próximas pruebas y plan de repaso"
        accion={
          <Boton onClick={() => navigate('/examenes/nuevo')}>
            <IconoMas1 className="size-4" />
            <span className="hidden sm:inline">Nuevo examen</span>
          </Boton>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : !examenes?.length ? (
        <EstadoVacio
          icono={<IconoExamenes className="size-8" />}
          titulo={pasados ? 'No hay exámenes' : 'No hay exámenes próximos'}
          texto="Apunta la fecha y el temario de cada prueba para que la app te ayude a repartir los repasos."
          accion={
            <Boton onClick={() => navigate('/examenes/nuevo')}>
              <IconoMas1 className="size-4" /> Nuevo examen
            </Boton>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {examenes.map((e) => (
            <FilaExamen key={e.id} examen={e} />
          ))}
        </div>
      )}

      <button
        onClick={() => setPasados((v) => !v)}
        className="mt-5 text-sm font-medium text-accent-ink hover:underline"
      >
        {pasados ? 'Ver solo los próximos' : 'Ver también los pasados'}
      </button>
    </>
  )
}
