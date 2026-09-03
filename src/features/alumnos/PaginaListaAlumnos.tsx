import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CabeceraPagina, Boton, EstadoVacio } from '@/components/ui'
import { Input } from '@/components/campos'
import { IconoAlumnos, IconoMas1, IconoBuscar, IconoFlechaDer } from '@/components/iconos'
import { edad } from '@/lib/fechas'
import { useAlumnos, type Alumno } from './api'
import { AvatarAlumno, EtiquetaPrioridad } from './componentes'

function TarjetaAlumno({ alumno }: { alumno: Alumno }) {
  const detalles = [
    alumno.curso,
    alumno.fecha_nacimiento ? `${edad(alumno.fecha_nacimiento)} años` : null,
  ].filter(Boolean)

  return (
    <Link
      to={`/alumnos/${alumno.id}`}
      className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-surface-2"
    >
      <AvatarAlumno
        nombre={alumno.nombre}
        apellidos={alumno.apellidos}
        color={alumno.color}
        tam="lg"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">
          {alumno.nombre} {alumno.apellidos}
        </p>
        <p className="truncate text-sm text-muted">
          {detalles.length ? detalles.join(' · ') : 'Sin curso'}
        </p>
        {alumno.prioridad !== 2 && (
          <span className="mt-1.5 inline-block">
            <EtiquetaPrioridad valor={alumno.prioridad} />
          </span>
        )}
      </div>
      <IconoFlechaDer className="size-4 shrink-0 text-muted" />
    </Link>
  )
}

export function PaginaListaAlumnos() {
  const navigate = useNavigate()
  const { data: alumnos, isLoading, error } = useAlumnos()
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    if (!alumnos) return []
    const q = busqueda.trim().toLowerCase()
    if (!q) return alumnos
    return alumnos.filter((a) =>
      `${a.nombre} ${a.apellidos ?? ''} ${a.curso ?? ''}`.toLowerCase().includes(q),
    )
  }, [alumnos, busqueda])

  return (
    <>
      <CabeceraPagina
        titulo="Alumnos"
        subtitulo={alumnos?.length ? `${alumnos.length} en activo` : undefined}
        accion={
          <Boton onClick={() => navigate('/alumnos/nuevo')}>
            <IconoMas1 className="size-4" />
            <span className="hidden sm:inline">Nuevo alumno</span>
          </Boton>
        }
      />

      {error && (
        <p className="mb-4 rounded-xl bg-crit-soft px-4 py-3 text-sm text-crit">
          No se han podido cargar los alumnos.
        </p>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : !alumnos?.length ? (
        <EstadoVacio
          icono={<IconoAlumnos className="size-8" />}
          titulo="Aún no hay alumnos"
          texto="Crea la ficha de un niño con su curso, color identificativo y las materias que necesita repasar."
          accion={
            <Boton onClick={() => navigate('/alumnos/nuevo')}>
              <IconoMas1 className="size-4" /> Nuevo alumno
            </Boton>
          }
        />
      ) : (
        <>
          <div className="relative mb-4">
            <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o curso"
              className="pl-9"
            />
          </div>

          {filtrados.length ? (
            <div className="flex flex-col gap-3">
              {filtrados.map((a) => (
                <TarjetaAlumno key={a.id} alumno={a} />
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted">
              Ningún alumno coincide con «{busqueda}».
            </p>
          )}
        </>
      )}
    </>
  )
}
