import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CabeceraPagina, Boton, Cargando } from '@/components/ui'
import { Campo, Input, Select, Textarea, InputFecha } from '@/components/campos'
import { IconoFlechaIzq } from '@/components/iconos'
import { useAlumnos } from '@/features/alumnos/api'
import { useMaterias } from '@/features/materias/api'
import { usePreferencias } from '@/features/recordatorios/api'
import {
  HORA_AVISO_DEFECTO,
  avisosPasados,
  describirAvisos,
  etiquetaDias,
} from '@/features/recordatorios/avisos'
import { SelectorDiasAviso } from '@/features/recordatorios/componentes'
import { hora } from '@/lib/fechas'
import { NivelPreparacion } from './componentes'
import { useExamen, useCrearExamen, useActualizarExamen } from './api'

type ModoAvisos = 'ajustes' | 'propios'

interface Campos {
  alumno_id: string
  materia_id: string
  titulo: string
  fecha: string
  temario: string
  nivel_preparacion: number
  avisos: ModoAvisos
  avisos_dias: number[]
  aviso_hora: string
}

const OPCIONES_AVISOS: { valor: ModoAvisos; etiqueta: string }[] = [
  { valor: 'ajustes', etiqueta: 'Como en Ajustes' },
  { valor: 'propios', etiqueta: 'Elegir para este examen' },
]

export function EditorExamen() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const editar = !!id
  const navigate = useNavigate()

  const { data: alumnos } = useAlumnos()
  const { data: materias } = useMaterias()
  const { data: examen, isLoading } = useExamen(id)
  const { data: pref } = usePreferencias()
  const crear = useCrearExamen()
  const actualizar = useActualizarExamen()

  const [c, setC] = useState<Campos>({
    alumno_id: sp.get('alumno') ?? '',
    materia_id: '',
    titulo: '',
    fecha: '',
    temario: '',
    nivel_preparacion: 1,
    avisos: 'ajustes',
    avisos_dias: [],
    aviso_hora: HORA_AVISO_DEFECTO,
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
      avisos: examen.avisos_dias ? 'propios' : 'ajustes',
      avisos_dias: examen.avisos_dias ?? [],
      aviso_hora: examen.aviso_hora ? hora(examen.aviso_hora) : HORA_AVISO_DEFECTO,
    })
  }, [examen])

  const set = <K extends keyof Campos>(k: K, v: Campos[K]) => setC((p) => ({ ...p, [k]: v }))
  const guardando = crear.isPending || actualizar.isPending

  // Al pasar a «Elegir para este examen» se parte de lo que haya en Ajustes.
  const elegirModoAvisos = (modo: ModoAvisos) =>
    setC((p) => ({
      ...p,
      avisos: modo,
      avisos_dias:
        modo === 'propios' && !p.avisos_dias.length ? [...(pref?.examen_dias ?? [])] : p.avisos_dias,
    }))

  const diasEfectivos = c.avisos === 'propios' ? c.avisos_dias : (pref?.examen_dias ?? [])
  const horaEfectiva = c.avisos === 'propios' ? c.aviso_hora : HORA_AVISO_DEFECTO
  const pasados = avisosPasados(c.fecha, diasEfectivos, horaEfectiva)

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
      avisos_dias: c.avisos === 'propios' ? c.avisos_dias : null,
      aviso_hora: c.avisos === 'propios' ? c.aviso_hora : null,
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
            <InputFecha
              value={c.fecha}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(v) => set('fecha', v)}
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

        <Campo etiqueta="Avisos">
          <div className="flex flex-col gap-3">
            <div role="radiogroup" aria-label="Avisos" className="grid grid-cols-2 gap-2 sm:max-w-md">
              {OPCIONES_AVISOS.map(({ valor, etiqueta }) => {
                const activo = c.avisos === valor
                return (
                  <button
                    key={valor}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    onClick={() => elegirModoAvisos(valor)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                      activo
                        ? 'border-accent bg-accent-soft text-accent-ink'
                        : 'border-line text-muted hover:bg-surface-2'
                    }`}
                  >
                    {etiqueta}
                  </button>
                )
              })}
            </div>

            {c.avisos === 'ajustes' ? (
              <p className="text-sm text-muted">
                {pref && `${describirAvisos(pref.examen_dias, HORA_AVISO_DEFECTO)}. `}
                <Link to="/mas/ajustes" className="font-medium text-accent hover:underline">
                  Cambiar en Ajustes
                </Link>
              </p>
            ) : (
              <>
                <SelectorDiasAviso valor={c.avisos_dias} onChange={(v) => set('avisos_dias', v)} />
                <label className="flex items-center gap-3 text-sm text-ink">
                  A las
                  <span className="w-32">
                    <Input
                      type="time"
                      value={c.aviso_hora}
                      onChange={(e) => set('aviso_hora', e.target.value || HORA_AVISO_DEFECTO)}
                      required
                    />
                  </span>
                </label>
                <p className="text-sm text-muted">{describirAvisos(c.avisos_dias, c.aviso_hora)}.</p>
              </>
            )}

            {pasados.length > 0 && (
              <p className="text-xs text-warn">
                Con esta fecha ya ha pasado la hora de{' '}
                {pasados.map((d) => (d === 0 ? 'el mismo día' : `${etiquetaDias(d)} antes`)).join(', ')}
                : {pasados.length === 1 ? 'ese aviso no se enviará' : 'esos avisos no se enviarán'}.
              </p>
            )}
          </div>
        </Campo>

        {error && <p role="alert" className="text-sm text-crit">{error}</p>}

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
