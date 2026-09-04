import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CabeceraPagina, Boton, EstadoVacio, ConfirmarDialogo } from '@/components/ui'
import { Input } from '@/components/campos'
import { IconoFlechaIzq, IconoMas1, IconoMateria } from '@/components/iconos'
import { PALETA_ALUMNOS } from '@/lib/colores'
import {
  useMaterias,
  useCrearMateria,
  useActualizarMateria,
  useEliminarMateria,
  type Materia,
} from './api'

const COLORES_MATERIA = ['#5b6472', ...PALETA_ALUMNOS.map((c) => c.hex)]

function PuntoColor({
  color,
  onChange,
}: {
  color: string | null
  onChange: (c: string) => void
}) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Cambiar color"
        onClick={() => setAbierto((v) => !v)}
        className="size-7 rounded-full ring-1 ring-line-strong"
        style={{ backgroundColor: color ?? 'var(--muted)' }}
      />
      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="absolute left-0 top-9 z-20 grid w-48 grid-cols-6 gap-2 rounded-xl border border-line bg-surface p-2.5 shadow-lg">
            {COLORES_MATERIA.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => {
                  onChange(c)
                  setAbierto(false)
                }}
                className="size-6 rounded-full hover:scale-110"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Fila({ materia }: { materia: Materia }) {
  const actualizar = useActualizarMateria()
  const eliminar = useEliminarMateria()
  const [nombre, setNombre] = useState(materia.nombre)
  const [confirmar, setConfirmar] = useState(false)

  const guardarNombre = () => {
    const limpio = nombre.trim()
    if (!limpio || limpio === materia.nombre) {
      setNombre(materia.nombre)
      return
    }
    actualizar.mutate({ id: materia.id, cambios: { nombre: limpio } })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <PuntoColor
        color={materia.color}
        onChange={(c) => actualizar.mutate({ id: materia.id, cambios: { color: c } })}
      />
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onBlur={guardarNombre}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none"
      />
      <button
        type="button"
        onClick={() => setConfirmar(true)}
        className="-m-2 inline-flex min-h-9 items-center p-2 text-xs font-medium text-crit hover:underline"
      >
        Eliminar
      </button>
      <ConfirmarDialogo
        abierto={confirmar}
        titulo={`¿Eliminar ${materia.nombre}?`}
        texto="Se quitará de todos los alumnos que la tengan asignada. Las clases ya registradas no se ven afectadas."
        confirmar="Eliminar"
        peligro
        onCancelar={() => setConfirmar(false)}
        onConfirmar={() => {
          eliminar.mutate(materia.id)
          setConfirmar(false)
        }}
      />
    </div>
  )
}

export function PaginaMaterias() {
  const { data: materias, isLoading } = useMaterias()
  const crear = useCrearMateria()
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')

  async function anadir(e: FormEvent) {
    e.preventDefault()
    const limpio = nombre.trim()
    if (!limpio) return
    if (materias?.some((m) => m.nombre.toLowerCase() === limpio.toLowerCase())) {
      setError('Ya existe una materia con ese nombre.')
      return
    }
    setError('')
    try {
      await crear.mutateAsync({ nombre: limpio })
      setNombre('')
    } catch {
      setError('No se ha podido crear la materia.')
    }
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
        titulo="Materias"
        subtitulo="Catálogo reutilizable entre todos los alumnos"
      />

      <form onSubmit={anadir} className="mb-5 flex gap-2">
        <Input
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value)
            setError('')
          }}
          placeholder="Nueva materia (Matemáticas, Inglés…)"
        />
        <Boton type="submit" cargando={crear.isPending}>
          {!crear.isPending && <IconoMas1 className="size-4" />}
          <span className="hidden sm:inline">Añadir</span>
        </Boton>
      </form>
      {error && (
        <p role="alert" className="mb-4 text-sm text-crit">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
      ) : !materias?.length ? (
        <EstadoVacio
          icono={<IconoMateria className="size-8" />}
          titulo="El catálogo está vacío"
          texto="Añade las materias que impartes. También puedes crearlas al vuelo desde la ficha de un alumno."
        />
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {materias.map((m) => (
            <Fila key={m.id} materia={m} />
          ))}
        </div>
      )}
    </>
  )
}
