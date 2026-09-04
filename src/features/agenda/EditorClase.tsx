import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CabeceraPagina, Boton, Cargando } from '@/components/ui'
import { Campo, Input, Select, InputFecha } from '@/components/campos'
import { IconoFlechaIzq } from '@/components/iconos'
import { DURACIONES, duracionLegible, hora, sumarMinutos, aMinutos, aISO } from '@/lib/fechas'
import { addDays } from 'date-fns'
import { useAlumnos } from '@/features/alumnos/api'
import { useMaterias } from '@/features/materias/api'
import { useClase, useCrearClase, useActualizarClase, mensajeErrorClase } from './api'

interface Campos {
  alumno_id: string
  materia_id: string
  fecha: string
  hora_inicio: string
  duracion_min: number
  precio: string
}

export function EditorClase() {
  const { id } = useParams() // presente solo en modo "editar"
  const [sp] = useSearchParams()
  const duplicarId = sp.get('duplicar') ?? undefined
  const editar = !!id
  const navigate = useNavigate()

  const { data: alumnos } = useAlumnos()
  const { data: materias } = useMaterias()
  const { data: base, isLoading: cargandoBase } = useClase(id ?? duplicarId)

  const crear = useCrearClase()
  const actualizar = useActualizarClase()

  const [c, setC] = useState<Campos>({
    alumno_id: '',
    materia_id: '',
    fecha: aISO(new Date()),
    hora_inicio: '17:00',
    duracion_min: 60,
    precio: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!base) return
    const dur = aMinutos(base.hora_fin) - aMinutos(base.hora_inicio)
    setC({
      alumno_id: base.alumno_id,
      materia_id: base.materia_id ?? '',
      fecha: editar ? base.fecha : aISO(addDays(new Date(), 7)),
      hora_inicio: hora(base.hora_inicio),
      duracion_min: dur,
      precio: base.precio?.toString() ?? '',
    })
  }, [base, editar])

  const set = <K extends keyof Campos>(k: K, v: Campos[K]) => setC((p) => ({ ...p, [k]: v }))

  const titulo = editar ? 'Editar clase' : duplicarId ? 'Duplicar clase' : 'Nueva clase'
  const volverA = editar ? `/agenda/clase/${id}` : '/agenda'
  const guardando = crear.isPending || actualizar.isPending

  const materiasVisibles = useMemo(() => materias ?? [], [materias])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!c.alumno_id) {
      setError('Elige un alumno.')
      return
    }
    setError('')
    try {
      if (editar) {
        await actualizar.mutateAsync({
          id: id!,
          cambios: {
            materia_id: c.materia_id || null,
            precio: c.precio ? Number(c.precio) : null,
          },
        })
        navigate(`/agenda/clase/${id}`)
      } else {
        const nueva = await crear.mutateAsync({
          alumno_id: c.alumno_id,
          materia_id: c.materia_id || null,
          fecha: c.fecha,
          hora_inicio: c.hora_inicio,
          hora_fin: sumarMinutos(c.hora_inicio, c.duracion_min),
          origen: duplicarId ? 'manual' : 'extraordinaria',
          precio: c.precio ? Number(c.precio) : null,
        })
        navigate(`/agenda/clase/${nueva.id}`, { replace: true })
      }
    } catch (err) {
      setError(mensajeErrorClase(err))
    }
  }

  if ((editar || duplicarId) && cargandoBase) return <Cargando />

  return (
    <>
      <Link
        to={volverA}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <IconoFlechaIzq className="size-4" /> {editar ? 'Clase' : 'Agenda'}
      </Link>
      <CabeceraPagina titulo={titulo} />

      <form onSubmit={enviar} className="flex flex-col gap-5">
        <Campo etiqueta="Alumno" obligatorio>
          <Select
            value={c.alumno_id}
            onChange={(e) => set('alumno_id', e.target.value)}
            disabled={editar}
          >
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
            {materiasVisibles.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </Select>
        </Campo>

        {!editar && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo etiqueta="Fecha" obligatorio>
                <InputFecha value={c.fecha} onChange={(v) => set('fecha', v)} required />
              </Campo>
              <Campo etiqueta="Hora de inicio" obligatorio>
                <Input
                  type="time"
                  value={c.hora_inicio}
                  onChange={(e) => set('hora_inicio', e.target.value)}
                  required
                />
              </Campo>
            </div>
            <Campo etiqueta="Duración">
              <Select
                value={c.duracion_min}
                onChange={(e) => set('duracion_min', Number(e.target.value))}
              >
                {DURACIONES.map((d) => (
                  <option key={d} value={d}>
                    {duracionLegible(d)}
                  </option>
                ))}
              </Select>
            </Campo>
          </>
        )}

        <Campo etiqueta="Precio (€)" ayuda="Opcional, para el control económico.">
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={c.precio}
            onChange={(e) => set('precio', e.target.value)}
            className="sm:max-w-[10rem]"
          />
        </Campo>

        {error && <p className="text-sm text-crit">{error}</p>}

        <div className="flex gap-2">
          <Boton type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : editar ? 'Guardar' : 'Crear clase'}
          </Boton>
          <Boton type="button" variante="secundario" onClick={() => navigate(volverA)}>
            Cancelar
          </Boton>
        </div>
      </form>
    </>
  )
}
