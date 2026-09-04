import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CabeceraPagina, Boton, Cargando, ConfirmarDialogo } from '@/components/ui'
import { Campo, Input, Textarea, InputFecha } from '@/components/campos'
import { IconoFlechaIzq } from '@/components/iconos'
import { COLOR_ALUMNO_POR_DEFECTO } from '@/lib/colores'
import {
  useAlumno,
  useCrearAlumno,
  useActualizarAlumno,
  useArchivarAlumno,
} from './api'
import { SelectorColor, SelectorPrioridad } from './componentes'

const CURSOS = [
  '1º Infantil', '2º Infantil', '3º Infantil',
  '1º Primaria', '2º Primaria', '3º Primaria', '4º Primaria', '5º Primaria', '6º Primaria',
  '1º ESO', '2º ESO', '3º ESO', '4º ESO',
  '1º Bachillerato', '2º Bachillerato',
]

interface Formulario {
  nombre: string
  apellidos: string
  fecha_nacimiento: string
  curso: string
  nivel: string
  observaciones: string
  color: string
  prioridad: number
  precio_mensual: string
}

const VACIO: Formulario = {
  nombre: '',
  apellidos: '',
  fecha_nacimiento: '',
  curso: '',
  nivel: '',
  observaciones: '',
  color: COLOR_ALUMNO_POR_DEFECTO,
  prioridad: 2,
  precio_mensual: '',
}

