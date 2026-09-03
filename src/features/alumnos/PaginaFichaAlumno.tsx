import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Boton, Cargando, EstadoVacio } from '@/components/ui'
import { IconoFlechaIzq } from '@/components/iconos'
import { edad, fechaCorta } from '@/lib/fechas'
import { nombreColor } from '@/lib/colores'
import { useAlumno } from './api'
import { AvatarAlumno, EtiquetaPrioridad } from './componentes'
import { MateriasDeAlumno } from './MateriasDeAlumno'
import { HorarioDeAlumno } from '@/features/horarios/HorarioDeAlumno'
import { HistorialAlumno } from './HistorialAlumno'
import { ExamenesDeAlumno } from '@/features/examenes/ExamenesDeAlumno'

type Pestana = 'datos' | 'materias' | 'horario' | 'exámenes' | 'historial'
const PESTANAS: Pestana[] = ['datos', 'materias', 'horario', 'exámenes', 'historial']

function DatoLinea({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted">{etiqueta}</dt>
      <dd className="text-right text-sm font-medium text-ink">{valor}</dd>
    </div>
  )
}

export function PaginaFichaAlumno() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: alumno, isLoading, error } = useAlumno(id)
  const [pestana, setPestana] = useState<Pestana>('datos')

  if (isLoading) return <Cargando />
  if (error || !alumno) {
    return (
      <EstadoVacio
        titulo="No se encuentra el alumno"
        accion={<Boton onClick={() => navigate('/alumnos')}>Volver a Alumnos</Boton>}
      />
    )
  }

  return (
    <>
      <Link
        to="/alumnos"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <IconoFlechaIzq className="size-4" /> Alumnos
      </Link>

      <header className="flex items-start gap-4">
        <AvatarAlumno
          nombre={alumno.nombre}
          apellidos={alumno.apellidos}
          color={alumno.color}
          tam="lg"
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            {alumno.nombre} {alumno.apellidos}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {[alumno.curso, alumno.fecha_nacimiento && `${edad(alumno.fecha_nacimiento)} años`]
              .filter(Boolean)
              .join(' · ') || 'Sin curso'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <EtiquetaPrioridad valor={alumno.prioridad} />
            {!alumno.activo && (
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted">
                Archivado
              </span>
            )}
          </div>
        </div>
        <Boton variante="secundario" onClick={() => navigate(`/alumnos/${alumno.id}/editar`)}>
          Editar
        </Boton>
      </header>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {PESTANAS.map((p) => (
          <button
            key={p}
            onClick={() => setPestana(p)}
            className={[
              '-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors',
              pestana === p
                ? 'border-accent text-ink'
                : 'border-transparent text-muted hover:text-ink',
            ].join(' ')}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {pestana === 'datos' && (
          <dl className="divide-y divide-line rounded-2xl border border-line bg-surface px-4">
            <DatoLinea etiqueta="Nivel o dificultades" valor={alumno.nivel || '—'} />
            <DatoLinea etiqueta="Observaciones" valor={alumno.observaciones || '—'} />
            <DatoLinea etiqueta="Color" valor={nombreColor(alumno.color)} />
            <DatoLinea
              etiqueta="Precio por hora"
              valor={alumno.precio_hora != null ? `${alumno.precio_hora} €` : '—'}
            />
            <DatoLinea
              etiqueta="Fecha de nacimiento"
              valor={alumno.fecha_nacimiento ? fechaCorta(alumno.fecha_nacimiento) : '—'}
            />
            <DatoLinea etiqueta="Alta en AulaMia" valor={fechaCorta(alumno.creado_en)} />
          </dl>
        )}
        {pestana === 'materias' && <MateriasDeAlumno alumnoId={alumno.id} />}
        {pestana === 'horario' && <HorarioDeAlumno alumnoId={alumno.id} />}
        {pestana === 'exámenes' && <ExamenesDeAlumno alumnoId={alumno.id} />}
        {pestana === 'historial' && <HistorialAlumno alumnoId={alumno.id} />}
      </div>

      <p className="mt-8 text-center font-mono text-xs text-muted">
        Las estadísticas llegan en la Fase 07
      </p>
    </>
  )
}
