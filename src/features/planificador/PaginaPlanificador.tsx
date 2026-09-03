import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays } from 'date-fns'
import { CabeceraPagina, Boton, EstadoVacio } from '@/components/ui'
import { IconoFlechaIzq, IconoPlanificador } from '@/components/iconos'
import { aISO, fechaLarga, franja } from '@/lib/fechas'
import { useAlumnosConMaterias } from '@/features/alumnos/api'
import { useExamenes } from '@/features/examenes/api'
import { useClasesRango, useCrearClase, mensajeErrorClase } from '@/features/agenda/api'
import { useDisponibilidad, useExcepciones } from '@/features/disponibilidad/api'
import { sugerirRepasos, type Sugerencia } from './motor'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function Tarjeta({
  s,
  onAnadir,
  onDescartar,
  ocupada,
}: {
  s: Sugerencia
  onAnadir: () => void
  onDescartar: () => void
  ocupada: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
      <span className="h-12 w-1 shrink-0 rounded-full" style={{ backgroundColor: s.alumnoColor }} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">
          {s.alumnoNombre} · {s.materiaNombre}
        </p>
        <p className="text-sm text-muted">
          {cap(fechaLarga(s.fecha))} · {franja(s.horaInicio, s.horaFin)}
        </p>
        <p className="mt-0.5 text-xs text-accent-ink">{s.motivo}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <Boton className="px-3 py-1.5 text-xs" onClick={onAnadir} disabled={ocupada}>
          Añadir
        </Boton>
        <button
          onClick={onDescartar}
          className="text-xs font-medium text-muted hover:text-ink"
        >
          Descartar
        </button>
      </div>
    </div>
  )
}

export function PaginaPlanificador() {
  const hoy = new Date()
  const { data: alumnos } = useAlumnosConMaterias()
  const { data: examenes } = useExamenes()
  const { data: clases } = useClasesRango(aISO(addDays(hoy, -45)), aISO(addDays(hoy, 14)))
  const { data: disponibilidad } = useDisponibilidad()
  const { data: excepciones } = useExcepciones()
  const crear = useCrearClase()

  const [descartadas, setDescartadas] = useState<Set<string>>(new Set())
  const [anadidas, setAnadidas] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  const listo = alumnos && examenes && clases && disponibilidad && excepciones

  const sugerencias = useMemo(() => {
    if (!listo) return []
    return sugerirRepasos({
      alumnos: alumnos!,
      examenes: examenes!,
      clases: clases!,
      disponibilidad: disponibilidad!,
      excepciones: excepciones!,
    })
  }, [listo, alumnos, examenes, clases, disponibilidad, excepciones])

  const visibles = sugerencias.filter((s) => !descartadas.has(s.clave) && !anadidas.has(s.clave))

  async function anadir(s: Sugerencia) {
    setError('')
    try {
      await crear.mutateAsync({
        alumno_id: s.alumnoId,
        materia_id: s.materiaId,
        fecha: s.fecha,
        hora_inicio: s.horaInicio,
        hora_fin: s.horaFin,
        origen: 'manual',
      })
      setAnadidas((prev) => new Set(prev).add(s.clave))
    } catch (e) {
      setError(mensajeErrorClase(e))
    }
  }

  async function anadirTodas() {
    for (const s of visibles) await anadir(s)
  }

  return (
    <>
      <Link
        to="/mas"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <IconoFlechaIzq className="size-4" /> Más
      </Link>
      <CabeceraPagina
        titulo="Planificador"
        subtitulo="Repasos sugeridos para los próximos 10 días"
      />

      {!listo ? (
        <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
      ) : visibles.length === 0 ? (
        <EstadoVacio
          icono={<IconoPlanificador className="size-8" />}
          titulo={
            anadidas.size ? 'Listo, no queda nada más que sugerir' : 'Nada que sugerir ahora mismo'
          }
          texto="La app propone repasos cuando hay exámenes cerca, materias sin repasar hace tiempo o alumnos prioritarios, y huecos libres en tu disponibilidad."
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted">{visibles.length} sugerencias</p>
            <button
              onClick={anadirTodas}
              disabled={crear.isPending}
              className="text-sm font-semibold text-accent-ink hover:underline"
            >
              Añadir todas
            </button>
          </div>
          {error && <p className="mb-3 text-sm text-crit">{error}</p>}
          <div className="flex flex-col gap-3">
            {visibles.map((s) => (
              <Tarjeta
                key={s.clave}
                s={s}
                ocupada={crear.isPending}
                onAnadir={() => anadir(s)}
                onDescartar={() =>
                  setDescartadas((prev) => new Set(prev).add(s.clave))
                }
              />
            ))}
          </div>
        </>
      )}

      {anadidas.size > 0 && (
        <p className="mt-4 text-center text-sm text-good">
          {anadidas.size} {anadidas.size === 1 ? 'clase añadida' : 'clases añadidas'} a la agenda.
        </p>
      )}
    </>
  )
}
