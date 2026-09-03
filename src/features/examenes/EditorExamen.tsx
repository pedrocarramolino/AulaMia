import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CabeceraPagina, Boton, Cargando } from '@/components/ui'
import { Campo, Input, Select, Textarea } from '@/components/campos'
import { IconoFlechaIzq } from '@/components/iconos'
import { useAlumnos } from '@/features/alumnos/api'
import { useMaterias } from '@/features/materias/api'
import { NivelPreparacion } from './componentes'
import { useExamen, useCrearExamen, useActualizarExamen } from './api'

interface Campos {
  alumno_id: string
  materia_id: string
  titulo: string
  fecha: string
  temario: string
  nivel_preparacion: number
}

export function EditorExamen() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const editar = !!id
  const navigate = useNavigate()

  const { data: alumnos } = useAlumnos()
  const { data: materias } = useMaterias()
  const { data: examen, isLoading } = useExamen(id)
  const crear = useCrearExamen()
  const actualizar = useActualizarExamen()

  const [c, setC] = useState<Campos>({
    alumno_id: sp.get('alumno') ?? '',
    materia_id: '',
    titulo: '',
    fecha: '',
    temario: '',
    nivel_preparacion: 1,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!examen) return
    setC({
      alumno_id: examen.alumno_id,
      materia_id: examen.materia_id ?? '',
      titulo: examen.titulo,
      fecha: examen.fecha,
      temario: examen.temario ?? '',
      nivel_preparacion: examen.nivel_preparacion,
    })
  }, [examen])

  const set = <K extends keyof Campos>(k: K, v: Campos[K]) => setC((p) => ({ ...p, [k]: v }))
  const guardando = crear.isPending || actualizar.isPending

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!c.alumno_id || !c.fecha) {
      setError('El alumno y la fecha son obligatorios.')
      return
    }
    setError('')
    const materiaNombre = materias?.find((m) => m.id === c.materia_id)?.nombre
    const titulo = c.titulo.trim() || (materiaNombre ? `Examen de ${materiaNombre}` : 'Examen')

    const datos = {
      alumno_id: c.alumno_id,
      materia_id: c.materia_id || null,
      titulo,
      fecha: c.fecha,
      temario: c.temario.trim() || null,
      nivel_preparacion: c.nivel_preparacion,
    }

    try {
      if (editar) {
        await actualizar.mutateAsync({ id: id!, cambios: datos })
        navigate(`/examenes/${id}`)
      } else {
        const nuevo = await crear.mutateAsync(datos)
        navigate(`/examenes/${nuevo.id}`, { replace: true })
      }
    } catch {
      setError('No se ha podido guardar el examen.')
    }
  }

  if (editar && isLoading) return <Cargando />

  const volverA = editar ? `/examenes/${id}` : '/examenes'

  return (
    <>
      <Link
        to={volverA}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <IconoFlechaIzq className="size-4" /> {editar ? 'Examen' : 'Exámenes'}
      </Link>
      <CabeceraPagina titulo={editar ? 'Editar examen' : 'Nuevo examen'} />

      <form onSubmit={enviar} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo etiqueta="Alumno" obligatorio>
            <Select value={c.alumno_id} onChange={(e) => set('alumno_id', e.target.value)} disabled={editar}>
              <option value="">Elige un alumno</option>
              {alumnos?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} {a.apellidos ?? ''}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo etiqueta="Materia">
            <Select value={c.materia_id} onChange={(e) => set('materia_id', e.target.value)}>
              <option value="">Sin materia</option>
              {materias?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </Select>
          </Campo>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo etiqueta="Título" ayuda="Si lo dejas vacío se pone «Examen de [materia]».">
            <Input
              value={c.titulo}
              onChange={(e) => set('titulo', e.target.value)}
              placeholder="Examen de Matemáticas"
            />
          </Campo>
          <Campo etiqueta="Fecha del examen" obligatorio>
            <Input
              type="date"
              value={c.fecha}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => set('fecha', e.target.value)}
              required
            />
          </Campo>
        </div>

        <Campo
          etiqueta="Temario"
          ayuda="Un tema por línea (o separados por comas). Se usa para generar el plan de repaso."
        >
          <Textarea
            rows={4}
            value={c.temario}
            onChange={(e) => set('temario', e.target.value)}
            placeholder={'Tema 1: Números enteros\nTema 2: Fracciones\nTema 3: Ecuaciones'}
          />
        </Campo>

        <Campo etiqueta="Nivel de preparación">
          <NivelPreparacion valor={c.nivel_preparacion} onChange={(v) => set('nivel_preparacion', v)} />
        </Campo>

        {error && <p className="text-sm text-crit">{error}</p>}

        <div className="flex gap-2">
          <Boton type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : editar ? 'Guardar' : 'Crear examen'}
          </Boton>
          <Boton type="button" variante="secundario" onClick={() => navigate(volverA)}>
            Cancelar
          </Boton>
        </div>
      </form>
    </>
  )
}