export function PaginaEditorAlumno() {
  const { id } = useParams()
  const editando = !!id
  const navigate = useNavigate()

  const { data: alumno, isLoading } = useAlumno(id)
  const crear = useCrearAlumno()
  const actualizar = useActualizarAlumno()
  const archivar = useArchivarAlumno()

  const [form, setForm] = useState<Formulario>(VACIO)
  const [errorNombre, setErrorNombre] = useState('')
  const [confirmarArchivar, setConfirmarArchivar] = useState(false)

  useEffect(() => {
    if (alumno) {
      setForm({
        nombre: alumno.nombre,
        apellidos: alumno.apellidos ?? '',
        fecha_nacimiento: alumno.fecha_nacimiento ?? '',
        curso: alumno.curso ?? '',
        nivel: alumno.nivel ?? '',
        observaciones: alumno.observaciones ?? '',
        color: alumno.color,
        prioridad: alumno.prioridad,
        precio_mensual: alumno.precio_mensual?.toString() ?? '',
      })
    }
  }, [alumno])

  const set = <K extends keyof Formulario>(clave: K, valor: Formulario[K]) =>
    setForm((f) => ({ ...f, [clave]: valor }))

  const guardando = crear.isPending || actualizar.isPending

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setErrorNombre('El nombre es obligatorio')
      return
    }
    const datos = {
      nombre: form.nombre.trim(),
      apellidos: form.apellidos.trim() || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      curso: form.curso.trim() || null,
      nivel: form.nivel.trim() || null,
      observaciones: form.observaciones.trim() || null,
      color: form.color,
      prioridad: form.prioridad,
      precio_mensual: form.precio_mensual ? Number(form.precio_mensual) : null,
    }

    try {
      if (editando) {
        await actualizar.mutateAsync({ id: id!, cambios: datos })
        navigate(`/alumnos/${id}`)
      } else {
        const nuevo = await crear.mutateAsync(datos)
        navigate(`/alumnos/${nuevo.id}`, { replace: true })
      }
    } catch {
      setErrorNombre('No se ha podido guardar. Revisa la conexión.')
    }
  }

  if (editando && isLoading) return <Cargando />

  const volverA = editando ? `/alumnos/${id}` : '/alumnos'

  return (
    <>
      <Link
        to={volverA}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <IconoFlechaIzq className="size-4" /> {editando ? 'Ficha' : 'Alumnos'}
      </Link>
      <CabeceraPagina titulo={editando ? 'Editar alumno' : 'Nuevo alumno'} />

      <form onSubmit={enviar} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo etiqueta="Nombre" htmlFor="nombre" obligatorio error={errorNombre}>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => {
                set('nombre', e.target.value)
                setErrorNombre('')
              }}
              onBlur={() =>
                setErrorNombre(form.nombre.trim() ? '' : 'El nombre es obligatorio')
              }
              autoFocus={!editando}
              autoComplete="off"
              aria-invalid={!!errorNombre}
            />
          </Campo>
          <Campo etiqueta="Apellidos" htmlFor="apellidos">
            <Input
              id="apellidos"
              value={form.apellidos}
              onChange={(e) => set('apellidos', e.target.value)}
              autoComplete="off"
            />
          </Campo>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo etiqueta="Fecha de nacimiento" htmlFor="nacimiento" ayuda="La edad se calcula sola.">
            <InputFecha
              id="nacimiento"
              value={form.fecha_nacimiento}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(v) => set('fecha_nacimiento', v)}
            />
          </Campo>
          <Campo etiqueta="Curso escolar" htmlFor="curso">
            <Input
              id="curso"
              list="cursos"
              value={form.curso}
              onChange={(e) => set('curso', e.target.value)}
              placeholder="Ej. 5º Primaria"
              autoComplete="off"
            />
            <datalist id="cursos">
              {CURSOS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Campo>
        </div>

        <Campo
          etiqueta="Nivel o dificultades"
          htmlFor="nivel"
          ayuda="Una nota rápida del punto de partida general."
        >
          <Input
            id="nivel"
            value={form.nivel}
            onChange={(e) => set('nivel', e.target.value)}
            placeholder="Ej. Le cuesta la comprensión lectora"
            autoComplete="off"
          />
        </Campo>

        <Campo etiqueta="Observaciones" htmlFor="observaciones">
          <Textarea
            id="observaciones"
            value={form.observaciones}
            onChange={(e) => set('observaciones', e.target.value)}
            placeholder="Cualquier cosa a tener en cuenta"
          />
        </Campo>

        <Campo etiqueta="Color identificativo" ayuda="Se usa en el calendario y en todas las vistas.">
          <SelectorColor valor={form.color} onChange={(c) => set('color', c)} />
        </Campo>

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo etiqueta="Prioridad" ayuda="Peso en la planificación de repasos.">
            <SelectorPrioridad valor={form.prioridad} onChange={(v) => set('prioridad', v)} />
          </Campo>
          <Campo etiqueta="Precio mensual (€)" htmlFor="precio" ayuda="Cuota mensual del alumno. Opcional.">
            <Input
              id="precio"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={form.precio_mensual}
              onChange={(e) => set('precio_mensual', e.target.value)}
              placeholder="Ej. 120"
            />
          </Campo>
        </div>

        <div className="sticky bottom-16 z-10 -mx-4 flex gap-2 border-t border-line bg-ground/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:pb-0">
          <Boton type="submit" disabled={guardando} className="flex-1 sm:flex-none">
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear alumno'}
          </Boton>
          <Boton
            type="button"
            variante="secundario"
            onClick={() => navigate(volverA)}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Boton>
        </div>

        {editando && alumno?.activo && (
          <button
            type="button"
            onClick={() => setConfirmarArchivar(true)}
            className="self-start text-sm font-medium text-crit hover:underline"
          >
            Archivar alumno
          </button>
        )}
        {editando && alumno && !alumno.activo && (
          <button
            type="button"
            onClick={() => archivar.mutate({ id: id!, activo: true })}
            className="self-start text-sm font-medium text-accent-ink hover:underline"
          >
            Reactivar alumno
          </button>
        )}
      </form>

      <ConfirmarDialogo
        abierto={confirmarArchivar}
        titulo="¿Archivar este alumno?"
        texto="Dejará de aparecer en las listas, pero se conserva todo su historial. Puedes reactivarlo cuando quieras."
        confirmar="Archivar"
        peligro
        onCancelar={() => setConfirmarArchivar(false)}
        onConfirmar={async () => {
          await archivar.mutateAsync({ id: id!, activo: false })
          setConfirmarArchivar(false)
          navigate('/alumnos')
        }}
      />
    </>
  )
}
